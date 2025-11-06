"""
Service layer for managing lab reports.
"""

from datetime import datetime
from typing import List, Optional, Tuple

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.lab_report import (
    LabReportCreate,
    LabReportUpdate,
    lab_report_helper,
)


class LabReportService:
    """Business logic for lab reports."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.lab_reports = db.lab_reports
        self.patients = db.patients
        self.users = db.users

    async def _generate_report_id(self) -> str:
        """Generate a unique, human-readable report identifier."""
        timestamp = int(datetime.utcnow().timestamp() * 1000)
        return f"LAB{str(timestamp)[-8:]}"

    async def _validate_patient(self, patient_id: str) -> None:
        if not ObjectId.is_valid(patient_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid patient ID",
            )
        exists = await self.patients.find_one({"_id": ObjectId(patient_id)})
        if not exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found",
            )

    async def _validate_doctor(self, doctor_id: str) -> None:
        if not ObjectId.is_valid(doctor_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid doctor ID",
            )
        doctor = await self.users.find_one({"_id": ObjectId(doctor_id)})
        if not doctor or doctor.get("role") != "doctor":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found",
            )

    async def create_report(
        self,
        report_data: LabReportCreate,
        created_by: str,
    ) -> dict:
        """Create a new lab report entry."""
        await self._validate_patient(report_data.patientId)
        await self._validate_doctor(report_data.doctorId)

        report_dict = report_data.model_dump()
        report_dict["reportId"] = await self._generate_report_id()
        report_dict["createdBy"] = created_by
        report_dict["createdAt"] = datetime.utcnow()
        report_dict["updatedAt"] = datetime.utcnow()
        report_dict["isActive"] = True

        result = await self.lab_reports.insert_one(report_dict)
        created = await self.lab_reports.find_one({"_id": result.inserted_id})
        return await lab_report_helper(created)

    async def get_report(self, report_id: str) -> Optional[dict]:
        """Retrieve a lab report by MongoDB ID."""
        if not ObjectId.is_valid(report_id):
            return None
        report = await self.lab_reports.find_one(
            {"_id": ObjectId(report_id), "isActive": True}
        )
        if not report:
            return None
        return await lab_report_helper(report)

    async def list_reports(
        self,
        page: int = 1,
        limit: int = 10,
        patient_id: Optional[str] = None,
        doctor_id: Optional[str] = None,
        category: Optional[str] = None,
        is_critical: Optional[bool] = None,
    ) -> Tuple[List[dict], int]:
        """List lab reports with optional filters."""
        query = {"isActive": True}

        if patient_id:
            query["patientId"] = patient_id
        if doctor_id:
            query["doctorId"] = doctor_id
        if category:
            query["category"] = category
        if is_critical is not None:
            query["isCritical"] = is_critical

        skip = (page - 1) * limit
        total = await self.lab_reports.count_documents(query)
        cursor = (
            self.lab_reports.find(query)
            .sort("reportedDate", -1)
            .skip(skip)
            .limit(limit)
        )
        reports = await cursor.to_list(length=limit)
        formatted = []
        for report in reports:
            formatted.append(await lab_report_helper(report))
        return formatted, total

    async def update_report(
        self,
        report_id: str,
        update_data: LabReportUpdate,
    ) -> dict:
        """Update an existing lab report."""
        if not ObjectId.is_valid(report_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lab report not found",
            )

        existing = await self.lab_reports.find_one(
            {"_id": ObjectId(report_id), "isActive": True}
        )
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lab report not found",
            )

        update_dict = update_data.model_dump(exclude_unset=True)
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

        update_dict["updatedAt"] = datetime.utcnow()
        await self.lab_reports.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": update_dict},
        )
        updated = await self.lab_reports.find_one({"_id": ObjectId(report_id)})
        return await lab_report_helper(updated)

    async def delete_report(self, report_id: str) -> bool:
        """Soft delete a lab report."""
        if not ObjectId.is_valid(report_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lab report not found",
            )
        result = await self.lab_reports.update_one(
            {"_id": ObjectId(report_id)},
            {
                "$set": {
                    "isActive": False,
                    "updatedAt": datetime.utcnow(),
                }
            },
        )
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lab report not found",
            )
        return True


