"""
Appointment service for scheduling and managing appointments.
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict
import mimetypes
from fastapi import HTTPException, status, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.appointment import AppointmentCreate, AppointmentUpdate, appointment_helper
from app.services.websocket_service import WebSocketService
from app.services.s3_service import s3_service
from app.config import settings


class AppointmentService:
    """Service for handling appointment operations."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.appointments_collection = db.appointments
        self.patients_collection = db.patients
        self.users_collection = db.users
    
    async def generate_appointment_id(self) -> str:
        """Generate unique appointment ID."""
        timestamp = int(datetime.now().timestamp() * 1000)
        return f"APT{str(timestamp)[-8:]}"
    
    async def check_time_slot_conflict(
        self,
        doctor_id: str,
        date: str,
        time: str,
        duration: int,
        patient_id: Optional[str] = None,
        exclude_appointment_id: Optional[str] = None
    ) -> bool:
        """
        Check if time slot conflicts with existing appointments.

        Returns:
            True if conflict exists, False otherwise
        """
        blocking_statuses = {"checked-in", "in-progress", "ongoing"}

        # Parse time
        hour, minute = map(int, time.split(':'))
        start_minutes = hour * 60 + minute
        end_minutes = start_minutes + duration

        # Build query
        query = {
            "doctorId": doctor_id,
            "date": date,
            "status": {"$nin": ["cancelled", "no-show"]}
        }

        if exclude_appointment_id:
            query["appointmentId"] = {"$ne": exclude_appointment_id}

        # Get existing appointments
        cursor = self.appointments_collection.find(query)
        existing_appointments = await cursor.to_list(length=None)

        # Check for overlaps
        for apt in existing_appointments:
            apt_hour, apt_minute = map(int, apt["time"].split(':'))
            apt_start = apt_hour * 60 + apt_minute
            apt_end = apt_start + apt.get("duration", 30)

            # Skip if time slots do not overlap
            if end_minutes <= apt_start or start_minutes >= apt_end:
                continue

            apt_status = apt.get("status")
            apt_patient_id = apt.get("patientId")

            # If we know the patient being booked, only block when that patient already has a blocking status appointment
            if patient_id:
                if apt_patient_id == patient_id and apt_status in blocking_statuses:
                    return True
                continue

            # Fallback: if patient id is unknown, keep previous behaviour and block on active statuses
            if apt_status in blocking_statuses:
                return True

        return False
    
    async def populate_names(self, appointment: dict) -> dict:
        """Populate patient, doctor, and scheduler names."""
        # Get patient name
        if appointment.get("patientId"):
            patient = await self.patients_collection.find_one({"_id": ObjectId(appointment["patientId"])})
            if patient:
                appointment["patientName"] = f"{patient['firstName']} {patient['lastName']}"
        
        # Get doctor name
        if appointment.get("doctorId"):
            doctor = await self.users_collection.find_one({"_id": ObjectId(appointment["doctorId"])})
            if doctor:
                appointment["doctorName"] = f"{doctor['firstName']} {doctor['lastName']}"
        
        # Get scheduler name
        if appointment.get("scheduledBy"):
            scheduler = await self.users_collection.find_one({"_id": ObjectId(appointment["scheduledBy"])})
            if scheduler:
                appointment["scheduledByName"] = f"{scheduler['firstName']} {scheduler['lastName']}"
        
        return appointment
    
    async def create_appointment(
        self,
        appointment_data: AppointmentCreate,
        scheduled_by: str,
        clinic_id: Optional[str] = None,
        clinic_name: Optional[str] = None
    ) -> dict:
        """Create new appointment with conflict checking."""
        # Validate patient exists
        patient = await self.patients_collection.find_one({"_id": ObjectId(appointment_data.patientId)})
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Validate doctor exists and is a doctor
        doctor = await self.users_collection.find_one({"_id": ObjectId(appointment_data.doctorId)})
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )
        
        if doctor.get("role") != "doctor":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected user is not a doctor"
            )

        # Patients are universal - not restricted to clinics
        # Only appointments and doctors are clinic-specific
        doctor_clinic = doctor.get("clinicId")

        # Infer clinic scope from appointment context or doctor
        effective_clinic = clinic_id or doctor_clinic

        # Validate doctor clinic alignment (doctors are clinic-specific)
        if clinic_id:
            if doctor_clinic and doctor_clinic != clinic_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Selected doctor does not belong to your clinic"
                )

        # Normalize doctor clinic if missing but determinable
        if not doctor_clinic and effective_clinic:
            update_fields: Dict[str, object] = {"clinicId": effective_clinic}
            if clinic_name:
                update_fields["clinicName"] = clinic_name
            await self.users_collection.update_one(
                {"_id": doctor["_id"]},
                {"$set": update_fields}
            )
            doctor_clinic = effective_clinic
        
        # Check for time slot conflicts
        has_conflict = await self.check_time_slot_conflict(
            appointment_data.doctorId,
            appointment_data.date,
            appointment_data.time,
            appointment_data.duration,
            patient_id=appointment_data.patientId
        )
        
        if has_conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Time slot is already booked for this doctor"
            )
        
        # Generate appointment ID
        appointment_id = await self.generate_appointment_id()
        
        # Prepare appointment document
        appointment_dict = appointment_data.model_dump()
        appointment_dict["appointmentId"] = appointment_id
        appointment_dict["scheduledBy"] = scheduled_by
        appointment_dict["createdAt"] = datetime.utcnow()
        appointment_dict["updatedAt"] = datetime.utcnow()
        if effective_clinic:
            appointment_dict["clinicId"] = effective_clinic
        
        # Populate names
        appointment_dict = await self.populate_names(appointment_dict)
        
        # Insert into database
        result = await self.appointments_collection.insert_one(appointment_dict)
        
        # Retrieve created appointment
        created_appointment = await self.appointments_collection.find_one({"_id": result.inserted_id})
        
        return await appointment_helper(created_appointment)
    
    async def get_appointment(self, appointment_id: str) -> Optional[dict]:
        """Get appointment by ID."""
        if not ObjectId.is_valid(appointment_id):
            return None
        
        appointment = await self.appointments_collection.find_one({"_id": ObjectId(appointment_id)})
        
        if not appointment:
            return None
        
        return await appointment_helper(appointment)
    
    async def list_appointments(
        self,
        page: int = 1,
        limit: int = 10,
        patient_id: Optional[str] = None,
        doctor_id: Optional[str] = None,
        date: Optional[str] = None,
        status: Optional[str] = None,
        clinic_id: Optional[str] = None
    ) -> tuple[List[dict], int]:
        """List appointments with filtering and pagination."""
        # Build query
        query = {}
        
        if patient_id:
            query["patientId"] = patient_id
        
        if doctor_id:
            query["doctorId"] = doctor_id
        
        if date:
            query["date"] = date
        
        if status:
            query["status"] = status
        
        if clinic_id:
            query["clinicId"] = clinic_id
        
        # Calculate skip
        skip = (page - 1) * limit
        
        # Get total count
        total = await self.appointments_collection.count_documents(query)
        
        # Get appointments
        cursor = (
            self.appointments_collection.find(query)
            .sort("date", 1)
            .sort("time", 1)
            .skip(skip)
            .limit(limit)
        )
        appointments = await cursor.to_list(length=limit)
        
        # Format appointments
        formatted_appointments = []
        for appointment in appointments:
            appointment = await self.populate_names(appointment)
            formatted_appointments.append(await appointment_helper(appointment))
        
        return formatted_appointments, total
    
    async def update_appointment(
        self,
        appointment_id: str,
        update_data: AppointmentUpdate
    ) -> Optional[dict]:
        """Update appointment."""
        if not ObjectId.is_valid(appointment_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        # Check if appointment exists
        existing_appointment = await self.appointments_collection.find_one({"_id": ObjectId(appointment_id)})
        if not existing_appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        # Prepare update data
        update_dict = update_data.model_dump(exclude_unset=True)
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Check for time slot conflicts if date/time/duration changed
        if any(k in update_dict for k in ["date", "time", "duration"]):
            new_date = update_dict.get("date", existing_appointment["date"])
            new_time = update_dict.get("time", existing_appointment["time"])
            new_duration = update_dict.get("duration", existing_appointment.get("duration", 30))
            
            has_conflict = await self.check_time_slot_conflict(
                existing_appointment["doctorId"],
                new_date,
                new_time,
                new_duration,
                patient_id=existing_appointment.get("patientId"),
                exclude_appointment_id=existing_appointment["appointmentId"]
            )
            
            if has_conflict:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Time slot is already booked for this doctor"
                )
        
        # Add updated timestamp
        update_dict["updatedAt"] = datetime.utcnow()
        
        # Update appointment
        await self.appointments_collection.update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": update_dict}
        )
        
        # Retrieve updated appointment
        updated_appointment = await self.appointments_collection.find_one({"_id": ObjectId(appointment_id)})
        
        return await appointment_helper(updated_appointment)
    
    async def upload_prescription_file(
        self,
        appointment_id: str,
        file: UploadFile,
        uploaded_by: str,
        notes: Optional[str] = None
    ) -> dict:
        """Upload a prescription document to S3 and attach it to the appointment."""
        if not ObjectId.is_valid(appointment_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )

        appointment = await self.appointments_collection.find_one({"_id": ObjectId(appointment_id)})
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )

        patient_id = appointment.get("patientId")
        if not patient_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Appointment is not linked to a patient"
            )

        filename = (file.filename or "prescription").strip()
        if not filename:
            filename = "prescription"
        filename = filename.replace(" ", "_")

        file_extension = filename.split(".")[-1].lower() if "." in filename else ""
        allowed_extensions = {"pdf", "jpg", "jpeg", "png"}
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Allowed types: PDF, JPG, JPEG, PNG"
            )

        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty"
            )

        max_upload_size_mb = getattr(settings, "max_upload_size_mb", 10)
        max_size_bytes = max_upload_size_mb * 1024 * 1024
        if len(file_bytes) > max_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds {max_upload_size_mb}MB limit"
            )

        content_type = file.content_type or mimetypes.guess_type(filename)[0] or ""
        if not content_type:
            if file_extension == "pdf":
                content_type = "application/pdf"
            else:
                content_type = f"image/{'jpeg' if file_extension == 'jpg' else file_extension}"

        clinic_id = appointment.get("clinicId") or "general"
        appointment_identifier = appointment.get("appointmentId") or appointment_id
        folder = f"clinic/{clinic_id}/patient/{patient_id}/appointment/{appointment_identifier}/prescriptions"

        upload_result = await s3_service.upload_file(
            file_content=file_bytes,
            file_name=filename,
            content_type=content_type,
            folder=folder
        )

        uploader_name = None
        if uploaded_by and ObjectId.is_valid(uploaded_by):
            uploader = await self.users_collection.find_one({"_id": ObjectId(uploaded_by)})
            if uploader:
                first_name = uploader.get("firstName", "")
                last_name = uploader.get("lastName", "")
                uploader_name = f"{first_name} {last_name}".strip() or uploader.get("email")

        timestamp = datetime.utcnow()
        update_fields = {
            "prescriptionFileUrl": upload_result.get("file_url"),
            "prescriptionFileKey": upload_result.get("s3_key"),
            "prescriptionFileName": filename,
            "prescriptionFileType": content_type,
            "prescriptionUploadedAt": timestamp,
            "prescriptionUploadedBy": uploaded_by if uploaded_by else None,
            "prescriptionUploadedByName": uploader_name,
            "prescriptionNotes": notes.strip() if isinstance(notes, str) and notes.strip() else None,
            "updatedAt": timestamp,
        }

        await self.appointments_collection.update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": update_fields}
        )

        updated_appointment = await self.appointments_collection.find_one({"_id": ObjectId(appointment_id)})
        return await appointment_helper(updated_appointment)
    
    async def update_status(
        self,
        appointment_id: str,
        new_status: str,
        cancellation_reason: Optional[str] = None
    ) -> dict:
        """Update appointment status."""
        if not ObjectId.is_valid(appointment_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        update_data = {
            "status": new_status,
            "updatedAt": datetime.utcnow()
        }
        
        # Set timestamps based on status
        if new_status == "checked-in":
            update_data["checkedInAt"] = datetime.utcnow()
            update_data["presentInClinic"] = True
        elif new_status == "in-progress":
            update_data["startedAt"] = datetime.utcnow()
        elif new_status == "completed":
            update_data["completedAt"] = datetime.utcnow()
        elif new_status == "cancelled":
            update_data["cancelledAt"] = datetime.utcnow()
            if cancellation_reason:
                update_data["cancellationReason"] = cancellation_reason
        
        # Update appointment
        result = await self.appointments_collection.update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )

        # Retrieve updated appointment
        updated_appointment = await self.appointments_collection.find_one({"_id": ObjectId(appointment_id)})

        # Broadcast appointment status update via WebSocket
        try:
            websocket_service = WebSocketService()
            await websocket_service.broadcast_appointment_status_update(updated_appointment)
        except Exception as e:
            # Log but don't fail the operation
            print(f"Failed to broadcast appointment update: {e}")

        return await appointment_helper(updated_appointment)
    
    async def delete_appointment(self, appointment_id: str) -> bool:
        """Delete (cancel) appointment."""
        return await self.update_status(appointment_id, "cancelled", "Deleted by user")
    
    async def get_doctor_schedule(
        self,
        doctor_id: str,
        date: str
    ) -> List[dict]:
        """Get doctor's schedule for a specific date."""
        query = {
            "doctorId": doctor_id,
            "date": date,
            "status": {"$nin": ["cancelled", "no-show"]}
        }
        
        cursor = self.appointments_collection.find(query).sort("time", 1)
        appointments = await cursor.to_list(length=None)
        
        formatted_appointments = []
        for appointment in appointments:
            formatted_appointments.append(await appointment_helper(appointment))
        
        return formatted_appointments

