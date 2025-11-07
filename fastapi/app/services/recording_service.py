"""
Recording service for managing consultation audio recordings with transcription.
"""

from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import HTTPException, status, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.recording import RecordingUpdate, recording_helper
from app.services.aws_service import aws_service
from app.config import settings


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

        # Start transcription job
        job_name = f"{recording_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        transcription_result = await aws_service.start_transcription_job(
            recording_url=f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_result['file_path']}",
            job_name=job_name
        )

        # Create recording document
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
            "status": "processing",  # Start as processing since transcription is initiated
            "transcription": "",
            "isEncrypted": True,  # S3 SSE encryption
            "retentionPolicy": retention_policy,
            "expiresAt": expires_at,
            "processingStartedAt": datetime.utcnow(),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        # Populate names
        recording_dict = await self.populate_names(recording_dict)
        
        # Insert into database
        result = await self.recordings_collection.insert_one(recording_dict)
        created_recording = await self.recordings_collection.find_one({"_id": result.inserted_id})
        
        return await recording_helper(created_recording)

    async def process_transcription_result(self, recording_id: str) -> dict:
        """Process completed transcription and extract structured notes."""
        if not ObjectId.is_valid(recording_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")

        recording = await self.recordings_collection.find_one({"_id": ObjectId(recording_id)})
        if not recording:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recording not found")

        job_name = recording.get("transcriptionJobName")
        if not job_name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No transcription job found")

        # Get transcription result from AWS
        transcription_result = await aws_service.get_transcription_result(job_name)

        if not transcription_result["success"]:
            # Update recording with error
            await self.recordings_collection.update_one(
                {"_id": ObjectId(recording_id)},
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

            # Extract structured notes using LLM
            notes_result = await aws_service.extract_structured_notes(transcript, patient_context)

            update_data = {
                "status": "processed",
                "transcription": transcript,
                "transcriptionConfidence": confidence,
                "processingCompletedAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
                "aiProcessing": {
                    "model": "gpt-4",
                    "version": "1.0",
                    "processingTime": None,  # Could calculate this
                    "language": "en-US",
                    "transcriptionModel": "AWS Transcribe",
                    "notesExtractionModel": "GPT-4",
                    "notesConfidence": notes_result.get("structured_notes") and 0.85 or 0.0
                }
            }

            if notes_result["success"] and notes_result.get("structured_notes"):
                update_data["aiProcessing"]["structuredNotes"] = notes_result["structured_notes"]

            # Update recording with transcription and structured notes
            await self.recordings_collection.update_one(
                {"_id": ObjectId(recording_id)},
                {"$set": update_data}
            )

            # Update appointment with structured notes if appointment exists
            if recording.get("appointmentId"):
                appointment_notes = self._format_notes_for_appointment(notes_result.get("structured_notes", {}))
                await self.appointments_collection.update_one(
                    {"_id": ObjectId(recording["appointmentId"])},
                    {"$set": {
                        "consultationNotes": appointment_notes,
                        "transcription": transcript,
                        "structuredNotes": notes_result.get("structured_notes"),
                        "updatedAt": datetime.utcnow()
                    }}
                )

            updated_recording = await self.recordings_collection.find_one({"_id": ObjectId(recording_id)})
            return await recording_helper(updated_recording)

        elif transcription_result["status"] == "failed":
            # Update recording with failure
            await self.recordings_collection.update_one(
                {"_id": ObjectId(recording_id)},
                {"$set": {
                    "status": "error",
                    "errorMessage": transcription_result.get("error", "Transcription job failed"),
                    "updatedAt": datetime.utcnow()
                }}
            )
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail=f"Transcription failed: {transcription_result.get('error')}")

        else:
            # Still processing
            return await recording_helper(recording)

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
        """Get recording by ID with optional presigned URL."""
        if not ObjectId.is_valid(recording_id):
            return None
        
        recording = await self.recordings_collection.find_one({"_id": ObjectId(recording_id)})
        
        if not recording:
            return None
        
        result = await recording_helper(recording)
        
        # Generate presigned URL if requested
        if include_presigned_url and recording.get("filePath"):
            try:
                presigned_url = await s3_service.generate_presigned_url(recording["filePath"])
                result["presignedUrl"] = presigned_url
            except:
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
            formatted.append(await recording_helper(recording))
        
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

