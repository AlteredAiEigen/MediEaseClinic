"""
Service layer for patient medical history management with version tracking.
"""

from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.patient_medical_history import (
    PatientMedicalHistoryCreate,
    PatientMedicalHistoryUpdate,
    patient_medical_history_helper,
)


class PatientMedicalHistoryService:
    """Business logic for patient medical history records with versioning."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.medical_history_collection = db.patient_medical_history
        self.patients_collection = db.patients

    async def _get_patient(self, patient_id: str) -> dict:
        """Validate and fetch patient."""
        if not ObjectId.is_valid(patient_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid patient ID",
            )
        patient = await self.patients_collection.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found",
            )
        return patient

    async def _get_current_record(self, patient_id: str) -> Optional[dict]:
        """Get the current (active) medical history record for a patient."""
        return await self.medical_history_collection.find_one(
            {
                "patientId": patient_id,
                "endDate": None,  # Current record has no end date
            }
        )

    async def create_medical_history(
        self, history_data: PatientMedicalHistoryCreate
    ) -> dict:
        """
        Create a new medical history record.
        If a current record exists, it will be closed (endDate set) before creating new one.
        """
        await self._get_patient(history_data.patientId)

        now = datetime.utcnow()

        # Close any existing current record by setting its endDate
        existing_current = await self._get_current_record(history_data.patientId)
        if existing_current:
            await self.medical_history_collection.update_one(
                {"_id": existing_current["_id"]},
                {
                    "$set": {
                        "endDate": now,
                        "updatedAt": now,
                    }
                },
            )

        # Create new record
        payload = history_data.model_dump(exclude_none=True)
        payload["createdAt"] = now
        payload["updatedAt"] = now

        # Ensure startDate is set (default to now if not provided)
        if not payload.get("startDate"):
            payload["startDate"] = now
        payload["endDate"] = None  # New record is current

        result = await self.medical_history_collection.insert_one(payload)
        created = await self.medical_history_collection.find_one({"_id": result.inserted_id})
        return patient_medical_history_helper(created)

    async def update_medical_history(
        self, history_id: str, update_data: PatientMedicalHistoryUpdate
    ) -> dict:
        """
        Update medical history record.
        If updating changes the data, create a new record and close the old one.
        """
        existing = await self.medical_history_collection.find_one({"_id": ObjectId(history_id)})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical history record not found",
            )

        update_dict = update_data.model_dump(exclude_unset=True, exclude_none=True)
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

        now = datetime.utcnow()

        # Check if we're updating the current record and if data actually changed
        is_current_record = existing.get("endDate") is None
        data_changed = any(
            existing.get(key) != update_dict.get(key)
            for key in ["familyHistory", "previousSurgeries", "pastMedications"]
            if key in update_dict
        )

        # If updating current record and data changed, create new version
        if is_current_record and data_changed:
            # Close current record
            await self.medical_history_collection.update_one(
                {"_id": existing["_id"]},
                {
                    "$set": {
                        "endDate": now,
                        "updatedAt": now,
                    }
                },
            )

            # Create new record with updated data
            new_payload = {
                "patientId": existing["patientId"],
                "familyHistory": update_dict.get("familyHistory", existing.get("familyHistory")),
                "previousSurgeries": update_dict.get("previousSurgeries", existing.get("previousSurgeries")),
                "pastMedications": update_dict.get("pastMedications", existing.get("pastMedications")),
                "startDate": now,
                "endDate": None,
                "createdAt": now,
                "updatedAt": now,
            }

            result = await self.medical_history_collection.insert_one(new_payload)
            created = await self.medical_history_collection.find_one({"_id": result.inserted_id})
            return patient_medical_history_helper(created)
        else:
            # Simple update (non-current record or only metadata changed)
            update_dict["updatedAt"] = now
            await self.medical_history_collection.update_one(
                {"_id": ObjectId(history_id)},
                {"$set": update_dict},
            )
            updated = await self.medical_history_collection.find_one({"_id": ObjectId(history_id)})
            return patient_medical_history_helper(updated)

    async def get_current_medical_history(self, patient_id: str) -> Optional[dict]:
        """Get the current active medical history record for a patient."""
        await self._get_patient(patient_id)
        current = await self._get_current_record(patient_id)
        return patient_medical_history_helper(current) if current else None

    async def get_all_medical_history(
        self, patient_id: str, include_inactive: bool = True
    ) -> List[dict]:
        """Get all medical history records for a patient, optionally including inactive ones."""
        await self._get_patient(patient_id)

        query = {"patientId": patient_id}
        if not include_inactive:
            query["endDate"] = None

        cursor = (
            self.medical_history_collection.find(query)
            .sort("startDate", -1)  # Most recent first
        )

        records = await cursor.to_list(length=1000)
        return [patient_medical_history_helper(record) for record in records]

    async def delete_medical_history(self, history_id: str) -> bool:
        """Soft delete a medical history record by setting endDate if it's current."""
        existing = await self.medical_history_collection.find_one({"_id": ObjectId(history_id)})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical history record not found",
            )

        # If it's a current record, just set endDate
        if existing.get("endDate") is None:
            await self.medical_history_collection.update_one(
                {"_id": ObjectId(history_id)},
                {
                    "$set": {
                        "endDate": datetime.utcnow(),
                        "updatedAt": datetime.utcnow(),
                    }
                },
            )
        else:
            # For historical records, we could hard delete, but let's keep them for audit
            # Just mark as deleted
            pass

        return True

