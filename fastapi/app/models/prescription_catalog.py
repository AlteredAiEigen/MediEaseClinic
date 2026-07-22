"""
Shared prescription catalog items (medicines, injections, tests) stored in MongoDB.
"""

from datetime import datetime
from typing import Literal, Optional

from bson import ObjectId
from pydantic import BaseModel, Field

PrescriptionCatalogType = Literal["TAB", "CAP", "SYR", "INJ", "TEST", "DROP", "OINT", "OTHER"]
PrescriptionCatalogCategory = Literal["Medicine", "Injection", "Test"]


class PyObjectId(ObjectId):
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


def category_for_type(item_type: str) -> PrescriptionCatalogCategory:
    normalized = (item_type or "").upper()
    if normalized == "INJ":
        return "Injection"
    if normalized == "TEST":
        return "Test"
    return "Medicine"


class PrescriptionCatalogCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=300)
    type: PrescriptionCatalogType = "TAB"
    composition: Optional[str] = Field(None, max_length=500)
    dosage: Optional[str] = Field(None, max_length=120)
    frequency: Optional[str] = Field(None, max_length=120)
    duration: Optional[str] = Field(None, max_length=120)


class PrescriptionCatalogInDB(PrescriptionCatalogCreate):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    category: PrescriptionCatalogCategory = "Medicine"
    nameLower: str = ""
    compositionLower: str = ""
    useCount: int = 0
    createdBy: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


async def prescription_catalog_helper(doc: dict) -> dict:
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "type": doc.get("type", "TAB"),
        "category": doc.get("category", category_for_type(doc.get("type", "TAB"))),
        "composition": doc.get("composition") or "",
        "dosage": doc.get("dosage") or "",
        "frequency": doc.get("frequency") or "",
        "duration": doc.get("duration") or "",
        "useCount": doc.get("useCount", 0),
    }
