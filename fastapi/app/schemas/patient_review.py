"""
Request schemas for patient review endpoints.
"""

from typing import Optional
from pydantic import BaseModel, Field


class PatientReviewCreateRequest(BaseModel):
    """Payload for creating a patient review."""

    appointmentId: str = Field(..., description="Appointment ID this review is for")
    patientId: str = Field(..., description="Patient ID")
    doctorId: str = Field(..., description="Doctor ID")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    comment: Optional[str] = Field(None, max_length=1000, description="Review comment")
    wouldRecommend: Optional[bool] = Field(None, description="Would recommend this doctor")
    waitTimeRating: Optional[int] = Field(None, ge=1, le=5, description="Wait time rating")
    cleanlinessRating: Optional[int] = Field(None, ge=1, le=5, description="Cleanliness rating")
    staffRating: Optional[int] = Field(None, ge=1, le=5, description="Staff friendliness rating")
    isAnonymous: bool = Field(False, description="Whether review is anonymous")


class PatientReviewUpdateRequest(BaseModel):
    """Payload for updating a patient review."""

    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)
    wouldRecommend: Optional[bool] = None
    waitTimeRating: Optional[int] = Field(None, ge=1, le=5)
    cleanlinessRating: Optional[int] = Field(None, ge=1, le=5)
    staffRating: Optional[int] = Field(None, ge=1, le=5)
    isAnonymous: Optional[bool] = None

