"""
Authentication router with login, register, and token management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    RefreshTokenRequest,
    ChangePasswordRequest
)
from app.services.auth_service import AuthService
from app.middleware.auth import get_current_active_user
from app.utils.response import success_response, error_response

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    user_data: RegisterRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Register a new user (admin, doctor, or receptionist).
    
    - **firstName**: User's first name
    - **lastName**: User's last name
    - **email**: User's email address (must be unique)
    - **password**: Strong password (min 8 chars, uppercase, lowercase, digit, special char)
    - **role**: User role (admin, doctor, receptionist)
    - **phone**: Optional phone number
    - **speciality**: Required for doctors
    - **licenseNumber**: Required for doctors
    - **experience**: Years of experience (for doctors)
    """
    try:
        from app.services.auth_service import auth_service
        user = await auth_service.register_user(user_data)
        
        # Generate tokens for immediate login
        token_data = {
            "user_id": user["_id"],
            "email": user["email"],
            "role": user["role"]
        }
        
        from app.utils.security import create_access_token, create_refresh_token
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token({"user_id": user["_id"]})
        
        return success_response(
            message="User registered successfully",
            data={
                "user": user,
                "accessToken": access_token,
                "refreshToken": refresh_token,
                "tokenType": "bearer"
            },
            status_code=201
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login")
async def login(
    credentials: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Login with email and password.
    
    Returns JWT access token and refresh token.
    
    - **email**: User's email address
    - **password**: User's password
    """
    try:
        from app.services.auth_service import auth_service
        result = await auth_service.login(credentials.email, credentials.password)
        
        return success_response(
            message="Login successful",
            data=result
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/refresh")
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    
    - **refreshToken**: Valid refresh token
    """
    try:
        from app.services.auth_service import auth_service
        result = await auth_service.refresh_access_token(request.refreshToken)
        
        return success_response(
            message="Token refreshed successfully",
            data=result
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_active_user)):
    """
    Get current authenticated user information.
    
    Requires valid JWT access token in Authorization header.
    """
    return success_response(
        message="User retrieved successfully",
        data={"user": current_user}
    )


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Change current user's password.
    
    - **currentPassword**: Current password for verification
    - **newPassword**: New password (must meet strength requirements)
    """
    try:
        from app.services.auth_service import auth_service
        await auth_service.change_password(
            current_user["_id"],
            request.currentPassword,
            request.newPassword
        )
        
        return success_response(
            message="Password changed successfully"
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password change failed: {str(e)}"
        )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_active_user)):
    """
    Logout current user.
    
    Note: Since we're using JWT tokens, actual logout happens client-side
    by discarding the token. This endpoint is for audit logging purposes.
    """
    return success_response(
        message="Logged out successfully",
        data={"userId": current_user["_id"]}
    )

