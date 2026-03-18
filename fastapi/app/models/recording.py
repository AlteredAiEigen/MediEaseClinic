"""
Recording model for consultation audio recordings.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic v2."""

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.no_info_plain_validator_function(
            cls.validate,
            serialization=core_schema.to_string_ser_schema(),
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)


class AudioQuality(BaseModel):
    """Audio quality metrics."""
    sampleRate: Optional[int] = None
    bitRate: Optional[int] = None
    channels: Optional[int] = None
    format: Optional[str] = None


class StructuredNotes(BaseModel):
    """Structured clinical notes extracted from transcription."""
    chiefComplaint: Optional[str] = None
    historyOfPresentIllness: Optional[str] = None
    reviewOfSystems: Optional[str] = None
    physicalExamination: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    medications: Optional[list] = None
    followUpInstructions: Optional[str] = None
    differentialDiagnosis: Optional[list] = None
    clinicalImpression: Optional[str] = None


class AIProcessing(BaseModel):
    """AI processing metadata."""
    model: Optional[str] = None
    version: Optional[str] = None
    processingTime: Optional[float] = None
    language: str = "en-US"
    structuredNotes: Optional[StructuredNotes] = None
    notesConfidence: Optional[float] = Field(None, ge=0, le=1)
    transcriptionModel: Optional[str] = None
    notesExtractionModel: Optional[str] = None
    notesExtractionStatus: Optional[str] = None
    notesExtractionError: Optional[str] = None


class RecordingBase(BaseModel):
    """Base recording fields."""
    patientId: str
    appointmentId: str
    doctorId: str
    duration: int = Field(..., ge=0)
    filePath: str  # S3 key
    fileName: str
    fileSize: int
    mimeType: str = "audio/mpeg"
    status: str = Field("recording", pattern="^(recording|processing|completed|failed|archived|error|processed|pending)$")
    transcription: Optional[str] = ""
    transcriptionStatus: Optional[str] = Field(None, pattern="^(pending|completed|failed|empty)$")
    transcriptionLanguage: Optional[str] = Field("hi", pattern="^(hi|en|hi-en|en-hi|auto)$")  # Language for transcription (default: Hindi)
    transcriptionConfidence: Optional[float] = Field(None, ge=0, le=1)
    audioQuality: Optional[AudioQuality] = None
    aiProcessing: Optional[AIProcessing] = None
    isEncrypted: bool = False
    encryptionKey: Optional[str] = None
    retentionPolicy: str = Field("standard", pattern="^(standard|extended|permanent)$")
    expiresAt: Optional[datetime] = None


class RecordingCreate(RecordingBase):
    """Schema for creating recording."""
    pass


class RecordingInDB(RecordingBase):
    """Recording as stored in database."""
    id: Optional[PyObjectId] = Field(alias="_id")
    recordingId: str
    patientName: Optional[str] = None
    doctorName: Optional[str] = None
    processingStartedAt: Optional[datetime] = None
    processingCompletedAt: Optional[datetime] = None
    errorMessage: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class RecordingResponse(BaseModel):
    """Schema for recording response."""
    id: str = Field(alias="_id")
    recordingId: str
    patientId: str
    appointmentId: str
    doctorId: str
    patientName: Optional[str] = None
    doctorName: Optional[str] = None
    duration: int
    filePath: str
    fileName: str
    fileSize: int
    mimeType: str
    status: str
    transcription: Optional[str] = None
    transcriptionStatus: Optional[str] = None
    transcriptionLanguage: Optional[str] = None
    transcriptionConfidence: Optional[float] = None
    processingStartedAt: Optional[datetime] = None
    processingCompletedAt: Optional[datetime] = None
    errorMessage: Optional[str] = None
    audioQuality: Optional[AudioQuality] = None
    aiProcessing: Optional[AIProcessing] = None
    isEncrypted: bool
    retentionPolicy: str
    expiresAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime
    presignedUrl: Optional[str] = None  # For file access
    
    class Config:
        populate_by_name = True


class RecordingUpdate(BaseModel):
    """Schema for updating recording."""
    status: Optional[str] = Field(None, pattern="^(recording|processing|completed|failed|archived|error|processed|pending)$")
    transcription: Optional[str] = None
    transcriptionConfidence: Optional[float] = Field(None, ge=0, le=1)
    errorMessage: Optional[str] = None
    audioQuality: Optional[AudioQuality] = None
    aiProcessing: Optional[AIProcessing] = None


async def recording_helper(recording: dict) -> dict:
    """Helper to format recording document."""
    if not recording:
        return None
    
    return {
        "_id": str(recording["_id"]),
        "id": str(recording["_id"]),  # Also include as "id" for frontend compatibility
        "recordingId": recording.get("recordingId", ""),
        "patientId": str(recording["patientId"]),
        "appointmentId": str(recording["appointmentId"]),
        "doctorId": str(recording["doctorId"]),
        "patientName": recording.get("patientName"),
        "doctorName": recording.get("doctorName"),
        "duration": recording.get("duration", 0),
        "filePath": recording.get("filePath", ""),
        "fileName": recording.get("fileName", ""),
        "fileSize": recording.get("fileSize", 0),
        "mimeType": recording.get("mimeType", "audio/mpeg"),
        "status": recording.get("status", "recording"),
        "transcription": recording.get("transcription", ""),
        "transcriptionStatus": recording.get("transcriptionStatus"),
        "transcriptionLanguage": recording.get("transcriptionLanguage", "hi"),
        "transcriptionJobName": recording.get("transcriptionJobName"),  # Added for polling
        "s3Url": recording.get("s3Url"),  # Added for appointment reference
        "transcriptionConfidence": recording.get("transcriptionConfidence"),
        "processingStartedAt": recording.get("processingStartedAt"),
        "processingCompletedAt": recording.get("processingCompletedAt"),
        "errorMessage": recording.get("errorMessage"),
        "audioQuality": recording.get("audioQuality"),
        "aiProcessing": recording.get("aiProcessing"),
        "isEncrypted": recording.get("isEncrypted", False),
        "retentionPolicy": recording.get("retentionPolicy", "standard"),
        "expiresAt": recording.get("expiresAt"),
        "createdAt": recording.get("createdAt"),
        "updatedAt": recording.get("updatedAt"),
    }

