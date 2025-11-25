"""
Patient insurance CRUD endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.middleware.auth import require_any_role
from app.models.patient_insurance import (
    PatientInsuranceCreate,
    PatientInsuranceUpdate,
)
from app.schemas.patient_insurance import (
    PatientInsuranceCreateRequest,
    PatientInsuranceUpdateRequest,
)
from app.services.patient_insurance_service import PatientInsuranceService
from app.utils.response import success_response

router = APIRouter()


def get_service(
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> PatientInsuranceService:
    """Dependency provider for insurance service."""
    return PatientInsuranceService(db)


@router.get("/", response_model=dict)
async def list_patient_insurances(
    patientId: str = Query(..., description="Patient ObjectId"),
    current_user: dict = Depends(require_any_role),
    service: PatientInsuranceService = Depends(get_service),
):
    """List insurance records for a patient."""
    records = await service.list_insurances(patientId)
    return success_response(
        message="Insurance records retrieved successfully",
        data={"insurances": records},
    )


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=dict)
async def create_patient_insurance(
    insurance_data: PatientInsuranceCreateRequest,
    current_user: dict = Depends(require_any_role),
    service: PatientInsuranceService = Depends(get_service),
):
    """Create a new insurance record for a patient."""
    record = await service.create_insurance(
        PatientInsuranceCreate(**insurance_data.model_dump())
    )
    return success_response(
        message="Insurance record created successfully",
        data=record,
        status_code=status.HTTP_201_CREATED,
    )


@router.put("/{insurance_id}", response_model=dict)
async def update_patient_insurance(
    insurance_id: str,
    update_data: PatientInsuranceUpdateRequest,
    current_user: dict = Depends(require_any_role),
    service: PatientInsuranceService = Depends(get_service),
):
    """Update an existing insurance record."""
    record = await service.update_insurance(
        insurance_id,
        PatientInsuranceUpdate(**update_data.model_dump(exclude_unset=True)),
    )
    return success_response(
        message="Insurance record updated successfully",
        data=record,
    )


@router.delete("/{insurance_id}", response_model=dict)
async def delete_patient_insurance(
    insurance_id: str,
    current_user: dict = Depends(require_any_role),
    service: PatientInsuranceService = Depends(get_service),
):
    """Delete an insurance record."""
    deleted_id, reassigned = await service.delete_insurance(insurance_id)
    return success_response(
        message="Insurance record deleted successfully",
        data={"insuranceId": deleted_id, "reassignedPrimary": reassigned},
    )


