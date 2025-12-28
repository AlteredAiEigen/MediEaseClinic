"""
Billing models for appointment and test pricing.
"""

from datetime import datetime
from typing import Optional, Literal

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


class BillingItemBase(BaseModel):
    """Base fields for a billing/pricing item."""

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
    isActive: bool = Field(True, description="Whether this item is active.")
    clinicId: str = Field(..., description="Clinic ID that owns this billing item.")


class BillingItemCreate(BillingItemBase):
    """Payload for creating a billing item."""

    pass


class BillingItemUpdate(BaseModel):
    """Payload for updating a billing item."""

    category: Optional[Literal["appointmentType", "test"]] = None
    key: Optional[str] = Field(None, min_length=1, max_length=100)
    label: Optional[str] = Field(None, min_length=1, max_length=120)
    price: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, min_length=1, max_length=10)
    isActive: Optional[bool] = None
    # Note: clinicId should not be updated after creation


class BillingItemInDB(BillingItemBase):
    """Billing item as stored in MongoDB."""

    id: Optional[PyObjectId] = Field(alias="_id")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class BillingItemResponse(BillingItemBase):
    """Response model for a billing item."""

    id: str = Field(alias="_id")
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True


async def billing_item_helper(item: dict) -> dict:
    """Format billing document."""
    if not item:
        return None

    return {
        "_id": str(item["_id"]),
        "category": item.get("category", "appointmentType"),
        "key": item.get("key"),
        "label": item.get("label"),
        "price": float(item.get("price", 0)),
        "currency": item.get("currency", "INR"),
        "isActive": item.get("isActive", True),
        "clinicId": item.get("clinicId"),
        "createdAt": item.get("createdAt"),
        "updatedAt": item.get("updatedAt"),
    }


