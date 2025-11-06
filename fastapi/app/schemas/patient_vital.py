"""
Schemas for patient vitals endpoints.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PatientVitalCreateRequest(BaseModel):
    """Request payload to record new vitals."""

    bloodPressure: Optional[str] = Field(None, max_length=20)
    heartRate: Optional[str] = Field(None, max_length=20)
    respiratoryRate: Optional[str] = Field(None, max_length=20)
    temperature: Optional[str] = Field(None, max_length=20)
    oxygenSaturation: Optional[str] = Field(None, max_length=20)
    weight: Optional[str] = Field(None, max_length=20)
    height: Optional[str] = Field(None, max_length=20)
    bmi: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = Field(None, max_length=500)
    recordedAt: Optional[datetime] = None


class PatientVitalResponse(BaseModel):
    """Response schema for vitals entry."""

    id: str = Field(alias="_id")
    patientId: str
    recordedBy: str
    bloodPressure: Optional[str]
    heartRate: Optional[str]
    respiratoryRate: Optional[str]
    temperature: Optional[str]
    oxygenSaturation: Optional[str]
    weight: Optional[str]
    height: Optional[str]
    bmi: Optional[str]
    notes: Optional[str]
    recordedAt: datetime
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True


