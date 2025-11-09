"""
Admin management API endpoints.
"""

from datetime import datetime
from collections import defaultdict
from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, Query, status
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field, EmailStr

from app.database import get_db
from app.schemas.auth import UserCreate
from app.services.auth_service import auth_service
from app.services.queue_service import QueueService
from app.middleware.auth import require_roles
from app.utils.response import success_response, error_response, paginated_response
from app.models.user import user_helper

router = APIRouter()


class ProfileUpdate(BaseModel):
    firstName: Optional[str] = Field(None, min_length=1, max_length=50)
    lastName: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, pattern=r"^[\d\s\-\+\(\)]+$")
    profileImage: Optional[str | None] = None

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


def _month_key(date_str: str) -> str:
    """Convert YYYY-MM-DD string into month abbreviation."""
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%b %Y")
    except Exception:
        return "Unknown"


def month_sort_key(month_label: str) -> tuple:
    """Generate sortable key for month labels like 'Jan 2024'."""
    try:
        dt = datetime.strptime(month_label, "%b %Y")
        return dt.year, dt.month
    except Exception:
        return (9999, 12)


@router.get("/dashboard", response_model=dict)
async def get_dashboard_stats(
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get admin dashboard statistics."""
    try:
        clinic_id = current_user.get("clinicId")

        def user_filter(extra: dict | None = None, *, require_active: bool | None = None):
            query = dict(extra or {})
            if clinic_id:
                query["clinicId"] = clinic_id
            if require_active is True:
                query["isActive"] = True
            elif require_active is False:
                query["isActive"] = False
            return query

        # Today's date range
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # This month's date range
        first_day_of_month = today.replace(day=1)
        
        # Get counts
        patient_query: Dict[str, object] = {}
        appointment_query: Dict[str, object] = {}
        if clinic_id:
            patient_query["clinicId"] = clinic_id
            appointment_query["clinicId"] = clinic_id

        total_patients = await get_patients_collection(db).count_documents(patient_query)
        total_appointments = await get_appointments_collection(db).count_documents(appointment_query)
        total_doctors = await get_users_collection(db).count_documents(
            user_filter({"role": "doctor"}, require_active=True)
        )
        total_receptionists = await get_users_collection(db).count_documents(
            user_filter({"role": "receptionist"}, require_active=True)
        )
        total_clinical_notes = await get_clinical_notes_collection(db).count_documents({})
        total_recordings = await get_recordings_collection(db).count_documents({})

        # Today's appointments
        appointments_today_query = {"date": today.strftime("%Y-%m-%d")}
        if clinic_id:
            appointments_today_query["clinicId"] = clinic_id
        appointments_today = await get_appointments_collection(db).count_documents(
            appointments_today_query
        )

        # Patients this month
        patients_this_month_query = {"createdAt": {"$gte": first_day_of_month}}
        if clinic_id:
            patients_this_month_query["clinicId"] = clinic_id
        patients_this_month = await get_patients_collection(db).count_documents(patients_this_month_query)

        # Recent activity (last 10 appointments and patients)
        recent_appointments = await (
            get_appointments_collection(db)
            .find(appointment_query)
            .sort("createdAt", -1)
            .limit(5)
            .to_list(length=5)
        )
        recent_patients = await (
            get_patients_collection(db)
            .find(patient_query)
            .sort("createdAt", -1)
            .limit(5)
            .to_list(length=5)
        )
        
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


@router.put("/profile", response_model=dict)
async def update_admin_profile(
    update_data: ProfileUpdate,
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update the current admin's profile details."""
    try:
        update_doc = update_data.model_dump(exclude_unset=True)

        if not update_doc:
            return error_response(
                message="No profile fields provided for update",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if "firstName" in update_doc:
            update_doc["firstName"] = update_doc["firstName"].strip()
            if not update_doc["firstName"]:
                return error_response(
                    message="First name cannot be empty",
                    status_code=status.HTTP_400_BAD_REQUEST
                )

        if "lastName" in update_doc:
            update_doc["lastName"] = update_doc["lastName"].strip()
            if not update_doc["lastName"]:
                return error_response(
                    message="Last name cannot be empty",
                    status_code=status.HTTP_400_BAD_REQUEST
                )

        if "email" in update_doc:
            email_lower = update_doc["email"].lower()
            existing = await get_users_collection(db).find_one({
                "email": email_lower,
                "_id": {"$ne": ObjectId(current_user["_id"])}
            })
            if existing:
                return error_response(
                    message="Another account already uses this email address",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            update_doc["email"] = email_lower

        if "phone" in update_doc and update_doc["phone"] is not None:
            update_doc["phone"] = update_doc["phone"].strip()
            if update_doc["phone"] == "":
                update_doc["phone"] = None

        if "profileImage" in update_doc and update_doc["profileImage"] == "":
            update_doc["profileImage"] = None

        update_doc["updatedAt"] = datetime.utcnow()

        result = await get_users_collection(db).find_one_and_update(
            {"_id": ObjectId(current_user["_id"])},
            {"$set": update_doc},
            return_document=True,
            projection={"password": 0}
        )

        if not result:
            return error_response(
                message="User not found",
                status_code=status.HTTP_404_NOT_FOUND
            )

        formatted_user = await user_helper(result)

        return success_response(
            message="Profile updated successfully",
            data={"user": formatted_user}
        )

    except Exception as exc:
        return error_response(
            message=f"Failed to update profile: {str(exc)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/stats", response_model=dict)
async def get_system_stats(
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get system statistics."""
    try:
        clinic_id = current_user.get("clinicId")

        def staff_filter(extra: dict | None = None, *, require_active: bool | None = None):
            query = {"role": {"$in": ["doctor", "receptionist"]}}
            if extra:
                query.update(extra)
            if clinic_id:
                query["clinicId"] = clinic_id
            if require_active is True:
                query["isActive"] = True
            elif require_active is False:
                query["isActive"] = False
            return query

        # User stats (exclude admins from staff metrics)
        total_users = await get_users_collection(db).count_documents(staff_filter())
        active_users = await get_users_collection(db).count_documents(staff_filter(require_active=True))

        # Collection counts
        patient_query: Dict[str, object] = {}
        appointment_query: Dict[str, object] = {}
        if clinic_id:
            patient_query["clinicId"] = clinic_id
            appointment_query["clinicId"] = clinic_id

        total_patients = await get_patients_collection(db).count_documents(patient_query)
        total_appointments = await get_appointments_collection(db).count_documents(appointment_query)
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
    """Get all users in the admin's clinic."""
    try:
        # Build query - only users from the same clinic
        query = {}
        clinic_id = current_user.get("clinicId")
        if clinic_id:
            query["clinicId"] = clinic_id
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
    """Create a new user (doctor or receptionist) for the admin's clinic."""
    # Inherit clinic information from the admin creating the user
    user_data.clinicName = current_user.get("clinicName")
    user_data.clinicId = current_user.get("clinicId")

    user = await auth_service.register_user(user_data)
    return success_response(
        data={"user": user},
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
        clinic_id = current_user.get("clinicId")
        query = {}
        if clinic_id:
            query["clinicId"] = clinic_id

        total = await get_patients_collection(db).count_documents(query)
        skip = (page - 1) * limit

        cursor = (
            get_patients_collection(db)
            .find(query)
            .sort("createdAt", -1)
            .skip(skip)
            .limit(limit)
        )
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
        clinic_id = current_user.get("clinicId")
        query = {}
        if clinic_id:
            query["clinicId"] = clinic_id

        total = await get_appointments_collection(db).count_documents(query)
        skip = (page - 1) * limit

        cursor = (
            get_appointments_collection(db)
            .find(query)
            .sort("date", 1)
            .sort("time", 1)
            .skip(skip)
            .limit(limit)
        )
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


@router.get("/metrics/revenue", response_model=dict)
async def get_revenue_metrics(
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Return monthly revenue and appointment metrics for dashboard charts."""
    appointments_cursor = get_appointments_collection(db).find({})
    appointments = await appointments_cursor.to_list(length=None)

    monthly_counts: Dict[str, Dict[str, float]] = defaultdict(lambda: {"appointments": 0, "completed": 0})
    for appointment in appointments:
        month = _month_key(appointment.get("date", ""))
        monthly_counts[month]["appointments"] += 1
        if appointment.get("status") == "completed":
            monthly_counts[month]["completed"] += 1

    series: List[dict] = []
    for month in sorted(monthly_counts.keys(), key=lambda m: month_sort_key(m)):
        counts = monthly_counts[month]
        revenue = counts["completed"] * 120.0  # simple heuristic
        series.append(
            {
                "month": month,
                "appointments": int(counts["appointments"]),
                "completed": int(counts["completed"]),
                "revenue": revenue,
            }
        )

    return success_response(
        data={"series": series},
        message="Revenue metrics retrieved successfully",
    )


@router.get("/metrics/summary", response_model=dict)
async def get_summary_metrics(
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Provide quick stats for dashboard widgets."""
    clinic_id = current_user.get("clinicId")

    def doctor_filter(extra: dict | None = None):
        query = dict(extra or {})
        if clinic_id:
            query["clinicId"] = clinic_id
        query["role"] = "doctor"
        return query

    total_patients = await get_patients_collection(db).count_documents({})
    active_patients = await get_patients_collection(db).count_documents({"presentInClinic": True})

    total_appointments = await get_appointments_collection(db).count_documents({})
    upcoming_appointments = await get_appointments_collection(db).count_documents({"status": {"$in": ["scheduled", "in-progress"]}})
    completed_appointments = await get_appointments_collection(db).count_documents({"status": "completed"})

    total_doctors = await get_users_collection(db).count_documents(doctor_filter())
    active_doctors = await get_users_collection(db).count_documents(doctor_filter({"isActive": True}))

    queue_service = QueueService(db)
    queue_stats = await queue_service.get_queue_stats()

    summary = {
        "patients": {
            "total": total_patients,
            "activeInClinic": active_patients,
        },
        "appointments": {
            "total": total_appointments,
            "upcoming": upcoming_appointments,
            "completed": completed_appointments,
        },
        "doctors": {
            "total": total_doctors,
            "active": active_doctors,
        },
        "queue": queue_stats,
    }

    return success_response(
        data=summary,
        message="Summary metrics retrieved successfully",
    )

