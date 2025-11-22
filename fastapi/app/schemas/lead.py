from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class LeadCreate(BaseModel):
    """Schema for capturing lead enquiries from the landing page."""

    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=5, max_length=20)
    query: Optional[str] = Field(default=None, max_length=1000)
from pydantic import BaseModel, EmailStr, Field


class LeadCreate(BaseModel):
    """Schema for marketing lead submissions."""

    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=8, max_length=20)
    query: str | None = Field(None, max_length=1000)

