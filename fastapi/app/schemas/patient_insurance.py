"""
Request schemas for patient insurance endpoints.
"""

from typing import Optional, Union, List
from pydantic import BaseModel, Field


class PatientInsuranceCreateRequest(BaseModel):
    """Payload for creating a patient insurance record."""

    patientId: str = Field(..., min_length=5)
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


class PatientInsuranceUpdateRequest(BaseModel):
    """Payload for updating a patient insurance record."""

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


