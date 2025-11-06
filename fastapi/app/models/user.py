"""
User model for authentication and role-based access.
Supports admin, doctor, and receptionist roles.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
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


class UserBase(BaseModel):
    """Base user fields."""
    firstName: str = Field(..., min_length=1, max_length=50)
    lastName: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    role: str = Field(..., pattern="^(admin|doctor|receptionist)$")
    phone: Optional[str] = Field(None, pattern=r"^[\d\s\-\+\(\)]+$")
    isActive: bool = True

    # Clinic/Hospital association (required for all users)
    clinicName: str = Field(..., min_length=1, max_length=100)
    clinicId: Optional[str] = None  # Auto-generated unique ID for the clinic

    # Doctor specific fields
    speciality: Optional[str] = None
    licenseNumber: Optional[str] = None
    experience: Optional[int] = Field(0, ge=0)

    # Admin specific fields
    permissions: Optional[List[str]] = []


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=8)


class UserInDB(UserBase):
    """User model as stored in database."""
    id: Optional[PyObjectId] = Field(alias="_id")
    password: str
    lastLogin: Optional[datetime] = None
    profileImage: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserResponse(UserBase):
    """Schema for user response (excludes password)."""
    id: str = Field(alias="_id")
    lastLogin: Optional[datetime] = None
    profileImage: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    fullName: Optional[str] = None
    
    class Config:
        populate_by_name = True


class UserUpdate(BaseModel):
    """Schema for updating user."""
    firstName: Optional[str] = Field(None, min_length=1, max_length=50)
    lastName: Optional[str] = Field(None, min_length=1, max_length=50)
    phone: Optional[str] = Field(None, pattern=r"^[\d\s\-\+\(\)]+$")
    speciality: Optional[str] = None
    licenseNumber: Optional[str] = None
    experience: Optional[int] = Field(None, ge=0)
    profileImage: Optional[str] = None
    isActive: Optional[bool] = None


async def user_helper(user: dict) -> dict:
    """
    Helper function to format user document from database.
    Adds fullName virtual field and converts ObjectId to string.
    """
    if not user:
        return None
    
    return {
        "_id": str(user["_id"]),
        "firstName": user["firstName"],
        "lastName": user["lastName"],
        "fullName": f"{user['firstName']} {user['lastName']}",
        "email": user["email"],
        "role": user["role"],
        "phone": user.get("phone"),
        "isActive": user.get("isActive", True),
        "clinicName": user.get("clinicName", ""),
        "clinicId": user.get("clinicId"),
        "lastLogin": user.get("lastLogin"),
        "profileImage": user.get("profileImage"),
        "speciality": user.get("speciality"),
        "licenseNumber": user.get("licenseNumber"),
        "experience": user.get("experience", 0),
        "permissions": user.get("permissions", []),
        "createdAt": user.get("createdAt"),
        "updatedAt": user.get("updatedAt"),
    }

