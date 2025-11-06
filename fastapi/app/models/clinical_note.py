"""
Clinical Note model for MongoDB.
Stores consultation notes, diagnoses, treatment plans with AI support.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId


class ActionItem(BaseModel):
    """Action item within clinical note."""
    item: str
    completed: bool = False
    due_date: Optional[datetime] = None


class FollowUp(BaseModel):
    """Follow-up information."""
    required: bool = False
    date: Optional[str] = None
    notes: Optional[str] = None
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")


class Prescription(BaseModel):
    """Prescription details within clinical note."""
    medication_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None
    quantity: Optional[int] = None
    refills: int = 0
    is_active: bool = True


class ClinicalNote(BaseModel):
    """Clinical Note MongoDB model."""
    id: Optional[str] = Field(None, alias="_id")
    note_id: Optional[str] = Field(None, description="Auto-generated NOTE{timestamp}")
    patient: str = Field(..., description="Patient ObjectId")
    doctor: str = Field(..., description="Doctor ObjectId")
    appointment: Optional[str] = Field(None, description="Appointment ObjectId")
    
    # Core fields
    note_type: str = Field(..., alias="type", pattern="^(vitals|symptom|diagnosis|treatment|followup|prescription|general)$")
    title: str = Field(..., max_length=200)
    content: str = Field(..., max_length=5000)
    category: str = Field(default="consultation", pattern="^(consultation|diagnosis|treatment|follow-up|general)$")
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    status: str = Field(default="draft", pattern="^(draft|reviewed|approved|archived)$")
    timestamp: str = Field(..., description="Time in HH:MM format")
    
    # Action tracking
    actionable: bool = False
    action_items: List[ActionItem] = []
    completed: bool = False
    completed_at: Optional[datetime] = None
    completed_by: Optional[str] = None
    
    # Tags and attachments
    tags: List[str] = []
    attachments: List[dict] = []
    
    # Nested objects
    prescription: Optional[Prescription] = None
    follow_up: Optional[FollowUp] = Field(None, alias="followUp")
    
    # AI fields
    ai_generated: bool = Field(False, alias="aiGenerated")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    
    # Review fields
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    
    # Populated fields (virtual)
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    
    # Timestamps
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")
    
    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class ClinicalNoteInDB(ClinicalNote):
    """Clinical Note as stored in database."""
    pass

