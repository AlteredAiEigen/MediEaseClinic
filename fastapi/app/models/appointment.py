"""
Appointment model for scheduling patient-doctor consultations.
"""

from datetime import datetime
from typing import Optional, Dict, Any
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


class AppointmentBase(BaseModel):
    """Base appointment fields."""
    patientId: str
    doctorId: Optional[str] = None
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    time: str = Field(..., pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    duration: int = Field(30, ge=15, le=480)
    status: str = Field("scheduled", pattern="^(scheduled|cancelled|checked-in|ongoing|in-progress|checkout|checkout-pending|completed)$")
    priority: str = Field("medium", pattern="^(low|medium|high)$")
    reason: str = Field(..., max_length=500)
    insurance: bool = False
    followUpRequired: bool = False
    followUpNotes: Optional[str] = None
    clinicId: Optional[str] = None
    type: Optional[str] = None
    appointmentType: Optional[str] = Field(None, description="Type of appointment: 'doctor' or 'lab-test'")
    bookingKind: Optional[str] = Field(None, description="Booking kind: 'doctor' or 'lab-test'")
    consultationSummary: Optional[Dict[str, Any]] = None
    prescriptionFileUrl: Optional[str] = None
    prescriptionFileKey: Optional[str] = None
    prescriptionFileName: Optional[str] = None
    prescriptionFileType: Optional[str] = None
    prescriptionUploadedAt: Optional[datetime] = None
    prescriptionUploadedBy: Optional[str] = None
    prescriptionUploadedByName: Optional[str] = None
    # Consultation details (added during consultation)
    prescribedTest: Optional[str] = None
    diagnosis: Optional[str] = None
    treatmentPlan: Optional[str] = None
    followUpInstructions: Optional[str] = None
    detailedNotes: Optional[str] = None
    aiRecommendations: Optional[str] = None
    # HIPAA Consent fields
    consentStatus: Optional[str] = Field(None, description="Consent status: pending, accepted, rejected")
    consentDate: Optional[datetime] = None


class AppointmentCreate(AppointmentBase):
    """Schema for creating appointment."""
    pass


class AppointmentInDB(AppointmentBase):
    """Appointment as stored in database."""
    id: Optional[PyObjectId] = Field(alias="_id")
    appointmentId: str
    scheduledBy: str
    patientName: Optional[str] = None
    doctorName: Optional[str] = None
    scheduledByName: Optional[str] = None
    checkedInAt: Optional[datetime] = None
    startedAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None
    cancelledAt: Optional[datetime] = None
    cancellationReason: Optional[str] = None
    isNoShow: bool = False
    consultationTimeMinutes: Optional[float] = None
    consultationSummary: Optional[Dict[str, Any]] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    preVisitReminderSentAt: Optional[datetime] = None
    labResultReminderSentAt: Optional[datetime] = None
    consentStatus: Optional[str] = None
    consentDate: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class AppointmentResponse(BaseModel):
    """Schema for appointment response."""
    id: str = Field(alias="_id")
    appointmentId: str
    patientId: str
    doctorId: Optional[str] = None
    scheduledBy: str
    patientName: Optional[str] = None
    doctorName: Optional[str] = None
    scheduledByName: Optional[str] = None
    date: str
    time: str
    duration: int
    status: str
    priority: str
    reason: str
    insurance: bool
    checkedInAt: Optional[datetime] = None
    startedAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None
    cancelledAt: Optional[datetime] = None
    cancellationReason: Optional[str] = None
    isNoShow: bool = False
    consultationTimeMinutes: Optional[float] = None
    consultationSummary: Optional[Dict[str, Any]] = None
    followUpRequired: bool
    followUpNotes: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    preVisitReminderSentAt: Optional[datetime] = None
    labResultReminderSentAt: Optional[datetime] = None
    type: Optional[str] = None
    appointmentType: Optional[str] = None
    bookingKind: Optional[str] = None
    prescriptionFileUrl: Optional[str] = None
    prescriptionFileKey: Optional[str] = None
    prescriptionFileName: Optional[str] = None
    prescriptionFileType: Optional[str] = None
    prescriptionUploadedAt: Optional[datetime] = None
    prescriptionUploadedBy: Optional[str] = None
    prescriptionUploadedByName: Optional[str] = None
    # Consultation details (added during consultation)
    prescribedTest: Optional[str] = None
    diagnosis: Optional[str] = None
    treatmentPlan: Optional[str] = None
    followUpInstructions: Optional[str] = None
    detailedNotes: Optional[str] = None
    aiRecommendations: Optional[str] = None
    # HIPAA Consent fields
    consentStatus: Optional[str] = None
    consentDate: Optional[datetime] = None
    
    class Config:
        populate_by_name = True


class AppointmentUpdate(BaseModel):
    """Schema for updating appointment."""
    date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    time: Optional[str] = Field(None, pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    duration: Optional[int] = Field(None, ge=15, le=480)
    status: Optional[str] = Field(None, pattern="^(scheduled|cancelled|checked-in|ongoing|in-progress|checkout|checkout-pending|completed|no-show)$")
    isNoShow: Optional[bool] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    reason: Optional[str] = Field(None, max_length=500)
    insurance: Optional[bool] = None
    cancellationReason: Optional[str] = None
    followUpRequired: Optional[bool] = None
    followUpNotes: Optional[str] = None
    type: Optional[str] = None
    appointmentType: Optional[str] = None
    bookingKind: Optional[str] = None
    consultationSummary: Optional[Dict[str, Any]] = None
    prescriptionFileUrl: Optional[str] = None
    prescriptionFileKey: Optional[str] = None
    prescriptionFileName: Optional[str] = None
    prescriptionFileType: Optional[str] = None
    prescriptionUploadedAt: Optional[datetime] = None
    prescriptionUploadedBy: Optional[str] = None
    prescriptionUploadedByName: Optional[str] = None
    # Consultation details (added during consultation)
    prescribedTest: Optional[str] = None
    diagnosis: Optional[str] = None
    treatmentPlan: Optional[str] = None
    followUpInstructions: Optional[str] = None
    detailedNotes: Optional[str] = None
    aiRecommendations: Optional[str] = None


async def appointment_helper(appointment: dict) -> dict:
    """Helper to format appointment document."""
    if not appointment:
        return None
    
    return {
        "_id": str(appointment["_id"]),
        "appointmentId": appointment.get("appointmentId", ""),
        "patientId": str(appointment["patientId"]),
        "doctorId": str(appointment["doctorId"]) if appointment.get("doctorId") else None,
        "scheduledBy": str(appointment["scheduledBy"]),
        "patientName": appointment.get("patientName"),
        "doctorName": appointment.get("doctorName"),
        "scheduledByName": appointment.get("scheduledByName"),
        "date": appointment["date"],
        "time": appointment["time"],
        "duration": appointment.get("duration", 30),
        "status": appointment.get("status", "scheduled"),
        "priority": appointment.get("priority", "medium"),
        "reason": appointment["reason"],
        "insurance": appointment.get("insurance", False),
        "checkedInAt": appointment.get("checkedInAt"),
        "startedAt": appointment.get("startedAt"),
        "completedAt": appointment.get("completedAt"),
        "cancelledAt": appointment.get("cancelledAt"),
        "cancellationReason": appointment.get("cancellationReason"),
        "isNoShow": appointment.get("isNoShow", False),
        "consultationTimeMinutes": appointment.get("consultationTimeMinutes"),
        "followUpRequired": appointment.get("followUpRequired", False),
        "followUpNotes": appointment.get("followUpNotes"),
        "clinicId": appointment.get("clinicId"),
        "createdAt": appointment.get("createdAt"),
        "updatedAt": appointment.get("updatedAt"),
        # Recording-related fields
        "s3Url": appointment.get("s3Url"),
        "recordingId": appointment.get("recordingId"),
        "consultationNotes": appointment.get("consultationNotes"),
        "transcription": appointment.get("transcription"),
        "structuredNotes": appointment.get("structuredNotes"),
        "consultationSummary": appointment.get("consultationSummary"),
        "preVisitReminderSentAt": appointment.get("preVisitReminderSentAt"),
        "labResultReminderSentAt": appointment.get("labResultReminderSentAt"),
        "prescriptionFileUrl": appointment.get("prescriptionFileUrl"),
        "prescriptionFileKey": appointment.get("prescriptionFileKey"),
        "prescriptionFileName": appointment.get("prescriptionFileName"),
        "prescriptionFileType": appointment.get("prescriptionFileType"),
        "prescriptionUploadedAt": appointment.get("prescriptionUploadedAt"),
        "prescriptionUploadedBy": appointment.get("prescriptionUploadedBy"),
        "prescriptionUploadedByName": appointment.get("prescriptionUploadedByName"),
        # Consultation details (added during consultation)
        "prescribedTest": appointment.get("prescribedTest"),
        "diagnosis": appointment.get("diagnosis"),
        "treatmentPlan": appointment.get("treatmentPlan"),
        "followUpInstructions": appointment.get("followUpInstructions"),
        "detailedNotes": appointment.get("detailedNotes"),
        "aiRecommendations": appointment.get("aiRecommendations"),
        # Patient profile updates tracking from this appointment's transcription
        "patientProfileUpdates": appointment.get("patientProfileUpdates"),
        # Appointment type fields
        "type": appointment.get("type"),
        "appointmentType": appointment.get("appointmentType"),
        "bookingKind": appointment.get("bookingKind"),
        # HIPAA Consent fields
        "consentStatus": appointment.get("consentStatus"),
        "consentDate": appointment.get("consentDate"),
    }

