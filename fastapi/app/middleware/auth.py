"""
Authentication middleware for JWT token verification and role-based access control.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.utils.security import decode_token
from app.services.auth_service import AuthService

# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> dict:
    """
    Dependency to get current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Authorization credentials
        db: Database instance
    
    Returns:
        Current user data
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    
    # Decode token
    payload = decode_token(token)
    
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    from app.services.auth_service import auth_service
    user = await auth_service.get_current_user(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    return user


async def get_current_active_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Dependency to ensure user is active.
    
    Args:
        current_user: Current user from get_current_user dependency
    
    Returns:
        Active user data
    
    Raises:
        HTTPException: If user is not active
    """
    if not current_user.get("isActive", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    return current_user


def require_roles(allowed_roles: List[str]):
    """
    Dependency factory for role-based access control.
    
    Args:
        allowed_roles: List of allowed roles (admin, doctor, receptionist)
    
    Returns:
        Dependency function that checks user role
    
    Usage:
        @app.get("/admin-only")
        async def admin_endpoint(user: dict = Depends(require_role(["admin"]))):
            ...
    """
    async def role_checker(current_user: dict = Depends(get_current_active_user)) -> dict:
        user_role = current_user.get("role")
        
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        
        return current_user
    
    return role_checker


# Convenience dependencies for specific roles
require_admin = require_roles(["admin"])
require_doctor = require_roles(["doctor"])
require_receptionist = require_roles(["receptionist"])
require_doctor_or_admin = require_roles(["doctor", "admin"])
require_any_role = require_roles(["admin", "doctor", "receptionist"])


class OptionalAuth:
    """
    Optional authentication dependency.
    Returns user if authenticated, None otherwise.
    """
    
    async def __call__(
        self,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
        db: AsyncIOMotorDatabase = Depends(get_db)
    ) -> Optional[dict]:
        """Get user if token is present and valid, otherwise return None."""
        
        if not credentials:
            return None
        
        try:
            token = credentials.credentials
            payload = decode_token(token)
            
            if not payload or payload.get("type") != "access":
                return None
            
            user_id = payload.get("user_id")
            if not user_id:
                return None
            
            from app.services.auth_service import auth_service
            user = await auth_service.get_current_user(user_id)
            
            return user
        except:
            return None


optional_auth = OptionalAuth()

