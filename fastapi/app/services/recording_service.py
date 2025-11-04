"""
Recording service for managing consultation audio recordings with transcription.
"""

from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import HTTPException, status, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.recording import RecordingUpdate, recording_helper
from app.services.s3_service import s3_service
from app.services.transcribe_service import transcribe_service
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
        
        # Upload to S3
        s3_result = await s3_service.upload_file(
            file_content=file_content,
            file_name=file.filename,
            content_type=file.content_type,
            folder="recordings"
        )
        
        # Generate recording ID
        recording_id = await self.generate_recording_id()
        
        # Calculate expiration
        expires_at = await self.calculate_expiration_date(retention_policy)
        
        # Create recording document
        recording_dict = {
            "recordingId": recording_id,
            "patientId": patient_id,
            "appointmentId": appointment_id,
            "doctorId": doctor_id,
            "duration": duration,
            "filePath": s3_result["s3_key"],
            "fileName": file.filename,
            "fileSize": file_size,
            "mimeType": file.content_type,
            "status": "completed",
            "transcription": "",
            "isEncrypted": True,  # S3 SSE encryption
            "retentionPolicy": retention_policy,
            "expiresAt": expires_at,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        # Populate names
        recording_dict = await self.populate_names(recording_dict)
        
        # Insert into database
        result = await self.recordings_collection.insert_one(recording_dict)
        created_recording = await self.recordings_collection.find_one({"_id": result.inserted_id})
        
        return await recording_helper(created_recording)
    
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

