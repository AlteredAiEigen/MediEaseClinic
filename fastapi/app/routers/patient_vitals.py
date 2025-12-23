"""
Patient vitals API endpoints.
"""

from fastapi import APIRouter, Depends, Path, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.middleware.auth import require_any_role, require_doctor_or_admin
from app.schemas.patient_vital import PatientVitalCreateRequest
from app.services.patient_vital_service import PatientVitalService
from app.models.patient_vital import PatientVitalCreate
from app.utils.response import success_response, paginated_response

router = APIRouter()


def get_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> PatientVitalService:
    return PatientVitalService(db)


@router.post(
    "/{patient_id}",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
)
async def record_vitals(
    patient_id: str = Path(..., description="Patient MongoDB ObjectId"),
    payload: PatientVitalCreateRequest = ...,
    current_user: dict = Depends(require_any_role),  # Allow receptionists, doctors, and admins
    service: PatientVitalService = Depends(get_service),
):
    """Record new vitals for a patient."""
    vitals = await service.record_vitals(
        patient_id=patient_id,
        recorded_by=str(current_user["_id"]),
        vitals_data=PatientVitalCreate(
            patientId=patient_id,
            recordedBy=str(current_user["_id"]),
            **payload.model_dump(exclude_unset=True),
        ),
    )
    return success_response(
        message="Vitals recorded successfully",
        data=vitals,
        status_code=status.HTTP_201_CREATED,
    )


@router.get("/{patient_id}", response_model=dict)
async def list_vitals(
    patient_id: str = Path(..., description="Patient MongoDB ObjectId"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_any_role),
    service: PatientVitalService = Depends(get_service),
):
    """List vitals history for a patient."""
    vitals, total = await service.list_vitals(
        patient_id=patient_id,
        page=page,
        limit=limit,
    )
    return paginated_response(
        message="Vitals retrieved successfully",
        data=vitals,
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{patient_id}/latest", response_model=dict)
async def get_latest_vitals(
    patient_id: str = Path(..., description="Patient MongoDB ObjectId"),
    current_user: dict = Depends(require_any_role),
    service: PatientVitalService = Depends(get_service),
):
    """Get the most recent vitals for a patient."""
    latest = await service.latest_vitals(patient_id)
    return success_response(
        message="Latest vitals retrieved successfully",
        data=latest,
    )


