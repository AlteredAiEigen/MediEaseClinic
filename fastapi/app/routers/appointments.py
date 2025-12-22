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
from app.services.patient_insights_service import patient_insights_service
from app.services.s3_service import s3_service
from app.middleware.auth import get_current_active_user, require_any_role, require_roles
from app.utils.response import success_response, paginated_response
from app.utils.cache import cache
from bson import ObjectId

router = APIRouter()

async def _invalidate_appointments_cache() -> None:
    """
    Appointment lists are cached for performance, but any write (create/update/status)
    must invalidate cached list responses so dashboards update immediately.
    """
    await cache.clear_pattern("appointments:")


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

        await _invalidate_appointments_cache()
        
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
        clinic_id = current_user.get("clinicId")
        user_role = current_user.get("role")

        doctor_filter = doctor_id
        if user_role == "doctor":
            doctor_filter = str(current_user["_id"])
        elif doctor_filter:
            doctor_filter = str(doctor_filter)

        patient_filter = str(patient_id) if patient_id else None
        
        # Generate cache key (20 second TTL for appointments)
        cache_key = f"appointments:{clinic_id}:{page}:{limit}:{patient_filter}:{doctor_filter}:{date}:{status}"
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached

        appointment_service = AppointmentService(db)

        appointments, total = await appointment_service.list_appointments(
            page=page,
            limit=limit,
            patient_id=patient_filter,
            doctor_id=doctor_filter,
            date=date,
            status=status,
            clinic_id=clinic_id
        )
        
        result = paginated_response(
            message="Appointments retrieved successfully",
            data=appointments,
            total=total,
            page=page,
            limit=limit
        )
        
        # Cache result for 20 seconds
        await cache.set(cache_key, result, ttl_seconds=20)
        
        return result
    
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

        await _invalidate_appointments_cache()
        
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

        await _invalidate_appointments_cache()
        
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

        await _invalidate_appointments_cache()

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


@router.delete("/{appointment_id}/prescription")
async def delete_prescription(
    appointment_id: str,
    current_user: dict = Depends(require_roles(["receptionist", "admin", "doctor"])),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Delete prescription file from S3 and database."""
    try:
        appointment_service = AppointmentService(db)
        appointment = await appointment_service.delete_prescription_file(
            appointment_id=appointment_id
        )

        await _invalidate_appointments_cache()

        return success_response(
            message="Prescription deleted successfully",
            data={"appointment": appointment}
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prescription deletion failed: {str(e)}"
        )


@router.get("/{appointment_id}/prescription/presigned-url")
async def get_prescription_presigned_url(
    appointment_id: str,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Get a presigned URL for the prescription file associated with an appointment.
    
    Args:
        appointment_id: Appointment ID
        
    Returns:
        Presigned URL for accessing the prescription file in S3
    """
    try:
        if not ObjectId.is_valid(appointment_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid appointment ID format"
            )
        
        appointment_service = AppointmentService(db)
        appointment = await appointment_service.get_appointment(appointment_id)
        
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        prescription_file_key = appointment.get("prescriptionFileKey")
        if not prescription_file_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No prescription file found for this appointment"
            )
        
        # Generate presigned URL
        presigned_url = await s3_service.generate_presigned_url(prescription_file_key)
        
        return success_response(
            message="Presigned URL generated successfully",
            data={
                "appointmentId": appointment_id,
                "presignedUrl": presigned_url,
                "fileName": appointment.get("prescriptionFileName"),
                "fileType": appointment.get("prescriptionFileType"),
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate presigned URL: {str(e)}"
        )


@router.patch("/{appointment_id}/check-in")
async def check_in_appointment(
    appointment_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Check in patient for appointment.

    In addition to updating the appointment status, this endpoint triggers
    asynchronous AI insights generation for the patient so that the
    consultation page has fresh recommendations.
    """
    try:
        appointment_service = AppointmentService(db)
        appointment = await appointment_service.update_status(
            appointment_id,
            "checked-in",
        )

        await _invalidate_appointments_cache()

        # Fire-and-forget task to refresh patient insights using AI
        patient_id = appointment.get("patientId")
        if patient_id:
            background_tasks.add_task(
                patient_insights_service.generate_patient_insights_on_checkin,
                patient_id,
            )

        return success_response(
            message="Patient checked in successfully",
            data={"appointment": appointment},
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
        
        # Check if prescription file already exists (uploaded by doctor during consultation)
        appointment_obj_id = ObjectId(appointment_id)
        existing_appointment = await db.appointments.find_one({"_id": appointment_obj_id})
        prescription_exists = existing_appointment and (
            existing_appointment.get("prescriptionFileUrl") or 
            existing_appointment.get("prescriptionFileKey")
        )
        
        # Set status based on whether prescription file exists
        # If prescription uploaded → "completed", else → "checkout-pending" (receptionist needs to upload)
        consultation_status = "completed" if prescription_exists else "checkout-pending"
        
        # Log for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Complete consultation for appointment {appointment_id}: prescription_exists={prescription_exists}, setting status to {consultation_status}")
        
        # Save consultation details to appointment immediately
        update_data = AppointmentUpdateRequest(
            status=consultation_status,
            prescribedTest=prescribed_test,
            diagnosis=diagnosis,
            treatmentPlan=treatment_plan,
            followUpInstructions=follow_up_instructions,
            detailedNotes=detailed_notes,
            aiRecommendations=ai_recommendations,
            prescription=prescription
        )
        
        appointment = await appointment_service.update_appointment(
            appointment_id,
            update_data
        )

        await _invalidate_appointments_cache()
        
        # Note: Queue status is now automatically synced in update_appointment method
        # This ensures queue status stays in sync with appointment status
        
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
                        
                        # Upload recording and process transcription in background
                        # This includes transcription and structured notes extraction
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
    """Background task to upload recording to S3 and process transcription."""
    import logging
    from io import BytesIO
    from bson import ObjectId
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
        recording = await recording_service.upload_recording(
            file=wrapped_file,
            patient_id=patient_id,
            appointment_id=appointment_id,
            doctor_id=doctor_id,
            duration=duration,
            retention_policy="standard"
        )
        logger.info(f"Successfully uploaded recording for appointment {appointment_id}. Transcription and AI extraction will be handled by cron job server.")
        
        # Note: Transcription and AI extraction are now handled by a separate cron job server
        # The recording is marked with transcriptionStatus="pending" and notesExtractionStatus="pending"
        # The cron job server will pick up pending recordings and process them
    except Exception as e:
        # Log error but don't raise - this is a background task
        logger.error(f"Background recording upload/processing failed for appointment {appointment_id}: {e}", exc_info=True)


async def _process_recording_transcription_background(
    db: AsyncIOMotorDatabase,
    appointment_id: str
):
    """Background task to process transcription and structured notes for a recording."""
    import logging
    from bson import ObjectId
    logger = logging.getLogger(__name__)
    try:
        # Find recording by appointment_id
        recording = await db.recordings.find_one({"appointmentId": appointment_id})
        if recording and recording.get("transcription") and recording.get("_id"):
            recording_service = RecordingService(db)
            await recording_service.process_structured_notes(recording["_id"])
            logger.info(f"Successfully processed transcription for appointment {appointment_id}")
    except Exception as e:
        logger.error(f"Background transcription processing failed for appointment {appointment_id}: {e}", exc_info=True)


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

        await _invalidate_appointments_cache()
        
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

