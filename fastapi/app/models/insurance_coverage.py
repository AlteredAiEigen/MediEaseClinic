"""
Insurance coverage model for storing selected coverage benefits.
Links to patient and policy number.
"""

from datetime import datetime
from typing import Optional, List
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


class InsuranceCoverageBase(BaseModel):
    """Base insurance coverage fields."""

    patientId: str = Field(..., min_length=5, description="Patient ID")
    policyNumber: str = Field(..., min_length=1, max_length=120, description="Insurance policy number")
    selectedBenefits: List[str] = Field(default_factory=list, description="List of selected coverage benefit titles")
    version: int = Field(default=1, description="Version number for history tracking")
    isLatest: bool = Field(default=True, description="Whether this is the latest version")
    previousVersionId: Optional[str] = Field(None, description="ID of the previous version")


class InsuranceCoverageCreate(InsuranceCoverageBase):
    """Schema for creating insurance coverage."""

    pass


class InsuranceCoverageUpdate(BaseModel):
    """Schema for updating insurance coverage."""

    selectedBenefits: Optional[List[str]] = Field(None, description="List of selected coverage benefit titles")


class InsuranceCoverageInDB(InsuranceCoverageBase):
    """Insurance coverage record stored in MongoDB."""

    id: Optional[PyObjectId] = Field(alias="_id")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class InsuranceCoverageResponse(InsuranceCoverageBase):
    """API response schema."""

    id: str = Field(alias="_id")
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True


def insurance_coverage_helper(document: dict) -> dict:
    """Convert MongoDB document into API-friendly dict."""
    if not document:
        return {}
    return {
        "_id": str(document["_id"]),
        "patientId": document.get("patientId"),
        "policyNumber": document.get("policyNumber"),
        "selectedBenefits": document.get("selectedBenefits", []),
        "version": document.get("version", 1),
        "isLatest": document.get("isLatest", True),
        "previousVersionId": document.get("previousVersionId"),
        "createdAt": document.get("createdAt"),
        "updatedAt": document.get("updatedAt"),
    }

