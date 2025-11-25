"""
Patient insurance model definitions.
"""

from datetime import datetime
from typing import Optional, Union, List
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


class PatientInsuranceBase(BaseModel):
    """Shared insurance fields."""

    provider: str = Field(..., min_length=1, max_length=150)
    planName: Optional[str] = Field(None, max_length=200)
    policyNumber: Optional[str] = Field(None, max_length=120)
    cardNumber: Optional[str] = Field(None, max_length=120)
    memberName: Optional[str] = Field(None, max_length=150)
    status: Optional[str] = Field(default="Active", max_length=50)
    coverageLimit: Optional[str] = Field(None, max_length=50)
    coverageUsed: Optional[str] = Field(None, max_length=50)
    coverageRemaining: Optional[str] = Field(None, max_length=50)
    validFrom: Optional[str] = Field(None, max_length=50)
    validUntil: Optional[str] = Field(None, max_length=50)
    familyMembersCovered: Optional[Union[int, str]] = None
    notes: Optional[str] = Field(None, max_length=2000)
    isPrimary: Optional[bool] = False
    selectedBenefits: Optional[List[str]] = Field(None, description="List of selected coverage benefit titles")
    version: Optional[int] = Field(default=1, description="Version number for history tracking")
    isLatest: Optional[bool] = Field(default=True, description="Whether this is the latest version")
    previousVersionId: Optional[str] = Field(None, description="ID of the previous version")


class PatientInsuranceCreate(PatientInsuranceBase):
    """Schema for creating insurance entry."""

    patientId: str = Field(..., min_length=5)


class PatientInsuranceUpdate(BaseModel):
    """Schema for updating insurance entry."""

    provider: Optional[str] = Field(None, min_length=1, max_length=150)
    planName: Optional[str] = Field(None, max_length=200)
    policyNumber: Optional[str] = Field(None, max_length=120)
    cardNumber: Optional[str] = Field(None, max_length=120)
    memberName: Optional[str] = Field(None, max_length=150)
    status: Optional[str] = Field(None, max_length=50)
    coverageLimit: Optional[str] = Field(None, max_length=50)
    coverageUsed: Optional[str] = Field(None, max_length=50)
    coverageRemaining: Optional[str] = Field(None, max_length=50)
    validFrom: Optional[str] = Field(None, max_length=50)
    validUntil: Optional[str] = Field(None, max_length=50)
    familyMembersCovered: Optional[Union[int, str]] = None
    notes: Optional[str] = Field(None, max_length=2000)
    isPrimary: Optional[bool] = None
    selectedBenefits: Optional[List[str]] = Field(None, description="List of selected coverage benefit titles")


class PatientInsuranceInDB(PatientInsuranceBase):
    """Insurance record stored in MongoDB."""

    id: Optional[PyObjectId] = Field(alias="_id")
    patientId: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class PatientInsuranceResponse(BaseModel):
    """API response schema."""

    id: str = Field(alias="_id")
    patientId: str
    provider: str
    planName: Optional[str]
    policyNumber: Optional[str]
    cardNumber: Optional[str]
    memberName: Optional[str]
    status: Optional[str]
    coverageLimit: Optional[str]
    coverageUsed: Optional[str]
    coverageRemaining: Optional[str]
    validFrom: Optional[str]
    validUntil: Optional[str]
    familyMembersCovered: Optional[Union[int, str]]
    notes: Optional[str]
    isPrimary: bool = False
    selectedBenefits: Optional[List[str]] = None
    version: int = 1
    isLatest: bool = True
    previousVersionId: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True


def patient_insurance_helper(document: dict) -> dict:
    """Convert MongoDB document into API-friendly dict."""
    if not document:
        return {}
    return {
        "_id": str(document["_id"]),
        "patientId": document.get("patientId"),
        "provider": document.get("provider"),
        "planName": document.get("planName"),
        "policyNumber": document.get("policyNumber"),
        "cardNumber": document.get("cardNumber"),
        "memberName": document.get("memberName"),
        "status": document.get("status"),
        "coverageLimit": document.get("coverageLimit"),
        "coverageUsed": document.get("coverageUsed"),
        "coverageRemaining": document.get("coverageRemaining"),
        "validFrom": document.get("validFrom"),
        "validUntil": document.get("validUntil"),
        "familyMembersCovered": document.get("familyMembersCovered"),
        "notes": document.get("notes"),
        "isPrimary": document.get("isPrimary", False),
        "selectedBenefits": document.get("selectedBenefits"),
        "version": document.get("version", 1),
        "isLatest": document.get("isLatest", True),
        "previousVersionId": document.get("previousVersionId"),
        "createdAt": document.get("createdAt"),
        "updatedAt": document.get("updatedAt"),
    }


