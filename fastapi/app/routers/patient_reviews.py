"""
Router for patient review endpoints.
"""

from fastapi import APIRouter, Depends, Query, status
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_db
from app.middleware.auth import require_any_role
from app.models.patient_review import PatientReviewCreate, PatientReviewUpdate
from app.schemas.patient_review import PatientReviewCreateRequest, PatientReviewUpdateRequest
from app.services.patient_review_service import PatientReviewService
from app.utils.response import success_response, paginated_response

router = APIRouter()


def get_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> PatientReviewService:
    return PatientReviewService(db)


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_patient_review(
    review_data: PatientReviewCreateRequest,
    current_user: dict = Depends(require_any_role),
    service: PatientReviewService = Depends(get_service),
):
    review = await service.create_review(PatientReviewCreate(**review_data.model_dump()))
    return success_response(
        message="Patient review created successfully",
        data=review,
        status_code=status.HTTP_201_CREATED,
    )


@router.get("/", response_model=dict)
async def list_patient_reviews(
    doctorId: Optional[str] = Query(None, description="Filter by doctor ID"),
    patientId: Optional[str] = Query(None, description="Filter by patient ID"),
    appointmentId: Optional[str] = Query(None, description="Filter by appointment ID"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(require_any_role),
    service: PatientReviewService = Depends(get_service),
):
    reviews, total = await service.list_reviews(doctorId, patientId, appointmentId, page, limit)
    return paginated_response(
        message="Patient reviews retrieved successfully",
        data=reviews,
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{review_id}", response_model=dict)
async def get_patient_review(
    review_id: str,
    current_user: dict = Depends(require_any_role),
    service: PatientReviewService = Depends(get_service),
):
    review = await service.get_review(review_id)
    if not review:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    return success_response(
        message="Patient review retrieved successfully",
        data=review,
    )


@router.put("/{review_id}", response_model=dict)
async def update_patient_review(
    review_id: str,
    update_data: PatientReviewUpdateRequest,
    current_user: dict = Depends(require_any_role),
    service: PatientReviewService = Depends(get_service),
):
    review = await service.update_review(
        review_id, PatientReviewUpdate(**update_data.model_dump(exclude_unset=True))
    )
    return success_response(
        message="Patient review updated successfully",
        data=review,
    )


@router.delete("/{review_id}", response_model=dict)
async def delete_patient_review(
    review_id: str,
    current_user: dict = Depends(require_any_role),
    service: PatientReviewService = Depends(get_service),
):
    await service.delete_review(review_id)
    return success_response(
        message="Patient review deleted successfully",
        data={"id": review_id},
    )


@router.get("/doctor/{doctor_id}/stats", response_model=dict)
async def get_doctor_rating_stats(
    doctor_id: str,
    current_user: dict = Depends(require_any_role),
    service: PatientReviewService = Depends(get_service),
):
    stats = await service.get_doctor_rating_stats(doctor_id)
    return success_response(
        message="Doctor rating statistics retrieved successfully",
        data=stats,
    )

