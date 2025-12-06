"""
Lab report API endpoints.
"""

from fastapi import APIRouter, Depends, Query, status
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.middleware.auth import (
    optional_auth,
    require_any_role,
    require_doctor_or_admin,
)
from app.models.lab_report import LabReportCreate, LabReportUpdate
from app.schemas.lab_report import (
    LabReportCreateRequest,
    LabReportUpdateRequest,
)
from app.services.lab_report_service import LabReportService
from app.utils.response import success_response, paginated_response, error_response

router = APIRouter()


def get_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> LabReportService:
    """Dependency for lab report service."""
    return LabReportService(db)


@router.post(
    "/",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
)
async def create_lab_report(
    report_data: LabReportCreateRequest,
    current_user: dict = Depends(require_doctor_or_admin),
    service: LabReportService = Depends(get_service),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create a new lab report."""
    report = await service.create_report(
        LabReportCreate(**report_data.model_dump()),
        created_by=str(current_user["_id"]),
    )
    
    # Send notification to doctor if assigned
    if report_data.doctorId:
        try:
            from app.services.notification_service import NotificationService
            notification_service = NotificationService(db)
            
            # Get patient name
            patient_name = "Patient"
            if report_data.patientId:
                patient = await db.patients.find_one({"patientId": report_data.patientId})
                if patient:
                    patient_name = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip() or "Patient"
            
            report_type = report_data.category or "Lab"
            
            await notification_service.notify_doctor_report_received(
                doctor_id=report_data.doctorId,
                patient_id=report_data.patientId,
                patient_name=patient_name,
                report_type=report_type,
                report_id=report.get("_id", ""),
                clinic_id=report_data.clinicId if hasattr(report_data, 'clinicId') else None
            )
        except Exception as e:
            # Don't fail the report creation if notification fails
            import logging
            logging.getLogger(__name__).error(f"Failed to send lab report notification: {e}")
    
    return success_response(
        message="Lab report created successfully",
        data=report,
        status_code=status.HTTP_201_CREATED,
    )


@router.get("/", response_model=dict)
async def list_lab_reports(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    patientId: Optional[str] = Query(None),
    doctorId: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    isCritical: Optional[bool] = Query(None),
    current_user: Optional[dict] = Depends(optional_auth),
    service: LabReportService = Depends(get_service),
):
    """
    List lab reports with filters.

    - Admins can view all reports.
    - Doctors can view reports they authored or for their patients.
    - Receptionists can view reports for patients when authenticated.
    """
    if not current_user:
        return error_response(
            message="Authentication required to view lab reports",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    # Enforce role-based filtering
    if current_user["role"] == "doctor":
        doctorId = doctorId or str(current_user["_id"])

    reports, total = await service.list_reports(
        page=page,
        limit=limit,
        patient_id=patientId,
        doctor_id=doctorId,
        category=category,
        is_critical=isCritical,
    )
    return paginated_response(
        message="Lab reports retrieved successfully",
        data=reports,
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{report_id}", response_model=dict)
async def get_lab_report(
    report_id: str,
    current_user: Optional[dict] = Depends(optional_auth),
    service: LabReportService = Depends(get_service),
):
    """Retrieve a specific lab report by ID."""
    if not current_user:
        return error_response(
            message="Authentication required",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    report = await service.get_report(report_id)
    if not report:
        return error_response(
            message="Lab report not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    if current_user["role"] == "doctor" and report["doctorId"] != str(
        current_user["_id"]
    ):
        return error_response(
            message="Access denied",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    return success_response(
        message="Lab report retrieved successfully",
        data=report,
    )


@router.put("/{report_id}", response_model=dict)
async def update_lab_report(
    report_id: str,
    update_data: LabReportUpdateRequest,
    current_user: dict = Depends(require_doctor_or_admin),
    service: LabReportService = Depends(get_service),
):
    """Update a lab report."""
    report = await service.update_report(
        report_id,
        LabReportUpdate(**update_data.model_dump(exclude_unset=True)),
    )
    return success_response(
        message="Lab report updated successfully",
        data=report,
    )


@router.delete("/{report_id}", response_model=dict)
async def delete_lab_report(
    report_id: str,
    current_user: dict = Depends(require_doctor_or_admin),
    service: LabReportService = Depends(get_service),
):
    """Delete a lab report (soft delete)."""
    await service.delete_report(report_id)
    return success_response(
        message="Lab report deleted successfully",
        data={"reportId": report_id},
    )


