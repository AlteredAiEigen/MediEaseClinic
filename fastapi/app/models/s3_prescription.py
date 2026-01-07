"""
S3 Prescription model for tracking prescription files uploaded to S3.
Structure matches s3_reports model for consistency.
"""

from datetime import datetime
from typing import Any, Dict, Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic."""

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema

        return core_schema.no_info_plain_validator_function(
            cls.validate,
            serialization=core_schema.to_string_ser_schema(),
        )

    @classmethod
    def validate(cls, value):
        if isinstance(value, ObjectId):
            return value
        if not ObjectId.is_valid(value):
            raise ValueError("Invalid ObjectId")
        return ObjectId(value)


class PrescriptionMedication(BaseModel):
    """Medication details extracted from prescription."""
    name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = ""


class PrescriptionTest(BaseModel):
    """Test/investigation details extracted from prescription."""
    name: str
    instructions: Optional[str] = ""


class PrescriptionStructuredDetails(BaseModel):
    """AI-extracted structured details from prescription image."""
    # Patient Information
    patientName: Optional[str] = None
    patientAge: Optional[str] = None  # Age in years (handles formats like "42y", "42yrs", "42", "42 years")
    patientGender: Optional[str] = None  # e.g., "Male", "Female", "M", "F"
    
    # Doctor Information
    doctorName: Optional[str] = None
    doctorLicenseNumber: Optional[str] = None
    
    # Prescription Metadata
    prescriptionDate: Optional[str] = None  # Date in YYYY-MM-DD format
    
    # Medications and Tests
    medicines: List[PrescriptionMedication] = Field(default_factory=list)
    tests: List[PrescriptionTest] = Field(default_factory=list)
    
    # Follow-up Information
    followUpRequired: bool = False  # Whether follow-up is mentioned in prescription
    followUpDuration: Optional[str] = None  # Original duration text from prescription (e.g., "1 week", "10 days", "1 month")
    followUpDays: Optional[int] = None  # Number of days until follow-up (converted from weeks/months if mentioned)
    
    # Additional Notes and Instructions
    additionalNotes: Optional[str] = None  # Formatted with bullet points for readability


class S3PrescriptionBase(BaseModel):
    """Base model for S3 prescription - matches s3_reports structure."""
    patientId: str
    patientMongoId: Optional[PyObjectId] = Field(default=None, alias="patientMongoId")
    appointmentId: str
    documentName: str  # Changed from fileName to match s3_reports
    s3Key: str
    s3Url: str
    fileType: str
    fileSize: int  # Size in bytes
    uploadedBy: Optional[str] = None  # User ID who uploaded
    uploadedByName: Optional[str] = None
    uploadedAt: datetime
    notes: Optional[str] = None
    emailSentToPatient: bool = False
    emailSentAt: Optional[datetime] = None
    lastAccessedAt: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None
    clinicId: Optional[str] = None
    structuredDetails: Optional[PrescriptionStructuredDetails] = None  # AI-extracted medicines and tests


class S3PrescriptionInDB(S3PrescriptionBase):
    """S3 prescription document as stored in MongoDB."""

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class S3PrescriptionCreate(S3PrescriptionBase):
    """Model for creating a new S3 prescription entry."""
    pass


class S3PrescriptionUpdate(BaseModel):
    """Model for updating S3 prescription."""
    notes: Optional[str] = None
    emailSentToPatient: Optional[bool] = None
    emailSentAt: Optional[datetime] = None
    lastAccessedAt: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


async def s3_prescription_helper(document: dict) -> dict:
    """Normalize S3 prescription documents for API responses."""
    if not document:
        return {}

    return {
        "_id": str(document.get("_id")),
        "patientId": document.get("patientId"),
        "patientMongoId": str(document.get("patientMongoId")) if document.get("patientMongoId") else None,
        "appointmentId": document.get("appointmentId"),
        "documentName": document.get("documentName") or document.get("fileName"),  # Support both for backward compatibility
        "s3Key": document.get("s3Key"),
        "s3Url": document.get("s3Url"),
        "fileType": document.get("fileType"),
        "fileSize": document.get("fileSize"),
        "uploadedBy": document.get("uploadedBy"),
        "uploadedByName": document.get("uploadedByName"),
        "uploadedAt": document.get("uploadedAt"),
        "notes": document.get("notes"),
        "emailSentToPatient": document.get("emailSentToPatient", False),
        "emailSentAt": document.get("emailSentAt"),
        "lastAccessedAt": document.get("lastAccessedAt"),
        "metadata": document.get("metadata") or {},
        "clinicId": document.get("clinicId"),
        "structuredDetails": document.get("structuredDetails"),  # AI-extracted medicines and tests
        "createdAt": document.get("createdAt"),
        "updatedAt": document.get("updatedAt"),
    }

