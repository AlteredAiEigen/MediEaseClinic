"""
Persist multi-turn doctor ↔ AI chat for a patient/appointment consultation.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import HTTPException, status

from app.database import Database


class PatientAIChatService:
    COLLECTION = "ai_consultation_chats"
    MAX_MESSAGES = 80

    async def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        if not ObjectId.is_valid(conversation_id):
            return None
        db = Database.get_database()
        return await db[self.COLLECTION].find_one({"_id": ObjectId(conversation_id)})

    async def create_conversation(
        self,
        patient_id: str,
        appointment_id: Optional[str],
        doctor_id: str,
    ) -> str:
        db = Database.get_database()
        doc = {
            "patientId": patient_id,
            "appointmentId": appointment_id,
            "doctorId": doctor_id,
            "messages": [],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }
        res = await db[self.COLLECTION].insert_one(doc)
        return str(res.inserted_id)

    async def append_pair(
        self,
        conversation_id: str,
        user_text: str,
        assistant_text: str,
    ) -> List[Dict[str, Any]]:
        if not ObjectId.is_valid(conversation_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid conversation")

        db = Database.get_database()
        coll = db[self.COLLECTION]
        now = datetime.utcnow()
        conv = await coll.find_one({"_id": ObjectId(conversation_id)})
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

        messages: List[Dict[str, Any]] = list(conv.get("messages") or [])
        messages.append({"role": "user", "content": user_text, "at": now.isoformat()})
        messages.append({"role": "assistant", "content": assistant_text, "at": now.isoformat()})
        if len(messages) > self.MAX_MESSAGES:
            messages = messages[-self.MAX_MESSAGES :]

        await coll.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {"messages": messages, "updatedAt": now}},
        )
        return messages

    def messages_for_llm(self, messages: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        out: List[Dict[str, str]] = []
        for m in messages:
            r, c = m.get("role"), m.get("content")
            if r in ("user", "assistant") and c:
                out.append({"role": r, "content": c})
        return out


patient_ai_chat_service = PatientAIChatService()
