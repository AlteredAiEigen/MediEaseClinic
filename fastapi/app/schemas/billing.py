"""
Pydantic request/response schemas for billing/pricing.
"""

from typing import Optional, Literal

from pydantic import BaseModel, Field


class BillingItemCreateRequest(BaseModel):
    category: Literal["appointmentType", "test"] = Field(
        "appointmentType",
        description="What this pricing applies to (appointment type or test).",
    )
    key: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Internal key used for matching (e.g. 'consultation').",
    )
    label: str = Field(
        ...,
        min_length=1,
        max_length=120,
        description="Human friendly label (e.g. 'Consultation').",
    )
    price: float = Field(..., ge=0, description="Price in clinic currency.")
    currency: str = Field("INR", min_length=1, max_length=10)
    isActive: bool = Field(True)


class BillingItemUpdateRequest(BaseModel):
    category: Optional[Literal["appointmentType", "test"]] = None
    key: Optional[str] = Field(None, min_length=1, max_length=100)
    label: Optional[str] = Field(None, min_length=1, max_length=120)
    price: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, min_length=1, max_length=10)
    isActive: Optional[bool] = None


