"""
Request schemas for insurance coverage endpoints.
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class InsuranceCoverageCreateRequest(BaseModel):
    """Payload for creating an insurance coverage record."""

    patientId: str = Field(..., min_length=5, description="Patient ID")
    policyNumber: str = Field(..., min_length=1, max_length=120, description="Insurance policy number")
    selectedBenefits: List[str] = Field(default_factory=list, description="List of selected coverage benefit titles")


class InsuranceCoverageUpdateRequest(BaseModel):
    """Payload for updating an insurance coverage record."""

    selectedBenefits: List[str] = Field(..., description="List of selected coverage benefit titles")

