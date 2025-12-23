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
        def normalize_time(value: str) -> str:
            """
            Normalize time values to 'HH:MM' 24h.
            Accepts 'HH:MM' (24h) or 'H:MM AM/PM' / 'HH:MM AM/PM'.
            """
            raw = (value or "").strip()
            if not raw:
                return raw
            # If already 24h "HH:MM"
            if raw.count(":") == 1 and "am" not in raw.lower() and "pm" not in raw.lower():
                hh, mm = raw.split(":")
                return f"{int(hh):02d}:{int(mm):02d}"
            # Try "HH:MM AM/PM"
            parts = raw.split()
            if len(parts) >= 2 and parts[0].count(":") == 1:
                time_part = parts[0]
                period = parts[1].lower()
                hh, mm = time_part.split(":")
                hours = int(hh)
                minutes = int(mm)
                if period == "pm" and hours != 12:
                    hours += 12
                if period == "am" and hours == 12:
                    hours = 0
                return f"{hours:02d}:{minutes:02d}"
            return raw

        normalized_time = normalize_time(time)

        # Build query
        query = {
            "doctorId": doctor_id,
            "date": date,
            "time": normalized_time,
            "status": {"$nin": ["cancelled", "no-show"]},
        }

        if exclude_appointment_id:
            query["appointmentId"] = {"$ne": exclude_appointment_id}

        # Exact-time only: block if any existing appointment matches the same start time.
        existing = await self.appointments_collection.find_one(query)
        return existing is not None
    
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
        
        # Validate doctor only when a doctorId is provided. Lab-test appointments
        # are allowed to be created without a doctor.
        effective_clinic: Optional[str] = clinic_id
        doctor_clinic: Optional[str] = None

        if appointment_data.doctorId:
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

            # Check for time slot conflicts only for doctor-based appointments
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
            # Handle both MongoDB ObjectId and human-readable patientId formats
            resolved_patient_id = patient_id
            
            # If it's not a valid ObjectId, it might be a human-readable patientId like "PRA123"
            # Look up the patient's MongoDB _id
            if not ObjectId.is_valid(patient_id):
                patient = await self.db.patients.find_one({"patientId": patient_id})
                if patient:
                    resolved_patient_id = str(patient["_id"])
            
            query["patientId"] = resolved_patient_id
        
        if doctor_id:
            # Handle both string and ObjectId formats - ensure string comparison
            query["doctorId"] = str(doctor_id)
        
        if date:
            # Ensure date is in YYYY-MM-DD format and normalize
            # Dates are stored as strings in YYYY-MM-DD format
            query["date"] = date.strip() if isinstance(date, str) else date
        
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
        
        # Prepare update data - use exclude_none=False to allow setting fields to null
        update_dict = update_data.model_dump(exclude_unset=True)
        
        # Handle doctorId explicitly - allow setting to None when switching to lab test
        if hasattr(update_data, 'doctorId') and update_data.doctorId is None and update_data.bookingKind == "lab-test":
            update_dict["doctorId"] = None
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Handle status changes
        if "status" in update_dict:
            new_status = update_dict["status"]
            now = datetime.utcnow()
            
            # Handle no-show tracking
            if new_status == "cancelled" and update_dict.get("isNoShow"):
                update_dict["isNoShow"] = True
                update_dict["cancelledAt"] = now
            elif new_status == "no-show":
                update_dict["isNoShow"] = True
                update_dict["status"] = "cancelled"
                update_dict["cancelledAt"] = now
                if not update_dict.get("cancellationReason"):
                    update_dict["cancellationReason"] = "No-show"
            elif new_status == "completed":
                # Calculate consultation time when appointment is completed
                if existing_appointment.get("startedAt") and not existing_appointment.get("completedAt"):
                    started_at = existing_appointment["startedAt"]
                    if isinstance(started_at, str):
                        started_at = datetime.fromisoformat(started_at.replace('Z', '+00:00'))
                    consultation_time = (now - started_at).total_seconds() / 60.0  # Convert to minutes
                    update_dict["consultationTimeMinutes"] = round(consultation_time, 1)
                    update_dict["completedAt"] = now
            elif new_status == "checkout-pending":
                # Set completedAt when consultation ends and moves to checkout-pending
                if existing_appointment.get("startedAt") and not existing_appointment.get("completedAt"):
                    started_at = existing_appointment["startedAt"]
                    if isinstance(started_at, str):
                        started_at = datetime.fromisoformat(started_at.replace('Z', '+00:00'))
                    consultation_time = (now - started_at).total_seconds() / 60.0  # Convert to minutes
                    update_dict["consultationTimeMinutes"] = round(consultation_time, 1)
                update_dict["completedAt"] = now
            elif new_status == "ongoing" and not existing_appointment.get("startedAt"):
                update_dict["startedAt"] = now
            elif new_status == "in-progress" and not existing_appointment.get("startedAt"):
                update_dict["startedAt"] = now
        
        # Track if date/time is being changed for notification
        is_rescheduled = any(k in update_dict for k in ["date", "time"])
        old_date = existing_appointment.get("date")
        old_time = existing_appointment.get("time")
        
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
        
        # Sync queue status if appointment status changed to completed or checkout-pending
        if "status" in update_dict:
            appointment_status = update_dict["status"]
            if appointment_status in ["completed", "checkout-pending"]:
                try:
                    import logging
                    logger = logging.getLogger(__name__)
                    from app.services.queue_service import QueueService
                    queue_service = QueueService(self.db)
                    queue_entry = await queue_service.get_queue_entry_by_appointment(appointment_id)
                    if queue_entry:
                        queue_entry_id = str(queue_entry.get("_id"))
                        logger.info(f"Syncing queue status for appointment {appointment_id}: queue_entry_id={queue_entry_id}, status={appointment_status}")
                        from app.schemas.queue import QueueStatusUpdate
                        await queue_service.update_queue_status(
                            queue_entry_id,
                            QueueStatusUpdate(status=appointment_status)
                        )
                        logger.info(f"Successfully synced queue status to {appointment_status}")
                    else:
                        logger.warning(f"No queue entry found for appointment {appointment_id}")
                except Exception as e:
                    # Log but don't fail if queue update fails
                    import logging
                    logging.error(f"Failed to sync queue status in update_appointment for appointment {appointment_id}: {e}", exc_info=True)
        
        # Retrieve updated appointment
        updated_appointment = await self.appointments_collection.find_one({"_id": ObjectId(appointment_id)})
        
        # Send notification to doctor if appointment was rescheduled
        if is_rescheduled and existing_appointment.get("doctorId"):
            try:
                from app.services.notification_service import NotificationService
                notification_service = NotificationService(self.db)
                
                # Get patient name
                patient_name = "Patient"
                patient_id = existing_appointment.get("patientId")
                if patient_id:
                    if ObjectId.is_valid(patient_id):
                        patient = await self.patients_collection.find_one({"_id": ObjectId(patient_id)})
                    else:
                        patient = await self.patients_collection.find_one({"patientId": patient_id})
                    if patient:
                        patient_name = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip() or "Patient"
                
                new_date = update_dict.get("date", old_date)
                new_time = update_dict.get("time", old_time)
                
                await notification_service.notify_doctor_appointment_rescheduled(
                    doctor_id=str(existing_appointment["doctorId"]),
                    appointment_id=appointment_id,
                    patient_name=patient_name,
                    old_date=old_date,
                    old_time=old_time,
                    new_date=new_date,
                    new_time=new_time,
                    rescheduled_by="Staff",
                    clinic_id=str(existing_appointment.get("clinicId")) if existing_appointment.get("clinicId") else None
                )
            except Exception as e:
                # Don't fail the update if notification fails
                import logging
                logging.getLogger(__name__).error(f"Failed to send reschedule notification: {e}")
        
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

        # Check existing prescription files count (max 1 per appointment)
        s3_prescriptions_collection = self.db.s3_prescriptions
        existing_count = await s3_prescriptions_collection.count_documents({
            "appointmentId": appointment_id
        })
        if existing_count >= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only 1 prescription file allowed per appointment. Please remove the existing file before uploading another."
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
            "updatedAt": timestamp,
        }

        await self.appointments_collection.update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": update_fields}
        )

        # Convert patient_id to ObjectId for patientMongoId
        patient_mongo_id = None
        if ObjectId.is_valid(patient_id):
            patient_mongo_id = ObjectId(patient_id)
        else:
            # If patient_id is not a valid ObjectId, try to find patient by patientId
            patient = await self.patients_collection.find_one({"patientId": patient_id})
            if patient:
                patient_mongo_id = patient["_id"]

        # Create entry in s3_prescriptions collection (matching s3_reports structure)
        s3_prescription_entry = {
            "patientId": patient_id,
            "patientMongoId": patient_mongo_id,
            "appointmentId": appointment_id,
            "documentName": filename,  # Changed from fileName to documentName
            "s3Key": upload_result.get("s3_key"),
            "s3Url": upload_result.get("file_url"),
            "fileType": content_type,
            "fileSize": len(file_bytes),
            "uploadedBy": uploaded_by if uploaded_by else None,
            "uploadedByName": uploader_name,
            "uploadedAt": timestamp,
            "notes": notes,
            "emailSentToPatient": False,
            "emailSentAt": None,
            "lastAccessedAt": None,
            "metadata": {},
            "clinicId": clinic_id,
            "createdAt": timestamp,
            "updatedAt": timestamp,
        }
        
        s3_prescriptions_collection = self.db.s3_prescriptions
        await s3_prescriptions_collection.insert_one(s3_prescription_entry)

        # Update appointment status to "completed" since prescription is now uploaded
        await self.appointments_collection.update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": {"status": "completed", "completedAt": timestamp, "updatedAt": timestamp}}
        )

        # Also update queue status to "completed" if queue entry exists
        try:
            from app.services.queue_service import QueueService
            queue_service = QueueService(self.db)
            queue_entry = await queue_service.get_queue_entry_by_appointment(appointment_id)
            if queue_entry:
                from app.schemas.queue import QueueStatusUpdate
                await queue_service.update_queue_status(
                    str(queue_entry.get("_id")),
                    QueueStatusUpdate(status="completed")
                )
        except Exception as e:
            # Log but don't fail if queue update fails
            import logging
            logging.warning(f"Failed to update queue status after prescription upload: {e}", exc_info=True)

        updated_appointment = await self.appointments_collection.find_one({"_id": ObjectId(appointment_id)})
        return await appointment_helper(updated_appointment)
    
    async def delete_prescription_file(
        self,
        appointment_id: str
    ) -> dict:
        """Delete prescription file from S3 and s3_prescriptions collection."""
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

        # Get prescription file info from appointment
        s3_key = appointment.get("prescriptionFileKey")
        
        # Delete from s3_prescriptions collection
        s3_prescriptions_collection = self.db.s3_prescriptions
        await s3_prescriptions_collection.delete_many({"appointmentId": appointment_id})
        
        # Delete from S3 if key exists
        if s3_key:
            try:
                await s3_service.delete_file(s3_key)
            except Exception as e:
                # Log but don't fail if S3 delete fails
                print(f"Failed to delete prescription file from S3: {e}")

        # Clear prescription file fields from appointment
        # Also revert status to "checkout-pending" since prescription is now removed
        timestamp = datetime.utcnow()
        
        # Use $set for status and $unset for prescription fields
        unset_fields = {
            "prescriptionFileUrl": "",
            "prescriptionFileKey": "",
            "prescriptionFileName": "",
            "prescriptionFileType": "",
            "prescriptionUploadedAt": "",
            "prescriptionUploadedBy": "",
            "prescriptionUploadedByName": ""
        }
        
        await self.appointments_collection.update_one(
            {"_id": ObjectId(appointment_id)},
            {
                "$set": {"status": "checkout-pending", "updatedAt": timestamp},
                "$unset": unset_fields
            }
        )
        
        # Also update queue status to "checkout-pending" if queue entry exists
        try:
            from app.services.queue_service import QueueService
            queue_service = QueueService(self.db)
            queue_entry = await queue_service.get_queue_entry_by_appointment(appointment_id)
            if queue_entry:
                from app.schemas.queue import QueueStatusUpdate
                await queue_service.update_queue_status(
                    str(queue_entry.get("_id")),
                    QueueStatusUpdate(status="checkout-pending")
                )
        except Exception as e:
            # Log but don't fail if queue update fails
            import logging
            logging.warning(f"Failed to update queue status after prescription deletion: {e}", exc_info=True)

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
        
        # Normalize status: when a doctor marks "completed", we set it to "checkout-pending"
        normalized_status = new_status
        if new_status == "completed":
            normalized_status = "checkout-pending"

        update_data = {
            "status": normalized_status,
            "updatedAt": datetime.utcnow()
        }
        
        # Set timestamps based on status
        if new_status == "checked-in":
            update_data["checkedInAt"] = datetime.utcnow()
        elif new_status == "in-progress":
            update_data["startedAt"] = datetime.utcnow()
        elif normalized_status in ["completed", "checkout-pending"]:
            update_data["completedAt"] = datetime.utcnow()
        elif normalized_status == "cancelled":
            update_data["cancelledAt"] = datetime.utcnow()
            if cancellation_reason:
                update_data["cancellationReason"] = cancellation_reason
        
        appointment_object_id = ObjectId(appointment_id)

        # Update appointment
        result = await self.appointments_collection.update_one(
            {"_id": appointment_object_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )

        # Retrieve updated appointment
        updated_appointment = await self.appointments_collection.find_one({"_id": appointment_object_id})

        # Keep queue entries in sync with appointment status for checkout-pending / completed
        try:
            queue_collection = self.db.queue
            if normalized_status in ["checkout-pending", "completed"]:
                queue_update: Dict = {
                    "status": normalized_status,
                    "updated_at": datetime.utcnow(),
                }
                if normalized_status == "checkout-pending":
                    queue_update["consultation_ended_at"] = datetime.utcnow()
                    queue_update["is_active"] = True  # keep visible for receptionist
                if normalized_status == "completed":
                    queue_update["consultation_ended_at"] = datetime.utcnow()
                    queue_update["is_active"] = False  # mark as inactive when completed

                await queue_collection.update_many(
                    {
                        # Defensive: queue documents historically stored appointment as either ObjectId or string
                        "appointment": {"$in": [appointment_object_id, str(appointment_object_id)]},
                        "is_active": {"$in": [True, False]},
                    },
                    {"$set": queue_update},
                )
        except Exception as e:  # pragma: no cover - defensive
            print(f"Failed to sync queue entries for appointment {appointment_id}: {e}")

        # If an appointment is cancelled after check-in, make sure any related
        # queue entries are also cancelled so they no longer appear in
        # receptionist \"checked-in\" views.
        if new_status == "cancelled":
            try:
                queue_collection = self.db.queue
                await queue_collection.update_many(
                    {
                        "appointment": appointment_object_id,
                        "is_active": True,
                        "status": {"$in": ["waiting", "in-consultation", "completed", "checkout"]},
                    },
                    {
                        "$set": {
                            "status": "cancelled",
                            "is_active": False,
                            "updated_at": datetime.utcnow(),
                        }
                    },
                )
            except Exception as e:  # pragma: no cover - defensive
                # Log but don't fail the appointment cancellation
                print(f"Failed to cancel related queue entries for appointment {appointment_id}: {e}")

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

