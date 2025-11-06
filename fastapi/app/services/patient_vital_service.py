"""
Service layer for patient vitals history.
"""

from datetime import datetime
from typing import List, Optional, Tuple

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.patient_vital import (
    PatientVitalCreate,
    patient_vital_helper,
)


class PatientVitalService:
    """Business logic for patient vitals."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.vitals = db.patient_vitals
        self.patients = db.patients
        self.users = db.users

    async def _ensure_patient_exists(self, patient_id: str):
        if not ObjectId.is_valid(patient_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid patient ID"
            )
        patient = await self.patients.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
            )

    async def _ensure_user_exists(self, user_id: str):
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID"
            )
        user = await self.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

    async def record_vitals(
        self, patient_id: str, recorded_by: str, vitals_data: PatientVitalCreate
    ) -> dict:
        """Record a new set of vitals."""
        await self._ensure_patient_exists(patient_id)
        await self._ensure_user_exists(recorded_by)

        vital_dict = vitals_data.model_dump()
        vital_dict["patientId"] = patient_id
        vital_dict["recordedBy"] = recorded_by
        vital_dict["recordedAt"] = vital_dict.get("recordedAt") or datetime.utcnow()
        vital_dict["createdAt"] = datetime.utcnow()
        vital_dict["updatedAt"] = datetime.utcnow()

        result = await self.vitals.insert_one(vital_dict)
        created = await self.vitals.find_one({"_id": result.inserted_id})
        return await patient_vital_helper(created)

    async def list_vitals(
        self,
        patient_id: str,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        """List vitals entries for a patient."""
        await self._ensure_patient_exists(patient_id)

        query = {"patientId": patient_id}
        skip = (page - 1) * limit

        total = await self.vitals.count_documents(query)
        cursor = (
            self.vitals.find(query).sort("recordedAt", -1).skip(skip).limit(limit)
        )
        entries = await cursor.to_list(length=limit)

        formatted = []
        for entry in entries:
            formatted.append(await patient_vital_helper(entry))

        return formatted, total

    async def latest_vitals(self, patient_id: str) -> Optional[dict]:
        """Fetch the most recent vitals entry."""
        await self._ensure_patient_exists(patient_id)
        entry = await self.vitals.find_one(
            {"patientId": patient_id}, sort=[("recordedAt", -1)]
        )
        if not entry:
            return None
        return await patient_vital_helper(entry)


