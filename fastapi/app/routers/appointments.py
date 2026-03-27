"""
Appointment management router.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, BackgroundTasks
from fastapi import status as http_status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
from datetime import datetime, timedelta
import asyncio
import logging

from app.database import get_db
from app.schemas.appointment import (
    AppointmentCreateRequest,
    AppointmentUpdateRequest,
    AppointmentStatusUpdate,
    AppointmentCheckIn
)
from app.models.appointment import AppointmentCreate
from app.services.appointment_service import AppointmentService
from app.services.recording_service import RecordingService
from app.services.queue_service import QueueService
from app.services.patient_insights_service import patient_insights_service
from app.services.s3_service import s3_service
from app.services.websocket_service import WebSocketService
from app.middleware.auth import get_current_active_user, require_any_role, require_roles
from app.utils.response import success_response, paginated_response
from app.utils.cache import cache
from bson import ObjectId

logger = logging.getLogger(__name__)

router = APIRouter()

async def _analyze_s3_prescription(
    db: AsyncIOMotorDatabase,
    s3_prescription: dict,
    appointment_id: str
) -> dict:
    """
    Helper function to analyze an s3_prescription using GPT-4o.
    Used by both automatic (on upload) and manual analysis endpoints.
    
    Returns the structured details dict.
    """
    from app.services.ai_service import ai_service
    from app.models.s3_prescription import PrescriptionStructuredDetails, PrescriptionMedication, PrescriptionTest
    
    # Generate a fresh presigned URL from s3Key (required for GPT-4o to access the image)
    # The stored s3Url is just a base URL without presigned parameters
    s3_key = s3_prescription.get("s3Key")
    if not s3_key:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Prescription does not have an s3Key to generate presigned URL"
        )
    
    # Generate presigned URL for GPT-4o to access the image
    from app.services.s3_service import s3_service
    try:
        image_url = await s3_service.generate_presigned_url(s3_key)
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate presigned URL for prescription: {str(e)}"
        )
    
    # Call GPT-4o vision to analyze the prescription with the presigned URL
    ai_result = await ai_service.analyze_prescription_image(image_url=image_url)
    
    # Parse and structure the results
    medicines_data = ai_result.get("medicines") or []
    tests_data = ai_result.get("tests") or []
    
    # Extract patient information (handle "Not available" as None)
    patient_name = ai_result.get("patientName")
    patient_age = ai_result.get("patientAge")
    patient_gender = ai_result.get("patientGender")
    
    # Extract doctor information (handle "Not available" as None)
    doctor_name = ai_result.get("doctorName")
    doctor_license = ai_result.get("doctorLicenseNumber")
    
    # Extract prescription date (handle "Not available" as None)
    prescription_date = ai_result.get("prescriptionDate")
    
    # Extract additional notes (handle "Not available" as None)
    additional_notes = ai_result.get("additionalNotes")
    
    # Extract follow-up information
    follow_up_required = ai_result.get("followUpRequired", False)
    follow_up_duration_text = ai_result.get("followUpDuration")
    
    # Helper function to normalize "Not available" to None
    def normalize_value(value):
        if not value or not isinstance(value, str):
            return None
        value = value.strip()
        if value.lower() in ["not available", "n/a", "na", ""]:
            return None
        return value
    
    # Helper function to convert follow-up duration to days
    def convert_followup_duration_to_days(duration_text: str) -> Optional[int]:
        """
        Convert follow-up duration text (e.g., '2 weeks', '5 days', '1 month') to number of days.
        Returns None if duration cannot be parsed or if follow-up not required.
        """
        if not duration_text or not isinstance(duration_text, str):
            return None
        
        duration_text = duration_text.strip()
        if duration_text.lower() in ["not specified", "not available", "n/a", "na", ""]:
            return None
        
        import re
        text = duration_text.lower()
        
        # Match patterns like "2 weeks", "5 days", "1 month", "3 months"
        match = re.match(r"(\d+)\s*(day|days|week|weeks|month|months)", text)
        if not match:
            return None
        
        amount = int(match.group(1))
        unit = match.group(2)
        
        if "day" in unit:
            return amount
        elif "week" in unit:
            return amount * 7
        elif "month" in unit:
            return amount * 30  # Approximate months as 30 days
        else:
            return None
    
    # Calculate follow-up days if follow-up is required
    follow_up_days = None
    if follow_up_required:
        if follow_up_duration_text:
            follow_up_days = convert_followup_duration_to_days(follow_up_duration_text)
            if follow_up_days:
                logger.info(f"Follow-up required: {follow_up_duration_text} = {follow_up_days} days")
        else:
            logger.info("Follow-up required but no duration specified")
    
    structured = PrescriptionStructuredDetails(
        # Patient Information
        patientName=normalize_value(patient_name),
        patientAge=normalize_value(patient_age),
        patientGender=normalize_value(patient_gender),
        
        # Doctor Information
        doctorName=normalize_value(doctor_name),
        doctorLicenseNumber=normalize_value(doctor_license),
        
        # Prescription Metadata
        prescriptionDate=normalize_value(prescription_date),
        
        # Medications
        medicines=[
            PrescriptionMedication(
                name=(m.get("name") or "").strip(),
                dosage=(m.get("dosage") or "").strip(),
                frequency=(m.get("frequency") or "").strip(),
                duration=(m.get("duration") or "").strip(),
                instructions=(m.get("instructions") or "").strip(),
            )
            for m in medicines_data
            if isinstance(m, dict) and (m.get("name") or "").strip()
        ],
        
        # Tests
        tests=[
            PrescriptionTest(
                name=(t.get("name") or "").strip(),
                instructions=(t.get("instructions") or "").strip(),
            )
            for t in tests_data
            if isinstance(t, dict) and (t.get("name") or "").strip()
        ],
        
        # Follow-up Information
        followUpRequired=bool(follow_up_required),
        followUpDuration=(
            None if not follow_up_duration_text or follow_up_duration_text.lower() in ["not specified", "not available", "n/a", "na", ""]
            else follow_up_duration_text.strip()
        ),  # Original duration text (e.g., "1 week", "10 days", "1 month")
        followUpDays=follow_up_days,
        
        # Additional Notes
        additionalNotes=normalize_value(additional_notes),
    )
    
    # Save structured details to s3_prescriptions collection
    await db.s3_prescriptions.update_one(
        {"_id": s3_prescription["_id"]},
        {
            "$set": {
                "structuredDetails": structured.model_dump(),
                "updatedAt": datetime.utcnow(),
            }
        },
    )
    
    # Get appointment to find patientId
    appointment = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appointment:
        logger.warning(f"Appointment {appointment_id} not found, skipping medication/test updates")
        return structured.model_dump()
    
    patient_id = appointment.get("patientId")
    if not patient_id:
        logger.warning(f"Appointment {appointment_id} has no patientId, skipping medication/test updates")
        return structured.model_dump()
    
    # Add medicines to patient's currentMedications
    if structured.medicines:
        try:
            # patientId in appointments is the MongoDB _id of the patient, not the human-readable patientId
            # Try both formats: MongoDB _id first, then human-readable patientId
            patient = None
            if ObjectId.is_valid(patient_id):
                patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
            if not patient:
                # Fallback: try as human-readable patientId (like "P001")
                patient = await db.patients.find_one({"patientId": patient_id})
            
            if patient:
                logger.info(f"Found patient for medication update: patientId={patient.get('patientId')}, _id={patient.get('_id')}")
                existing_medications = patient.get("currentMedications", [])
                
                # Create new medication entries from prescription
                new_medication_entries = []
                for med in structured.medicines:
                    # Check if medication already exists (by name and dosage to avoid duplicates)
                    med_name_lower = med.name.lower().strip() if med.name else ""
                    med_dosage = med.dosage.strip() if med.dosage else ""
                    
                    # Check for duplicates
                    is_duplicate = False
                    for existing_med in existing_medications:
                        existing_name = existing_med.get("name", "").lower().strip()
                        existing_dosage = existing_med.get("dosage", "").strip()
                        if existing_name == med_name_lower and existing_dosage == med_dosage:
                            is_duplicate = True
                            break
                    
                    if not is_duplicate and med_name_lower:
                        # Use the same duration parsing logic as recording_service.py
                        def _parse_duration_to_end_date(duration_text: str) -> str:
                            """
                            Convert duration text like '5 days', '2 weeks', '1 month'
                            into an ISO date string (YYYY-MM-DD). Falls back to empty
                            string if parsing fails. Empty endDate means ongoing/active medication.
                            """
                            if not duration_text:
                                return ""
                            import re
                            
                            text = duration_text.strip().lower()
                            match = re.match(r"(\d+)\s*(day|days|week|weeks|month|months)", text)
                            if not match:
                                return ""
                            amount = int(match.group(1))
                            unit = match.group(2)
                            
                            if "week" in unit:
                                delta = timedelta(weeks=amount)
                            elif "month" in unit:
                                delta = timedelta(days=amount * 30)  # Approximate months as 30 days
                            else:
                                delta = timedelta(days=amount)
                            
                            end_date = datetime.utcnow() + delta
                            return end_date.strftime("%Y-%m-%d")
                        
                        # Calculate end date from duration if provided
                        # Empty endDate means ongoing/active medication (frontend logic: if (!med.endDate) return true)
                        duration_text = med.duration.strip() if med.duration else ""
                        end_date = _parse_duration_to_end_date(duration_text)
                        
                        medication_entry = {
                            "name": med.name.strip(),
                            "dosage": med.dosage.strip() if med.dosage else "",
                            "frequency": med.frequency.strip() if med.frequency else "",
                            "duration": duration_text,  # Keep original duration text
                            "instructions": med.instructions.strip() if med.instructions else "",
                            "startDate": datetime.utcnow().strftime("%Y-%m-%d"),
                            "endDate": end_date,  # Empty string if no duration or parsing fails = active medication
                        }
                        new_medication_entries.append(medication_entry)
                
                # Update patient's currentMedications if there are new medications
                if new_medication_entries:
                    updated_medications = existing_medications + new_medication_entries
                    # Update patient using the correct identifier (_id is more reliable)
                    update_query = {"_id": patient["_id"]} if patient.get("_id") else {"patientId": patient.get("patientId")}
                    update_result = await db.patients.update_one(
                        update_query,
                        {
                            "$set": {
                                "currentMedications": updated_medications,
                                "updatedAt": datetime.utcnow(),
                            }
                        }
                    )
                    if update_result.modified_count > 0:
                        logger.info(f"✅ Successfully added {len(new_medication_entries)} new medications to patient {patient.get('patientId')} (MongoDB _id: {patient.get('_id')})")
                        logger.info(f"   Medications added: {[med.get('name') for med in new_medication_entries]}")
                    else:
                        logger.warning(f"⚠️ Patient update returned modified_count=0 for patient {patient.get('patientId')} - medications may not have been saved")
            else:
                logger.error(f"❌ Patient not found for patientId={patient_id} (tried both MongoDB _id and human-readable patientId)")
        except Exception as e:
            logger.error(f"Failed to add medications to patient profile: {e}", exc_info=True)
            # Don't fail the whole operation if medication update fails
    
    # Add medications and tests to appointment (prescribedMedications, prescribedTest)
    appointment_update_fields = {"updatedAt": datetime.utcnow()}
    
    if structured.medicines:
        try:
            meds_for_appointment = [
                {
                    "name": m.name.strip(),
                    "dosage": (m.dosage or "").strip(),
                    "frequency": (m.frequency or "").strip(),
                    "duration": (m.duration or "").strip(),
                    "instructions": (m.instructions or "").strip(),
                }
                for m in structured.medicines
                if m.name and m.name.strip()
            ]
            if meds_for_appointment:
                appointment_update_fields["prescribedMedications"] = meds_for_appointment
                logger.info(f"Added {len(meds_for_appointment)} medications to appointment {appointment_id}")
        except Exception as e:
            logger.error(f"Failed to add medications to appointment: {e}", exc_info=True)
    
    if structured.tests:
        try:
            test_names = [test.name.strip() for test in structured.tests if test.name and test.name.strip()]
            if test_names:
                # Get existing prescribedTest from appointment
                existing_tests = appointment.get("prescribedTest", "")
                existing_test_list = [t.strip() for t in existing_tests.split(",") if t.strip()] if existing_tests else []
                
                # Merge new tests with existing ones (avoid duplicates)
                all_tests = list(set(existing_test_list + test_names))
                appointment_update_fields["prescribedTest"] = ", ".join(all_tests)
                logger.info(f"Added {len(test_names)} tests to appointment {appointment_id}: {appointment_update_fields['prescribedTest']}")
        except Exception as e:
            logger.error(f"Failed to add tests to appointment: {e}", exc_info=True)
    
    if len(appointment_update_fields) > 1:
        await db.appointments.update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": appointment_update_fields}
        )
    
    # Update appointment with follow-up information if follow-up is required
    if structured.followUpRequired:
        try:
            update_fields = {
                "followUpRequired": True,
                "updatedAt": datetime.utcnow(),
            }
            
            # Add followUpDuration (original duration text from prescription)
            if follow_up_duration_text and follow_up_duration_text.lower() not in ["not specified", "not available", "n/a", "na"]:
                update_fields["followUpDuration"] = follow_up_duration_text.strip()
            
            # Add followUpInDays (calculated days)
            if follow_up_days:
                update_fields["followUpInDays"] = follow_up_days
            
            await db.appointments.update_one(
                {"_id": ObjectId(appointment_id)},
                {"$set": update_fields}
            )
            logger.info(f"Updated appointment {appointment_id} with follow-up information: followUpRequired=True, followUpDuration='{follow_up_duration_text}', followUpInDays={follow_up_days}")
        except Exception as e:
            logger.error(f"Failed to update appointment with follow-up information: {e}", exc_info=True)
            # Don't fail the whole operation if follow-up update fails
    
    return structured.model_dump()


async def _invalidate_appointments_cache() -> None:
    """
    Appointment lists are cached for performance, but any write (create/update/status)
    must invalidate cached list responses so dashboards update immediately.
    """
    await cache.clear_pattern("appointments:")


async def _background_refresh_insights_after_booking(patient_id: str, appointment_mongo_id: str) -> None:
    """Fire-and-forget cumulative insights + RAG after a new appointment is booked."""
    try:
        from app.services.patient_insights_service import patient_insights_service

        await patient_insights_service.refresh_patient_insights(
            patient_id,
            trigger="appointment_booked",
            triggered_by_appointment_id=appointment_mongo_id,
        )
    except Exception as exc:
        logger.error(
            "Background patient insights refresh failed after booking: %s",
            exc,
            exc_info=True,
        )


async def _send_appointment_consent_background(appointment_obj_id: str) -> None:
    """Send HIPAA consent email without blocking the HTTP response (SMTP can be slow)."""
    try:
        from app.database import Database
        from app.services.consent_service import ConsentService

        db = Database.get_database()
        consent_service = ConsentService(db)
        await consent_service.send_appointment_consent(appointment_obj_id)
        logger.info("Appointment consent email sent (background) for %s", appointment_obj_id)
    except Exception as e:
        logger.error(
            "Background consent email failed for %s: %s",
            appointment_obj_id,
            e,
            exc_info=True,
        )


async def _broadcast_appointment_created_background(appointment: dict) -> None:
    """WebSocket broadcast after response — keeps scheduling API fast."""
    try:
        websocket_service = WebSocketService()
        await websocket_service.broadcast_appointment_created(appointment)
    except Exception:
        pass


async def _background_refresh_insights_after_consultation(patient_id: str, appointment_mongo_id: str) -> None:
    """Refresh cumulative insights after consultation data is saved."""
    try:
        from app.services.patient_insights_service import patient_insights_service

        await patient_insights_service.refresh_patient_insights(
            patient_id,
            trigger="consultation_completed",
            triggered_by_appointment_id=appointment_mongo_id,
        )
    except Exception as exc:
        logger.error(
            "Background patient insights refresh failed after consultation: %s",
            exc,
            exc_info=True,
        )


@router.post("/", status_code=http_status.HTTP_201_CREATED)
async def create_appointment(
    appointment_data: AppointmentCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create new appointment.
    
    Requires authentication. Checks for time slot conflicts.
    """
    try:
        appointment_service = AppointmentService(db)
        appointment_payload = appointment_data.model_dump()
        appointment_model = AppointmentCreate(**appointment_payload)
        clinic_id = current_user.get("clinicId")
        clinic_name = current_user.get("clinicName")
        appointment = await appointment_service.create_appointment(
            appointment_model,
            scheduled_by=str(current_user["_id"]),
            clinic_id=clinic_id,
            clinic_name=clinic_name
        )

        await _invalidate_appointments_cache()

        appointment_obj_id = appointment.get("_id") or appointment.get("id")

        # Defer slow / best-effort work so the client gets 201 immediately
        if appointment_obj_id:
            background_tasks.add_task(
                _send_appointment_consent_background,
                str(appointment_obj_id),
            )
        background_tasks.add_task(_broadcast_appointment_created_background, appointment)

        # Cumulative AI insights + RAG chunks (same background queue — never blocks scheduling)
        try:
            apt_obj = appointment.get("_id") or appointment.get("id")
            pid = appointment.get("patientId")
            if apt_obj and pid:
                background_tasks.add_task(
                    _background_refresh_insights_after_booking,
                    str(pid),
                    str(apt_obj),
                )
        except Exception as exc:
            logger.warning("Could not schedule patient insights after booking: %s", exc)
        
        return success_response(
            message="Appointment created successfully",
            data={"appointment": appointment},
            status_code=201
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Appointment creation failed: {str(e)}"
        )


