"""
Admin management API endpoints.
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.schemas.auth import UserCreate
from app.services.auth_service import auth_service
from app.middleware.auth import require_roles
from app.utils.response import success_response, error_response, paginated_response

router = APIRouter()

def get_users_collection(db: AsyncIOMotorDatabase):
    """Get users collection."""
    return db.users

def get_patients_collection(db: AsyncIOMotorDatabase):
    """Get patients collection."""
    return db.patients

def get_appointments_collection(db: AsyncIOMotorDatabase):
    """Get appointments collection."""
    return db.appointments

def get_clinical_notes_collection(db: AsyncIOMotorDatabase):
    """Get clinical notes collection."""
    return db.clinical_notes

def get_recordings_collection(db: AsyncIOMotorDatabase):
    """Get recordings collection."""
    return db.recordings


@router.get("/dashboard", response_model=dict)
async def get_dashboard_stats(
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get admin dashboard statistics."""
    try:
        # Today's date range
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        
        # This month's date range
        first_day_of_month = today.replace(day=1)
        
        # Get counts
        total_patients = await get_patients_collection(db).count_documents({})
        total_appointments = await get_appointments_collection(db).count_documents({})
        total_doctors = await get_users_collection(db).count_documents({"role": "doctor"})
        total_receptionists = await get_users_collection(db).count_documents({"role": "receptionist"})
        total_clinical_notes = await get_clinical_notes_collection(db).count_documents({})
        total_recordings = await get_recordings_collection(db).count_documents({})

        # Today's appointments
        appointments_today = await get_appointments_collection(db).count_documents({
            "date": {"$gte": today.isoformat().split('T')[0]}
        })

        # Patients this month
        patients_this_month = await get_patients_collection(db).count_documents({
            "createdAt": {"$gte": first_day_of_month}
        })

        # Recent activity (last 10 appointments and patients)
        recent_appointments = await get_appointments_collection(db).find({}).sort("createdAt", -1).limit(5).to_list(length=5)
        recent_patients = await get_patients_collection(db).find({}).sort("createdAt", -1).limit(5).to_list(length=5)
        
        recent_activity = []
        for apt in recent_appointments:
            recent_activity.append({
                "type": "appointment",
                "description": f"Appointment scheduled - {apt.get('appointmentId', 'N/A')}",
                "date": apt.get("createdAt", datetime.utcnow()).isoformat(),
                "user": apt.get("scheduledBy", "Unknown")
            })
        
        for patient in recent_patients:
            recent_activity.append({
                "type": "patient",
                "description": f"New patient registered - {patient.get('firstName', '')} {patient.get('lastName', '')}",
                "date": patient.get("createdAt", datetime.utcnow()).isoformat(),
                "user": "System"
            })
        
        # Sort by date
        recent_activity.sort(key=lambda x: x["date"], reverse=True)
        recent_activity = recent_activity[:10]
        
        return success_response(
            data={
                "totalPatients": total_patients,
                "totalAppointments": total_appointments,
                "totalDoctors": total_doctors,
                "totalReceptionists": total_receptionists,
                "totalClinicalNotes": total_clinical_notes,
                "totalRecordings": total_recordings,
                "appointmentsToday": appointments_today,
                "patientsThisMonth": patients_this_month,
                "recentActivity": recent_activity
            },
            message="Dashboard statistics retrieved successfully"
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to fetch dashboard stats: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/stats", response_model=dict)
async def get_system_stats(
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get system statistics."""
    try:
        # User stats
        total_users = await get_users_collection(db).count_documents({})
        active_users = await get_users_collection(db).count_documents({"isActive": True})

        # Collection counts
        total_patients = await get_patients_collection(db).count_documents({})
        total_appointments = await get_appointments_collection(db).count_documents({})
        total_clinical_notes = await get_clinical_notes_collection(db).count_documents({})
        total_recordings = await get_recordings_collection(db).count_documents({})
        
        # System info (placeholder values - implement based on your monitoring)
        import time
        system_uptime = time.time() / 3600  # Convert to hours (placeholder)
        
        return success_response(
            data={
                "totalUsers": total_users,
                "activeUsers": active_users,
                "totalPatients": total_patients,
                "totalAppointments": total_appointments,
                "totalClinicalNotes": total_clinical_notes,
                "totalRecordings": total_recordings,
                "systemUptime": round(system_uptime, 2),
                "databaseSize": "N/A",  # Would need MongoDB admin access
                "apiRequestsToday": 0,  # Implement with middleware tracking
                "errorRate": 0.0  # Implement with error tracking
            },
            message="System statistics retrieved successfully"
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to fetch system stats: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/users", response_model=dict)
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None, alias="isActive"),
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all users."""
    try:
        # Build query
        query = {}
        if role:
            query["role"] = role
        if is_active is not None:
            query["isActive"] = is_active
        
        # Get total count
        total = await get_users_collection(db).count_documents(query)

        # Get paginated results
        skip = (page - 1) * limit
        cursor = get_users_collection(db).find(
            query,
            {"password": 0}  # Exclude password
        ).sort("createdAt", -1).skip(skip).limit(limit)
        
        users = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for user in users:
            user["_id"] = str(user["_id"])
        
        return paginated_response(
            message="Users retrieved successfully",
            data=users,
            total=total,
            page=page,
            limit=limit
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to fetch users: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.post("/users", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new user (admin, doctor, or receptionist)."""
    user = await auth_service.register_user(user_data)
    return success_response(
        data=user.dict(by_alias=True),
        message="User created successfully"
    )


@router.put("/users/{user_id}", response_model=dict)
async def update_user(
    user_id: str,
    update_data: dict,
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update user information."""
    try:
        # Remove sensitive fields
        update_data.pop("password", None)
        
        if not update_data:
            return error_response(
                message="No valid fields to update",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        result = await get_users_collection(db).find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": update_data},
            return_document=True,
            projection={"password": 0}
        )
        
        if not result:
            return error_response(
                message="User not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        result["_id"] = str(result["_id"])
        
        return success_response(
            data={"user": result},
            message="User updated successfully"
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to update user: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.delete("/users/{user_id}", response_model=dict)
async def delete_user(
    user_id: str,
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete a user."""
    try:
        result = await get_users_collection(db).delete_one({"_id": ObjectId(user_id)})
        
        if result.deleted_count == 0:
            return error_response(
                message="User not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        return success_response(message="User deleted successfully")
    
    except Exception as e:
        return error_response(
            message=f"Failed to delete user: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/patients", response_model=dict)
async def get_patients(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all patients."""
    try:
        total = await get_patients_collection(db).count_documents({})
        skip = (page - 1) * limit

        cursor = get_patients_collection(db).find({}).sort("createdAt", -1).skip(skip).limit(limit)
        patients = await cursor.to_list(length=limit)
        
        for patient in patients:
            patient["_id"] = str(patient["_id"])
        
        return success_response(
            data={"patients": patients},
            message="Patients retrieved successfully",
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
            message=f"Failed to fetch patients: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/appointments", response_model=dict)
async def get_appointments(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all appointments."""
    try:
        total = await get_appointments_collection(db).count_documents({})
        skip = (page - 1) * limit

        cursor = get_appointments_collection(db).find({}).sort("createdAt", -1).skip(skip).limit(limit)
        appointments = await cursor.to_list(length=limit)
        
        for appointment in appointments:
            appointment["_id"] = str(appointment["_id"])
        
        return success_response(
            data={"appointments": appointments},
            message="Appointments retrieved successfully",
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
            message=f"Failed to fetch appointments: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/clinical-notes", response_model=dict)
async def get_clinical_notes(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all clinical notes."""
    try:
        total = await get_clinical_notes_collection(db).count_documents({})
        skip = (page - 1) * limit

        cursor = get_clinical_notes_collection(db).find({}).sort("created_at", -1).skip(skip).limit(limit)
        notes = await cursor.to_list(length=limit)
        
        for note in notes:
            note["_id"] = str(note["_id"])
        
        return success_response(
            data={"clinical_notes": notes},
            message="Clinical notes retrieved successfully",
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
            message=f"Failed to fetch clinical notes: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/recordings", response_model=dict)
async def get_recordings(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all recordings."""
    try:
        total = await get_recordings_collection(db).count_documents({})
        skip = (page - 1) * limit

        cursor = get_recordings_collection(db).find({}).sort("created_at", -1).skip(skip).limit(limit)
        recordings = await cursor.to_list(length=limit)
        
        for recording in recordings:
            recording["_id"] = str(recording["_id"])
        
        return success_response(
            data={"recordings": recordings},
            message="Recordings retrieved successfully",
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
            message=f"Failed to fetch recordings: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

