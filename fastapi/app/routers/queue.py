"""
Queue API endpoints.
"""

import json
from fastapi import APIRouter, Depends, status, HTTPException, BackgroundTasks
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
        queue_entry = await queue_service.check_in_patient(check_in_data, current_user["_id"])
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
    """Get today's active queue."""
    try:
        queue_service = QueueService(db)
        queue = await queue_service.get_active_queue()
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
    """Get today's queue statistics."""
    queue_service = QueueService(db)
    stats = await queue_service.get_queue_stats()
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
    current_user: dict = Depends(require_roles(["receptionist", "admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Check out patient from queue.
    
    **Prescription Analysis**: If a prescription was uploaded during checkout and hasn't been analyzed,
    it will be analyzed in the background (same as when doctor ends consultation).
    This updates the s3_prescription table and patient's currentMedications.
    """
    from bson import ObjectId
    import logging
    logger = logging.getLogger(__name__)
    
    queue_service = QueueService(db)
    entry = await queue_service.check_out_patient(entry_id)
    if not entry:
        return error_response(
            message="Queue entry not found",
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    # After checkout, check if there's a prescription that needs analysis
    # This handles the case where receptionist uploads prescription at checkout
    try:
        # Get appointment ID from queue entry
        # appointment can be: ObjectId, string (ObjectId), or dict with _id
        appointment_value = entry.get("appointment")
        appointment_id = None
        
        if appointment_value:
            if isinstance(appointment_value, dict):
                # If it's a dict, get _id from it
                appointment_id = appointment_value.get("_id")
            elif isinstance(appointment_value, ObjectId):
                appointment_id = str(appointment_value)
            elif isinstance(appointment_value, str):
                appointment_id = appointment_value
            else:
                appointment_id = str(appointment_value)
        
        if appointment_id:
            # Ensure it's a string for the query
            if isinstance(appointment_id, ObjectId):
                appointment_id = str(appointment_id)
            
            # Find the most recent s3_prescription for this appointment
            s3_prescription = await db.s3_prescriptions.find_one(
                {"appointmentId": appointment_id},
                sort=[("createdAt", -1)]  # Get the most recent one
            )
            
            if s3_prescription and s3_prescription.get("s3Key"):
                # Check if already analyzed
                if not s3_prescription.get("structuredDetails"):
                    logger.info(f"Prescription found at checkout for appointment {appointment_id}, scheduling analysis in background...")
                    # Import the analysis function from appointments router
                    from app.routers.appointments import _analyze_prescription_background
                    # Schedule prescription analysis in background
                    background_tasks.add_task(
                        _analyze_prescription_background,
                        db,
                        str(s3_prescription["_id"]),
                        appointment_id
                    )
                else:
                    logger.info(f"Prescription for appointment {appointment_id} already analyzed, skipping")
    except Exception as analysis_error:
        logger.error(f"Failed to schedule prescription analysis during checkout for entry {entry_id}: {analysis_error}", exc_info=True)
        # Don't fail checkout if analysis scheduling fails
    
    return success_response(data=entry, message="Patient checked out successfully")


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

