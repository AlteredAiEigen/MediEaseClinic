"""
Admin management API endpoints.
"""

from datetime import datetime, timedelta
from collections import defaultdict
from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, Query, status
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError
from pydantic import BaseModel, Field, EmailStr

from app.database import get_db
from app.schemas.auth import UserCreate
from app.services.auth_service import auth_service
from app.services.queue_service import QueueService
from app.middleware.auth import require_roles
from app.utils.response import success_response, error_response, paginated_response
from app.models.billing import (
    BillingItemCreate,
    BillingItemUpdate,
    billing_item_helper,
)
from app.schemas.billing import (
    BillingItemCreateRequest,
    BillingItemUpdateRequest,
)
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

def get_messages_collection(db: AsyncIOMotorDatabase):
    """Get messages collection."""
    return db.messages

def get_billing_collection(db: AsyncIOMotorDatabase):
    """Get billing/pricing collection."""
    return db.billing_items


def normalize_appointment_type(raw_type: str) -> str:
    """
    Normalize appointment type to match billing item keys (lowercase).
    Handles various formats like "General Consultation", "Consultation", "consultation", etc.
    Returns the normalized lowercase key that should match a billing item key.
    """
    if not raw_type:
        return "consultation"
    
    normalized = raw_type.strip().lower()
    
    # Map various appointment type formats to standard lowercase keys
    # These should match the keys used in billing_items (stored as lowercase)
    if normalized in ["consultation", "consultations", "general consultation", "general appointment", "appointment"]:
        return "consultation"
    elif normalized in ["follow-up", "followup", "follow_up", "follow ups", "followups"]:
        return "followup"  # lowercase to match billing key storage
    elif normalized in ["emergency", "urgent"]:
        return "emergency"
    elif normalized in ["checkup", "check-up", "health check", "health checkup", "checkups"]:
        return "checkup"
    else:
        # For any unknown type, try to use the normalized string directly
        # This allows custom appointment types to work if they match billing item keys
        return normalized


