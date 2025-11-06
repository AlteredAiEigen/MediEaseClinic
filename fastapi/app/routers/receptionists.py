"""
Receptionist-specific API endpoints.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from bson import ObjectId

from app.database import db
from app.middleware.auth import get_current_user, require_roles
from app.utils.response import success_response, error_response

router = APIRouter()

def get_users_collection():
    """Get users collection."""
    from app.database import Database
    return Database.get_database()["users"]


@router.get("/", response_model=dict)
async def get_receptionists(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    is_active: Optional[bool] = Query(None, alias="isActive"),
    current_user: dict = Depends(require_roles(["admin"]))
):
    """Get all receptionists (admin only)."""
    try:
        # Build query
        query = {"role": "receptionist"}
        if is_active is not None:
            query["isActive"] = is_active
        
        # Get total count
        total = await get_users_collection().count_documents(query)
        
        # Get paginated results
        skip = (page - 1) * limit
        cursor = get_users_collection().find(
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
    current_user: dict = Depends(require_roles(["admin"]))
):
    """Get single receptionist by ID (admin only)."""
    try:
        receptionist = await get_users_collection().find_one(
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
    current_user: dict = Depends(require_roles(["admin"]))
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
        
        result = await get_users_collection().find_one_and_update(
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
    current_user: dict = Depends(require_roles(["admin"]))
):
    """Delete receptionist account (admin only)."""
    try:
        result = await get_users_collection().delete_one(
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

