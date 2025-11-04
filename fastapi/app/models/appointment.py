"""
Appointment model for scheduling patient-doctor consultations.
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


class AppointmentBase(BaseModel):
    """Base appointment fields."""
    patientId: str
    doctorId: str
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    time: str = Field(..., pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    duration: int = Field(30, ge=15, le=480)
    status: str = Field("scheduled", pattern="^(scheduled|checked-in|in-progress|completed|cancelled|no-show)$")
    priority: str = Field("medium", pattern="^(low|medium|high)$")
    reason: str = Field(..., max_length=500)
    notes: Optional[str] = Field("", max_length=1000)
    presentInClinic: bool = False
    insurance: bool = False
    followUpRequired: bool = False
    followUpDate: Optional[str] = None
    followUpNotes: Optional[str] = None


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
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class AppointmentResponse(BaseModel):
    """Schema for appointment response."""
    id: str = Field(alias="_id")
    appointmentId: str
    patientId: str
    doctorId: str
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
    notes: Optional[str] = None
    presentInClinic: bool
    insurance: bool
    checkedInAt: Optional[datetime] = None
    startedAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None
    cancelledAt: Optional[datetime] = None
    cancellationReason: Optional[str] = None
    followUpRequired: bool
    followUpDate: Optional[str] = None
    followUpNotes: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        populate_by_name = True


class AppointmentUpdate(BaseModel):
    """Schema for updating appointment."""
    date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    time: Optional[str] = Field(None, pattern=r"^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    duration: Optional[int] = Field(None, ge=15, le=480)
    status: Optional[str] = Field(None, pattern="^(scheduled|checked-in|in-progress|completed|cancelled|no-show)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    reason: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)
    presentInClinic: Optional[bool] = None
    insurance: Optional[bool] = None
    cancellationReason: Optional[str] = None
    followUpRequired: Optional[bool] = None
    followUpDate: Optional[str] = None
    followUpNotes: Optional[str] = None


async def appointment_helper(appointment: dict) -> dict:
    """Helper to format appointment document."""
    if not appointment:
        return None
    
    return {
        "_id": str(appointment["_id"]),
        "appointmentId": appointment.get("appointmentId", ""),
        "patientId": str(appointment["patientId"]),
        "doctorId": str(appointment["doctorId"]),
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
        "notes": appointment.get("notes", ""),
        "presentInClinic": appointment.get("presentInClinic", False),
        "insurance": appointment.get("insurance", False),
        "checkedInAt": appointment.get("checkedInAt"),
        "startedAt": appointment.get("startedAt"),
        "completedAt": appointment.get("completedAt"),
        "cancelledAt": appointment.get("cancelledAt"),
        "cancellationReason": appointment.get("cancellationReason"),
        "followUpRequired": appointment.get("followUpRequired", False),
        "followUpDate": appointment.get("followUpDate"),
        "followUpNotes": appointment.get("followUpNotes"),
        "createdAt": appointment.get("createdAt"),
        "updatedAt": appointment.get("updatedAt"),
    }

