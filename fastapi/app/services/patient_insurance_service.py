"""
Service layer for patient insurance management.
"""

from datetime import datetime
from typing import List, Tuple

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.patient_insurance import (
    PatientInsuranceCreate,
    PatientInsuranceUpdate,
    patient_insurance_helper,
)


class PatientInsuranceService:
    """Business logic for patient insurance records."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.insurances = db.patient_insurances
        self.patients = db.patients

    async def _get_patient(self, patient_id: str) -> dict:
        if not ObjectId.is_valid(patient_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid patient ID",
            )
        patient = await self.patients.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found",
            )
        return patient

    async def _get_insurance(self, insurance_id: str) -> dict:
        if not ObjectId.is_valid(insurance_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid insurance ID",
            )
        record = await self.insurances.find_one({"_id": ObjectId(insurance_id)})
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance record not found",
            )
        return record

    async def create_insurance(
        self, insurance_data: PatientInsuranceCreate
    ) -> dict:
        patient = await self._get_patient(insurance_data.patientId)
        payload = insurance_data.model_dump(exclude_none=True)

        if not payload.get("memberName"):
            payload["memberName"] = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()

        now = datetime.utcnow()
        payload["createdAt"] = now
        payload["updatedAt"] = now

        existing_count = await self.insurances.count_documents(
            {"patientId": insurance_data.patientId}
        )
        if payload.get("isPrimary"):
            await self.insurances.update_many(
                {"patientId": insurance_data.patientId},
                {"$set": {"isPrimary": False}},
            )
        elif existing_count == 0:
            payload["isPrimary"] = True
        else:
            payload.setdefault("isPrimary", False)

        # Set versioning fields for new record
        payload["version"] = 1
        payload["isLatest"] = True
        payload["previousVersionId"] = None

        result = await self.insurances.insert_one(payload)
        created = await self.insurances.find_one({"_id": result.inserted_id})
        return patient_insurance_helper(created)

    async def list_insurances(self, patient_id: str) -> List[dict]:
        await self._get_patient(patient_id)
        # Only return latest versions (or records without isLatest field for backward compatibility)
        cursor = (
            self.insurances.find({
                "patientId": patient_id,
                "$or": [
                    {"isLatest": True},
                    {"isLatest": {"$exists": False}}
                ]
            })
            .sort([("isPrimary", -1), ("updatedAt", -1)])
        )
        records = await cursor.to_list(length=None)
        return [patient_insurance_helper(record) for record in records]

    async def update_insurance(
        self, insurance_id: str, update_data: PatientInsuranceUpdate
    ) -> dict:
        record = await self._get_insurance(insurance_id)
        update_payload = update_data.model_dump(exclude_unset=True, exclude_none=True)

        if not update_payload:
            return patient_insurance_helper(record)

        # Mark current record as not latest
        await self.insurances.update_one(
            {"_id": ObjectId(insurance_id)},
            {"$set": {"isLatest": False, "updatedAt": datetime.utcnow()}},
        )

        # Create new version with updated data
        new_version = {
            "patientId": record["patientId"],
            "provider": update_payload.get("provider", record.get("provider")),
            "planName": update_payload.get("planName", record.get("planName")),
            "policyNumber": update_payload.get("policyNumber", record.get("policyNumber")),
            "cardNumber": update_payload.get("cardNumber", record.get("cardNumber")),
            "memberName": update_payload.get("memberName", record.get("memberName")),
            "status": update_payload.get("status", record.get("status", "Active")),
            "coverageLimit": update_payload.get("coverageLimit", record.get("coverageLimit")),
            "coverageUsed": update_payload.get("coverageUsed", record.get("coverageUsed")),
            "coverageRemaining": update_payload.get("coverageRemaining", record.get("coverageRemaining")),
            "validFrom": update_payload.get("validFrom", record.get("validFrom")),
            "validUntil": update_payload.get("validUntil", record.get("validUntil")),
            "familyMembersCovered": update_payload.get("familyMembersCovered", record.get("familyMembersCovered")),
            "notes": update_payload.get("notes", record.get("notes")),
            "isPrimary": update_payload.get("isPrimary", record.get("isPrimary", False)),
            "selectedBenefits": update_payload.get("selectedBenefits", record.get("selectedBenefits")),
            "version": record.get("version", 1) + 1,
            "isLatest": True,
            "previousVersionId": str(record["_id"]),
            "createdAt": record.get("createdAt", datetime.utcnow()),
            "updatedAt": datetime.utcnow(),
        }

        # Handle primary insurance update
        if update_payload.get("isPrimary"):
            await self.insurances.update_many(
                {"patientId": record["patientId"]},
                {"$set": {"isPrimary": False}},
            )

        # Insert new version
        result = await self.insurances.insert_one(new_version)
        updated = await self.insurances.find_one({"_id": result.inserted_id})
        return patient_insurance_helper(updated)

    async def delete_insurance(self, insurance_id: str) -> Tuple[str, bool]:
        record = await self._get_insurance(insurance_id)
        await self.insurances.delete_one({"_id": ObjectId(insurance_id)})

        reassigned_primary = False
        if record.get("isPrimary"):
            next_record = await self.insurances.find_one(
                {"patientId": record["patientId"]},
                sort=[("updatedAt", -1)],
            )
            if next_record:
                await self.insurances.update_one(
                    {"_id": next_record["_id"]}, {"$set": {"isPrimary": True}}
                )
                reassigned_primary = True
        return str(record["_id"]), reassigned_primary


