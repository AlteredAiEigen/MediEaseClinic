"""
Model definitions for patient documents persisted to S3 via inbound email.
"""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field


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


class S3ReportBase(BaseModel):
    """Fields shared across create/update operations."""

    patientId: str
    patientMongoId: Optional[PyObjectId] = Field(default=None, alias="patientMongoId")
    patientEmail: EmailStr
    documentName: str
    s3Key: str
    s3Url: str
    emailSentToPatient: bool = False
    emailSentAt: Optional[datetime] = None
    lastAccessedAt: Optional[datetime] = None
    mailgunRecipient: Optional[str] = None
    mailgunSender: Optional[str] = None
    mailgunSubject: Optional[str] = None
    mailgunMessageId: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    clinicId: Optional[str] = None
    # AI parsing (lab PDFs from email or manual upload)
    parseStatus: Optional[Literal["pending", "processing", "success", "failed"]] = None
    parseError: Optional[str] = None
    parsedAt: Optional[datetime] = None
    parsedLabReport: Optional[Dict[str, Any]] = None


class ParsedLabTestItem(BaseModel):
    """Structured test row from AI lab parse (aligned with lab_reports LabTest)."""

    name: str = ""
    result: str = ""
    unit: Optional[str] = None
    normalRange: Optional[str] = None
    status: Optional[str] = None
    flag: Optional[str] = None


class ParsedLabReportPayload(BaseModel):
    """Validated payload stored in s3_reports.parsedLabReport."""

    reportType: str = "Laboratory report"
    labName: Optional[str] = None
    collectedDate: Optional[str] = None
    reportedDate: Optional[str] = None
    interpretation: Optional[str] = None
    notes: Optional[str] = None
    tests: List[ParsedLabTestItem] = Field(default_factory=list)
    summaryText: Optional[str] = None


class S3ReportInDB(S3ReportBase):
    """S3 report document as stored in MongoDB."""

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


async def s3_report_helper(document: dict) -> dict:
    """Normalize S3 report documents for API responses."""
    if not document:
        return {}

    return {
        "_id": str(document.get("_id")),
        "patientId": document.get("patientId"),
        "patientMongoId": str(document.get("patientMongoId")) if document.get("patientMongoId") else None,
        "patientEmail": document.get("patientEmail"),
        "documentName": document.get("documentName"),
        "s3Key": document.get("s3Key"),
        "s3Url": document.get("s3Url"),
        "emailSentToPatient": document.get("emailSentToPatient", False),
        "emailSentAt": document.get("emailSentAt"),
        "lastAccessedAt": document.get("lastAccessedAt"),
        "mailgunRecipient": document.get("mailgunRecipient"),
        "mailgunSender": document.get("mailgunSender"),
        "mailgunSubject": document.get("mailgunSubject"),
        "mailgunMessageId": document.get("mailgunMessageId"),
        "metadata": document.get("metadata") or {},
        "clinicId": document.get("clinicId"),
        "createdAt": document.get("createdAt"),
        "updatedAt": document.get("updatedAt"),
        "parseStatus": document.get("parseStatus"),
        "parseError": document.get("parseError"),
        "parsedAt": document.get("parsedAt"),
        "parsedLabReport": document.get("parsedLabReport"),
    }


