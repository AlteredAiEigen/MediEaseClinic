"""
Pydantic schemas for appointment endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, time


class AppointmentCreateRequest(BaseModel):
    """Appointment creation request."""
    patientId: str
    doctorId: Optional[str] = None
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Date in YYYY-MM-DD format")
    time: str = Field(..., pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$", description="Time in HH:MM format")
    duration: int = Field(30, ge=15, le=480, description="Duration in minutes")
    priority: str = Field("medium", pattern="^(low|medium|high)$")
    reason: str = Field(..., max_length=500)
    insurance: bool = False
    followUpRequired: bool = False
    followUpNotes: Optional[str] = None


class AppointmentUpdateRequest(BaseModel):
    """Appointment update request."""
    date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    time: Optional[str] = Field(None, pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    duration: Optional[int] = Field(None, ge=15, le=480)
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    reason: Optional[str] = Field(None, max_length=500)
    insurance: Optional[bool] = None
    status: Optional[str] = Field(None, pattern="^(scheduled|checked-in|in-progress|ongoing|checkout|completed|cancelled|no-show)$")
    followUpRequired: Optional[bool] = None
    followUpNotes: Optional[str] = None
    # Allow updating doctor and type
    doctorId: Optional[str] = None
    type: Optional[str] = None
    notes: Optional[str] = None
    bookingKind: Optional[str] = None
    # Fields for recording service updates
    s3Url: Optional[str] = None
    recordingId: Optional[str] = None
    consultationNotes: Optional[str] = None
    transcription: Optional[str] = None
    structuredNotes: Optional[dict] = None
    prescriptionFileUrl: Optional[str] = None
    prescriptionFileKey: Optional[str] = None
    prescriptionFileName: Optional[str] = None
    prescriptionFileType: Optional[str] = None
    prescriptionUploadedAt: Optional[str] = None
    prescriptionUploadedBy: Optional[str] = None
    prescriptionUploadedByName: Optional[str] = None
    # Consultation details (added during consultation)
    prescribedTest: Optional[str] = None
    diagnosis: Optional[str] = None
    treatmentPlan: Optional[str] = None
    followUpInstructions: Optional[str] = None
    detailedNotes: Optional[str] = None
    aiRecommendations: Optional[str] = None


class AppointmentStatusUpdate(BaseModel):
    """Update appointment status."""
    status: str = Field(..., pattern="^(scheduled|checked-in|in-progress|ongoing|checkout|completed|cancelled|no-show)$")
    cancellationReason: Optional[str] = None


class AppointmentCheckIn(BaseModel):
    """Check-in appointment."""
    pass

