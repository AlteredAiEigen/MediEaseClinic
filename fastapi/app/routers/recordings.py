"""
Recording management router with audio upload and transcription.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.database import get_db
from app.services.recording_service import RecordingService
from app.middleware.auth import require_any_role, require_doctor_or_admin
from app.utils.response import success_response, paginated_response

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_recording(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    appointment_id: str = Form(...),
    doctor_id: str = Form(...),
    duration: int = Form(...),
    retention_policy: str = Form("standard"),
    current_user: dict = Depends(require_doctor_or_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Upload consultation recording to S3.
    
    Only doctors and admins can upload recordings.
    Files are encrypted with SSE-S3 before storage.
    """
    try:
        recording_service = RecordingService(db)
        recording = await recording_service.upload_recording(
            file=file,
            patient_id=patient_id,
            appointment_id=appointment_id,
            doctor_id=doctor_id,
            duration=duration,
            retention_policy=retention_policy
        )
        
        return success_response(
            message="Recording uploaded successfully",
            data={"recording": recording},
            status_code=201
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recording upload failed: {str(e)}"
        )


@router.post("/{recording_id}/transcribe")
async def transcribe_recording(
    recording_id: str,
    current_user: dict = Depends(require_doctor_or_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Start transcription job for recording using AWS Transcribe.
    
    Supports multi-language detection (en-US, hi-IN).
    This is an async operation that may take several minutes.
    """
    try:
        recording_service = RecordingService(db)
        recording = await recording_service.start_transcription(recording_id)
        
        return success_response(
            message="Transcription completed successfully",
            data={"recording": recording}
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}"
        )


@router.get("/")
async def list_recordings(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    patient_id: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List recordings with filtering."""
    try:
        recording_service = RecordingService(db)
        recordings, total = await recording_service.list_recordings(
            page=page,
            limit=limit,
            patient_id=patient_id,
            doctor_id=doctor_id,
            status=status
        )
        
        return paginated_response(
            message="Recordings retrieved successfully",
            data=recordings,
            total=total,
            page=page,
            limit=limit
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve recordings: {str(e)}"
        )


@router.get("/{recording_id}")
async def get_recording(
    recording_id: str,
    include_presigned_url: bool = Query(True, description="Include presigned URL for file access"),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get recording by ID with optional presigned URL.
    
    Presigned URL provides temporary (15 min) access to audio file.
    """
    recording_service = RecordingService(db)
    recording = await recording_service.get_recording(
        recording_id,
        include_presigned_url=include_presigned_url
    )
    
    if not recording:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recording not found"
        )
    
    return success_response(
        message="Recording retrieved successfully",
        data={"recording": recording}
    )


@router.get("/patient/{patient_id}")
async def get_patient_recordings(
    patient_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all recordings for a specific patient."""
    try:
        recording_service = RecordingService(db)
        recordings, total = await recording_service.list_recordings(
            page=page,
            limit=limit,
            patient_id=patient_id
        )
        
        return paginated_response(
            message="Patient recordings retrieved successfully",
            data=recordings,
            total=total,
            page=page,
            limit=limit
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve patient recordings: {str(e)}"
        )


@router.delete("/{recording_id}")
async def delete_recording(
    recording_id: str,
    current_user: dict = Depends(require_doctor_or_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Delete recording from database and S3.
    
    Only doctors and admins can delete recordings.
    """
    try:
        recording_service = RecordingService(db)
        await recording_service.delete_recording(recording_id)
        
        return success_response(
            message="Recording deleted successfully",
            data={"recordingId": recording_id}
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recording deletion failed: {str(e)}"
        )


@router.post("/{recording_id}/process-transcription", status_code=status.HTTP_200_OK)
async def process_transcription(
    recording_id: str,
    current_user: dict = Depends(require_doctor_or_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Process completed transcription and extract structured notes.

    This endpoint is called after AWS Transcribe completes transcription.
    It extracts structured clinical notes using LLM and updates the recording.
    """
    try:
        recording_service = RecordingService(db)
        recording = await recording_service.process_transcription_result(recording_id)

        return success_response(
            message="Transcription processed successfully",
            data={"recording": recording}
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription processing failed: {str(e)}"
        )


@router.get("/{recording_id}/transcription-status", status_code=status.HTTP_200_OK)
async def get_transcription_status(
    recording_id: str,
    current_user: dict = Depends(require_doctor_or_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get transcription status for a recording.

    Returns current transcription status and results if completed.
    """
    try:
        recording_service = RecordingService(db)
        recording = await recording_service.get_recording(recording_id)

        transcription_status = {
            "recordingId": recording["recordingId"],
            "status": recording["status"],
            "transcriptionAvailable": bool(recording.get("transcription")),
            "structuredNotesAvailable": bool(recording.get("aiProcessing", {}).get("structuredNotes")),
            "processingStartedAt": recording.get("processingStartedAt"),
            "processingCompletedAt": recording.get("processingCompletedAt"),
            "errorMessage": recording.get("errorMessage")
        }

        return success_response(
            message="Transcription status retrieved",
            data={"transcription": transcription_status}
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get transcription status: {str(e)}"
        )

