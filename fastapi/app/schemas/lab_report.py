"""
Pydantic schemas for lab report endpoints.
"""

from typing import List, Optional
from pydantic import BaseModel, Field

from app.models.lab_report import LabTest


class LabReportCreateRequest(BaseModel):
    """Request payload for creating a lab report."""

    patientId: str = Field(..., description="Patient MongoDB ObjectId string")
    doctorId: str = Field(..., description="Doctor MongoDB ObjectId string")
    reportType: str = Field(..., min_length=1, max_length=150)
    category: Optional[str] = Field(None, max_length=100)
    orderedBy: Optional[str] = Field(None, max_length=100)
    labName: Optional[str] = Field(None, max_length=150)
    collectedDate: Optional[str] = Field(None, max_length=100)
    reportedDate: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=2000)
    interpretation: Optional[str] = Field(None, max_length=2000)
    attachments: Optional[List[str]] = Field(default_factory=list)
    tests: List[LabTest] = Field(..., min_items=1)
    isCritical: bool = Field(default=False)


class LabReportUpdateRequest(BaseModel):
    """Request payload for updating a lab report."""

    reportType: Optional[str] = Field(None, min_length=1, max_length=150)
    category: Optional[str] = Field(None, max_length=100)
    orderedBy: Optional[str] = Field(None, max_length=100)
    labName: Optional[str] = Field(None, max_length=150)
    collectedDate: Optional[str] = Field(None, max_length=100)
    reportedDate: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=2000)
    interpretation: Optional[str] = Field(None, max_length=2000)
    attachments: Optional[List[str]] = Field(default=None)
    tests: Optional[List[LabTest]] = Field(default=None, min_items=1)
    isCritical: Optional[bool] = None
    isReviewed: Optional[bool] = None
    reviewedBy: Optional[str] = None