@router.get("/")
async def list_appointments(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    patient_id: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
    date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$"),
    status: Optional[str] = Query(None, pattern="^(scheduled|checked-in|in-progress|completed|cancelled|no-show)$"),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List appointments with filtering.
    
    Filter by patient, doctor, date, or status.
    """
    try:
        clinic_id = current_user.get("clinicId")
        user_role = current_user.get("role")

        doctor_filter = doctor_id
        if user_role == "doctor":
            doctor_filter = str(current_user["_id"])
        elif doctor_filter:
            doctor_filter = str(doctor_filter)

        patient_filter = str(patient_id) if patient_id else None
        
        # Generate cache key (20 second TTL for appointments)
        cache_key = f"appointments:{clinic_id}:{page}:{limit}:{patient_filter}:{doctor_filter}:{date}:{status}"
        cached = await cache.get(cache_key)
        if cached is not None:
            return cached

        appointment_service = AppointmentService(db)

        appointments, total = await appointment_service.list_appointments(
            page=page,
            limit=limit,
            patient_id=patient_filter,
            doctor_id=doctor_filter,
            date=date,
            status=status,
            clinic_id=clinic_id
        )
        
        result = paginated_response(
            message="Appointments retrieved successfully",
            data=appointments,
            total=total,
            page=page,
            limit=limit
        )
        
        # Cache result for 20 seconds
        await cache.set(cache_key, result, ttl_seconds=20)
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve appointments: {str(e)}"
        )


@router.get("/{appointment_id}")
async def get_appointment(
    appointment_id: str,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get appointment by ID."""
    appointment_service = AppointmentService(db)
    appointment = await appointment_service.get_appointment(appointment_id)
    
    if not appointment:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    return success_response(
        message="Appointment retrieved successfully",
        data={"appointment": appointment}
    )


@router.get("/doctor/{doctor_id}/schedule")
async def get_doctor_schedule(
    doctor_id: str,
    date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get doctor's schedule for specific date."""
    try:
        appointment_service = AppointmentService(db)
        schedule = await appointment_service.get_doctor_schedule(doctor_id, date)
        
        return success_response(
            message="Doctor schedule retrieved successfully",
            data={"schedule": schedule}
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve schedule: {str(e)}"
        )


@router.put("/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    update_data: AppointmentUpdateRequest,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update appointment details."""
    try:
        appointment_service = AppointmentService(db)
        appointment = await appointment_service.update_appointment(
            appointment_id,
            update_data
        )

        await _invalidate_appointments_cache()
        
        return success_response(
            message="Appointment updated successfully",
            data={"appointment": appointment}
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Appointment update failed: {str(e)}"
        )


@router.patch("/{appointment_id}/status")
async def update_appointment_status(
    appointment_id: str,
    status_update: AppointmentStatusUpdate,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Update appointment status.
    
    **Prescription Analysis**: If status is updated to "completed" and a prescription exists
    that hasn't been analyzed, it will be analyzed in the background.
    """
    try:
        from bson import ObjectId
        import logging
        logger = logging.getLogger(__name__)
        
        appointment_service = AppointmentService(db)
        appointment = await appointment_service.update_status(
            appointment_id,
            status_update.status,
            status_update.cancellationReason
        )

        await _invalidate_appointments_cache()
        
        # If status is being set to "completed", check if there's a prescription to analyze
        # This handles the case where receptionist uploads prescription and then marks appointment as completed
        if status_update.status == "completed":
            try:
                # Find the most recent s3_prescription for this appointment
                s3_prescription = await db.s3_prescriptions.find_one(
                    {"appointmentId": appointment_id},
                    sort=[("createdAt", -1)]  # Get the most recent one
                )
                
                if s3_prescription and s3_prescription.get("s3Key"):
                    # Check if already analyzed
                    if not s3_prescription.get("structuredDetails"):
                        logger.info(f"Appointment {appointment_id} marked as completed with prescription, scheduling analysis in background...")
                        # Schedule prescription analysis in background
                        background_tasks.add_task(
                            _analyze_prescription_background,
                            db,
                            str(s3_prescription["_id"]),
                            appointment_id
                        )
                    else:
                        logger.info(f"Prescription for appointment {appointment_id} already analyzed, skipping")
            except Exception as analysis_error:
                logger.error(f"Failed to schedule prescription analysis when marking appointment {appointment_id} as completed: {analysis_error}", exc_info=True)
        
        return success_response(
            message="Appointment status updated successfully",
            data={"appointment": appointment}
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Status update failed: {str(e)}"
        )


@router.post("/{appointment_id}/prescription-upload")
async def upload_prescription(
    appointment_id: str,
    file: UploadFile = File(...),
    notes: Optional[str] = Form(None),
    current_user: dict = Depends(require_roles(["receptionist", "admin", "doctor"])),
    db: AsyncIOMotorDatabase = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Upload a scanned prescription and attach it to the appointment record.
    
    **Prescription Analysis**:
    - If appointment is already completed or checkout-pending (receptionist upload at checkout),
      analysis is triggered immediately in the background.
    - If appointment is still in-progress (doctor upload during consultation),
      analysis will happen when consultation is completed.
    """
    try:
        from bson import ObjectId
        import logging
        logger = logging.getLogger(__name__)
        
        appointment_service = AppointmentService(db)
        appointment = await appointment_service.upload_prescription_file(
            appointment_id=appointment_id,
            file=file,
            uploaded_by=str(current_user["_id"]),
            notes=notes
        )

        await _invalidate_appointments_cache()

        # Check appointment status to determine if we should analyze immediately
        # If appointment is completed or checkout-pending, analyze now (receptionist upload at checkout)
        # If appointment is still in-progress, analysis will happen at complete-consultation
        appointment_obj_id = ObjectId(appointment_id)
        appointment_doc = await db.appointments.find_one({"_id": appointment_obj_id})
        appointment_status = appointment_doc.get("status") if appointment_doc else None
        
        # Check if we should analyze immediately (appointment is already completed/checkout-pending)
        should_analyze_now = appointment_status in ["completed", "checkout-pending", "checkout"]
        
        if should_analyze_now:
            # Find the s3_prescription that was just created and analyze it
            try:
                s3_prescription = await db.s3_prescriptions.find_one(
                    {"appointmentId": appointment_id},
                    sort=[("createdAt", -1)]  # Get the most recent one
                )
                
                if s3_prescription and s3_prescription.get("s3Key"):
                    # Check if already analyzed
                    if not s3_prescription.get("structuredDetails"):
                        logger.info(f"Prescription uploaded at checkout for appointment {appointment_id}, scheduling analysis in background...")
                        # Schedule prescription analysis in background
                        background_tasks.add_task(
                            _analyze_prescription_background,
                            db,
                            str(s3_prescription["_id"]),
                            appointment_id
                        )
                    else:
                        logger.info(f"Prescription for appointment {appointment_id} already analyzed, skipping")
                else:
                    logger.warning(f"No s3_prescription found after upload for appointment {appointment_id}")
            except Exception as analysis_error:
                logger.error(f"Failed to schedule prescription analysis for appointment {appointment_id}: {analysis_error}", exc_info=True)
        else:
            logger.info(f"Prescription uploaded for appointment {appointment_id} with status '{appointment_status}'. Analysis will happen when consultation is completed.")

        return success_response(
            message="Prescription uploaded successfully",
            data={"appointment": appointment}
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prescription upload failed: {str(e)}"
        )


@router.post("/{appointment_id}/prescription-analyze", status_code=http_status.HTTP_200_OK)
async def analyze_prescription(
    appointment_id: str,
    s3_prescription_id: Optional[str] = Query(None, description="Optional: Specific s3_prescription ID to analyze. If not provided, uses the most recent prescription for the appointment."),
    current_user: dict = Depends(require_roles(["receptionist", "admin", "doctor"])),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Analyze a prescription image from s3_prescriptions using GPT-4o (vision) and
    store structured medicines/tests in the s3_prescriptions collection.
    
    **Uses the same AI method as automatic analysis** (`ai_service.analyze_prescription_image`).
    
    This endpoint can be called manually to:
    - Re-analyze a prescription (if analysis failed or needs updating)
    - Analyze a prescription that wasn't automatically analyzed during upload
    
    **Parameters:**
    - `appointment_id` (path): The appointment ID (required)
    - `s3_prescription_id` (query, optional): Specific s3_prescription document ID to analyze.
      If not provided, analyzes the most recent prescription for the appointment.
    
    **Returns:**
    - Structured details with medicines (name, dosage, frequency, duration, instructions) and tests (name, instructions)
    """
    try:
        # Find the s3_prescription document
        if s3_prescription_id and ObjectId.is_valid(s3_prescription_id):
            # Use specific s3_prescription ID if provided
            s3_prescription = await db.s3_prescriptions.find_one({"_id": ObjectId(s3_prescription_id)})
            if not s3_prescription:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail=f"No prescription found with ID: {s3_prescription_id}"
                )
            # Verify it belongs to the appointment
            if s3_prescription.get("appointmentId") != appointment_id:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail=f"Prescription {s3_prescription_id} does not belong to appointment {appointment_id}"
                )
        else:
            # Find the most recent prescription for this appointment
            s3_prescription = await db.s3_prescriptions.find_one(
                {"appointmentId": appointment_id},
                sort=[("createdAt", -1)]  # Get the most recent one
            )
            if not s3_prescription:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail=f"No prescription found for appointment {appointment_id}"
                )
        
        # Use the shared helper function (same as automatic analysis)
        structured_details = await _analyze_s3_prescription(db, s3_prescription, appointment_id)
        
        return success_response(
            message="Prescription analyzed successfully",
            data={
                "appointmentId": appointment_id,
                "s3PrescriptionId": str(s3_prescription["_id"]),
                "structuredDetails": structured_details,
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to analyze prescription: {e}", exc_info=True)
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prescription analysis failed: {str(e)}"
        )


@router.delete("/{appointment_id}/prescription")
async def delete_prescription(
    appointment_id: str,
    current_user: dict = Depends(require_roles(["receptionist", "admin", "doctor"])),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Delete prescription file from S3 and database."""
    try:
        appointment_service = AppointmentService(db)
        appointment = await appointment_service.delete_prescription_file(
            appointment_id=appointment_id
        )

        await _invalidate_appointments_cache()

        return success_response(
            message="Prescription deleted successfully",
            data={"appointment": appointment}
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prescription deletion failed: {str(e)}"
        )


@router.get("/{appointment_id}/prescription/presigned-url")
async def get_prescription_presigned_url(
    appointment_id: str,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Get a presigned URL for the prescription file associated with an appointment.
    
    Args:
        appointment_id: Appointment ID
        
    Returns:
        Presigned URL for accessing the prescription file in S3
    """
    try:
        if not ObjectId.is_valid(appointment_id):
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Invalid appointment ID format"
            )
        
        appointment_service = AppointmentService(db)
        appointment = await appointment_service.get_appointment(appointment_id)
        
        if not appointment:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        # Check clinic-based access control (except for platform admins)
        user_clinic_id = current_user.get("clinicId")
        appointment_clinic_id = appointment.get("clinicId")
        user_role = current_user.get("role")
        
        # Platform admins can access any clinic's files
        if user_role != "admin" and user_clinic_id and appointment_clinic_id:
            if str(user_clinic_id) != str(appointment_clinic_id):
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this prescription file"
                )
        
        prescription_file_key = appointment.get("prescriptionFileKey")
        if not prescription_file_key:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="No prescription file found for this appointment"
            )
        
        # Generate presigned URL
        presigned_url = await s3_service.generate_presigned_url(prescription_file_key)
        
        return success_response(
            message="Presigned URL generated successfully",
            data={
                "appointmentId": appointment_id,
                "presignedUrl": presigned_url,
                "fileName": appointment.get("prescriptionFileName"),
                "fileType": appointment.get("prescriptionFileType"),
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate presigned URL: {str(e)}"
        )


@router.patch("/{appointment_id}/check-in")
async def check_in_appointment(
    appointment_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Check in patient for appointment.

    In addition to updating the appointment status, this endpoint triggers
    asynchronous AI insights generation for the patient so that the
    consultation page has fresh recommendations.
    """
    try:
        appointment_service = AppointmentService(db)
        appointment = await appointment_service.update_status(
            appointment_id,
            "checked-in",
        )

        await _invalidate_appointments_cache()

        # Fire-and-forget task to refresh patient insights using AI
        patient_id = appointment.get("patientId")
        if patient_id:
            background_tasks.add_task(
                patient_insights_service.generate_patient_insights_on_checkin,
                patient_id,
            )

        return success_response(
            message="Patient checked in successfully",
            data={"appointment": appointment},
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Check-in failed: {str(e)}"
        )


@router.post("/{appointment_id}/complete-consultation")
async def complete_consultation(
    appointment_id: str,
    background_tasks: BackgroundTasks,
    queue_id: Optional[str] = Form(None),
    prescribed_test: Optional[str] = Form(None),
    diagnosis: Optional[str] = Form(None),
    treatment_plan: Optional[str] = Form(None),
    follow_up_instructions: Optional[str] = Form(None),
    detailed_notes: Optional[str] = Form(None),
    ai_recommendations: Optional[str] = Form(None),
    prescription: Optional[str] = Form(None),
    recording_file: Optional[UploadFile] = File(None),
    recording_duration: Optional[int] = Form(None),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Complete consultation: save consultation details and optionally upload recording in background.
    
    This endpoint saves consultation data immediately and handles recording upload
    in the background, allowing the frontend to navigate away quickly.
    
    **Prescription Analysis**: If a prescription was uploaded during consultation, it will be
    automatically analyzed in the background using GPT-4o vision. The analysis extracts:
    - Medications (added to patient's currentMedications)
    - Tests (added to appointment's prescribedTest field)
    - Patient and doctor information from the prescription
    
    **Testing via Swagger**: 
    - Use form-data format
    - All fields except `appointment_id` are optional
    - `recording_file` should be uploaded as a file if provided
    - The endpoint returns immediately; prescription analysis happens in background
    """
    try:
        from bson import ObjectId
        # Validate appointment_id
        if not ObjectId.is_valid(appointment_id):
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Invalid appointment ID"
            )
        
        appointment_service = AppointmentService(db)
        
        # Check if prescription file already exists (uploaded by doctor during consultation)
        appointment_obj_id = ObjectId(appointment_id)
        existing_appointment = await db.appointments.find_one({"_id": appointment_obj_id})
        prescription_exists = existing_appointment and (
            existing_appointment.get("prescriptionFileUrl") or 
            existing_appointment.get("prescriptionFileKey")
        )
        
        # Set status based on whether prescription file exists
        # If prescription uploaded → "completed", else → "checkout-pending" (receptionist needs to upload)
        consultation_status = "completed" if prescription_exists else "checkout-pending"
        
        # Log for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Complete consultation for appointment {appointment_id}: prescription_exists={prescription_exists}, setting status to {consultation_status}")
        
        # Save consultation details to appointment immediately
        update_data = AppointmentUpdateRequest(
            status=consultation_status,
            prescribedTest=prescribed_test,
            diagnosis=diagnosis,
            treatmentPlan=treatment_plan,
            followUpInstructions=follow_up_instructions,
            detailedNotes=detailed_notes,
            aiRecommendations=ai_recommendations,
            prescription=prescription
        )
        
        appointment = await appointment_service.update_appointment(
            appointment_id,
            update_data
        )

        await _invalidate_appointments_cache()
        
        # Note: Queue status is now automatically synced in update_appointment method
        # This ensures queue status stays in sync with appointment status
        
        # Check if prescription was uploaded during consultation and analyze it in background
        # This updates patient profile with medications and appointment with tests
        # Run in background to not block consultation completion
        try:
            # Find the most recent s3_prescription document for this appointment
            s3_prescription = await db.s3_prescriptions.find_one(
                {"appointmentId": appointment_id},
                sort=[("createdAt", -1)]  # Get the most recent one
            )
            
            if s3_prescription and s3_prescription.get("s3Key"):
                # Check if already analyzed (has structuredDetails)
                if not s3_prescription.get("structuredDetails"):
                    logger.info(f"Prescription found for appointment {appointment_id}, scheduling analysis in background...")
                    # Schedule prescription analysis in background
                    background_tasks.add_task(
                        _analyze_prescription_background,
                        db,
                        str(s3_prescription["_id"]),
                        appointment_id
                    )
                else:
                    logger.info(f"Prescription for appointment {appointment_id} already analyzed, skipping")
            else:
                logger.info(f"No prescription uploaded for appointment {appointment_id}, skipping analysis")
        except Exception as analysis_error:
            # Log but don't fail consultation completion if analysis fails
            logger.error(f"Failed to schedule prescription analysis for appointment {appointment_id}: {analysis_error}", exc_info=True)
        
        # If recording is provided, upload it in the background
        if recording_file and recording_duration:
            # Get patient and doctor IDs from appointment
            from bson import ObjectId
            appointment_obj_id = ObjectId(appointment_id) if ObjectId.is_valid(appointment_id) else None
            if appointment_obj_id:
                appointment_data = await db.appointments.find_one({"_id": appointment_obj_id})
                if appointment_data:
                    patient_id = appointment_data.get("patientId")
                    doctor_id = appointment_data.get("doctorId") or current_user.get("_id")
                    
                    if patient_id and doctor_id:
                        # Read file content before request completes
                        file_content = await recording_file.read()
                        file_filename = recording_file.filename or "consultation-recording.wav"
                        file_content_type = recording_file.content_type or "audio/wav"
                        
                        # Upload recording and process transcription in background
                        # This includes transcription and structured notes extraction
                        background_tasks.add_task(
                            _upload_recording_background,
                            db,
                            file_content,
                            file_filename,
                            file_content_type,
                            patient_id,
                            appointment_id,
                            doctor_id,
                            recording_duration
                        )

        try:
            pid = appointment.get("patientId") if isinstance(appointment, dict) else None
            if pid:
                background_tasks.add_task(
                    _background_refresh_insights_after_consultation,
                    str(pid),
                    appointment_id,
                )
        except Exception as exc:
            logger.warning("Could not schedule post-consultation insights refresh: %s", exc)
        
        return success_response(
            message="Consultation completed successfully",
            data={"appointment": appointment}
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Consultation completion failed: {str(e)}"
        )


async def _analyze_prescription_background(
    db: AsyncIOMotorDatabase,
    s3_prescription_id: str,
    appointment_id: str
):
    """Background task to analyze prescription image and update patient profile."""
    import logging
    from bson import ObjectId
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Starting background prescription analysis for appointment {appointment_id}")
        
        # Get the s3_prescription document
        s3_prescription = await db.s3_prescriptions.find_one({"_id": ObjectId(s3_prescription_id)})
        
        if not s3_prescription:
            logger.error(f"s3_prescription {s3_prescription_id} not found for appointment {appointment_id}")
            return
        
        # Check if already analyzed (double-check in case it was analyzed between scheduling and execution)
        if s3_prescription.get("structuredDetails"):
            logger.info(f"Prescription {s3_prescription_id} already analyzed, skipping")
            return
        
        # Analyze prescription and update patient profile with medications
        structured_details = await _analyze_s3_prescription(db, s3_prescription, appointment_id)
        logger.info(f"Prescription analyzed successfully. Extracted {len(structured_details.get('medicines', []))} medications and {len(structured_details.get('tests', []))} tests")
        logger.info(f"Patient profile updated with medications and appointment updated with tests")
        
    except Exception as e:
        logger.error(f"Failed to analyze prescription in background for appointment {appointment_id}: {e}", exc_info=True)


async def _upload_recording_background(
    db: AsyncIOMotorDatabase,
    file_content: bytes,
    filename: str,
    content_type: str,
    patient_id: str,
    appointment_id: str,
    doctor_id: str,
    duration: int
):
    """Background task to upload recording to S3 and process transcription."""
    import logging
    from io import BytesIO
    from bson import ObjectId
    logger = logging.getLogger(__name__)
    try:
        # Create a file-like object from bytes
        file_obj = BytesIO(file_content)
        file_obj.name = filename
        
        # Create a wrapper that implements the UploadFile interface
        class FileWrapper:
            def __init__(self, file_obj, filename, content_type):
                self.file = file_obj
                self.filename = filename
                self.content_type = content_type
            
            async def read(self):
                # Reset file pointer to beginning
                self.file.seek(0)
                return self.file.read()
        
        wrapped_file = FileWrapper(file_obj, filename, content_type)
        
        recording_service = RecordingService(db)
        recording = await recording_service.upload_recording(
            file=wrapped_file,
            patient_id=patient_id,
            appointment_id=appointment_id,
            doctor_id=doctor_id,
            duration=duration,
            retention_policy="standard"
        )
        logger.info(f"Successfully uploaded recording for appointment {appointment_id}. Transcription and AI extraction will be handled by cron job server.")
        
        # Note: Transcription and AI extraction are now handled by a separate cron job server
        # The recording is marked with transcriptionStatus="pending" and notesExtractionStatus="pending"
        # The cron job server will pick up pending recordings and process them
    except Exception as e:
        # Log error but don't raise - this is a background task
        logger.error(f"Background recording upload/processing failed for appointment {appointment_id}: {e}", exc_info=True)


async def _process_recording_transcription_background(
    db: AsyncIOMotorDatabase,
    appointment_id: str
):
    """Background task to process transcription and structured notes for a recording."""
    import logging
    from bson import ObjectId
    logger = logging.getLogger(__name__)
    try:
        # Find recording by appointment_id
        recording = await db.recordings.find_one({"appointmentId": appointment_id})
        if recording and recording.get("transcription") and recording.get("_id"):
            recording_service = RecordingService(db)
            await recording_service.process_structured_notes(recording["_id"])
            logger.info(f"Successfully processed transcription for appointment {appointment_id}")
    except Exception as e:
        logger.error(f"Background transcription processing failed for appointment {appointment_id}: {e}", exc_info=True)


@router.delete("/{appointment_id}")
async def cancel_appointment(
    appointment_id: str,
    cancellation_reason: Optional[str] = Query(None),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Cancel appointment."""
    try:
        appointment_service = AppointmentService(db)
        await appointment_service.update_status(
            appointment_id,
            "cancelled",
            cancellation_reason
        )

        await _invalidate_appointments_cache()
        
        return success_response(
            message="Appointment cancelled successfully",
            data={"appointmentId": appointment_id}
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cancellation failed: {str(e)}"
        )

