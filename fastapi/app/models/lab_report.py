"""
Lab report model for managing patient laboratory results.
"""

from datetime import datetime
from typing import List, Optional
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


class LabTest(BaseModel):
    """Individual lab test result."""

    name: str = Field(..., min_length=1, max_length=100)
    result: str = Field(..., min_length=1, max_length=100)
    unit: Optional[str] = Field(None, max_length=50)
    normalRange: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(
        default=None,
        pattern=r"^(normal|high|low|critical|pending)$",
    )
    flag: Optional[str] = Field(default=None, max_length=150)


class LabReportBase(BaseModel):
    """Base lab report fields."""

    patientId: str
    doctorId: str
    reportType: str = Field(..., min_length=1, max_length=150)
    category: Optional[str] = Field(default=None, max_length=100)
    orderedBy: Optional[str] = Field(default=None, max_length=100)
    labName: Optional[str] = Field(default=None, max_length=150)
    collectedDate: Optional[str] = Field(default=None, max_length=100)
    reportedDate: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = Field(default=None, max_length=2000)
    interpretation: Optional[str] = Field(default=None, max_length=2000)
    attachments: Optional[List[str]] = Field(default_factory=list)
    tests: List[LabTest] = Field(default_factory=list, min_items=1)
    isCritical: bool = False
    isReviewed: bool = False


class LabReportCreate(LabReportBase):
    """Schema for creating a lab report."""

    pass


class LabReportInDB(LabReportBase):
    """Lab report as stored in MongoDB."""

    id: Optional[PyObjectId] = Field(alias="_id")
    reportId: str
    createdBy: str
    reviewedBy: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = True

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class LabReportUpdate(BaseModel):
    """Schema for updating a lab report."""

    reportType: Optional[str] = Field(None, min_length=1, max_length=150)
    category: Optional[str] = Field(default=None, max_length=100)
    orderedBy: Optional[str] = Field(default=None, max_length=100)
    labName: Optional[str] = Field(default=None, max_length=150)
    collectedDate: Optional[str] = Field(default=None, max_length=100)
    reportedDate: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = Field(default=None, max_length=2000)
    interpretation: Optional[str] = Field(default=None, max_length=2000)
    attachments: Optional[List[str]] = Field(default=None)
    tests: Optional[List[LabTest]] = Field(default=None, min_items=1)
    isCritical: Optional[bool] = None
    isReviewed: Optional[bool] = None
    reviewedBy: Optional[str] = None


class LabReportResponse(BaseModel):
    """Response schema for lab report."""

    id: str = Field(alias="_id")
    reportId: str
    patientId: str
    doctorId: str
    reportType: str
    category: Optional[str]
    orderedBy: Optional[str]
    labName: Optional[str]
    collectedDate: Optional[str]
    reportedDate: Optional[str]
    notes: Optional[str]
    interpretation: Optional[str]
    attachments: List[str]
    tests: List[LabTest]
    isCritical: bool
    isReviewed: bool
    reviewedBy: Optional[str]
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True


async def lab_report_helper(report: dict) -> dict:
    """Helper function to format lab report document from database."""
    if not report:
        return None

    return {
        "_id": str(report["_id"]),
        "reportId": report.get("reportId"),
        "patientId": report.get("patientId"),
        "doctorId": report.get("doctorId"),
        "reportType": report.get("reportType"),
        "category": report.get("category"),
        "orderedBy": report.get("orderedBy"),
        "labName": report.get("labName"),
        "collectedDate": report.get("collectedDate"),
        "reportedDate": report.get("reportedDate"),
        "notes": report.get("notes"),
        "interpretation": report.get("interpretation"),
        "attachments": report.get("attachments", []),
        "tests": report.get("tests", []),
        "isCritical": report.get("isCritical", False),
        "isReviewed": report.get("isReviewed", False),
        "reviewedBy": report.get("reviewedBy"),
        "createdAt": report.get("createdAt"),
        "updatedAt": report.get("updatedAt"),
    }


