"""
Clinical Note schemas for request/response validation.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ActionItemCreate(BaseModel):
    """Action item creation schema."""
    item: str
    due_date: Optional[datetime] = None


class ActionItemResponse(BaseModel):
    """Action item response schema."""
    item: str
    completed: bool
    due_date: Optional[datetime] = None


class PrescriptionCreate(BaseModel):
    """Prescription creation within note."""
    medication_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None
    quantity: Optional[int] = None
    refills: int = 0


class FollowUpCreate(BaseModel):
    """Follow-up creation schema."""
    required: bool
    date: Optional[str] = None
    notes: Optional[str] = None
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")


class ClinicalNoteCreate(BaseModel):
    """Clinical note creation schema."""
    patient: str
    doctor: str
    appointment: Optional[str] = None
    note_type: str = Field(..., alias="type", pattern="^(vitals|symptom|diagnosis|treatment|followup|prescription|general)$")
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=5000)
    category: str = Field(default="consultation", pattern="^(consultation|diagnosis|treatment|follow-up|general)$")
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    timestamp: str = Field(..., description="Time in HH:MM format")
    tags: List[str] = []
    actionable: bool = False
    action_items: List[ActionItemCreate] = []
    prescription: Optional[PrescriptionCreate] = None
    follow_up: Optional[FollowUpCreate] = Field(None, alias="followUp")
    
    class Config:
        allow_population_by_field_name = True


class ClinicalNoteUpdate(BaseModel):
    """Clinical note update schema."""
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = Field(None, max_length=5000)
    category: Optional[str] = Field(None, pattern="^(consultation|diagnosis|treatment|follow-up|general)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")
    status: Optional[str] = Field(None, pattern="^(draft|reviewed|approved|archived)$")
    tags: Optional[List[str]] = None
    actionable: Optional[bool] = None
    completed: Optional[bool] = None
    review_notes: Optional[str] = None


class ClinicalNoteResponse(BaseModel):
    """Clinical note response schema."""
    id: str = Field(..., alias="_id")
    note_id: str
    patient: str
    doctor: str
    appointment: Optional[str] = None
    note_type: str = Field(..., alias="type")
    title: str
    content: str
    category: str
    priority: str
    status: str
    timestamp: str
    actionable: bool
    action_items: List[ActionItemResponse] = []
    completed: bool
    completed_at: Optional[datetime] = None
    tags: List[str] = []
    ai_generated: bool = Field(..., alias="aiGenerated")
    confidence: Optional[float] = None
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    
    class Config:
        allow_population_by_field_name = True


class GenerateFromTranscriptRequest(BaseModel):
    """Request to generate note from transcript."""
    transcript: str = Field(..., min_length=10)
    patient_id: str
    appointment_id: Optional[str] = None
    use_gemini: bool = False


class GenerateFromTranscriptResponse(BaseModel):
    """AI-generated clinical note response."""
    chief_complaint: str
    symptoms: List[str]
    diagnosis: str
    treatment_plan: str
    prescriptions: List[dict]
    recommendations: str
    follow_up_required: bool
    follow_up_date: Optional[str] = None
    notes: str


class TreatmentPlanRequest(BaseModel):
    """Request for AI treatment plan."""
    symptoms: str
    diagnosis: str
    patient_context: Optional[str] = None
    use_gemini: bool = False


class ConsultationSummaryRequest(BaseModel):
    """Request for AI consultation summary."""
    transcript: str
    use_gemini: bool = False

