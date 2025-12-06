"""
Authentication service with user management and JWT handling.
"""

from datetime import datetime
from typing import Optional, Dict

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.user import UserCreate, UserInDB, user_helper
from app.schemas.auth import RegisterRequest
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.utils.validators import validate_password_strength


class AuthService:
    """Service for handling authentication operations."""

    def __init__(self):
        pass

    def _get_users_collection(self):
        """Get users collection lazily."""
        from app.database import db
        if db is None:
            raise Exception("Database not initialized")
        return db["users"]
    
    async def register_user(self, user_data: RegisterRequest) -> dict:
        """
        Register a new user.
        
        Args:
            user_data: User registration data
        
        Returns:
            Created user data (without password)
        
        Raises:
            HTTPException: If email already exists or validation fails
        """
        # Check if user already exists
        existing_user = await self._get_users_collection().find_one(
            {"email": user_data.email.lower()}
        )
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already exists with this email"
            )
        
        # Validate password strength
        is_valid, error_message = validate_password_strength(user_data.password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message,
            )

        # Enforce Gmail-only signup for admin registrations
        if user_data.role == "admin":
            email_lower = user_data.email.lower().strip()
            if not email_lower.endswith("@gmail.com"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Admin registration requires a Gmail address (ending in @gmail.com).",
                )

        # Validate clinic information
        if user_data.role == "admin":
            if not user_data.clinicName:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Clinic name is required for admin registration",
                )
            # Generate unique clinic ID for admin
            import uuid

            clinic_id = str(uuid.uuid4())[:8].upper()
            clinic_name = user_data.clinicName
        else:
            # For doctors/receptionists - clinic info should be set by the admin creating them
            # Use clinicId and clinicName from user_data if provided (when created by admin)
            # Handle both RegisterRequest and UserCreate types
            try:
                # Try to get from model_dump first (works for both Pydantic models)
                user_dict_temp = user_data.model_dump()
                clinic_id = user_dict_temp.get("clinicId")
                clinic_name = user_dict_temp.get("clinicName")
            except (AttributeError, TypeError):
                # Fallback to direct attribute access
                clinic_id = getattr(user_data, "clinicId", None)
                clinic_name = getattr(user_data, "clinicName", None)

        # Validate doctor-specific fields
        if user_data.role == "doctor":
            if not user_data.speciality or not user_data.licenseNumber:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Speciality and license number required for doctors"
                )

        # Hash password
        hashed_password = hash_password(user_data.password)
        
        # Prepare user document
        user_dict = user_data.model_dump()
        user_dict["password"] = hashed_password
        user_dict["email"] = user_dict["email"].lower()
        user_dict["createdAt"] = datetime.utcnow()
        user_dict["updatedAt"] = datetime.utcnow()
        user_dict["lastLogin"] = None

        # New accounts are active by default, except admins which must verify email first
        if user_data.role == "admin":
            user_dict["isActive"] = False
            user_dict["accountStatus"] = "pending_verification"
        else:
            user_dict["isActive"] = True
            user_dict["accountStatus"] = "active"

        # Handle clinic information
        if user_data.role == "admin":
            user_dict["clinicId"] = clinic_id
            user_dict["clinicName"] = clinic_name
        else:
            # For doctors/receptionists, assign clinic info if provided (when created by admin)
            if clinic_id:
                user_dict["clinicId"] = clinic_id
            if clinic_name:
                user_dict["clinicName"] = clinic_name
        
        # Insert into database
        result = await self._get_users_collection().insert_one(user_dict)
        
        # Retrieve created user
        created_user = await self._get_users_collection().find_one({"_id": result.inserted_id})
        
        return await user_helper(created_user)
    
    async def authenticate_user(self, email: str, password: str) -> Optional[dict]:
        """
        Authenticate user with email and password.
        
        Args:
            email: User email
            password: User password
        
        Returns:
            User data if authentication successful, None otherwise
        
        Raises:
            HTTPException: If user account is deactivated or password verification fails
        """
        # Normalize email to lowercase for lookup
        normalized_email = email.lower().strip()
        
        # Find user by email
        user = await self._get_users_collection().find_one({"email": normalized_email})
        
        if not user:
            # User not found - return None to indicate invalid credentials
            return None
        
        # Check if user is active / verified
        if not user.get("isActive", True):
            account_status = user.get("accountStatus")
            # Provide a clearer message for accounts pending email verification
            if account_status == "pending_verification":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your account is pending email verification. Please click the activation link sent to your Gmail address.",
                )

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated. Please contact your administrator.",
            )
        
        # Check if password field exists
        if "password" not in user or not user.get("password"):
            # Password not set - this shouldn't happen but handle gracefully
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User account configuration error. Please contact support."
            )
        
        # Verify password
        if not verify_password(password, user["password"]):
            # Password doesn't match - return None to indicate invalid credentials
            return None
        
        # Update last login
        try:
            await self._get_users_collection().update_one(
                {"_id": user["_id"]},
                {"$set": {"lastLogin": datetime.utcnow()}}
            )
            # Update user dict with new lastLogin
            user["lastLogin"] = datetime.utcnow()
        except Exception as e:
            # Log error but don't fail authentication if lastLogin update fails
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to update lastLogin for user {user.get('_id')}: {str(e)}")
        
        return await user_helper(user)
    
    async def login(self, email: str, password: str) -> Dict:
        """
        Login user and generate JWT tokens.
        
        Args:
            email: User email
            password: User password
        
        Returns:
            Dictionary with user data and tokens
        
        Raises:
            HTTPException: If authentication fails
        """
        user = await self.authenticate_user(email, password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create tokens
        token_data = {
            "user_id": user["_id"],
            "email": user["email"],
            "role": user["role"]
        }
        
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token({"user_id": user["_id"]})
        
        return {
            "user": user,
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "tokenType": "bearer"
        }
    
    async def refresh_access_token(self, refresh_token: str) -> Dict:
        """
        Generate new access token from refresh token.
        
        Args:
            refresh_token: Valid refresh token
        
        Returns:
            New access token
        
        Raises:
            HTTPException: If refresh token is invalid
        """
        payload = decode_token(refresh_token)
        
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Get user from database
        from bson import ObjectId
        user = await self._get_users_collection().find_one({"_id": ObjectId(user_id)})
        
        if not user or not user.get("isActive", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new access token
        token_data = {
            "user_id": str(user["_id"]),
            "email": user["email"],
            "role": user["role"]
        }
        
        access_token = create_access_token(token_data)
        
        return {
            "accessToken": access_token,
            "tokenType": "bearer"
        }
    
    async def get_current_user(self, user_id: str) -> Optional[dict]:
        """
        Get current user by ID.
        
        Args:
            user_id: User ID from JWT token
        
        Returns:
            User data
        """
        from bson import ObjectId
        
        user = await self._get_users_collection().find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return None
        
        return await user_helper(user)
    
    async def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        """
        Change user password.
        
        Args:
            user_id: User ID
            current_password: Current password for verification
            new_password: New password
        
        Returns:
            True if password changed successfully
        
        Raises:
            HTTPException: If current password is incorrect or validation fails
        """
        from bson import ObjectId
        
        # Get user with password
        user = await self._get_users_collection().find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify current password
        if not verify_password(current_password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Validate new password
        is_valid, error_message = validate_password_strength(new_password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message
            )
        
        # Hash new password
        hashed_password = hash_password(new_password)
        
        # Update password
        await self._get_users_collection().update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "password": hashed_password,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        return True


# Global auth service instance
auth_service = AuthService()

