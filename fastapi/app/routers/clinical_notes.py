"""
Clinical Notes API endpoints.
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse

from app.schemas.clinical_note import (
    ClinicalNoteCreate,
    ClinicalNoteUpdate,
    ClinicalNoteResponse,
    GenerateFromTranscriptRequest,
    GenerateFromTranscriptResponse,
    TreatmentPlanRequest,
    ConsultationSummaryRequest
)
from app.services.clinical_note_service import clinical_note_service
from app.services.ai_service import ai_service
from app.middleware.auth import get_current_user, require_roles
from app.utils.response import success_response, error_response, paginated_response

router = APIRouter()


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_clinical_note(
    note_data: ClinicalNoteCreate,
    current_user: dict = Depends(require_roles(["doctor"]))
):
    """Create a new clinical note."""
    note = await clinical_note_service.create_note(note_data, current_user["_id"])
    return success_response(
        data=note.dict(by_alias=True),
        message="Clinical note created successfully"
    )


@router.get("/", response_model=dict)
async def get_clinical_notes(
    patient: Optional[str] = Query(None, alias="patient"),
    doctor: Optional[str] = Query(None, alias="doctor"),
    appointment: Optional[str] = Query(None, alias="appointment"),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    actionable: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(require_roles(["doctor", "admin"]))
):
    """Get clinical notes with filters."""
    try:
        notes, total = await clinical_note_service.get_notes(
            patient_id=patient,
            doctor_id=doctor,
            appointment_id=appointment,
            category=category,
            priority=priority,
            actionable=actionable,
            page=page,
            limit=limit
        )
        
        return paginated_response(
            message="Clinical notes retrieved successfully",
            data=notes,
            total=total,
            page=page,
            limit=limit
        )
    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching clinical notes: {e}", exc_info=True)
        return error_response(
            message=f"Failed to fetch clinical notes: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/actionable", response_model=dict)
async def get_actionable_notes(
    patient: Optional[str] = Query(None),
    doctor: Optional[str] = Query(None),
    current_user: dict = Depends(require_roles(["doctor", "admin"]))
):
    """Get actionable notes (pending action items)."""
    notes = await clinical_note_service.get_actionable_notes(patient, doctor)
    return success_response(data=notes, message="Actionable notes retrieved successfully")


@router.get("/{note_id}", response_model=dict)
async def get_clinical_note(
    note_id: str,
    current_user: dict = Depends(require_roles(["doctor", "admin"]))
):
    """Get a single clinical note by ID."""
    note = await clinical_note_service.get_note_by_id(note_id)
    if not note:
        return error_response(
            message="Clinical note not found",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return success_response(data=note, message="Clinical note retrieved successfully")


@router.put("/{note_id}", response_model=dict)
async def update_clinical_note(
    note_id: str,
    update_data: ClinicalNoteUpdate,
    current_user: dict = Depends(require_roles(["doctor"]))
):
    """Update a clinical note."""
    note = await clinical_note_service.update_note(note_id, update_data)
    if not note:
        return error_response(
            message="Clinical note not found",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return success_response(data=note, message="Clinical note updated successfully")


@router.put("/{note_id}/complete", response_model=dict)
async def mark_note_complete(
    note_id: str,
    current_user: dict = Depends(require_roles(["doctor"]))
):
    """Mark a clinical note as complete."""
    note = await clinical_note_service.mark_note_complete(note_id, current_user["_id"])
    if not note:
        return error_response(
            message="Clinical note not found",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return success_response(data=note, message="Clinical note marked as complete")


@router.delete("/{note_id}", response_model=dict)
async def delete_clinical_note(
    note_id: str,
    current_user: dict = Depends(require_roles(["doctor", "admin"]))
):
    """Delete a clinical note."""
    deleted = await clinical_note_service.delete_note(note_id)
    if not deleted:
        return error_response(
            message="Clinical note not found",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return success_response(message="Clinical note deleted successfully")


# AI-powered endpoints
@router.post("/ai/generate-from-transcript", response_model=dict, status_code=status.HTTP_201_CREATED)
async def generate_note_from_transcript(
    request: GenerateFromTranscriptRequest,
    current_user: dict = Depends(require_roles(["doctor"]))
):
    """Generate clinical note from consultation transcript using AI."""
    ai_notes = await clinical_note_service.generate_from_transcript(request)
    return success_response(
        data=ai_notes,
        message="Clinical note generated successfully from transcript"
    )


@router.post("/ai/treatment-plan", response_model=dict)
async def generate_treatment_plan(
    request: TreatmentPlanRequest,
    current_user: dict = Depends(require_roles(["doctor"]))
):
    """Generate treatment plan using AI based on symptoms and diagnosis."""
    # Build prompt for treatment plan
    prompt = f"""
Based on the following patient information, generate a comprehensive treatment plan:

Symptoms: {request.symptoms}
Diagnosis: {request.diagnosis}
{f"Patient Context: {request.patient_context}" if request.patient_context else ""}

Please provide:
1. Immediate treatment steps
2. Medication recommendations (with dosage and duration)
3. Lifestyle modifications
4. Follow-up care requirements
5. Warning signs to watch for

Format as structured JSON with clear sections.
"""
    
    # For treatment plan, we'll use the transcript generation method
    ai_response = await ai_service.generate_clinical_notes(prompt, request.patient_context)
    
    return success_response(
        data=ai_response,
        message="Treatment plan generated successfully"
    )


@router.post("/ai/summarize", response_model=dict)
async def summarize_consultation(
    request: ConsultationSummaryRequest,
    current_user: dict = Depends(require_roles(["doctor"]))
):
    """Summarize consultation transcript using AI."""
    summary = await ai_service.summarize_medical_history(request.transcript)
    
    return success_response(
        data={"summary": summary},
        message="Consultation summarized successfully"
    )

