"""
Patient vitals history model.
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


class PatientVitalCreate(BaseModel):
    """Schema for recording patient vitals."""

    patientId: str
    recordedBy: str
    bloodPressure: Optional[str] = Field(None, max_length=20)
    heartRate: Optional[str] = Field(None, max_length=20)
    respiratoryRate: Optional[str] = Field(None, max_length=20)
    temperature: Optional[str] = Field(None, max_length=20)
    oxygenSaturation: Optional[str] = Field(None, max_length=20)
    weight: Optional[str] = Field(None, max_length=20)
    height: Optional[str] = Field(None, max_length=20)
    bmi: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = Field(None, max_length=500)
    recordedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)


class PatientVitalInDB(PatientVitalCreate):
    """Vitals entry stored in MongoDB."""

    id: Optional[PyObjectId] = Field(alias="_id")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


async def patient_vital_helper(vital: dict) -> dict:
    """Format vital document."""
    if not vital:
        return None

    return {
        "_id": str(vital["_id"]),
        "patientId": vital.get("patientId"),
        "recordedBy": vital.get("recordedBy"),
        "bloodPressure": vital.get("bloodPressure"),
        "heartRate": vital.get("heartRate"),
        "respiratoryRate": vital.get("respiratoryRate"),
        "temperature": vital.get("temperature"),
        "oxygenSaturation": vital.get("oxygenSaturation"),
        "weight": vital.get("weight"),
        "height": vital.get("height"),
        "bmi": vital.get("bmi"),
        "notes": vital.get("notes"),
        "recordedAt": vital.get("recordedAt"),
        "createdAt": vital.get("createdAt"),
        "updatedAt": vital.get("updatedAt"),
    }


