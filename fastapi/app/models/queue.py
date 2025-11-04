"""
Queue model for MongoDB.
Manages patient check-in and consultation queue.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId


class Queue(BaseModel):
    """Queue entry MongoDB model."""
    id: Optional[str] = Field(None, alias="_id")
    queue_id: Optional[str] = Field(None, description="Auto-generated Q{timestamp}")
    patient: str = Field(..., description="Patient ObjectId")
    appointment: Optional[str] = Field(None, description="Appointment ObjectId")
    doctor: str = Field(..., description="Doctor ObjectId")
    checked_in_by: Optional[str] = Field(None, description="User who checked in the patient")
    
    # Queue management
    checked_in_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(
        default="waiting",
        pattern="^(waiting|in-consultation|completed|checked-out|cancelled)$"
    )
    queue_number: Optional[int] = Field(None, description="Daily queue number per doctor")
    priority: str = Field(default="medium", pattern="^(low|medium|high|emergency)$")
    
    # Visit details
    reason: str = Field(default="General Consultation")
    notes: str = Field(default="")
    
    # Timestamps
    consultation_started_at: Optional[datetime] = None
    consultation_ended_at: Optional[datetime] = None
    wait_time: int = Field(default=0, description="Wait time in minutes")
    
    # Status
    is_active: bool = True
    
    # Timestamps
    created_at: Optional[datetime] = Field(None, alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")
    
    class Config:
        allow_population_by_field_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class QueueInDB(Queue):
    """Queue entry as stored in database."""
    pass

