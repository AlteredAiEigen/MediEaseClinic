"""
Doctor-specific API endpoints.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.middleware.auth import get_current_user, require_roles
from app.utils.response import success_response, error_response, paginated_response

router = APIRouter()

def get_users_collection(db: AsyncIOMotorDatabase):
    """Get users collection."""
    return db.users

def get_appointments_collection(db: AsyncIOMotorDatabase):
    """Get appointments collection."""
    return db.appointments


@router.get("/", response_model=dict)
async def get_doctors(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    speciality: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None, alias="isActive"),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all doctors with optional filtering and pagination."""
    try:
        # Build query
        query = {"role": "doctor"}
        if speciality:
            query["speciality"] = speciality
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
        
        doctors = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for doctor in doctors:
            doctor["_id"] = str(doctor["_id"])
        
        return paginated_response(
            message="Doctors retrieved successfully",
            data=doctors,
            total=total,
            page=page,
            limit=limit
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to fetch doctors: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/stats", response_model=dict)
async def get_doctor_stats(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get doctor statistics."""
    try:
        # Total and active doctors
        total_doctors = await get_users_collection(db).count_documents({"role": "doctor"})
        active_doctors = await get_users_collection(db).count_documents({"role": "doctor", "isActive": True})

        # Doctors by speciality
        pipeline = [
            {"$match": {"role": "doctor"}},
            {"$group": {"_id": "$speciality", "count": {"$sum": 1}}}
        ]
        cursor = get_users_collection(db).aggregate(pipeline)
        speciality_results = await cursor.to_list(length=None)
        doctors_by_speciality = {item["_id"]: item["count"] for item in speciality_results}

        # Average appointments per doctor
        total_appointments = await get_appointments_collection(db).count_documents({})
        avg_appointments = total_appointments / total_doctors if total_doctors > 0 else 0
        
        return success_response(
            data={
                "totalDoctors": total_doctors,
                "activeDoctors": active_doctors,
                "doctorsBySpeciality": doctors_by_speciality,
                "averageAppointmentsPerDoctor": round(avg_appointments, 2)
            },
            message="Doctor statistics retrieved successfully"
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to fetch doctor statistics: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/{doctor_id}", response_model=dict)
async def get_doctor(
    doctor_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get single doctor by ID."""
    try:
        doctor = await get_users_collection(db).find_one(
            {"_id": ObjectId(doctor_id), "role": "doctor"},
            {"password": 0}
        )
        
        if not doctor:
            return error_response(
                message="Doctor not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        doctor["_id"] = str(doctor["_id"])
        
        return success_response(
            data={"doctor": doctor},
            message="Doctor retrieved successfully"
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to fetch doctor: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.put("/{doctor_id}", response_model=dict)
async def update_doctor(
    doctor_id: str,
    update_data: dict,
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update doctor information (admin only)."""
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
        
        result = await get_users_collection(db).find_one_and_update(
            {"_id": ObjectId(doctor_id), "role": "doctor"},
            {"$set": update_data},
            return_document=True,
            projection={"password": 0}
        )
        
        if not result:
            return error_response(
                message="Doctor not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        result["_id"] = str(result["_id"])
        
        return success_response(
            data={"doctor": result},
            message="Doctor updated successfully"
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to update doctor: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.delete("/{doctor_id}", response_model=dict)
async def delete_doctor(
    doctor_id: str,
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete doctor account (admin only)."""
    try:
        result = await get_users_collection(db).delete_one(
            {"_id": ObjectId(doctor_id), "role": "doctor"}
        )
        
        if result.deleted_count == 0:
            return error_response(
                message="Doctor not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        return success_response(message="Doctor deleted successfully")
    
    except Exception as e:
        return error_response(
            message=f"Failed to delete doctor: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

