"""
Patient review model for storing patient feedback and ratings.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic v2."""

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema

        return core_schema.no_info_plain_validator_function(
            cls.validate,
            serialization=core_schema.to_string_ser_schema(),
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)


class PatientReviewBase(BaseModel):
    """Base patient review fields."""

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


class PatientReviewCreate(PatientReviewBase):
    """Schema for creating patient review."""

    pass


class PatientReviewUpdate(BaseModel):
    """Schema for updating patient review."""

    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)
    wouldRecommend: Optional[bool] = None
    waitTimeRating: Optional[int] = Field(None, ge=1, le=5)
    cleanlinessRating: Optional[int] = Field(None, ge=1, le=5)
    staffRating: Optional[int] = Field(None, ge=1, le=5)
    isAnonymous: Optional[bool] = None


class PatientReviewInDB(PatientReviewBase):
    """Patient review as stored in database."""

    id: Optional[PyObjectId] = Field(alias="_id")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class PatientReviewResponse(PatientReviewBase):
    """Schema for patient review response."""

    id: str = Field(alias="_id")
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True


def patient_review_helper(review: dict) -> dict:
    """Helper to format patient review document."""
    if not review:
        return None

    return {
        "_id": str(review["_id"]),
        "appointmentId": review.get("appointmentId"),
        "patientId": review.get("patientId"),
        "doctorId": review.get("doctorId"),
        "rating": review.get("rating"),
        "comment": review.get("comment"),
        "wouldRecommend": review.get("wouldRecommend"),
        "waitTimeRating": review.get("waitTimeRating"),
        "cleanlinessRating": review.get("cleanlinessRating"),
        "staffRating": review.get("staffRating"),
        "isAnonymous": review.get("isAnonymous", False),
        "createdAt": review.get("createdAt"),
        "updatedAt": review.get("updatedAt"),
    }

