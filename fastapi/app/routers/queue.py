"""
Queue API endpoints.
"""

import json
from typing import Optional
from fastapi import APIRouter, Depends, status, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.queue import (
    QueueCheckIn,
    QueueStatusUpdate,
    QueueEntryResponse,
    QueueStats,
    QueueReorderRequest,
    QueueConsultationUpdate,
)
from app.services.queue_service import QueueService
from app.database import get_db
from app.middleware.auth import get_current_user, require_roles
from app.utils.response import success_response, error_response

router = APIRouter()


@router.post("/check-in", response_model=dict, status_code=status.HTTP_201_CREATED)
async def check_in_patient(
    check_in_data: QueueCheckIn,
    current_user: dict = Depends(require_roles(["receptionist", "admin", "doctor"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Check in a patient to the queue."""
    try:
        queue_service = QueueService(db)
        clinic_id = current_user.get("clinicId")
        if clinic_id:
            clinic_id = str(clinic_id)
        queue_entry = await queue_service.check_in_patient(
            check_in_data,
            current_user["_id"],
            clinic_id=clinic_id,
        )
        # Convert Pydantic model to dict, ensuring ObjectIds are strings
        entry_dict = queue_entry.dict(by_alias=True, exclude_none=False)
        # Ensure all values are JSON-serializable (handles any remaining ObjectIds)
        entry_dict = json.loads(json.dumps(entry_dict, default=str))
        return success_response(
            data=entry_dict,
            message="Patient checked in successfully"
        )
    except HTTPException as e:
        return error_response(
            message=e.detail,
            status_code=e.status_code
        )
    except Exception as e:
        return error_response(
            message=f"Failed to check in patient: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/", response_model=dict)
async def get_queue(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get today's active queue, filtered by clinic for receptionists."""
    try:
        queue_service = QueueService(db)
        # Filter by clinic_id for receptionists and doctors
        clinic_id = current_user.get("clinicId")
        if clinic_id:
            clinic_id = str(clinic_id)
        queue = await queue_service.get_active_queue(clinic_id=clinic_id)
        return success_response(
            data={"queue": queue},
            message="Queue retrieved successfully"
        )
    except HTTPException as e:
        return error_response(
            message=e.detail,
            status_code=e.status_code
        )
    except Exception as e:
        return error_response(
            message=f"Failed to fetch queue: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/stats", response_model=dict)
async def get_queue_stats(
    current_user: dict = Depends(require_roles(["admin", "doctor", "receptionist"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get today's queue statistics, filtered by clinic for receptionists."""
    queue_service = QueueService(db)
    # Filter by clinic_id for receptionists and doctors
    clinic_id = current_user.get("clinicId")
    if clinic_id:
        clinic_id = str(clinic_id)
    stats = await queue_service.get_queue_stats(clinic_id=clinic_id)
    return success_response(
        data=stats,
        message="Queue statistics retrieved successfully"
    )


@router.get("/doctor/{doctor_id}", response_model=dict)
async def get_doctor_queue(
    doctor_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get today's queue for a specific doctor."""
    queue_service = QueueService(db)
    queue = await queue_service.get_doctor_queue(doctor_id)
    return success_response(
        data={"queue": queue},
        message="Doctor's queue retrieved successfully"
    )


@router.get("/by-appointment/{appointment_id}", response_model=dict)
async def get_queue_entry_by_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get queue entry by appointment ID."""
    queue_service = QueueService(db)
    entry = await queue_service.get_queue_entry_by_appointment(appointment_id)
    if not entry:
        # Return success with null data instead of 404 - not all appointments have queue entries
        return success_response(
            data=None,
            message="No queue entry found for this appointment"
        )
    return success_response(data=entry, message="Queue entry retrieved successfully")


@router.get("/{entry_id}", response_model=dict)
async def get_queue_entry(
    entry_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get a single queue entry by ID."""
    queue_service = QueueService(db)
    entry = await queue_service.get_queue_entry(entry_id)
    if not entry:
        return error_response(
            message="Queue entry not found",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return success_response(data=entry, message="Queue entry retrieved successfully")


@router.put("/{entry_id}/status", response_model=dict)
async def update_queue_status(
    entry_id: str,
    status_update: QueueStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update the status of a queue entry."""
    queue_service = QueueService(db)
    entry = await queue_service.update_queue_status(entry_id, status_update)
    if not entry:
        return error_response(
            message="Queue entry not found",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return success_response(data=entry, message="Queue status updated successfully")


@router.put("/{entry_id}/start-consultation", response_model=dict)
async def start_consultation(
    entry_id: str,
    current_user: dict = Depends(require_roles(["doctor"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Start consultation for a queue entry."""
    queue_service = QueueService(db)
    entry = await queue_service.start_consultation(entry_id)
    if not entry:
        return error_response(
            message="Queue entry not found",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return success_response(data=entry, message="Consultation started successfully")


@router.post("/{entry_id}/check-out", response_model=dict)
async def check_out_patient(
    entry_id: str,
    prescription_file: Optional[UploadFile] = File(None),
    notes: Optional[str] = Form(None),
    current_user: dict = Depends(require_roles(["receptionist", "admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Check out patient from queue.
    
    **All processing happens in the backend**:
    - If prescription_file is provided, it will be uploaded to S3 in the background
    - Appointment status will be updated to "completed" automatically
    - Prescription analysis will be scheduled in the background
    - Queue entry will be marked as checked out
    
    This endpoint returns immediately after initiating all background tasks.
    """
    from bson import ObjectId
    from datetime import datetime
    import logging
    logger = logging.getLogger(__name__)
    
    # First, get the queue entry to find the appointment
    queue_entry = await db.queue.find_one({"_id": ObjectId(entry_id)})
    if not queue_entry:
        return error_response(
            message="Queue entry not found",
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    # Get appointment ID from queue entry
    appointment_value = queue_entry.get("appointment")
    appointment_id = None
    
    if appointment_value:
        if isinstance(appointment_value, dict):
            appointment_id = appointment_value.get("_id")
        elif isinstance(appointment_value, ObjectId):
            appointment_id = str(appointment_value)
        elif isinstance(appointment_value, str):
            appointment_id = appointment_value
        else:
            appointment_id = str(appointment_value)
    
    # Update appointment status to completed FIRST (before checkout to avoid race conditions)
    # This ensures queue status sync happens before we explicitly set it to checked-out
    if appointment_id:
        try:
            from app.services.appointment_service import AppointmentService
            appointment_service = AppointmentService(db)
            await appointment_service.update_status(
                appointment_id,
                "completed"
            )
            logger.info(f"Appointment {appointment_id} status updated to completed")
        except Exception as status_error:
            logger.error(f"Failed to update appointment status during checkout: {status_error}", exc_info=True)
            # Don't fail checkout if appointment update fails
    
    # Handle prescription upload in background if provided
    if prescription_file and appointment_id:
        try:
            # Read file content before passing to background task
            file_content = await prescription_file.read()
            file_name = prescription_file.filename
            content_type = prescription_file.content_type
            
            # Create a background task function
            async def upload_and_analyze_prescription():
                try:
                    from app.services.s3_service import s3_service
                    from datetime import datetime
                    
                    logger.info(f"Uploading prescription file for appointment {appointment_id} (background)")
                    
                    # Upload to S3 using correct API (file_name, folder; s3_key is returned)
                    upload_result = await s3_service.upload_file(
                        file_content=file_content,
                        file_name=file_name or "prescription",
                        content_type=content_type or "image/jpeg",
                        folder=f"prescriptions/{appointment_id}"
                    )
                    s3_key = upload_result["s3_key"]
                    
                    # Create s3_prescription document (scanned Rx only — not lab reports)
                    s3_prescription_doc = {
                        "appointmentId": appointment_id,
                        "s3Key": s3_key,
                        "documentName": file_name,
                        "documentType": "prescription",
                        "fileType": content_type,
                        "uploadedBy": str(current_user["_id"]),
                        "uploadedAt": datetime.utcnow(),
                        "notes": notes,
                        "metadata": {
                            "source": "scanned",
                            "documentType": "prescription",
                        },
                        "createdAt": datetime.utcnow(),
                        "updatedAt": datetime.utcnow()
                    }
                    
                    result = await db.s3_prescriptions.insert_one(s3_prescription_doc)
                    s3_prescription_id = str(result.inserted_id)
                    
                    # Update appointment with prescription file info
                    await db.appointments.update_one(
                        {"_id": ObjectId(appointment_id)},
                        {
                            "$set": {
                                "prescriptionFileKey": s3_key,
                                "prescriptionFileName": file_name,
                                "prescriptionFileType": content_type,
                                "prescriptionUploadedAt": datetime.utcnow(),
                                "prescriptionUploadedBy": str(current_user["_id"]),
                                "updatedAt": datetime.utcnow()
                            }
                        }
                    )
                    
                    # Schedule prescription analysis in background
                    from app.routers.appointments import _analyze_prescription_background
                    await _analyze_prescription_background(
                        db,
                        s3_prescription_id,
                        appointment_id
                    )
                    logger.info(f"Prescription uploaded and analysis scheduled for appointment {appointment_id}")
                except Exception as upload_error:
                    logger.error(f"Failed to upload/analyze prescription during checkout: {upload_error}", exc_info=True)
            
            # Schedule prescription upload and analysis in background
            background_tasks.add_task(upload_and_analyze_prescription)
            logger.info(f"Prescription upload scheduled in background for appointment {appointment_id}")
        except Exception as e:
            logger.error(f"Failed to schedule prescription upload: {e}", exc_info=True)
            # Don't fail checkout if prescription upload scheduling fails
    
    # Check out from queue (this is the main operation - must complete synchronously)
    # This will override the queue status set by appointment update to "checked-out" and ensure is_active=False
    queue_service = QueueService(db)
    entry = await queue_service.check_out_patient(entry_id)
    if not entry:
        return error_response(
            message="Queue entry not found",
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    # Verify the checkout was successful by checking the entry status
    verified_entry = await db.queue.find_one({"_id": ObjectId(entry_id)})
    if verified_entry:
        logger.info(f"Queue entry {entry_id} checkout verified - status: {verified_entry.get('status')}, is_active: {verified_entry.get('is_active')}")
        if verified_entry.get("status") != "checked-out" or verified_entry.get("is_active") is not False:
            logger.warning(f"Queue entry {entry_id} checkout may not have completed correctly - status: {verified_entry.get('status')}, is_active: {verified_entry.get('is_active')}")
            # Force update to ensure checkout is complete
            await db.queue.update_one(
                {"_id": ObjectId(entry_id)},
                {
                    "$set": {
                        "status": "checked-out",
                        "is_active": False,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            logger.info(f"Force-updated queue entry {entry_id} to checked-out with is_active=False")
    
    # Invalidate queue cache to ensure frontend gets updated data
    try:
        from app.database import cache
        await cache.clear_pattern("queue:*")
        logger.info("Queue cache cleared after checkout")
    except Exception as cache_error:
        logger.warning(f"Failed to clear queue cache: {cache_error}")
    
    # Check if there's an existing prescription that needs analysis
    if appointment_id:
        try:
            s3_prescription = await db.s3_prescriptions.find_one(
                {"appointmentId": appointment_id},
                sort=[("createdAt", -1)]
            )
            
            if s3_prescription and s3_prescription.get("s3Key"):
                if not s3_prescription.get("structuredDetails"):
                    logger.info(f"Existing prescription found at checkout for appointment {appointment_id}, scheduling analysis in background...")
                    from app.routers.appointments import _analyze_prescription_background
                    background_tasks.add_task(
                        _analyze_prescription_background,
                        db,
                        str(s3_prescription["_id"]),
                        appointment_id
                    )
        except Exception as analysis_error:
            logger.error(f"Failed to schedule prescription analysis during checkout: {analysis_error}", exc_info=True)
    
    return success_response(data=entry, message="Patient checked out successfully. Prescription processing in progress.")


@router.put("/reorder", response_model=dict)
async def reorder_queue(
    payload: QueueReorderRequest,
    current_user: dict = Depends(require_roles(["doctor", "admin", "receptionist"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Reorder queue entries for a doctor."""
    queue_service = QueueService(db)
    updated_entries = await queue_service.reorder_queue(
        doctor_id=payload.doctor_id,
        queue_order=payload.queue_order,
    )
    return success_response(
        data={"queue": updated_entries},
        message="Queue reordered successfully"
    )


@router.put("/{entry_id}/consultation", response_model=dict)
async def update_consultation_details(
    entry_id: str,
    consultation_update: QueueConsultationUpdate,
    current_user: dict = Depends(require_roles(["doctor"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update prescription and tests for a queue entry."""
    queue_service = QueueService(db)
    entry = await queue_service.update_consultation_details(entry_id, consultation_update)
    if not entry:
        return error_response(
            message="Queue entry not found",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return success_response(data=entry, message="Consultation details updated successfully")


@router.post("/cleanup", response_model=dict)
async def cleanup_stale_entries(
    current_user: dict = Depends(require_roles(["admin", "receptionist"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Manually trigger cleanup of stale queue entries and old checked-in appointments."""
    queue_service = QueueService(db)
    await queue_service.cleanup_all_stale_entries()
    return success_response(
        message="Cleanup completed successfully"
    )

