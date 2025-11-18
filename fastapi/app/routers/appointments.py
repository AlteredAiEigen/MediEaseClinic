"""
Appointment management router.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.database import get_db
from app.schemas.appointment import (
    AppointmentCreateRequest,
    AppointmentUpdateRequest,
    AppointmentStatusUpdate,
    AppointmentCheckIn
)
from app.models.appointment import AppointmentCreate
from app.services.appointment_service import AppointmentService
from app.middleware.auth import get_current_active_user, require_any_role, require_roles
from app.utils.response import success_response, paginated_response

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_data: AppointmentCreateRequest,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create new appointment.
    
    Requires authentication. Checks for time slot conflicts.
    """
    try:
        appointment_service = AppointmentService(db)
        appointment_payload = appointment_data.model_dump()
        appointment_model = AppointmentCreate(**appointment_payload)
        clinic_id = current_user.get("clinicId")
        clinic_name = current_user.get("clinicName")
        appointment = await appointment_service.create_appointment(
            appointment_model,
            scheduled_by=str(current_user["_id"]),
            clinic_id=clinic_id,
            clinic_name=clinic_name
        )
        
        return success_response(
            message="Appointment created successfully",
            data={"appointment": appointment},
            status_code=201
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Appointment creation failed: {str(e)}"
        )


@router.get("/")
async def list_appointments(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    patient_id: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
    date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    status: Optional[str] = Query(None, pattern="^(scheduled|checked-in|in-progress|completed|cancelled|no-show)$"),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List appointments with filtering.
    
    Filter by patient, doctor, date, or status.
    """
    try:
        appointment_service = AppointmentService(db)

        clinic_id = current_user.get("clinicId")
        user_role = current_user.get("role")

        doctor_filter = doctor_id
        if user_role == "doctor":
            doctor_filter = str(current_user["_id"])
        elif doctor_filter:
            doctor_filter = str(doctor_filter)

        patient_filter = str(patient_id) if patient_id else None

        appointments, total = await appointment_service.list_appointments(
            page=page,
            limit=limit,
            patient_id=patient_filter,
            doctor_id=doctor_filter,
            date=date,
            status=status,
            clinic_id=clinic_id
        )
        
        return paginated_response(
            message="Appointments retrieved successfully",
            data=appointments,
            total=total,
            page=page,
            limit=limit
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve appointments: {str(e)}"
        )


@router.get("/{appointment_id}")
async def get_appointment(
    appointment_id: str,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get appointment by ID."""
    appointment_service = AppointmentService(db)
    appointment = await appointment_service.get_appointment(appointment_id)
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    return success_response(
        message="Appointment retrieved successfully",
        data={"appointment": appointment}
    )


@router.get("/doctor/{doctor_id}/schedule")
async def get_doctor_schedule(
    doctor_id: str,
    date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get doctor's schedule for specific date."""
    try:
        appointment_service = AppointmentService(db)
        schedule = await appointment_service.get_doctor_schedule(doctor_id, date)
        
        return success_response(
            message="Doctor schedule retrieved successfully",
            data={"schedule": schedule}
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve schedule: {str(e)}"
        )


@router.put("/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    update_data: AppointmentUpdateRequest,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update appointment details."""
    try:
        appointment_service = AppointmentService(db)
        appointment = await appointment_service.update_appointment(
            appointment_id,
            update_data
        )
        
        return success_response(
            message="Appointment updated successfully",
            data={"appointment": appointment}
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Appointment update failed: {str(e)}"
        )


@router.patch("/{appointment_id}/status")
async def update_appointment_status(
    appointment_id: str,
    status_update: AppointmentStatusUpdate,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update appointment status."""
    try:
        appointment_service = AppointmentService(db)
        appointment = await appointment_service.update_status(
            appointment_id,
            status_update.status,
            status_update.cancellationReason
        )
        
        return success_response(
            message="Appointment status updated successfully",
            data={"appointment": appointment}
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Status update failed: {str(e)}"
        )


@router.post("/{appointment_id}/prescription-upload")
async def upload_prescription(
    appointment_id: str,
    file: UploadFile = File(...),
    notes: Optional[str] = Form(None),
    current_user: dict = Depends(require_roles(["receptionist", "admin", "doctor"])),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Upload a scanned prescription and attach it to the appointment record."""
    try:
        appointment_service = AppointmentService(db)
        appointment = await appointment_service.upload_prescription_file(
            appointment_id=appointment_id,
            file=file,
            uploaded_by=str(current_user["_id"]),
            notes=notes
        )

        return success_response(
            message="Prescription uploaded successfully",
            data={"appointment": appointment}
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prescription upload failed: {str(e)}"
        )


@router.patch("/{appointment_id}/check-in")
async def check_in_appointment(
    appointment_id: str,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Check in patient for appointment."""
    try:
        appointment_service = AppointmentService(db)
        appointment = await appointment_service.update_status(
            appointment_id,
            "checked-in"
        )
        
        return success_response(
            message="Patient checked in successfully",
            data={"appointment": appointment}
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Check-in failed: {str(e)}"
        )


@router.delete("/{appointment_id}")
async def cancel_appointment(
    appointment_id: str,
    cancellation_reason: Optional[str] = Query(None),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Cancel appointment."""
    try:
        appointment_service = AppointmentService(db)
        await appointment_service.update_status(
            appointment_id,
            "cancelled",
            cancellation_reason
        )
        
        return success_response(
            message="Appointment cancelled successfully",
            data={"appointmentId": appointment_id}
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cancellation failed: {str(e)}"
        )

