"""
Patient medical history model for tracking family history, previous surgeries, and past medications over time.
"""

from datetime import datetime
from typing import Optional, List, Dict
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


class PatientMedicalHistoryBase(BaseModel):
    """Shared medical history fields."""

    familyHistory: Optional[str] = Field(None, max_length=5000, description="Family medical history")
    previousSurgeries: Optional[str] = Field(None, max_length=5000, description="Previous surgical procedures")
    pastMedications: Optional[str] = Field(None, max_length=5000, description="Past medications that are no longer active")
    startDate: Optional[datetime] = Field(None, description="Date when this record became active (defaults to now if not provided)")
    endDate: Optional[datetime] = Field(None, description="Date when this record ended (null for current record)")


class PatientMedicalHistoryCreate(PatientMedicalHistoryBase):
    """Schema for creating medical history entry."""

    patientId: str = Field(..., min_length=1, description="Patient ObjectId from patients collection")


class PatientMedicalHistoryUpdate(BaseModel):
    """Schema for updating medical history entry."""

    familyHistory: Optional[str] = Field(None, max_length=5000)
    previousSurgeries: Optional[str] = Field(None, max_length=5000)
    pastMedications: Optional[str] = Field(None, max_length=5000)
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None


class PatientMedicalHistoryInDB(PatientMedicalHistoryBase):
    """Medical history record stored in MongoDB."""

    id: Optional[PyObjectId] = Field(alias="_id")
    patientId: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class PatientMedicalHistoryResponse(BaseModel):
    """API response schema."""

    id: str = Field(alias="_id")
    patientId: str
    familyHistory: Optional[str]
    previousSurgeries: Optional[str]
    pastMedications: Optional[str]
    startDate: datetime
    endDate: Optional[datetime]
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True


def patient_medical_history_helper(document: dict) -> dict:
    """Convert MongoDB document into API-friendly dict."""
    if not document:
        return {}
    return {
        "_id": str(document["_id"]),
        "patientId": document.get("patientId"),
        "familyHistory": document.get("familyHistory"),
        "previousSurgeries": document.get("previousSurgeries"),
        "pastMedications": document.get("pastMedications"),
        "startDate": document.get("startDate"),
        "endDate": document.get("endDate"),
        "createdAt": document.get("createdAt"),
        "updatedAt": document.get("updatedAt"),
    }

