"""
Receptionist-specific API endpoints.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from bson import ObjectId
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.middleware.auth import get_current_user, require_roles, get_current_active_user
from app.utils.response import success_response, error_response

router = APIRouter()


class AvailabilityUpdate(BaseModel):
    """Schema for updating receptionist availability."""
    availability: Dict[str, Dict[str, Any]] = Field(..., description="Availability schedule by day")


class NotificationPreferencesUpdate(BaseModel):
    """Schema for updating notification preferences."""
    notificationPreferences: Dict[str, bool] = Field(..., description="Notification preferences")


def get_users_collection(db: AsyncIOMotorDatabase):
    """Get users collection."""
    return db["users"]


@router.get("/", response_model=dict)
async def get_receptionists(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    is_active: Optional[bool] = Query(None, alias="isActive"),
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all receptionists (admin only)."""
    try:
        # Build query
        query = {"role": "receptionist"}
        if is_active is not None:
            query["isActive"] = is_active
        
        # Get total count
        total = await get_users_collection(db).count_documents(query)
        
        # Get paginated results
        skip = (page - 1) * limit
        cursor = get_users_collection(db).find(
            query,
            {"password": 0}  # Exclude password field
        ).sort("createdAt", -1).skip(skip).limit(limit)
        
        receptionists = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for receptionist in receptionists:
            receptionist["_id"] = str(receptionist["_id"])
        
        return success_response(
            data={"receptionists": receptionists},
            message="Receptionists retrieved successfully",
            metadata={
                "pagination": {
                    "total": total,
                    "page": page,
                    "limit": limit,
                    "pages": (total + limit - 1) // limit
                }
            }
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to fetch receptionists: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/{receptionist_id}", response_model=dict)
async def get_receptionist(
    receptionist_id: str,
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get single receptionist by ID (admin only)."""
    try:
        receptionist = await get_users_collection(db).find_one(
            {"_id": ObjectId(receptionist_id), "role": "receptionist"},
            {"password": 0}
        )
        
        if not receptionist:
            return error_response(
                message="Receptionist not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        receptionist["_id"] = str(receptionist["_id"])
        
        return success_response(
            data={"receptionist": receptionist},
            message="Receptionist retrieved successfully"
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to fetch receptionist: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.put("/{receptionist_id}", response_model=dict)
async def update_receptionist(
    receptionist_id: str,
    update_data: dict,
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update receptionist information (admin only)."""
    try:
        # Remove fields that shouldn't be updated via this endpoint
        update_data.pop("password", None)
        update_data.pop("email", None)
        update_data.pop("role", None)
        
        if not update_data:
            return error_response(
                message="No valid fields to update",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        update_data["updatedAt"] = datetime.utcnow()
        
        result = await get_users_collection(db).find_one_and_update(
            {"_id": ObjectId(receptionist_id), "role": "receptionist"},
            {"$set": update_data},
            return_document=True,
            projection={"password": 0}
        )
        
        if not result:
            return error_response(
                message="Receptionist not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        result["_id"] = str(result["_id"])
        
        return success_response(
            data={"receptionist": result},
            message="Receptionist updated successfully"
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to update receptionist: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.delete("/{receptionist_id}", response_model=dict)
async def delete_receptionist(
    receptionist_id: str,
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete receptionist account (admin only)."""
    try:
        result = await get_users_collection(db).delete_one(
            {"_id": ObjectId(receptionist_id), "role": "receptionist"}
        )
        
        if result.deleted_count == 0:
            return error_response(
                message="Receptionist not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        return success_response(message="Receptionist deleted successfully")
    
    except Exception as e:
        return error_response(
            message=f"Failed to delete receptionist: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/me", response_model=dict)
async def get_current_receptionist(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get current receptionist's profile information."""
    try:
        # Verify user is a receptionist
        if current_user.get("role") != "receptionist":
            return error_response(
                message="Access denied. Receptionist role required.",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        from app.models.user import user_helper
        receptionist = await get_users_collection(db).find_one(
            {"_id": ObjectId(current_user["_id"]), "role": "receptionist"},
            {"password": 0}
        )
        
        if not receptionist:
            return error_response(
                message="Receptionist profile not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        formatted_receptionist = await user_helper(receptionist)
        
        return success_response(
            data={"receptionist": formatted_receptionist},
            message="Receptionist profile retrieved successfully"
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to fetch receptionist profile: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.put("/me/profile", response_model=dict)
async def update_current_receptionist_profile(
    update_data: dict,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update current receptionist's profile information."""
    try:
        # Verify user is a receptionist
        if current_user.get("role") != "receptionist":
            return error_response(
                message="Access denied. Receptionist role required.",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        # Remove fields that shouldn't be updated
        update_data.pop("password", None)
        update_data.pop("email", None)
        update_data.pop("role", None)
        update_data.pop("_id", None)
        
        if not update_data:
            return error_response(
                message="No valid fields to update",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        update_data["updatedAt"] = datetime.utcnow()
        
        result = await get_users_collection(db).find_one_and_update(
            {"_id": ObjectId(current_user["_id"]), "role": "receptionist"},
            {"$set": update_data},
            return_document=True,
            projection={"password": 0}
        )
        
        if not result:
            return error_response(
                message="Receptionist profile not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        from app.models.user import user_helper
        formatted_receptionist = await user_helper(result)
        
        return success_response(
            data={"receptionist": formatted_receptionist},
            message="Profile updated successfully"
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to update profile: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/me/availability", response_model=dict)
async def get_current_receptionist_availability(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get current receptionist's availability schedule."""
    try:
        # Verify user is a receptionist
        if current_user.get("role") != "receptionist":
            return error_response(
                message="Access denied. Receptionist role required.",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        receptionist = await get_users_collection(db).find_one(
            {"_id": ObjectId(current_user["_id"]), "role": "receptionist"},
            {"availability": 1}
        )
        
        if not receptionist:
            return error_response(
                message="Receptionist profile not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        availability = receptionist.get("availability") or {}
        
        return success_response(
            data={"availability": availability},
            message="Availability retrieved successfully"
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to fetch availability: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.put("/me/availability", response_model=dict)
async def update_current_receptionist_availability(
    update_data: AvailabilityUpdate,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update current receptionist's availability schedule."""
    try:
        # Verify user is a receptionist
        if current_user.get("role") != "receptionist":
            return error_response(
                message="Access denied. Receptionist role required.",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        update_doc = {
            "availability": update_data.availability,
            "updatedAt": datetime.utcnow()
        }
        
        result = await get_users_collection(db).find_one_and_update(
            {"_id": ObjectId(current_user["_id"]), "role": "receptionist"},
            {"$set": update_doc},
            return_document=True,
            projection={"availability": 1}
        )
        
        if not result:
            return error_response(
                message="Receptionist profile not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        return success_response(
            message="Availability updated successfully",
            data={"availability": result.get("availability", {})}
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to update availability: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.put("/me/notifications", response_model=dict)
async def update_current_receptionist_notifications(
    update_data: NotificationPreferencesUpdate,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update current receptionist's notification preferences."""
    try:
        # Verify user is a receptionist
        if current_user.get("role") != "receptionist":
            return error_response(
                message="Access denied. Receptionist role required.",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        update_doc = {
            "notificationPreferences": update_data.notificationPreferences,
            "updatedAt": datetime.utcnow()
        }
        
        result = await get_users_collection(db).find_one_and_update(
            {"_id": ObjectId(current_user["_id"]), "role": "receptionist"},
            {"$set": update_doc},
            return_document=True,
            projection={"notificationPreferences": 1}
        )
        
        if not result:
            return error_response(
                message="Receptionist profile not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        return success_response(
            message="Notification preferences updated successfully",
            data={"notificationPreferences": result.get("notificationPreferences", {})}
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to update notification preferences: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

