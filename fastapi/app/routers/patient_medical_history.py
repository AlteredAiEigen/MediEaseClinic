"""
Patient medical history CRUD endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.middleware.auth import require_any_role
from app.models.patient_medical_history import (
    PatientMedicalHistoryCreate,
    PatientMedicalHistoryUpdate,
)
from app.services.patient_medical_history_service import PatientMedicalHistoryService
from app.utils.response import success_response

router = APIRouter()


def get_service(
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> PatientMedicalHistoryService:
    """Dependency provider for medical history service."""
    return PatientMedicalHistoryService(db)


@router.get("/current", response_model=dict)
async def get_current_medical_history(
    patientId: str = Query(..., description="Patient ObjectId"),
    current_user: dict = Depends(require_any_role),
    service: PatientMedicalHistoryService = Depends(get_service),
):
    """Get the current active medical history record for a patient."""
    record = await service.get_current_medical_history(patientId)
    if not record:
        return success_response(
            message="No medical history record found",
            data={"medicalHistory": None},
        )
    return success_response(
        message="Medical history retrieved successfully",
        data={"medicalHistory": record},
    )


@router.get("/history", response_model=dict)
async def get_all_medical_history(
    patientId: str = Query(..., description="Patient ObjectId"),
    includeInactive: bool = Query(True, description="Include inactive historical records"),
    current_user: dict = Depends(require_any_role),
    service: PatientMedicalHistoryService = Depends(get_service),
):
    """Get all medical history records for a patient."""
    records = await service.get_all_medical_history(patientId, include_inactive=includeInactive)
    return success_response(
        message="Medical history records retrieved successfully",
        data={"history": records},
    )


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=dict)
async def create_medical_history(
    history_data: PatientMedicalHistoryCreate,
    current_user: dict = Depends(require_any_role),
    service: PatientMedicalHistoryService = Depends(get_service),
):
    """Create a new medical history record for a patient."""
    record = await service.create_medical_history(history_data)
    return success_response(
        message="Medical history record created successfully",
        data=record,
        status_code=status.HTTP_201_CREATED,
    )


@router.put("/{history_id}", response_model=dict)
async def update_medical_history(
    history_id: str,
    update_data: PatientMedicalHistoryUpdate,
    current_user: dict = Depends(require_any_role),
    service: PatientMedicalHistoryService = Depends(get_service),
):
    """Update a medical history record. Creates new version if updating current record."""
    record = await service.update_medical_history(
        history_id,
        update_data,
    )
    return success_response(
        message="Medical history record updated successfully",
        data=record,
    )


@router.delete("/{history_id}", response_model=dict)
async def delete_medical_history(
    history_id: str,
    current_user: dict = Depends(require_any_role),
    service: PatientMedicalHistoryService = Depends(get_service),
):
    """Delete (deactivate) a medical history record."""
    await service.delete_medical_history(history_id)
    return success_response(
        message="Medical history record deleted successfully",
    )