@router.get("/billing-items", response_model=dict)
async def list_billing_items(
    category: Optional[str] = Query(None),
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """List all billing/pricing items (optionally filtered by category)."""
    try:
        query: Dict[str, object] = {}
        if category:
            query["category"] = category

        cursor = get_billing_collection(db).find(query).sort("label", 1)
        items = await cursor.to_list(length=None)
        formatted = [await billing_item_helper(item) for item in items]

        return success_response(
            data={"items": formatted},
            message="Billing items retrieved successfully",
        )
    except Exception as e:
        return error_response(
            message=f"Failed to fetch billing items: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.post("/billing-items", response_model=dict)
async def create_billing_item(
    payload: BillingItemCreateRequest,
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create a new billing/pricing item."""
    try:
        model = BillingItemCreate(**payload.model_dump())
        item_dict = model.model_dump()
        item_dict["createdAt"] = datetime.utcnow()
        item_dict["updatedAt"] = datetime.utcnow()

        result = await get_billing_collection(db).insert_one(item_dict)
        created = await get_billing_collection(db).find_one({"_id": result.inserted_id})
        formatted = await billing_item_helper(created)

        return success_response(
            data={"item": formatted},
            message="Billing item created successfully",
            status_code=status.HTTP_201_CREATED,
        )
    except DuplicateKeyError:
        return error_response(
            message="A pricing entry with this category and key already exists. Please use a different key or edit the existing item.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return error_response(
            message=f"Failed to create billing item: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.put("/billing-items/{item_id}", response_model=dict)
async def update_billing_item(
    item_id: str,
    payload: BillingItemUpdateRequest,
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Update an existing billing item."""
    try:
        update_doc = BillingItemUpdate(**payload.model_dump(exclude_unset=True)).model_dump(
            exclude_unset=True
        )
        if not update_doc:
            return error_response(
                message="No fields provided for update",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        update_doc["updatedAt"] = datetime.utcnow()

        result = await get_billing_collection(db).update_one(
            {"_id": ObjectId(item_id)},
            {"$set": update_doc},
        )
        if result.matched_count == 0:
            return error_response(
                message="Billing item not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        updated = await get_billing_collection(db).find_one({"_id": ObjectId(item_id)})
        formatted = await billing_item_helper(updated)

        return success_response(
            data={"item": formatted},
            message="Billing item updated successfully",
        )
    except DuplicateKeyError:
        return error_response(
            message="Another pricing entry already uses this category and key. Please choose a unique key.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return error_response(
            message=f"Failed to update billing item: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.delete("/billing-items/{item_id}", response_model=dict)
async def delete_billing_item(
    item_id: str,
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Delete a billing item."""
    try:
        result = await get_billing_collection(db).delete_one({"_id": ObjectId(item_id)})
        if result.deleted_count == 0:
            return error_response(
                message="Billing item not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return success_response(
            data=None,
            message="Billing item deleted successfully",
        )
    except Exception as e:
        return error_response(
            message=f"Failed to delete billing item: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


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

        # Today's date (UTC, start of day)
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        # This month's date range
        first_day_of_month = today.replace(day=1)
        # Start of this week (Monday) and end of week (Sunday)
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        # Tomorrow (for follow-up window)
        tomorrow = today + timedelta(days=1)
        
        # Get counts
        # Patients are universal - not filtered by clinic
        appointment_query: Dict[str, object] = {}
        if clinic_id:
            appointment_query["clinicId"] = clinic_id

        # Patients are universal across all clinics
        total_patients = await get_patients_collection(db).count_documents({})
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

        # Patients this month (universal - not filtered by clinic)
        patients_this_month_query = {"createdAt": {"$gte": first_day_of_month}}
        patients_this_month = await get_patients_collection(db).count_documents(
            patients_this_month_query
        )

        # New patients this week (from week_start)
        new_patients_this_week_query = {"createdAt": {"$gte": week_start}}
        new_patients_this_week = await get_patients_collection(db).count_documents(
            new_patients_this_week_query
        )

        # Patient messages/queries this week (messages created since week_start)
        patient_messages_this_week = await get_messages_collection(db).count_documents(
            {"createdAt": {"$gte": week_start}}
        )

        # Pending follow-ups for today and tomorrow
        follow_up_query: Dict[str, object] = {
            "followUpRequired": True,
            "followUpDate": {
                "$gte": today.strftime("%Y-%m-%d"),
                "$lte": tomorrow.strftime("%Y-%m-%d"),
            },
        }
        if clinic_id:
            follow_up_query["clinicId"] = clinic_id
        pending_follow_ups = await get_appointments_collection(db).count_documents(
            follow_up_query
        )

        # Recent activity (last 10 appointments and patients)
        recent_appointments = await (
            get_appointments_collection(db)
            .find(appointment_query)
            .sort("createdAt", -1)
            .limit(5)
            .to_list(length=5)
        )
        # Recent patients (universal - not filtered by clinic)
        recent_patients = await (
            get_patients_collection(db)
            .find({})
            .sort("createdAt", -1)
            .limit(5)
            .to_list(length=5)
        )
        
        recent_activity = []
        
        # Fetch patient names for appointments
        patient_ids = []
        for apt in recent_appointments:
            patient_id = apt.get("patientId")
            if patient_id:
                try:
                    # Convert to ObjectId if it's a string
                    if isinstance(patient_id, str):
                        patient_ids.append(ObjectId(patient_id))
                    else:
                        patient_ids.append(patient_id)
                except Exception:
                    pass
        
        patients_dict = {}
        if patient_ids:
            patients_cursor = get_patients_collection(db).find({"_id": {"$in": patient_ids}})
            patients_list = await patients_cursor.to_list(length=None)
            for p in patients_list:
                patients_dict[str(p["_id"])] = p
        
        for apt in recent_appointments:
            patient_id = apt.get("patientId")
            patient_name = "Unknown Patient"
            if patient_id:
                patient = patients_dict.get(str(patient_id))
                if patient:
                    first_name = patient.get("firstName", "")
                    last_name = patient.get("lastName", "")
                    patient_name = f"{first_name} {last_name}".strip() or "Unknown Patient"
            
            recent_activity.append({
                "type": "appointment",
                "description": "Appointment",
                "patientName": patient_name,
                "date": apt.get("createdAt", datetime.utcnow()).isoformat(),
            })
        
        for patient in recent_patients:
            first_name = patient.get("firstName", "")
            last_name = patient.get("lastName", "")
            patient_name = f"{first_name} {last_name}".strip() or "Unknown Patient"
            
            recent_activity.append({
                "type": "patient",
                "description": "New patient register",
                "patientName": patient_name,
                "date": patient.get("createdAt", datetime.utcnow()).isoformat(),
            })
        
        # Sort by date
        recent_activity.sort(key=lambda x: x["date"], reverse=True)
        recent_activity = recent_activity[:10]

        # Appointment type stats for this week
        week_appointments_query: Dict[str, object] = {
            "date": {
                "$gte": week_start.strftime("%Y-%m-%d"),
                "$lte": week_end.strftime("%Y-%m-%d"),
            }
        }
        if clinic_id:
            week_appointments_query["clinicId"] = clinic_id

        week_appointments = await (
            get_appointments_collection(db)
            .find(week_appointments_query, {"type": 1})
            .to_list(length=None)
        )

        type_stats = {
            "consultation": 0,
            "followUp": 0,
            "emergency": 0,
            "checkup": 0,
        }
        for apt in week_appointments:
            raw_type = (apt.get("type") or "").strip().lower()
            if raw_type in ["consultation", "consultations"]:
                type_stats["consultation"] += 1
            elif raw_type in ["follow-up", "followup", "follow_up"]:
                type_stats["followUp"] += 1
            elif raw_type in ["emergency", "urgent"]:
                type_stats["emergency"] += 1
            elif raw_type in ["checkup", "check-up", "health check"]:
                type_stats["checkup"] += 1
            else:
                # Default unknown types into consultation to avoid losing counts
                type_stats["consultation"] += 1
        
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
                "newPatientsThisWeek": new_patients_this_week,
                "patientMessagesThisWeek": patient_messages_this_week,
                "pendingFollowUps": pending_follow_ups,
                "appointmentTypeStats": type_stats,
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
        # Patients are universal - not filtered by clinic
        appointment_query: Dict[str, object] = {}
        if clinic_id:
            appointment_query["clinicId"] = clinic_id

        total_patients = await get_patients_collection(db).count_documents({})
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
    """Get all patients. Patients are universal across all clinics."""
    try:
        # Patients are universal - not filtered by clinic
        query = {}

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
    period: str = Query("month", pattern="^(day|week|month|year)$"),
    current_user: dict = Depends(require_roles(["admin"])),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Return revenue metrics for appointments and lab tests.

    Aggregates revenue per day over a given period (day, week, month, year),
    and breaks it down into appointments vs lab tests.
    """
    # Load billing configuration for appointment types
    billing_cursor = get_billing_collection(db).find(
        {"category": "appointmentType", "isActive": True}
    )
    billing_items = await billing_cursor.to_list(length=None)
    pricing: Dict[str, float] = {}
    # Store pricing by normalized key (lowercase) for matching
    for item in billing_items:
        key = (item.get("key") or "").strip().lower()
        if key:
            pricing[key] = float(item.get("price", 0))
    
    # Also check if pricing dictionary is empty, set default
    if not pricing:
        default_price = 120.0
    else:
        # Use the first available price as default, or consultation if available
        default_price = pricing.get("consultation") or next(iter(pricing.values()), 120.0)

    # Determine date range based on period
    now = datetime.utcnow()
    if period == "day":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "week":
        # Week starts Monday, ends at Sunday (show all 7 days)
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        # For week view, include all 7 days but only calculate revenue up to current time
        end = start + timedelta(days=6, hours=23, minutes=59, seconds=59)
    elif period == "month":
        # Month starts first day, ends at current date/time (not end of month)
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now  # End at current time, not end of month
    elif period == "year":
        # Year starts Jan 1, ends at current date/time (not end of year)
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now  # End at current time, not end of year
    else:
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now

    # For day view, group by hour; otherwise group by date
    if period == "day":
        # Revenue grouped by hour (0-23)
        revenue_by_hour: Dict[int, Dict[str, float]] = defaultdict(
            lambda: {"appointments": 0.0, "tests": 0.0, "count": 0}
        )
    else:
        # Revenue grouped by date string YYYY-MM-DD
        revenue_by_date: Dict[str, Dict[str, float]] = defaultdict(
            lambda: {"appointments": 0.0, "tests": 0.0}
        )

    # Appointments revenue (any appointment where patient has moved beyond 'scheduled')
    appointments_cursor = get_appointments_collection(db).find(
        {
            "date": {
                "$gte": start.strftime("%Y-%m-%d"),
                "$lte": end.strftime("%Y-%m-%d"),
            }
        }
    )
    appointments = await appointments_cursor.to_list(length=None)

    for appointment in appointments:
        status = (appointment.get("status") or "").lower()
        # Count revenue for visits where patient actually engaged with clinic flow.
        # Include: checked-in, ongoing, checkout, completed.
        # Exclude: scheduled, cancelled, no-show (no revenue).
        if status not in {"checked-in", "ongoing", "checkout", "completed"}:
            continue
        date_str = appointment.get("date")
        if not date_str:
            continue
        
        # Get appointment type and look up price from billing items
        raw_type = appointment.get("type") or ""
        raw_type_lower = raw_type.strip().lower() if raw_type else ""
        
        # Try direct match first (in case appointment type exactly matches billing key)
        price = pricing.get(raw_type_lower, None)
        
        # If no direct match, try normalized matching
        if price is None:
            normalized_type = normalize_appointment_type(raw_type)
            price = pricing.get(normalized_type, default_price)
        
        # Only add revenue if price is valid (greater than 0)
        if price > 0:
            if period == "day":
                # Extract hour from appointment time
                time_str = appointment.get("time", "")
                hour = 0  # Default to midnight if time not available
                if time_str:
                    try:
                        # Parse time string (format: "HH:MM" or "HH:MM AM/PM")
                        time_clean = time_str.strip().upper()
                        if "AM" in time_clean or "PM" in time_clean:
                            # 12-hour format
                            from datetime import datetime as dt
                            time_obj = dt.strptime(time_clean, "%I:%M %p").time()
                            hour = time_obj.hour
                        else:
                            # 24-hour format
                            parts = time_clean.split(":")
                            if len(parts) >= 1:
                                hour = int(parts[0])
                    except (ValueError, IndexError):
                        hour = 0
                
                revenue_by_hour[hour]["appointments"] += float(price)
                revenue_by_hour[hour]["count"] += 1
            else:
                revenue_by_date[date_str]["appointments"] += float(price)

    # Lab test pricing
    test_pricing_cursor = get_billing_collection(db).find(
        {"category": "test", "isActive": True}
    )
    test_billing = await test_pricing_cursor.to_list(length=None)
    test_pricing: Dict[str, float] = {}
    for item in test_billing:
        key = (item.get("key") or "").strip().lower()
        if key:
            test_pricing[key] = float(item.get("price", 0))

    # Lab reports revenue (createdAt within range)
    lab_cursor = db.lab_reports.find(
        {
            "isActive": True,
            "createdAt": {"$gte": start, "$lte": end},
        }
    )
    lab_reports = await lab_cursor.to_list(length=None)

    for report in lab_reports:
        created_at: datetime = report.get("createdAt") or now
        date_str = created_at.strftime("%Y-%m-%d")
        raw_key = (report.get("reportType") or "").strip().lower()
        if not raw_key:
            continue
        price = test_pricing.get(raw_key, 0.0)
        if price <= 0:
            continue
        
        if period == "day":
            # For day view, lab tests are also grouped by hour of creation
            created_at: datetime = report.get("createdAt") or now
            hour = created_at.hour
            revenue_by_hour[hour]["tests"] += float(price)
        else:
            revenue_by_date[date_str]["tests"] += float(price)

    # Build chart data based on period
    if period == "day":
        # For day view, create hourly data (0-23)
        sorted_hours = sorted(revenue_by_hour.keys())
        # Ensure all hours 0-23 are present
        all_hours = list(range(24))
        hours_data = []
        appointments_revenue = []
        tests_revenue = []
        appointments_counts = []
        
        for hour in all_hours:
            hours_data.append(f"{hour:02d}:00")
            appointments_revenue.append(revenue_by_hour[hour]["appointments"])
            tests_revenue.append(revenue_by_hour[hour]["tests"])
            appointments_counts.append(int(revenue_by_hour[hour]["count"]))
        
        chart_data = {
            "dates": hours_data,  # Actually hours in "HH:00" format
            "appointments": appointments_revenue,
            "tests": tests_revenue,
            "total": [
                appointments_revenue[i] + tests_revenue[i]
                for i in range(len(hours_data))
            ],
            "appointmentCounts": appointments_counts,  # New field for counts
        }
    else:
        # Ensure all dates in range are present, even with zero revenue
        # For week view, always show all 7 days (Mon-Sun)
        # For month/year views, show all dates in the period
        current = start.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = end.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        if period == "week":
            # For week, show exactly 7 days starting from Monday
            for day_offset in range(7):
                date_to_add = start + timedelta(days=day_offset)
                date_str = date_to_add.strftime("%Y-%m-%d")
                if date_str not in revenue_by_date:
                    revenue_by_date[date_str] = {"appointments": 0.0, "tests": 0.0}
        elif period == "year":
            # For year view, always show all 12 months (Jan-Dec) for the current year
            current_year = now.year
            for month in range(1, 13):  # 1 to 12 for all months
                # Get first day of each month
                month_start = datetime(current_year, month, 1)
                # For months we've passed or are in, use actual data
                # For future months, add at least one date to ensure month appears
                if month <= now.month:
                    # Include all days up to current date for current month, or full month for past months
                    days_in_month = (datetime(current_year, month + 1, 1) - timedelta(days=1)).day if month < 12 else 31
                    last_day = now.day if month == now.month else days_in_month
                    for day in range(1, last_day + 1):
                        date_str = datetime(current_year, month, day).strftime("%Y-%m-%d")
                        if date_str not in revenue_by_date:
                            revenue_by_date[date_str] = {"appointments": 0.0, "tests": 0.0}
                else:
                    # For future months, add first day to ensure month appears in aggregation
                    date_str = month_start.strftime("%Y-%m-%d")
                    if date_str not in revenue_by_date:
                        revenue_by_date[date_str] = {"appointments": 0.0, "tests": 0.0}
        else:
            # For month view, include all dates in the month up to current date
            while current.date() <= end_date.date():
                date_str = current.strftime("%Y-%m-%d")
                if date_str not in revenue_by_date:
                    revenue_by_date[date_str] = {"appointments": 0.0, "tests": 0.0}
                current += timedelta(days=1)

        # Build chart data
        sorted_dates = sorted(revenue_by_date.keys())
        chart_data = {
            "dates": sorted_dates,
            "appointments": [revenue_by_date[d]["appointments"] for d in sorted_dates],
            "tests": [revenue_by_date[d]["tests"] for d in sorted_dates],
            "total": [
                revenue_by_date[d]["appointments"] + revenue_by_date[d]["tests"]
                for d in sorted_dates
            ],
        }

    # Calculate totals based on the period
    # For day/week/month/year, sum only the data in the chart (which represents the selected period)
    if period == "day":
        # For day view, total is sum of all 24 hours (chart shows 8-20, but total includes all)
        total_appointments_revenue = sum(chart_data["appointments"])
        total_tests_revenue = sum(chart_data["tests"])
    elif period == "week":
        # For week view, chart shows all 7 days but only count revenue up to current date/time
        # Filter chart data to only include dates up to today
        today_str = now.strftime("%Y-%m-%d")
        total_appointments_revenue = sum(
            chart_data["appointments"][i] 
            for i, date_str in enumerate(chart_data["dates"]) 
            if date_str <= today_str
        )
        total_tests_revenue = sum(
            chart_data["tests"][i] 
            for i, date_str in enumerate(chart_data["dates"]) 
            if date_str <= today_str
        )
    else:
        # For month/year, sum all dates in the selected period up to current date
        today_str = now.strftime("%Y-%m-%d")
        total_appointments_revenue = sum(
            chart_data["appointments"][i] 
            for i, date_str in enumerate(chart_data["dates"]) 
            if date_str <= today_str
        )
        total_tests_revenue = sum(
            chart_data["tests"][i] 
            for i, date_str in enumerate(chart_data["dates"]) 
            if date_str <= today_str
        )
    
    total_revenue = total_appointments_revenue + total_tests_revenue

    return success_response(
        data={
            "period": period,
            "startDate": start.isoformat(),
            "endDate": end.isoformat(),
            "totalAppointmentsRevenue": total_appointments_revenue,
            "totalLabTestsRevenue": total_tests_revenue,
            "totalRevenue": total_revenue,
            "chartData": chart_data,
        },
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

