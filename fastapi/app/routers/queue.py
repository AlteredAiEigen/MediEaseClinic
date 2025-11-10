"""
Queue API endpoints.
"""

import json
from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.queue import (
    QueueCheckIn,
    QueueStatusUpdate,
    QueueEntryResponse,
    QueueStats,
    QueueReorderRequest,
)
from app.services.queue_service import QueueService
from app.database import get_db
from app.middleware.auth import get_current_user, require_roles
from app.utils.response import success_response, error_response

router = APIRouter()


@router.post("/check-in", response_model=dict, status_code=status.HTTP_201_CREATED)
async def check_in_patient(
    check_in_data: QueueCheckIn,
    current_user: dict = Depends(require_roles(["receptionist", "admin"])),
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
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Check out patient from queue."""
    queue_service = QueueService(db)
    entry = await queue_service.check_out_patient(entry_id)
    if not entry:
        return error_response(
            message="Queue entry not found",
            status_code=status.HTTP_404_NOT_FOUND
        )
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

