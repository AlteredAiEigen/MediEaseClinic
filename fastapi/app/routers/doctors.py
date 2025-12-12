"""
Doctor-specific API endpoints.
"""

from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, status
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field, EmailStr

from app.database import get_db
from app.middleware.auth import get_current_user, require_roles, get_current_active_user
from app.utils.response import success_response, error_response, paginated_response
from app.models.user import user_helper
from app.services.appointment_service import AppointmentService
from app.services.queue_service import QueueService
from app.services.appointment_overview_service import AppointmentOverviewService
from datetime import datetime

router = APIRouter()


class DoctorProfileUpdate(BaseModel):
    """Schema for updating doctor profile."""
    firstName: Optional[str] = Field(None, min_length=1, max_length=50)
    lastName: Optional[str] = Field(None, min_length=1, max_length=50)
    phone: Optional[str] = Field(None, pattern=r"^[\d\s\-\+\(\)]+$")
    speciality: Optional[str] = None
    licenseNumber: Optional[str] = None
    experience: Optional[int] = Field(None, ge=0)
    profileImage: Optional[str | None] = None


class AvailabilityUpdate(BaseModel):
    """Schema for updating doctor availability."""
    availability: Dict[str, Dict[str, Any]] = Field(..., description="Availability schedule by day")


class NotificationPreferencesUpdate(BaseModel):
    """Schema for updating notification preferences."""
    notificationPreferences: Dict[str, bool] = Field(..., description="Notification preferences")


def get_users_collection(db: AsyncIOMotorDatabase):
    """Get users collection."""
    return db.users

def get_appointments_collection(db: AsyncIOMotorDatabase):
    """Get appointments collection."""
    return db.appointments

def get_patients_collection(db: AsyncIOMotorDatabase):
    """Get patients collection."""
    return db.patients


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
        clinic_id = current_user.get("clinicId")
        if clinic_id:
            query["clinicId"] = clinic_id
        
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
        clinic_id = current_user.get("clinicId")
        base_query = {"role": "doctor"}
        if clinic_id:
            base_query["clinicId"] = clinic_id
        total_doctors = await get_users_collection(db).count_documents(base_query)
        active_query = base_query.copy()
        active_query["isActive"] = True
        active_doctors = await get_users_collection(db).count_documents(active_query)

        # Doctors by speciality
        match_stage = {"role": "doctor"}
        if clinic_id:
            match_stage["clinicId"] = clinic_id

        pipeline = [
            {"$match": match_stage},
            {"$group": {"_id": "$speciality", "count": {"$sum": 1}}}
        ]
        cursor = get_users_collection(db).aggregate(pipeline)
        speciality_results = await cursor.to_list(length=None)
        doctors_by_speciality = {item["_id"]: item["count"] for item in speciality_results}

        # Average appointments per doctor
        appointment_query = {}
        if clinic_id:
            appointment_query["clinicId"] = clinic_id
        total_appointments = await get_appointments_collection(db).count_documents(appointment_query)
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


