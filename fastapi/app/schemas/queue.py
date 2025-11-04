"""
Queue schemas for request/response validation.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class QueueCheckIn(BaseModel):
    """Check-in request schema."""
    patient_id: str = Field(..., alias="patientId")
    doctor_id: str = Field(..., alias="doctorId")
    appointment_id: Optional[str] = Field(None, alias="appointmentId")
    reason: Optional[str] = Field("General Consultation")
    priority: str = Field(default="medium", pattern="^(low|medium|high|emergency)$")
    notes: Optional[str] = Field("")
    
    class Config:
        allow_population_by_field_name = True


class QueueStatusUpdate(BaseModel):
    """Queue status update schema."""
    status: str = Field(..., pattern="^(waiting|in-consultation|completed|checked-out|cancelled)$")


class QueueEntryResponse(BaseModel):
    """Queue entry response schema."""
    id: str = Field(..., alias="_id")
    queue_id: str
    patient: dict
    doctor: dict
    appointment: Optional[dict] = None
    checked_in_at: datetime
    status: str
    queue_number: int
    priority: str
    reason: str
    notes: str
    consultation_started_at: Optional[datetime] = None
    consultation_ended_at: Optional[datetime] = None
    wait_time: int
    is_active: bool
    created_at: datetime = Field(..., alias="createdAt")
    
    class Config:
        allow_population_by_field_name = True


class QueueStats(BaseModel):
    """Queue statistics response."""
    total_patients: int
    waiting: int
    in_consultation: int
    completed: int
    checked_out: int
    average_wait_time: float

