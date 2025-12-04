"""
Patient history model for storing historical snapshots of patient records.

This collection keeps old versions of patient documents whenever updates are
made to the main `patients` collection. The `patients` collection always
represents the latest active record, while `patient_history` keeps the
previous versions with validity ranges.
"""

from datetime import datetime
from typing import Optional, Dict, Any

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


class PatientHistoryInDB(BaseModel):
    """
    Historical snapshot of a patient record.

    - `patientMongoId` links to the `_id` in the `patients` collection.
    - `patientId` stores the human-readable patient ID (e.g., P001) for convenience.
    - `snapshot` stores the full patient document as it existed before an update.
    - `validFrom` / `validTo` represent the period during which this snapshot
      was the active record.
    """

    id: Optional[PyObjectId] = Field(alias="_id")
    patientMongoId: PyObjectId
    patientId: Optional[str] = None
    snapshot: Dict[str, Any]
    validFrom: datetime
    validTo: datetime
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}



