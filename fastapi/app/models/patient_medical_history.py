"""
Patient medical history model for tracking family history, previous surgeries, and past medications over time.
"""

from datetime import datetime
from typing import Optional, List, Dict, Union

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


class FamilyHistoryItem(BaseModel):
    relation: Optional[str] = None
    condition: Optional[str] = None
    notes: Optional[str] = None


class PreviousSurgeryItem(BaseModel):
    surgery: Optional[str] = None
    date: Optional[str] = None
    hospital: Optional[str] = None
    notes: Optional[str] = None


class PatientMedicalHistoryBase(BaseModel):
    """Shared medical history fields stored outside the main patient document."""

    # NOTE: We intentionally keep `medicalHistory` here instead of on the
    # patient document so that the patients collection stays slim.
    # Shape mirrors the patient API: string or list of structured records.
    medicalHistory: Optional[Union[str, List[Dict[str, str]]]] = Field(
        None,
        description="Structured medical history (string or list of records) stored separately from patient",
    )
    familyHistory: Optional[Union[str, List[FamilyHistoryItem]]] = Field(
        None,
        description="Structured family history entries (relation, condition, notes) or legacy string",
    )
    previousSurgeries: Optional[Union[str, List[PreviousSurgeryItem]]] = Field(
        None,
        description="Structured previous surgeries (surgery, date, hospital, notes) or legacy string",
    )
    startDate: Optional[datetime] = Field(
        None,
        description="Date when this record became active (defaults to now if not provided)",
    )
    endDate: Optional[datetime] = Field(
        None,
        description="Date when this record ended (null for current record)",
    )


class PatientMedicalHistoryCreate(PatientMedicalHistoryBase):
    """Schema for creating medical history entry."""

    patientId: str = Field(..., min_length=1, description="Patient ObjectId from patients collection")


class PatientMedicalHistoryUpdate(BaseModel):
    """Schema for updating medical history entry."""

    medicalHistory: Optional[Union[str, List[Dict[str, str]]]] = None
    familyHistory: Optional[Union[str, List[FamilyHistoryItem]]] = None
    previousSurgeries: Optional[Union[str, List[PreviousSurgeryItem]]] = None
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
    medicalHistory: Optional[Union[str, List[Dict[str, str]]]]
    familyHistory: Optional[Union[str, List[FamilyHistoryItem]]]
    previousSurgeries: Optional[Union[str, List[PreviousSurgeryItem]]]
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
        "medicalHistory": document.get("medicalHistory"),
        "familyHistory": document.get("familyHistory"),
        "previousSurgeries": document.get("previousSurgeries"),
        "startDate": document.get("startDate"),
        "endDate": document.get("endDate"),
        "createdAt": document.get("createdAt"),
        "updatedAt": document.get("updatedAt"),
    }

