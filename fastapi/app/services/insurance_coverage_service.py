"""
Service layer for insurance coverage management.
"""

from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.insurance_coverage import (
    InsuranceCoverageCreate,
    InsuranceCoverageUpdate,
    insurance_coverage_helper,
)


class InsuranceCoverageService:
    """Business logic for insurance coverage records."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.coverage = db.insurance_coverage
        self.patients = db.patients
        self.insurances = db.patient_insurances

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

    async def _verify_policy_number(self, patient_id: str, policy_number: str) -> bool:
        """Verify that the policy number exists for the patient."""
        insurance = await self.insurances.find_one({
            "patientId": patient_id,
            "$or": [
                {"policyNumber": policy_number},
                {"cardNumber": policy_number},
            ],
            "isLatest": True,
        })
        return insurance is not None

    async def create_coverage(
        self, coverage_data: InsuranceCoverageCreate
    ) -> dict:
        await self._get_patient(coverage_data.patientId)
        
        # Verify policy number exists
        if not await self._verify_policy_number(coverage_data.patientId, coverage_data.policyNumber):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Policy number {coverage_data.policyNumber} not found for this patient",
            )

        payload = coverage_data.model_dump(exclude_none=True)
        now = datetime.utcnow()
        payload["createdAt"] = now
        payload["updatedAt"] = now
        payload["version"] = 1
        payload["isLatest"] = True
        payload["previousVersionId"] = None

        # Mark any existing coverage for this policy as not latest
        await self.coverage.update_many(
            {"patientId": coverage_data.patientId, "policyNumber": coverage_data.policyNumber},
            {"$set": {"isLatest": False, "updatedAt": now}},
        )

        result = await self.coverage.insert_one(payload)
        created = await self.coverage.find_one({"_id": result.inserted_id})
        return insurance_coverage_helper(created)

    async def get_coverage_by_policy(
        self, patient_id: str, policy_number: str
    ) -> Optional[dict]:
        """Get the latest coverage for a specific policy."""
        await self._get_patient(patient_id)
        coverage = await self.coverage.find_one(
            {
                "patientId": patient_id,
                "policyNumber": policy_number,
                "isLatest": True,
            },
            sort=[("updatedAt", -1)],
        )
        if not coverage:
            return None
        return insurance_coverage_helper(coverage)

    async def list_coverage(self, patient_id: str) -> List[dict]:
        """List all latest coverage records for a patient."""
        await self._get_patient(patient_id)
        cursor = (
            self.coverage.find({"patientId": patient_id, "isLatest": True})
            .sort([("updatedAt", -1)])
        )
        records = await cursor.to_list(length=None)
        return [insurance_coverage_helper(record) for record in records]

    async def update_coverage(
        self, coverage_id: str, update_data: InsuranceCoverageUpdate
    ) -> dict:
        record = await self._get_coverage(coverage_id)
        update_payload = update_data.model_dump(exclude_unset=True, exclude_none=True)

        if not update_payload:
            return insurance_coverage_helper(record)

        # Mark current record as not latest
        await self.coverage.update_one(
            {"_id": ObjectId(coverage_id)},
            {"$set": {"isLatest": False, "updatedAt": datetime.utcnow()}},
        )

        # Create new version with updated data
        new_version = {
            "patientId": record["patientId"],
            "policyNumber": record["policyNumber"],
            "selectedBenefits": update_payload.get("selectedBenefits", record.get("selectedBenefits", [])),
            "version": record.get("version", 1) + 1,
            "isLatest": True,
            "previousVersionId": str(record["_id"]),
            "createdAt": record.get("createdAt", datetime.utcnow()),
            "updatedAt": datetime.utcnow(),
        }

        # Insert new version
        result = await self.coverage.insert_one(new_version)
        updated = await self.coverage.find_one({"_id": result.inserted_id})
        return insurance_coverage_helper(updated)

    async def _get_coverage(self, coverage_id: str) -> dict:
        if not ObjectId.is_valid(coverage_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid coverage ID",
            )
        record = await self.coverage.find_one({"_id": ObjectId(coverage_id)})
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coverage record not found",
            )
        return record

    async def delete_coverage(self, coverage_id: str):
        """Delete a coverage record."""
        record = await self._get_coverage(coverage_id)
        await self.coverage.delete_one({"_id": ObjectId(coverage_id)})

