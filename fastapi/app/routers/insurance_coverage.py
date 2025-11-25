"""
Router for insurance coverage endpoints.
"""

from fastapi import APIRouter, Depends, Query, status
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_db
from app.middleware.auth import require_any_role
from app.models.insurance_coverage import InsuranceCoverageCreate, InsuranceCoverageUpdate
from app.schemas.insurance_coverage import InsuranceCoverageCreateRequest, InsuranceCoverageUpdateRequest
from app.services.insurance_coverage_service import InsuranceCoverageService
from app.utils.response import success_response

router = APIRouter()


def get_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> InsuranceCoverageService:
    return InsuranceCoverageService(db)


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_insurance_coverage(
    coverage_data: InsuranceCoverageCreateRequest,
    current_user: dict = Depends(require_any_role),
    service: InsuranceCoverageService = Depends(get_service),
):
    coverage = await service.create_coverage(InsuranceCoverageCreate(**coverage_data.model_dump()))
    return success_response(
        message="Insurance coverage created successfully",
        data=coverage,
        status_code=status.HTTP_201_CREATED,
    )


@router.get("/", response_model=dict)
async def list_insurance_coverage(
    patientId: str = Query(..., description="Patient ID to filter coverage"),
    policyNumber: Optional[str] = Query(None, description="Policy number to filter coverage"),
    current_user: dict = Depends(require_any_role),
    service: InsuranceCoverageService = Depends(get_service),
):
    if policyNumber:
        coverage = await service.get_coverage_by_policy(patientId, policyNumber)
        if not coverage:
            return success_response(
                message="No coverage found for this policy",
                data=None,
            )
        return success_response(
            message="Insurance coverage retrieved successfully",
            data=coverage,
        )
    else:
        coverage_list = await service.list_coverage(patientId)
        return success_response(
            message="Insurance coverage list retrieved successfully",
            data=coverage_list,
        )


@router.get("/{coverage_id}", response_model=dict)
async def get_insurance_coverage(
    coverage_id: str,
    current_user: dict = Depends(require_any_role),
    service: InsuranceCoverageService = Depends(get_service),
):
    from fastapi import HTTPException
    coverage = await service._get_coverage(coverage_id)
    from app.models.insurance_coverage import insurance_coverage_helper
    return success_response(
        message="Insurance coverage retrieved successfully",
        data=insurance_coverage_helper(coverage),
    )


@router.put("/{coverage_id}", response_model=dict)
async def update_insurance_coverage(
    coverage_id: str,
    update_data: InsuranceCoverageUpdateRequest,
    current_user: dict = Depends(require_any_role),
    service: InsuranceCoverageService = Depends(get_service),
):
    coverage = await service.update_coverage(
        coverage_id, InsuranceCoverageUpdate(**update_data.model_dump())
    )
    return success_response(
        message="Insurance coverage updated successfully",
        data=coverage,
    )


@router.delete("/{coverage_id}", response_model=dict)
async def delete_insurance_coverage(
    coverage_id: str,
    current_user: dict = Depends(require_any_role),
    service: InsuranceCoverageService = Depends(get_service),
):
    await service.delete_coverage(coverage_id)
    return success_response(
        message="Insurance coverage deleted successfully",
        data={"id": coverage_id},
    )

