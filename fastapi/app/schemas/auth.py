"""
Pydantic schemas for authentication endpoints.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class LoginRequest(BaseModel):
    """Login request schema."""
    email: EmailStr
    password: str = Field(..., min_length=6)


class RegisterRequest(BaseModel):
    """Registration request schema."""
    firstName: str = Field(..., min_length=1, max_length=50)
    lastName: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str = Field(..., pattern="^(admin|doctor|receptionist)$")
    phone: Optional[str] = Field(None, pattern=r"^[\d\s\-\+\(\)]+$")

    # Doctor specific
    speciality: Optional[str] = None
    licenseNumber: Optional[str] = None
    experience: Optional[int] = Field(0, ge=0)


class UserCreate(BaseModel):
    """User creation schema for admin operations."""
    firstName: str = Field(..., min_length=1, max_length=50)
    lastName: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(..., pattern="^(admin|doctor|receptionist)$")
    phone: Optional[str] = Field(None, pattern=r"^[\d\s\-\+\(\)]+$")

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

