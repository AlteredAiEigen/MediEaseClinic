"""
Pydantic schemas for authentication endpoints.
"""

from typing import Optional
import re

from pydantic import BaseModel, EmailStr, Field
from pydantic import ConfigDict, field_validator


class LoginRequest(BaseModel):
    """Login request schema."""
    email: EmailStr
    password: str = Field(..., min_length=6)


class RegisterRequest(BaseModel):
    """Registration request schema."""
    model_config = ConfigDict(str_strip_whitespace=True)

    firstName: str = Field(...)
    lastName: str = Field(...)
    email: EmailStr
    password: str = Field(...)
    role: str = Field(...)
    phone: Optional[str] = Field(None)

    # Clinic information (required for admin registration)
    clinicName: Optional[str] = Field(None)
    clinicId: Optional[str] = None  # Auto-generated for admin registration

    # Doctor specific
    speciality: Optional[str] = None
    licenseNumber: Optional[str] = None
    experience: Optional[int] = Field(0)

    @field_validator("firstName")
    @classmethod
    def validate_first_name(cls, value: str) -> str:
        if not value:
            raise ValueError("First name is required")
        if len(value) < 2:
            raise ValueError("First name must be at least 2 characters long")
        if len(value) > 50:
            raise ValueError("First name must be at most 50 characters long")
        return value

    @field_validator("lastName")
    @classmethod
    def validate_last_name(cls, value: str) -> str:
        if not value:
            raise ValueError("Last name is required")
        if len(value) < 2:
            raise ValueError("Last name must be at least 2 characters long")
        if len(value) > 50:
            raise ValueError("Last name must be at most 50 characters long")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not value:
            raise ValueError("Password is required")
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return value

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        if value not in {"admin", "doctor", "receptionist"}:
            raise ValueError("Role must be one of: admin, doctor, or receptionist")
        return value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: Optional[str]) -> Optional[str]:
        if value is None or value == "":
            return None
        if not re.match(r"^[\d\s\-\+\(\)]+$", value):
            raise ValueError("Phone number can only contain digits, spaces, plus, minus, and parentheses")
        if len(re.sub(r"\D", "", value)) < 10:
            raise ValueError("Phone number must include at least 10 digits")
        return value

    @field_validator("clinicName")
    @classmethod
    def validate_clinic_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if len(value) < 2:
            raise ValueError("Clinic name must be at least 2 characters long")
        if len(value) > 100:
            raise ValueError("Clinic name must be at most 100 characters long")
        return value

    @field_validator("experience")
    @classmethod
    def validate_experience(cls, value: Optional[int]) -> Optional[int]:
        if value is None:
            return 0
        if value < 0:
            raise ValueError("Experience must be zero or a positive number")
        return value


class UserCreate(BaseModel):
    """User creation schema for admin operations."""
    firstName: str = Field(..., min_length=1, max_length=50)
    lastName: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(..., pattern="^(doctor|receptionist)$")  # Admins can only create doctors/receptionists
    phone: Optional[str] = Field(None, pattern=r"^[\d\s\-\+\(\)]+$")

    # Clinic info - set by server from admin's clinic
    clinicName: Optional[str] = None
    clinicId: Optional[str] = None

    # Doctor specific
    speciality: Optional[str] = None
    licenseNumber: Optional[str] = None
    experience: Optional[int] = Field(0, ge=0)


class TokenResponse(BaseModel):
    """Token response schema."""
    accessToken: str
    refreshToken: str
    tokenType: str = "bearer"


class LoginResponse(BaseModel):
    """Login response schema."""
    success: bool = True
    message: str
    data: dict  # Contains user and tokens


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""
    refreshToken: str


class ChangePasswordRequest(BaseModel):
    """Change password request schema."""
    currentPassword: str = Field(..., min_length=6)
    newPassword: str = Field(..., min_length=8)


class ResetPasswordRequest(BaseModel):
    """Reset password request schema."""
    email: EmailStr


class ResetPasswordConfirm(BaseModel):
    """Reset password confirmation schema."""
    token: str
    newPassword: str = Field(..., min_length=8)

