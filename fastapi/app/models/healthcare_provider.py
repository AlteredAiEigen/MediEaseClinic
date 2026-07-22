"""
Healthcare provider (clinic / hospital) model for reference data.
Stores provider information including name, phone, and address.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic v2."""

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema

        return core_schema.no_info_plain_validator_function(
            cls.validate, serialization=core_schema.to_string_ser_schema()
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)


class HealthcareProviderBase(BaseModel):
    """Base healthcare provider fields."""

    clinicId: str = Field(..., description="Unique clinic/provider identifier")
    name: str = Field(..., min_length=1, max_length=200, description="Clinic/Hospital name")
    phone: str = Field(..., min_length=1, max_length=20, description="Clinic phone number")
    email: Optional[str] = Field(None, max_length=100, description="Clinic email address")
    address: Optional[str] = Field(None, max_length=500, description="Street address")
    city: Optional[str] = Field(None, max_length=100, description="City")
    state: Optional[str] = Field(None, max_length=100, description="State/Province")
    pincode: Optional[str] = Field(None, max_length=20, description="Postal/ZIP code")
    country: Optional[str] = Field("India", max_length=100, description="Country")
    website: Optional[str] = Field(None, max_length=200, description="Website URL")
    registrationNumber: Optional[str] = Field(
        None, max_length=100, description="Medical registration/license number"
    )


class HealthcareProviderCreate(HealthcareProviderBase):
    """Schema for creating a new healthcare provider."""
    pass


class HealthcareProviderUpdate(BaseModel):
    """Schema for updating healthcare provider information."""

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    phone: Optional[str] = Field(None, min_length=1, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    pincode: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=200)
    registrationNumber: Optional[str] = Field(None, max_length=100)


class HealthcareProviderInDB(HealthcareProviderBase):
    """Healthcare provider as stored in database."""

    id: Optional[PyObjectId] = Field(alias="_id")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class HealthcareProviderResponse(BaseModel):
    """Schema for healthcare provider response."""

    id: str = Field(alias="_id")
    clinicId: str
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    registrationNumber: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True


def healthcare_provider_helper(provider: dict) -> dict:
    """Helper to format healthcare provider document."""
    if not provider:
        return None

    return {
        "_id": str(provider["_id"]),
        "clinicId": provider.get("clinicId", ""),
        "name": provider.get("name", ""),
        "phone": provider.get("phone", ""),
        "email": provider.get("email"),
        "address": provider.get("address"),
        "city": provider.get("city"),
        "state": provider.get("state"),
        "pincode": provider.get("pincode"),
        "country": provider.get("country", "India"),
        "website": provider.get("website"),
        "registrationNumber": provider.get("registrationNumber"),
        # Optional branding (used by prescription PDF letterhead)
        "logoUrl": provider.get("logoUrl") or provider.get("logo_url") or provider.get("logo"),
        "logoS3Key": provider.get("logoS3Key") or provider.get("logoKey") or provider.get("logo_s3_key"),
        "createdAt": provider.get("createdAt"),
        "updatedAt": provider.get("updatedAt"),
    }

