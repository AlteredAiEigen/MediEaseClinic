"""
Prescription model for managing patient medications.
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


class Medication(BaseModel):
    """Medication details."""
    name: str = Field(..., min_length=1)
    dosage: str = Field(..., min_length=1)
    frequency: str = Field("", description="Optional; blank when not specified")
    duration: str = Field("", description="Optional; blank when not specified")
    instructions: Optional[str] = ""
    medicineType: Optional[str] = None
    composition: Optional[str] = None
    quantity: Optional[int] = None


class PrescriptionTest(BaseModel):
    """Structured test / investigation extracted from prescription."""
    name: str = Field(..., min_length=1)
    instructions: Optional[str] = ""


class PrescriptionStructuredDetails(BaseModel):
    """
    AI-extracted structured details from a prescription.
    Separates medicines and diagnostic tests.
    """
    medicines: List[Medication] = Field(default_factory=list)
    tests: List[PrescriptionTest] = Field(default_factory=list)


class PrescriptionBase(BaseModel):
    """Base prescription fields."""
    patientId: str
    doctorId: str
    appointmentId: Optional[str] = None
    medications: List[Medication] = Field(..., min_items=1)
    diagnosis: Optional[str] = ""
    notes: Optional[str] = ""
    language: Optional[str] = Field(
        "en",
        description="Prescription UI language used for PDF labels: en | hi",
    )
    imageUrl: Optional[str] = ""
    imagePublicId: Optional[str] = ""
    pdfS3Key: Optional[str] = None
    pdfUrl: Optional[str] = None
    pdfGeneratedAt: Optional[datetime] = None
    validUntil: Optional[datetime] = None
    isActive: bool = True


class PrescriptionCreate(PrescriptionBase):
    """Schema for creating prescription."""
    pass


class PrescriptionInDB(PrescriptionBase):
    """Prescription as stored in database."""
    id: Optional[PyObjectId] = Field(alias="_id")
    prescriptionId: str
    patientName: Optional[str] = None
    doctorName: Optional[str] = None
    prescribedAt: datetime = Field(default_factory=datetime.utcnow)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    # AI / GPT structured extraction from prescription image or text
    structuredDetails: Optional[PrescriptionStructuredDetails] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class PrescriptionResponse(BaseModel):
    """Schema for prescription response."""
    id: str = Field(alias="_id")
    prescriptionId: str
    patientId: str
    doctorId: str
    appointmentId: Optional[str] = None
    patientName: Optional[str] = None
    doctorName: Optional[str] = None
    medications: List[Medication]
    diagnosis: Optional[str] = None
    notes: Optional[str] = None
    imageUrl: Optional[str] = None
    imagePublicId: Optional[str] = None
    pdfS3Key: Optional[str] = None
    pdfUrl: Optional[str] = None
    pdfGeneratedAt: Optional[datetime] = None
    validUntil: Optional[datetime] = None
    isActive: bool
    prescribedAt: datetime
    createdAt: datetime
    updatedAt: datetime
    structuredDetails: Optional[PrescriptionStructuredDetails] = None
    
    class Config:
        populate_by_name = True


class PrescriptionUpdate(BaseModel):
    """Schema for updating prescription."""
    medications: Optional[List[Medication]] = Field(None, min_items=1)
    diagnosis: Optional[str] = None
    notes: Optional[str] = None
    language: Optional[str] = None
    imageUrl: Optional[str] = None
    imagePublicId: Optional[str] = None
    validUntil: Optional[datetime] = None
    isActive: Optional[bool] = None


async def prescription_helper(prescription: dict) -> dict:
    """Helper to format prescription document."""
    if not prescription:
        return None
    
    return {
        "_id": str(prescription["_id"]),
        "prescriptionId": prescription.get("prescriptionId", ""),
        "patientId": str(prescription["patientId"]),
        "doctorId": str(prescription["doctorId"]),
        "appointmentId": str(prescription["appointmentId"]) if prescription.get("appointmentId") else None,
        "patientName": prescription.get("patientName"),
        "doctorName": prescription.get("doctorName"),
        "medications": prescription.get("medications", []),
        "diagnosis": prescription.get("diagnosis", ""),
        "notes": prescription.get("notes", ""),
        "language": prescription.get("language") or "en",
        "imageUrl": prescription.get("imageUrl", ""),
        "imagePublicId": prescription.get("imagePublicId", ""),
        "pdfS3Key": prescription.get("pdfS3Key"),
        "pdfUrl": prescription.get("pdfUrl"),
        "pdfGeneratedAt": prescription.get("pdfGeneratedAt"),
        "validUntil": prescription.get("validUntil"),
        "isActive": prescription.get("isActive", True),
        "prescribedAt": prescription.get("prescribedAt"),
        "createdAt": prescription.get("createdAt"),
        "updatedAt": prescription.get("updatedAt"),
        "structuredDetails": prescription.get("structuredDetails"),
    }

