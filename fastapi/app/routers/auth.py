"""
Authentication router with login, register, and token management endpoints.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    RefreshTokenRequest,
    ChangePasswordRequest,
    ResetPasswordRequest,
    ResetPasswordConfirm,
)
from app.services.auth_service import AuthService
from app.services.password_reset_service import password_reset_service
from app.services.email_verification_service import email_verification_service
from app.middleware.auth import get_current_active_user
from app.utils.response import success_response, error_response
from app.config import settings

logger = logging.getLogger(__name__)

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

        user = await auth_service.register_user(user_data, db)

        # For admin users, send an email verification link to their Gmail account.
        if user.get("role") == "admin":
            try:
                await email_verification_service.send_verification_email(user)
            except Exception as exc:
                logger.error(
                    "Failed to send admin verification email to %s: %s",
                    user.get("email"),
                    exc,
                )

        # Generate tokens for immediate login
        token_data = {
            "user_id": user["_id"],
            "email": user["email"],
            "role": user["role"],
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
                "tokenType": "bearer",
            },
            status_code=201,
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
        
        # Normalize email input
        email = credentials.email.lower().strip()
        
        result = await auth_service.login(email, credentials.password)
        
        return success_response(
            message="Login successful",
            data=result
        )
    
    except HTTPException as e:
        # Re-raise HTTP exceptions (like 403 for deactivated accounts)
        raise e
    except Exception as e:
        # Log the error for debugging but return generic message to client
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Login error for {credentials.email}: {str(e)}", exc_info=True)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again or contact support if the problem persists."
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
        from app.services.notification_service import NotificationService
        
        await auth_service.change_password(
            current_user["_id"],
            request.currentPassword,
            request.newPassword
        )
        
        # Send notification to admin if user is doctor or receptionist
        user_role = current_user.get("role", "")
        if user_role in ["doctor", "receptionist"]:
            notification_service = NotificationService(db)
            user_name = f"{current_user.get('firstName', '')} {current_user.get('lastName', '')}".strip()
            if not user_name:
                user_name = current_user.get("email", "User")
            
            clinic_id = current_user.get("clinicId")
            if clinic_id:
                await notification_service.notify_admin_password_change(
                    user_id=str(current_user["_id"]),
                    user_name=user_name,
                    user_role=user_role,
                    clinic_id=str(clinic_id) if clinic_id else None
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


@router.post("/password-reset/request")
async def request_password_reset(
    payload: ResetPasswordRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Send password reset email to the user if the account exists.
    Always returns success to avoid revealing account existence.
    """
    email = payload.email.lower().strip()
    user = await db["users"].find_one({"email": email})

    if user:
        try:
            await password_reset_service.send_password_reset_email(user)
        except Exception as exc:
            logger.error("Failed to send password reset email to %s: %s", email, exc)

    return success_response(
        message="If an account exists for this email, instructions have been sent."
    )


@router.post("/password-reset/confirm")
async def confirm_password_reset(payload: ResetPasswordConfirm):
    """
    Confirm password reset by providing the reset token and a new password.
    """
    await password_reset_service.reset_password_with_token(
        payload.token, payload.newPassword
    )
    return success_response(message="Password reset successfully")


@router.get("/verify-email")
async def verify_email(token: str):
    """
    Verify a user's email address using a one-time token.
    
    This endpoint is typically called when the user clicks the activation link
    sent to their Gmail account during admin signup.
    
    On success, it redirects the user to the admin login page.
    """
    try:
        # Activate the account
        await email_verification_service.verify_with_token(token)

        # Redirect to admin login with a flag indicating verification success
        redirect_url = f"{settings.frontend_base_url.rstrip('/')}/auth?role=admin&verified=1"
        return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error("Email verification failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification failed. Please try again or contact support.",
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

