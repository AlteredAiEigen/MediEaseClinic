"""
Service layer for messaging between staff and patients.
"""

from datetime import datetime
from typing import List, Optional, Tuple

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.message import (
    ConversationCreate,
    MessageCreate,
    conversation_helper,
    message_helper,
)


class MessageService:
    """Business logic for messaging."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.conversations = db.message_conversations
        self.messages = db.messages
        self.patients = db.patients
        self.users = db.users

    async def _generate_conversation_id(self) -> str:
        timestamp = int(datetime.utcnow().timestamp() * 1000)
        return f"MSG{str(timestamp)[-8:]}"

    async def _ensure_patient_exists(self, patient_id: str) -> None:
        if not ObjectId.is_valid(patient_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid patient ID"
            )
        patient = await self.patients.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
            )

    async def _ensure_users_exist(self, participant_ids: List[str]) -> None:
        for participant_id in participant_ids:
            if not ObjectId.is_valid(participant_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID"
                )
            user = await self.users.find_one({"_id": ObjectId(participant_id)})
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User {participant_id} not found",
                )

    async def get_or_create_conversation(
        self,
        conversation_data: ConversationCreate,
        created_by: str,
    ) -> dict:
        """Return existing conversation for patient & participants or create a new one."""
        await self._ensure_patient_exists(conversation_data.patientId)
        await self._ensure_users_exist(conversation_data.participants)

        existing = await self.conversations.find_one(
            {
                "patientId": conversation_data.patientId,
                "participants": {"$all": conversation_data.participants},
                "isActive": True,
            }
        )

        if existing:
            return await conversation_helper(existing)

        conversation_dict = conversation_data.model_dump()
        conversation_dict["conversationId"] = await self._generate_conversation_id()
        conversation_dict["createdBy"] = created_by
        conversation_dict["createdAt"] = datetime.utcnow()
        conversation_dict["updatedAt"] = datetime.utcnow()
        conversation_dict["isActive"] = True

        result = await self.conversations.insert_one(conversation_dict)
        created = await self.conversations.find_one({"_id": result.inserted_id})
        return await conversation_helper(created)

    async def list_conversations(
        self,
        user_id: str,
        role: str,
        page: int = 1,
        limit: int = 10,
    ) -> Tuple[List[dict], int]:
        """List conversations accessible to the current user."""
        query = {"isActive": True}
        if role != "admin":
            query["participants"] = user_id

        skip = (page - 1) * limit
        total = await self.conversations.count_documents(query)
        cursor = (
            self.conversations.find(query)
            .sort("lastMessageAt", -1)
            .skip(skip)
            .limit(limit)
        )
        conversations = await cursor.to_list(length=limit)
        formatted = []
        for convo in conversations:
            formatted.append(await conversation_helper(convo))
        return formatted, total

    async def get_conversation(self, conversation_id: str) -> Optional[dict]:
        if not ObjectId.is_valid(conversation_id):
            return None
        conversation = await self.conversations.find_one(
            {"_id": ObjectId(conversation_id), "isActive": True}
        )
        if not conversation:
            return None
        return await conversation_helper(conversation)

    async def list_messages(
        self,
        conversation_id: str,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        if not ObjectId.is_valid(conversation_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
            )

        query = {"conversationId": conversation_id}
        skip = (page - 1) * limit
        total = await self.messages.count_documents(query)
        cursor = (
            self.messages.find(query)
            .sort("createdAt", -1)
            .skip(skip)
            .limit(limit)
        )
        messages = await cursor.to_list(length=limit)
        formatted = []
        for message in messages:
            formatted.append(await message_helper(message))
        # Messages queried descending; reverse to chronological
        formatted.reverse()
        return formatted, total

    async def create_message(
        self,
        conversation_id: str,
        message_data: MessageCreate,
        patient_id: str,
    ) -> dict:
        if not ObjectId.is_valid(conversation_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
            )

        conversation = await self.conversations.find_one(
            {"_id": ObjectId(conversation_id), "isActive": True}
        )
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
            )

        message_dict = message_data.model_dump()
        message_dict["conversationId"] = conversation_id
        message_dict["patientId"] = patient_id
        message_dict["createdAt"] = datetime.utcnow()
        message_dict["updatedAt"] = datetime.utcnow()

        result = await self.messages.insert_one(message_dict)
        created = await self.messages.find_one({"_id": result.inserted_id})

        # Update conversation metadata
        await self.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {
                "$set": {
                    "lastMessage": message_data.body,
                    "lastMessageAt": message_dict["createdAt"],
                    "lastSenderId": message_data.senderId,
                    "updatedAt": datetime.utcnow(),
                }
            },
        )
        return await message_helper(created)


