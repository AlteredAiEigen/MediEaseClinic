"""
Recording service for managing consultation audio recordings with transcription.
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from copy import deepcopy
from fastapi import HTTPException, status, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.recording import RecordingUpdate, recording_helper
from app.models.patient import DEFAULT_PATIENT_INSIGHTS
from app.services.aws_service import aws_service
from app.services.patient_medical_history_service import PatientMedicalHistoryService
from app.models.patient_medical_history import PatientMedicalHistoryCreate
from app.config import settings
from app.services.transcribe_service import transcribe_service


class RecordingService:
    """Service for handling recording operations."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.recordings_collection = db.recordings
        self.patients_collection = db.patients
        self.users_collection = db.users
        self.appointments_collection = db.appointments
    
    async def generate_recording_id(self) -> str:
        """Generate unique recording ID."""
        timestamp = int(datetime.now().timestamp() * 1000)
        return f"REC{str(timestamp)[-8:]}"
    
    async def calculate_expiration_date(self, retention_policy: str) -> Optional[datetime]:
        """Calculate expiration date based on retention policy."""
        retention_days = {
            "standard": settings.recording_retention_standard,
            "extended": settings.recording_retention_extended,
            "permanent": 0
        }
        
        days = retention_days.get(retention_policy, 90)
        
        if days == 0:  # Permanent
            return None
        
        return datetime.utcnow() + timedelta(days=days)
    
    async def populate_names(self, recording: dict) -> dict:
        """Populate patient and doctor names."""
        if recording.get("patientId"):
            patient = await self.patients_collection.find_one({"_id": ObjectId(recording["patientId"])})
            if patient:
                recording["patientName"] = f"{patient['firstName']} {patient['lastName']}"
        
        if recording.get("doctorId"):
            doctor = await self.users_collection.find_one({"_id": ObjectId(recording["doctorId"])})
            if doctor:
                recording["doctorName"] = f"{doctor['firstName']} {doctor['lastName']}"
        
        return recording
    
    async def upload_recording(
        self,
        file: UploadFile,
        patient_id: str,
        appointment_id: str,
        doctor_id: str,
        duration: int,
        retention_policy: str = "standard"
    ) -> dict:
        """Upload recording file to S3 and create database record."""
        # Validate file type
        allowed_formats = settings.audio_formats_list
        file_extension = file.filename.split('.')[-1].lower()
        
        if file_extension not in allowed_formats:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file format. Allowed: {', '.join(allowed_formats)}"
            )
        
        # Validate entities exist
        patient = await self.patients_collection.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
        
        doctor = await self.users_collection.find_one({"_id": ObjectId(doctor_id)})
        if not doctor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
        
        # Get transcription language from doctor settings (default: "hi" for Hindi)
        transcription_language = doctor.get("transcriptionLanguage", "hi")
        
        appointment = await self.appointments_collection.find_one({"_id": ObjectId(appointment_id)})
        if not appointment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Check file size limit
        max_size = settings.max_upload_size_mb * 1024 * 1024
        if file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds {settings.max_upload_size_mb}MB limit"
            )
        
        # Get clinic ID from doctor (assuming doctor belongs to clinic)
        clinic_id = doctor.get("clinicId", "default")

        # Upload to S3 with systematic naming and amplification
        s3_result = await aws_service.upload_recording_to_s3(
            file_data=file_content,
            patient_id=patient_id,
            clinic_id=str(clinic_id),
            appointment_id=appointment_id,
            amplify=True
        )

        if not s3_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"S3 upload failed: {s3_result['error']}"
            )

        # Generate recording ID
        recording_id = await self.generate_recording_id()

        # Calculate expiration
        expires_at = await self.calculate_expiration_date(retention_policy)

        # Build S3 URL
        s3_url = f"https://{settings.s3_bucket_name}.s3.{settings.aws_region}.amazonaws.com/{s3_result['file_path']}"

        # Create recording document with pending transcription and AI extraction status
        # Transcription and AI extraction will be handled by separate cron job server
        recording_dict = {
            "recordingId": recording_id,
            "patientId": patient_id,
            "appointmentId": appointment_id,
            "doctorId": doctor_id,
            "duration": duration,
            "filePath": s3_result["file_path"],
            "fileName": s3_result["file_name"],
            "fileSize": s3_result["file_size"],
            "mimeType": "audio/wav",  # Converted to WAV during amplification
            "s3Url": s3_url,
            "isEncrypted": True,
            "retentionPolicy": retention_policy,
            "expiresAt": expires_at,
            "status": "pending",
            "transcriptionStatus": "pending",
            "transcriptionLanguage": transcription_language,
            "transcription": "",
            "transcriptionConfidence": None,
            "processingStartedAt": datetime.utcnow(),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "aiProcessing": {
                "model": settings.openai_model,
                "version": "1.0",
                "language": "en-US",
                "transcriptionModel": None,  # Will be set by cron job
                "notesExtractionModel": settings.openai_model,
                "notesExtractionStatus": "pending",
                "notesExtractionError": None
            }
        }
        
        # Update appointment with S3 URL
        if appointment_id:
            await self.appointments_collection.update_one(
                {"_id": ObjectId(appointment_id)},
                {"$set": {
                    "s3Url": s3_url,
                    "recordingId": recording_id,
                    "updatedAt": datetime.utcnow()
                }}
            )
        
        # Populate names
        recording_dict = await self.populate_names(recording_dict)
        
        # Insert into database
        result = await self.recordings_collection.insert_one(recording_dict)
        created_recording = await self.recordings_collection.find_one({"_id": result.inserted_id})

        # Note: Structured notes processing happens in background task for async processing
        # This allows the API to return immediately while processing continues

        return await recording_helper(created_recording)

    async def process_structured_notes(self, recording_id: str) -> None:
        """Extract structured notes from completed transcription and update patient/appointment."""
        recording = await self.recordings_collection.find_one({"_id": recording_id})
        if not recording or not recording.get("transcription"):
            return

        transcript = recording["transcription"]

        # Get patient context for better note extraction
        patient_context = {}
        if recording.get("patientId"):
            patient = await self.patients_collection.find_one({"_id": ObjectId(recording["patientId"])})
            if patient:
                patient_context = {
                    "age": patient.get("age"),
                    "gender": patient.get("gender"),
                    "medicalHistory": patient.get("medicalHistory", []),
                    "allergies": patient.get("allergies", []),
                    "chiefComplaint": patient.get("chiefComplaint")
                }

        # Mark extraction as pending before calling LLM
        update_data = {}
        ai_processing = deepcopy(recording.get("aiProcessing") or {})
        ai_processing.update({
            "model": settings.openai_model,
            "version": "1.0",
            "language": "en-US",
            "transcriptionModel": "AWS Transcribe",
            "notesExtractionModel": settings.openai_model,
            "notesExtractionStatus": "pending",
            "notesExtractionError": None,
        })
        await self.recordings_collection.update_one(
            {"_id": recording_id},
            {"$set": {"aiProcessing": ai_processing, "updatedAt": datetime.utcnow()}}
        )

        try:
            notes_result = await aws_service.extract_structured_notes(transcript, patient_context)

            if notes_result["success"] and notes_result.get("structured_notes"):
                structured_notes = notes_result["structured_notes"]
                ai_processing.update({
                    "notesConfidence": 0.85,
                    "structuredNotes": structured_notes,
                    "notesExtractionStatus": "success",
                    "notesExtractionError": None,
                })
                update_data["aiProcessing"] = ai_processing

                # Update appointment with structured notes
                if recording.get("appointmentId"):
                    appointment_notes = self._format_notes_for_appointment(structured_notes)
                    appointment_summary = self._build_appointment_summary(structured_notes)
                    appointment_updates = {
                        "consultationNotes": appointment_notes,
                        "transcription": transcript,
                        "structuredNotes": structured_notes,
                        "consultationSummary": appointment_summary,
                        "followUpNotes": structured_notes.get("followUpInstructions"),
                        "updatedAt": datetime.utcnow()
                    }
                    appointment = await self.appointments_collection.find_one({"_id": ObjectId(recording["appointmentId"])})
                    if appointment:
                        if structured_notes.get("chiefComplaint"):
                            appointment_updates["reason"] = structured_notes["chiefComplaint"]
                        if structured_notes.get("historyOfPresentIllness"):
                            appointment_updates["notes"] = structured_notes["historyOfPresentIllness"]
                        # Extract and save prescribed tests from structured notes
                        if structured_notes.get("prescribedTests"):
                            tests = structured_notes["prescribedTests"]
                            if isinstance(tests, list) and tests:
                                # Join test names with comma and space
                                prescribed_test_str = ", ".join([str(t).strip() for t in tests if t])
                                if prescribed_test_str:
                                    appointment_updates["prescribedTest"] = prescribed_test_str
                    await self.appointments_collection.update_one(
                        {"_id": ObjectId(recording["appointmentId"])},
                        {"$set": appointment_updates}
                    )

                # Update patient with medications, allergies, and summary fields
                appointment_id_str = str(recording.get("appointmentId", "")) if recording.get("appointmentId") else None
                await self.update_patient_from_notes(
                    recording["patientId"], 
                    structured_notes,
                    appointment_id=appointment_id_str
                )

                # Optionally update structured medical history collection
                try:
                    if recording.get("patientId") and any(
                        structured_notes.get(key)
                        for key in ("medicalHistory", "familyHistory", "previousSurgeries")
                    ):
                        history_service = PatientMedicalHistoryService(self.db)
                        history_payload = PatientMedicalHistoryCreate(
                            patientId=str(recording["patientId"]),
                            medicalHistory=structured_notes.get("medicalHistory"),
                            familyHistory=structured_notes.get("familyHistory"),
                            previousSurgeries=structured_notes.get("previousSurgeries"),
                        )
                        await history_service.create_medical_history(history_payload)
                except Exception as e:  # pragma: no cover - defensive
                    # Do not fail recording processing if history update fails
                    print(f"Warning: failed to update patient_medical_history: {e}")
            else:
                ai_processing.update({
                    "notesExtractionStatus": "failed",
                    "notesExtractionError": notes_result.get("error") or "Structured notes not returned",
                })
                update_data["aiProcessing"] = ai_processing
        except Exception as e:
            ai_processing.update({
                "notesExtractionStatus": "failed",
                "notesExtractionError": f"Extraction exception: {str(e)}",
            })
            update_data["aiProcessing"] = ai_processing

        # Update recording with structured notes
        if update_data:
            await self.recordings_collection.update_one(
                {"_id": recording_id},
                {"$set": update_data}
            )

    async def update_patient_from_notes(
        self, 
        patient_id: str, 
        structured_notes: dict,
        appointment_id: str = None
    ) -> Dict[str, Any]:
        """
        Update patient record with information from structured notes.
        Returns a dictionary of what was updated for tracking purposes.
        """
        updates_applied = {
            "fieldsUpdated": [],
            "medicationsAdded": [],
            "allergiesAdded": [],
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        if not patient_id or not structured_notes:
            return updates_applied

        if not ObjectId.is_valid(patient_id):
            return updates_applied

        patient = await self.patients_collection.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            return updates_applied
        
        patient_updates: Dict[str, any] = {}
        now_iso = datetime.utcnow().isoformat()
        
        # Extract medications from structured notes into currentMedications
        if structured_notes.get("medications"):
            meds = structured_notes["medications"]
            if isinstance(meds, list) and meds:
                existing_meds = patient.get("currentMedications", [])
                if not isinstance(existing_meds, list):
                    existing_meds = []

                existing_names = {
                    (m.get("name") or "").lower()
                    for m in existing_meds
                    if isinstance(m, dict)
                }

                def _parse_duration_to_end_date(duration_text: str) -> str:
                    """
                    Convert duration text like '5 days', '2 weeks', '1 month'
                    into an ISO date string (YYYY-MM-DD). Falls back to empty
                    string if parsing fails.
                    """
                    if not duration_text:
                        return ""
                    import re

                    text = duration_text.strip().lower()
                    match = re.match(r"(\\d+)\\s*(day|days|week|weeks|month|months)", text)
                    if not match:
                        return ""
                    amount = int(match.group(1))
                    unit = match.group(2)
                    delta: timedelta
                    if "week" in unit:
                        delta = timedelta(weeks=amount)
                    elif "month" in unit:
                        delta = timedelta(days=amount * 30)
                    else:
                        delta = timedelta(days=amount)
                    end_date = datetime.utcnow() + delta
                    return end_date.strftime("%Y-%m-%d")

                new_entries: List[Dict[str, Any]] = []
                for raw in meds:
                    if isinstance(raw, dict):
                        name = (raw.get("name") or "").strip()
                        if not name:
                            continue
                        if name.lower() in existing_names:
                            continue
                        dosage = (raw.get("dosage") or "").strip()
                        frequency = (raw.get("frequency") or "").strip()
                        duration_text = (raw.get("duration") or "").strip()
                        instructions = (raw.get("instructions") or "").strip() or "From consultation transcript"
                        start_date = now_iso.split("T")[0]
                        end_date = _parse_duration_to_end_date(duration_text)
                        entry = {
                            "name": name,
                            "dosage": dosage,
                            "frequency": frequency,
                            "duration": duration_text,
                            "instructions": instructions,
                            "startDate": start_date,
                            "endDate": end_date,
                        }
                        new_entries.append(entry)
                    else:
                        # String or other primitive – treat as simple name
                        name = str(raw).strip()
                        if not name or name.lower() in existing_names:
                            continue
                        entry = {
                            "name": name,
                            "dosage": "",
                            "frequency": "",
                            "duration": "",
                            "instructions": "From consultation transcript",
                            "startDate": now_iso.split("T")[0],
                            "endDate": "",
                        }
                        new_entries.append(entry)

                if new_entries:
                    patient_updates["currentMedications"] = existing_meds + new_entries
                    updates_applied["fieldsUpdated"].append("currentMedications")
                    updates_applied["medicationsAdded"] = [
                        {"name": e["name"], "dosage": e.get("dosage", ""), "duration": e.get("duration", "")}
                        for e in new_entries
                    ]
        
        # Extract allergies
        if structured_notes.get("allergies"):
            found_allergies = structured_notes["allergies"]
            if isinstance(found_allergies, list):
                existing_allergies = patient.get("allergies", [])
                if isinstance(existing_allergies, str):
                    existing_allergies = [existing_allergies] if existing_allergies else []
                # Find new allergies that weren't already present
                existing_set = set(a.lower() for a in existing_allergies)
                new_allergies = [a for a in found_allergies if a.lower() not in existing_set]
                if new_allergies:
                    combined_allergies = list(set(existing_allergies + found_allergies))
                    patient_updates["allergies"] = combined_allergies
                    updates_applied["fieldsUpdated"].append("allergies")
                    updates_applied["allergiesAdded"] = new_allergies

        if structured_notes.get("assessment"):
            patient_updates["condition"] = structured_notes["assessment"]
            updates_applied["fieldsUpdated"].append("condition")
            updates_applied["assessmentAdded"] = structured_notes["assessment"]
        if structured_notes.get("plan"):
            patient_updates["carePlanSummary"] = structured_notes["plan"]
            updates_applied["fieldsUpdated"].append("carePlanSummary")
            updates_applied["planAdded"] = structured_notes["plan"]
        if structured_notes.get("followUpInstructions"):
            patient_updates["followUpPlan"] = structured_notes["followUpInstructions"]
            updates_applied["fieldsUpdated"].append("followUpPlan")
            updates_applied["followUpAdded"] = structured_notes["followUpInstructions"]
        if structured_notes.get("chiefComplaint"):
            patient_updates["chiefComplaint"] = structured_notes["chiefComplaint"]
            updates_applied["fieldsUpdated"].append("chiefComplaint")
            updates_applied["chiefComplaintAdded"] = structured_notes["chiefComplaint"]
        if structured_notes.get("historyOfPresentIllness"):
            patient_updates["currentSymptoms"] = structured_notes["historyOfPresentIllness"]
            updates_applied["fieldsUpdated"].append("currentSymptoms")
            updates_applied["historyOfPresentIllnessAdded"] = structured_notes["historyOfPresentIllness"]

        patient_updates["lastVisit"] = now_iso.split("T")[0]
        updates_applied["fieldsUpdated"].append("lastVisit")
        updates_applied["lastVisitUpdated"] = now_iso.split("T")[0]

        # NOTE: Do NOT overwrite patient.insights here.
        # Longitudinal AI insights are generated separately by PatientInsightsService.
        
        if patient_updates:
            patient_updates["updatedAt"] = datetime.utcnow()
            await self.patients_collection.update_one(
                {"_id": ObjectId(patient_id)},
                {"$set": patient_updates}
            )
            
            # Store the updates applied in the appointment for tracking
            if appointment_id and ObjectId.is_valid(appointment_id):
                await self.db.appointments.update_one(
                    {"_id": ObjectId(appointment_id)},
                    {"$set": {"patientProfileUpdates": updates_applied}}
                )
        
        return updates_applied

    async def process_transcription_result(self, recording_id: str) -> dict:
        """Process completed transcription and extract structured notes."""
        print(f"DEBUG: Starting process_transcription_result for recording_id: {recording_id}")
        query = {"_id": ObjectId(recording_id)} if ObjectId.is_valid(recording_id) else {"recordingId": recording_id}

        recording = await self.recordings_collection.find_one(query)
        if not recording:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")

        recording_object_id = recording["_id"]

        # Check if transcription already exists (for re-processing already completed recordings)
        existing_transcript = recording.get("transcription")

        # If recording has error status but has transcription, reset to processing
        if existing_transcript and recording.get("status") == "error":
            await self.recordings_collection.update_one(
                {"_id": recording_object_id},
                {"$set": {"status": "processing"}}
            )
            recording["status"] = "processing"

        if existing_transcript:
            # Use existing transcription data
            transcript = existing_transcript
            confidence = recording.get("transcriptionConfidence", 0)
        else:
            # Get transcription result from AWS
            job_name = recording.get("transcriptionJobName")
            if not job_name:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No transcription job found")

            transcription_result = await aws_service.get_transcription_result(job_name)

            if not transcription_result["success"]:
                # Update recording with error
                await self.recordings_collection.update_one(
                    {"_id": recording_object_id},
                    {"$set": {
                        "status": "error",
                        "errorMessage": transcription_result.get("error", "Transcription failed"),
                        "updatedAt": datetime.utcnow()
                    }}
                )
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                  detail=f"Transcription failed: {transcription_result.get('error')}")

            if transcription_result["status"] == "completed":
                transcript = transcription_result["transcript"]
                confidence = transcription_result.get("confidence", 0)
            else:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                  detail="Transcription not yet completed")

        # Get patient context for better note extraction (runs for both existing and new transcription)
        patient_context = {}
        if recording.get("patientId"):
            patient = await self.patients_collection.find_one({"_id": ObjectId(recording["patientId"])})
            if patient:
                patient_context = {
                    "age": patient.get("age"),
                    "gender": patient.get("gender"),
                    "medicalHistory": patient.get("medicalHistory", []),
                    "allergies": patient.get("allergies", []),
                    "chiefComplaint": patient.get("chiefComplaint")
                }

        # Extract structured notes using LLM (runs for both existing and new transcription)
        notes_result = await aws_service.extract_structured_notes(transcript, patient_context)

        ai_processing = {
            "model": settings.openai_model,
            "version": "1.0",
            "processingTime": None,  # Could calculate this
            "language": "en-US",
            "transcriptionModel": "AWS Transcribe",
            "notesExtractionModel": settings.openai_model,
            "notesConfidence": notes_result.get("structured_notes") and 0.85 or 0.0,
            "notesExtractionStatus": "pending",
            "notesExtractionError": None,
        }

        if notes_result.get("success") and notes_result.get("structured_notes"):
            ai_processing.update({
                "structuredNotes": notes_result["structured_notes"],
                "notesExtractionStatus": "success",
                "notesExtractionError": None,
            })
        else:
            ai_processing.update({
                "notesExtractionStatus": "failed",
                "notesExtractionError": notes_result.get("error") or "Structured notes not returned",
            })

        update_data = {
            "status": "processed",
            "transcription": transcript,
            "transcriptionConfidence": confidence,
            "processingCompletedAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "aiProcessing": ai_processing
        }

        # Update recording with transcription and structured notes
        await self.recordings_collection.update_one(
            {"_id": recording_object_id},
            {"$set": update_data}
        )

        # Update appointment with structured notes if appointment exists
        if recording.get("appointmentId"):
            structured_payload = notes_result.get("structured_notes", {})
            appointment_notes = self._format_notes_for_appointment(structured_payload)
            appointment_summary = self._build_appointment_summary(structured_payload)
            appointment_updates = {
                "consultationNotes": appointment_notes,
                "transcription": transcript,
                "structuredNotes": structured_payload,
                "consultationSummary": appointment_summary,
                "followUpNotes": structured_payload.get("followUpInstructions"),
                "updatedAt": datetime.utcnow()
            }
            appointment = await self.appointments_collection.find_one({"_id": ObjectId(recording["appointmentId"])})
            if appointment:
                if structured_payload.get("chiefComplaint"):
                    appointment_updates["reason"] = structured_payload["chiefComplaint"]
                if structured_payload.get("historyOfPresentIllness"):
                    appointment_updates["notes"] = structured_payload["historyOfPresentIllness"]
            await self.appointments_collection.update_one(
                {"_id": ObjectId(recording["appointmentId"])},
                {"$set": appointment_updates}
            )

        # Extract and update patient data from structured notes using shared helper
        if notes_result.get("structured_notes") and recording.get("patientId"):
            appointment_id_str = str(recording.get("appointmentId", "")) if recording.get("appointmentId") else None
            await self.update_patient_from_notes(
                str(recording["patientId"]),
                notes_result["structured_notes"],
                appointment_id=appointment_id_str
            )

            # Instead of querying the database again, update the recording object in memory
            # and return it directly to avoid potential ObjectId serialization issues
            updated_recording = {**recording, **update_data}

            # Convert ObjectIds to strings for JSON serialization
            result = {
                "_id": str(updated_recording["_id"]),
                "id": str(updated_recording["_id"]),
                "recordingId": updated_recording.get("recordingId", ""),
                "patientId": str(updated_recording.get("patientId", "")),
                "appointmentId": str(updated_recording.get("appointmentId", "")),
                "doctorId": str(updated_recording.get("doctorId", "")),
                "patientName": updated_recording.get("patientName"),
                "doctorName": updated_recording.get("doctorName"),
                "duration": updated_recording.get("duration", 0),
                "filePath": updated_recording.get("filePath", ""),
                "fileName": updated_recording.get("fileName", ""),
                "fileSize": updated_recording.get("fileSize", 0),
                "mimeType": updated_recording.get("mimeType", "audio/wav"),
                "status": updated_recording.get("status", "processed"),
                "transcription": updated_recording.get("transcription", ""),
                "transcriptionJobName": updated_recording.get("transcriptionJobName"),
                "s3Url": updated_recording.get("s3Url"),
                "transcriptionConfidence": updated_recording.get("transcriptionConfidence"),
                "processingStartedAt": updated_recording.get("processingStartedAt"),
                "processingCompletedAt": updated_recording.get("processingCompletedAt"),
                "errorMessage": updated_recording.get("errorMessage"),
                "audioQuality": updated_recording.get("audioQuality"),
                "aiProcessing": updated_recording.get("aiProcessing"),
                "isEncrypted": updated_recording.get("isEncrypted", True),
                "retentionPolicy": updated_recording.get("retentionPolicy", "standard"),
                "expiresAt": updated_recording.get("expiresAt"),
                "createdAt": updated_recording.get("createdAt"),
                "updatedAt": updated_recording.get("updatedAt")
            }

            return result
    
    def _build_appointment_summary(self, structured_notes: dict) -> Dict[str, Any]:
        """Build a structured summary object for appointments."""
        if not structured_notes:
            return {}
        summary = {
            "chiefComplaint": structured_notes.get("chiefComplaint"),
            "assessment": structured_notes.get("assessment"),
            "plan": structured_notes.get("plan"),
            "followUpInstructions": structured_notes.get("followUpInstructions"),
            "differentialDiagnosis": structured_notes.get("differentialDiagnosis"),
            "clinicalImpression": structured_notes.get("clinicalImpression"),
        }
        return summary

    def _format_notes_for_appointment(self, structured_notes: dict) -> str:
        """Format structured notes for appointment display."""
        if not structured_notes:
            return ""

        formatted = []
        if structured_notes.get("chiefComplaint"):
            formatted.append(f"**Chief Complaint:** {structured_notes['chiefComplaint']}")
        if structured_notes.get("assessment"):
            formatted.append(f"**Assessment:** {structured_notes['assessment']}")
        if structured_notes.get("plan"):
            formatted.append(f"**Plan:** {structured_notes['plan']}")
        if structured_notes.get("followUpInstructions"):
            formatted.append(f"**Follow-up:** {structured_notes['followUpInstructions']}")

        return "\n\n".join(formatted)

    async def start_transcription(self, recording_id: str) -> dict:
        """Start transcription job for recording."""
        if not ObjectId.is_valid(recording_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")
        
        recording = await self.recordings_collection.find_one({"_id": ObjectId(recording_id)})
        if not recording:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")
        
        # Update status to processing
        await self.recordings_collection.update_one(
            {"_id": ObjectId(recording_id)},
            {
                "$set": {
                    "status": "processing",
                    "processingStartedAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        try:
            # Build S3 URI
            s3_uri = f"s3://{settings.aws_s3_bucket}/{recording['filePath']}"
            
            # Start transcription
            job_name = f"transcribe_{recording['recordingId']}"
            media_format = recording['fileName'].split('.')[-1].lower()
            
            result = await transcribe_service.start_transcription_job(
                job_name=job_name,
                file_uri=s3_uri,
                media_format=media_format,
                identify_multiple_languages=True
            )
            
            # Update recording with transcription
            await self.recordings_collection.update_one(
                {"_id": ObjectId(recording_id)},
                {
                    "$set": {
                        "status": "completed",
                        "transcription": result["transcript"],
                        "processingCompletedAt": datetime.utcnow(),
                        "aiProcessing": {
                            "model": "AWS Transcribe",
                            "language": result.get("language_code", "en-US")
                        },
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            
            updated_recording = await self.recordings_collection.find_one({"_id": ObjectId(recording_id)})
            return await recording_helper(updated_recording)
        
        except Exception as e:
            # Update status to failed
            await self.recordings_collection.update_one(
                {"_id": ObjectId(recording_id)},
                {
                    "$set": {
                        "status": "failed",
                        "errorMessage": str(e),
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            raise
    
    async def get_recording(self, recording_id: str, include_presigned_url: bool = True) -> Optional[dict]:
        """Get recording by ID (ObjectId or recordingId) with optional presigned URL."""
        recording = None
        
        # Try to find by ObjectId first
        if ObjectId.is_valid(recording_id):
            recording = await self.recordings_collection.find_one({"_id": ObjectId(recording_id)})
        
        # If not found, try to find by recordingId (string ID like "REC12345678")
        if not recording:
            recording = await self.recordings_collection.find_one({"recordingId": recording_id})
        
        if not recording:
            return None

        # Note: Transcription and AI extraction are now handled by a separate cron job server
        # No automatic processing is triggered here
        
        result = await recording_helper(recording)
        
        # Generate presigned URL if requested
        if include_presigned_url and recording.get("filePath"):
            try:
                from app.services.aws_service import aws_service
                # Generate presigned URL using AWS service
                presigned_url = aws_service.s3_client.generate_presigned_url(
                    'get_object',
                    Params={
                        'Bucket': aws_service.bucket_name,
                        'Key': recording["filePath"]
                    },
                    ExpiresIn=3600  # 1 hour
                )
                result["presignedUrl"] = presigned_url
            except Exception as e:
                print(f"Failed to generate presigned URL: {e}")
                pass
        
        return result
    
    async def list_recordings(
        self,
        page: int = 1,
        limit: int = 10,
        patient_id: Optional[str] = None,
        doctor_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> tuple[List[dict], int]:
        """List recordings with filtering."""
        query = {}
        
        if patient_id:
            query["patientId"] = patient_id
        
        if doctor_id:
            query["doctorId"] = doctor_id
        
        if status:
            query["status"] = status
        
        skip = (page - 1) * limit
        total = await self.recordings_collection.count_documents(query)
        
        cursor = self.recordings_collection.find(query).sort("createdAt", -1).skip(skip).limit(limit)
        recordings = await cursor.to_list(length=limit)
        
        formatted = []
        for recording in recordings:
            formatted_recording = await recording_helper(recording)
            
            # Populate basic patient information if not already present
            if not formatted_recording.get("patientName") and recording.get("patientId"):
                try:
                    patient = await self.patients_collection.find_one({"_id": ObjectId(recording["patientId"])})
                    if patient:
                        formatted_recording["patientName"] = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
                        # Add basic patient info for frontend
                        formatted_recording["patient"] = {
                            "_id": str(patient["_id"]),
                            "patientId": patient.get("patientId", str(patient["_id"])),
                            "fullName": formatted_recording["patientName"],
                            "firstName": patient.get("firstName", ""),
                            "lastName": patient.get("lastName", ""),
                            "age": patient.get("age"),
                            "gender": patient.get("gender"),
                        }
                except Exception as e:
                    # If patient fetch fails, continue without patient info
                    pass
            
            formatted.append(formatted_recording)
        
        return formatted, total
    
    async def update_recording(self, recording_id: str, update_data: RecordingUpdate) -> Optional[dict]:
        """Update recording."""
        if not ObjectId.is_valid(recording_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")
        
        update_dict = update_data.model_dump(exclude_unset=True)
        
        if not update_dict:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
        
        update_dict["updatedAt"] = datetime.utcnow()
        
        result = await self.recordings_collection.update_one(
            {"_id": ObjectId(recording_id)},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")
        
        updated = await self.recordings_collection.find_one({"_id": ObjectId(recording_id)})
        return await recording_helper(updated)
    
    async def delete_recording(self, recording_id: str) -> bool:
        """Delete recording from database and S3."""
        if not ObjectId.is_valid(recording_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")
        
        recording = await self.recordings_collection.find_one({"_id": ObjectId(recording_id)})
        if not recording:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")
        
        # Delete from S3
        if recording.get("filePath"):
            try:
                await s3_service.delete_file(recording["filePath"])
            except:
                pass  # Continue even if S3 deletion fails
        
        # Delete from database
        await self.recordings_collection.delete_one({"_id": ObjectId(recording_id)})
        
        return True

