"""
Appointment management router.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
from datetime import datetime
import asyncio

from app.database import get_db
from app.schemas.appointment import (
    AppointmentCreateRequest,
    AppointmentUpdateRequest,
    AppointmentStatusUpdate,
    AppointmentCheckIn
)
from app.models.appointment import AppointmentCreate
from app.services.appointment_service import AppointmentService
from app.services.recording_service import RecordingService
from app.services.queue_service import QueueService
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


@router.post("/{appointment_id}/complete-consultation")
async def complete_consultation(
    appointment_id: str,
    background_tasks: BackgroundTasks,
    queue_id: Optional[str] = Form(None),
    prescribed_test: Optional[str] = Form(None),
    diagnosis: Optional[str] = Form(None),
    treatment_plan: Optional[str] = Form(None),
    follow_up_instructions: Optional[str] = Form(None),
    detailed_notes: Optional[str] = Form(None),
    ai_recommendations: Optional[str] = Form(None),
    prescription: Optional[str] = Form(None),
    recording_file: Optional[UploadFile] = File(None),
    recording_duration: Optional[int] = Form(None),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Complete consultation: save consultation details and optionally upload recording in background.
    
    This endpoint saves consultation data immediately and handles recording upload
    in the background, allowing the frontend to navigate away quickly.
    """
    try:
        from bson import ObjectId
        # Validate appointment_id
        if not ObjectId.is_valid(appointment_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid appointment ID"
            )
        
        appointment_service = AppointmentService(db)
        
        # Save consultation details to appointment immediately
        update_data = AppointmentUpdateRequest(
            status="completed",
            prescribed_test=prescribed_test,
            diagnosis=diagnosis,
            treatment_plan=treatment_plan,
            follow_up_instructions=follow_up_instructions,
            detailed_notes=detailed_notes,
            ai_recommendations=ai_recommendations,
            prescription=prescription
        )
        
        appointment = await appointment_service.update_appointment(
            appointment_id,
            update_data
        )
        
        # Update queue status - find queue entry by appointment if queue_id not provided
        try:
            from app.schemas.queue import QueueStatusUpdate
            queue_service = QueueService(db)
            
            # If queue_id provided, use it; otherwise find by appointment
            queue_entry_id = queue_id
            if not queue_entry_id:
                queue_entry = await queue_service.get_queue_entry_by_appointment(appointment_id)
                if queue_entry:
                    queue_entry_id = queue_entry.get("_id")
            
            if queue_entry_id:
                # Update queue status to completed (this will also set is_active to False)
                await queue_service.update_queue_status(
                    queue_entry_id, 
                    QueueStatusUpdate(status="completed")
                )
        except Exception as e:
            # Log but don't fail the request if queue update fails
            import logging
            logging.warning(f"Failed to update queue status: {e}", exc_info=True)
        
        # If recording is provided, upload it in the background
        if recording_file and recording_duration:
            # Get patient and doctor IDs from appointment
            from bson import ObjectId
            appointment_obj_id = ObjectId(appointment_id) if ObjectId.is_valid(appointment_id) else None
            if appointment_obj_id:
                appointment_data = await db.appointments.find_one({"_id": appointment_obj_id})
                if appointment_data:
                    patient_id = appointment_data.get("patientId")
                    doctor_id = appointment_data.get("doctorId") or current_user.get("_id")
                    
                    if patient_id and doctor_id:
                        # Read file content before request completes
                        file_content = await recording_file.read()
                        file_filename = recording_file.filename or "consultation-recording.wav"
                        file_content_type = recording_file.content_type or "audio/wav"
                        
                        background_tasks.add_task(
                            _upload_recording_background,
                            db,
                            file_content,
                            file_filename,
                            file_content_type,
                            patient_id,
                            appointment_id,
                            doctor_id,
                            recording_duration
                        )
        
        return success_response(
            message="Consultation completed successfully",
            data={"appointment": appointment}
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Consultation completion failed: {str(e)}"
        )


async def _upload_recording_background(
    db: AsyncIOMotorDatabase,
    file_content: bytes,
    filename: str,
    content_type: str,
    patient_id: str,
    appointment_id: str,
    doctor_id: str,
    duration: int
):
    """Background task to upload recording to S3."""
    import logging
    from io import BytesIO
    logger = logging.getLogger(__name__)
    try:
        # Create a file-like object from bytes
        file_obj = BytesIO(file_content)
        file_obj.name = filename
        
        # Create a wrapper that implements the UploadFile interface
        class FileWrapper:
            def __init__(self, file_obj, filename, content_type):
                self.file = file_obj
                self.filename = filename
                self.content_type = content_type
            
            async def read(self):
                # Reset file pointer to beginning
                self.file.seek(0)
                return self.file.read()
        
        wrapped_file = FileWrapper(file_obj, filename, content_type)
        
        recording_service = RecordingService(db)
        await recording_service.upload_recording(
            file=wrapped_file,
            patient_id=patient_id,
            appointment_id=appointment_id,
            doctor_id=doctor_id,
            duration=duration,
            retention_policy="standard"
        )
        logger.info(f"Successfully uploaded recording for appointment {appointment_id}")
    except Exception as e:
        # Log error but don't raise - this is a background task
        logger.error(f"Background recording upload failed for appointment {appointment_id}: {e}", exc_info=True)


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