@router.get("/me/stats", response_model=dict)
async def get_current_doctor_stats(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get current doctor's dashboard statistics."""
    try:
        # Verify user is a doctor
        if current_user.get("role") != "doctor":
            return error_response(
                message="Access denied. Doctor role required.",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        doctor_id = str(current_user["_id"])
        today = datetime.utcnow().strftime("%Y-%m-%d")
        clinic_id = current_user.get("clinicId")
        
        appointment_service = AppointmentService(db)
        queue_service = QueueService(db)
        
        # Get today's appointments count
        today_appointments, _ = await appointment_service.list_appointments(
            page=1,
            limit=1,
            doctor_id=doctor_id,
            date=today,
            clinic_id=clinic_id
        )
        today_appointments_count = await get_appointments_collection(db).count_documents({
            "doctorId": doctor_id,
            "date": today,
            "clinicId": clinic_id
        })
        
        # Get scheduled appointments for today
        scheduled_today = await get_appointments_collection(db).count_documents({
            "doctorId": doctor_id,
            "date": today,
            "status": "scheduled",
            "clinicId": clinic_id
        })
        
        # Get completed appointments today (fully checked out or pending checkout)
        completed_today = await get_appointments_collection(db).count_documents({
            "doctorId": doctor_id,
            "date": today,
            "status": {"$in": ["completed", "checkout_completed", "checkout-pending"]},
            "clinicId": clinic_id
        })
        
        # Get queue stats for this doctor
        doctor_queue = await queue_service.get_doctor_queue(doctor_id)
        in_queue = len([e for e in doctor_queue if e.get("status") in ["waiting", "in-consultation"]])
        
        # Get total unique patients seen by this doctor (from appointments)
        unique_patients = await get_appointments_collection(db).distinct(
            "patientId",
            {"doctorId": doctor_id, "clinicId": clinic_id}
        )
        total_patients = len(unique_patients)
        
        # Get this week's appointments
        week_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = week_start - timedelta(days=week_start.weekday())
        week_start_str = week_start.strftime("%Y-%m-%d")
        
        this_week = await get_appointments_collection(db).count_documents({
            "doctorId": doctor_id,
            "date": {"$gte": week_start_str},
            "clinicId": clinic_id
        })
        
        return success_response(
            data={
                "totalPatients": total_patients,
                "todayAppointments": today_appointments_count,
                "scheduledToday": scheduled_today,
                "completedToday": completed_today,
                "inQueue": in_queue,
                "thisWeek": this_week,
            },
            message="Doctor statistics retrieved successfully"
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to fetch doctor statistics: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/me/performance", response_model=dict)
async def get_doctor_performance_insights(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Return performance metrics for the currently authenticated doctor."""
    try:
        if current_user.get("role") != "doctor":
            return error_response(
                message="Access denied. Doctor role required.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        doctor_id = str(current_user["_id"])
        clinic_id = current_user.get("clinicId")
        base_query: Dict[str, Any] = {"doctorId": doctor_id}
        if clinic_id:
            base_query["clinicId"] = clinic_id

        appointments_collection = get_appointments_collection(db)

        total_appointments = await appointments_collection.count_documents(base_query)
        completed_query = base_query.copy()
        completed_query["status"] = {"$in": ["completed", "checkout_completed", "checkout-pending"]}
        total_completed = await appointments_collection.count_documents(completed_query)

        follow_up_count = await appointments_collection.count_documents(
            {**base_query, "followUpRequired": True}
        )
        no_show_count = await appointments_collection.count_documents(
            {**base_query, "status": "no-show"}
        )

        avg_duration_minutes = None
        duration_pipeline = [
            {
                "$match": {
                    **base_query,
                    "startedAt": {"$ne": None},
                    "completedAt": {"$ne": None},
                }
            },
            {
                "$project": {
                    "durationMinutes": {
                        "$divide": [
                            {"$subtract": ["$completedAt", "$startedAt"]},
                            1000 * 60,
                        ]
                    }
                }
            },
            {"$group": {"_id": None, "avgDuration": {"$avg": "$durationMinutes"}}},
        ]

        duration_cursor = appointments_collection.aggregate(duration_pipeline)
        duration_result = await duration_cursor.to_list(length=1)
        if duration_result:
            avg_duration_minutes = duration_result[0].get("avgDuration")

        follow_up_rate = None
        no_show_rate = None

        if total_appointments > 0:
            follow_up_rate = round((follow_up_count / total_appointments) * 100, 1)
            no_show_rate = round((no_show_count / total_appointments) * 100, 1)

        return success_response(
            data={
                "patientSatisfaction": None,
                "averageConsultationTime": round(avg_duration_minutes, 1)
                if avg_duration_minutes is not None
                else None,
                "followUpRate": follow_up_rate,
                "noShowRate": no_show_rate,
                "totalCompleted": total_completed,
                "totalAppointments": total_appointments,
                "lastUpdated": datetime.utcnow().isoformat(),
            },
            message="Performance insights retrieved successfully.",
        )

    except Exception as e:
        return error_response(
            message=f"Failed to fetch performance insights: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.get("/me/patients", response_model=dict)
@router.get("/appointment-overview", response_model=dict)
async def get_appointment_overview(
    period: str = Query("week", pattern="^(day|week|month|year)$"),
    doctorId: Optional[str] = Query(None, description="Doctor ID (defaults to current user)"),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get appointment overview statistics."""
    from app.services.appointment_overview_service import AppointmentOverviewService
    service = AppointmentOverviewService(db)
    
    # Use current user's doctor ID if not provided
    effective_doctor_id = doctorId or current_user.get("_id")
    if not effective_doctor_id:
        return error_response("Doctor ID is required", status_code=status.HTTP_400_BAD_REQUEST)
    
    overview = await service.get_appointment_overview(
        doctor_id=str(effective_doctor_id),
        period=period
    )
    
    return success_response(
        message="Appointment overview retrieved successfully",
        data=overview
    )


@router.get("/performance-insights", response_model=dict)
async def get_performance_insights(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get performance insights for the current doctor."""
    from app.services.appointment_overview_service import AppointmentOverviewService
    service = AppointmentOverviewService(db)
    
    doctor_id = current_user.get("_id")
    if not doctor_id:
        return error_response("Doctor ID is required", status_code=status.HTTP_400_BAD_REQUEST)
    
    insights = await service.get_performance_insights(doctor_id=str(doctor_id))
    
    return success_response(
        message="Performance insights retrieved successfully",
        data=insights
    )


async def get_current_doctor_patients(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get patients who have appointments with the current doctor."""
    try:
        # Verify user is a doctor
        if current_user.get("role") != "doctor":
            return error_response(
                message="Access denied. Doctor role required.",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        doctor_id = str(current_user["_id"])
        clinic_id = current_user.get("clinicId")
        
        # Get unique patient IDs from appointments
        appointment_query = {"doctorId": doctor_id}
        if clinic_id:
            appointment_query["clinicId"] = clinic_id
        
        unique_patient_ids = await get_appointments_collection(db).distinct(
            "patientId",
            appointment_query
        )
        
        if not unique_patient_ids:
            return paginated_response(
                message="No patients found",
                data=[],
                total=0,
                page=page,
                limit=limit
            )
        
        # Convert to ObjectIds for query
        patient_object_ids = [ObjectId(pid) for pid in unique_patient_ids if ObjectId.is_valid(pid)]
        
        if not patient_object_ids:
            return paginated_response(
                message="No valid patients found",
                data=[],
                total=0,
                page=page,
                limit=limit
            )
        
        # Get total count
        total = await get_patients_collection(db).count_documents({
            "_id": {"$in": patient_object_ids},
            "clinicId": clinic_id
        } if clinic_id else {"_id": {"$in": patient_object_ids}})
        
        # Get paginated results
        skip = (page - 1) * limit
        query = {"_id": {"$in": patient_object_ids}}
        if clinic_id:
            query["clinicId"] = clinic_id
        
        cursor = get_patients_collection(db).find(query).sort("createdAt", -1).skip(skip).limit(limit)
        patients = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string and format
        for patient in patients:
            patient["_id"] = str(patient["_id"])
            if "fullName" not in patient:
                patient["fullName"] = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
        
        return paginated_response(
            message="Doctor's patients retrieved successfully",
            data=patients,
            total=total,
            page=page,
            limit=limit
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to fetch doctor's patients: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/me/availability", response_model=dict)
async def get_current_doctor_availability(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get current doctor's availability schedule."""
    try:
        # Verify user is a doctor
        if current_user.get("role") != "doctor":
            return error_response(
                message="Access denied. Doctor role required.",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        doctor = await get_users_collection(db).find_one(
            {"_id": ObjectId(current_user["_id"]), "role": "doctor"},
            {"availability": 1}
        )
        
        if not doctor:
            return error_response(
                message="Doctor profile not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        availability = doctor.get("availability") or {}
        
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
async def update_current_doctor_availability(
    update_data: AvailabilityUpdate,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update current doctor's availability schedule."""
    try:
        # Verify user is a doctor
        if current_user.get("role") != "doctor":
            return error_response(
                message="Access denied. Doctor role required.",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        update_doc = {
            "availability": update_data.availability,
            "updatedAt": datetime.utcnow()
        }
        
        result = await get_users_collection(db).find_one_and_update(
            {"_id": ObjectId(current_user["_id"]), "role": "doctor"},
            {"$set": update_doc},
            return_document=True,
            projection={"availability": 1}
        )
        
        if not result:
            return error_response(
                message="Doctor profile not found",
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
async def update_current_doctor_notifications(
    update_data: NotificationPreferencesUpdate,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update current doctor's notification preferences."""
    try:
        # Verify user is a doctor
        if current_user.get("role") != "doctor":
            return error_response(
                message="Access denied. Doctor role required.",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        update_doc = {
            "notificationPreferences": update_data.notificationPreferences,
            "updatedAt": datetime.utcnow()
        }
        
        result = await get_users_collection(db).find_one_and_update(
            {"_id": ObjectId(current_user["_id"]), "role": "doctor"},
            {"$set": update_doc},
            return_document=True,
            projection={"notificationPreferences": 1}
        )
        
        if not result:
            return error_response(
                message="Doctor profile not found",
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


@router.get("/me", response_model=dict)
async def get_current_doctor(
    current_user: dict = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get current doctor's profile information."""
    try:
        # Verify user is a doctor
        if current_user.get("role") != "doctor":
            return error_response(
                message="Access denied. Doctor role required.",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        doctor = await get_users_collection(db).find_one(
            {"_id": ObjectId(current_user["_id"]), "role": "doctor"},
            {"password": 0}
        )
        
        if not doctor:
            return error_response(
                message="Doctor profile not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        formatted_doctor = await user_helper(doctor)
        
        return success_response(
            data={"doctor": formatted_doctor},
            message="Doctor profile retrieved successfully"
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to fetch doctor profile: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.put("/me/profile", response_model=dict)
async def update_current_doctor_profile(
    update_data: DoctorProfileUpdate,
    current_user: dict = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update current doctor's profile details."""
    try:
        # Verify user is a doctor
        if current_user.get("role") != "doctor":
            return error_response(
                message="Access denied. Doctor role required.",
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        update_doc = update_data.model_dump(exclude_unset=True)
        
        if not update_doc:
            return error_response(
                message="No profile fields provided for update",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate and clean fields
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
        
        if "phone" in update_doc and update_doc["phone"] is not None:
            update_doc["phone"] = update_doc["phone"].strip()
            if update_doc["phone"] == "":
                update_doc["phone"] = None
        
        if "profileImage" in update_doc and update_doc["profileImage"] == "":
            update_doc["profileImage"] = None
        
        update_doc["updatedAt"] = datetime.utcnow()
        
        result = await get_users_collection(db).find_one_and_update(
            {"_id": ObjectId(current_user["_id"]), "role": "doctor"},
            {"$set": update_doc},
            return_document=True,
            projection={"password": 0}
        )
        
        if not result:
            return error_response(
                message="Doctor profile not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        formatted_doctor = await user_helper(result)
        
        return success_response(
            message="Profile updated successfully",
            data={"doctor": formatted_doctor}
        )
    
    except Exception as e:
        return error_response(
            message=f"Failed to update profile: {str(e)}",
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

