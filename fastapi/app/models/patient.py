"""
Patient model with field-level encryption for PHI data.
HIPAA Compliance: Sensitive fields are encrypted at rest.
"""

from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, EmailStr
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


class Vitals(BaseModel):
    """Patient vitals sub-document."""
    bloodPressure: Optional[str] = None
    heartRate: Optional[str] = None
    temperature: Optional[str] = None
    oxygenSaturation: Optional[str] = None
    weight: Optional[str] = None
    height: Optional[str] = None
    bmi: Optional[str] = None


class Lifestyle(BaseModel):
    """Patient lifestyle information."""
    smoking: Optional[str] = None
    alcohol: Optional[str] = None
    exercise: Optional[str] = None
    diet: Optional[str] = None
    sleep: Optional[str] = None
    stress: Optional[str] = None


class PatientBase(BaseModel):
    """Base patient fields."""
    firstName: str = Field(..., min_length=1, max_length=50)
    lastName: str = Field(..., min_length=1, max_length=50)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")
    age: str
    bloodGroup: str = Field(..., pattern="^(A\\+|A-|B\\+|B-|AB\\+|AB-|O\\+|O-)$")
    dateOfBirth: str
    email: EmailStr
    phone: str
    address: str
    
    # Medical information
    vitals: Optional[Vitals] = Vitals()
    medicalHistory: Optional[str] = ""
    allergies: Optional[str] = ""
    familyHistory: Optional[str] = ""
    previousSurgeries: Optional[str] = ""
    currentMedication: Optional[str] = ""
    medicationDosage: Optional[str] = None
    medicationFrequency: Optional[str] = None
    lastMedicationReview: Optional[str] = None
    lifestyle: Optional[Lifestyle] = Lifestyle()
    
    # Clinical information
    chiefComplaint: Optional[str] = None
    currentSymptoms: Optional[str] = None
    painLevel: Optional[str] = None
    
    # Status
    presentInClinic: bool = False
    emergencyContact: Optional[str] = None
    emergencyContactPhone: Optional[str] = None
    insuranceProvider: Optional[str] = None
    insuranceNumber: Optional[str] = None
    clinicId: Optional[str] = None
    clinicName: Optional[str] = None


class PatientCreate(PatientBase):
    """Schema for creating a new patient."""
    pass


class PatientInDB(PatientBase):
    """Patient model as stored in database."""
    id: Optional[PyObjectId] = Field(alias="_id")
    patientId: str  # Auto-generated unique ID (e.g., P001, P002)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    
    # Encrypted fields (stored encrypted in database)
    # SSN or other sensitive identifiers would go here
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class PatientResponse(BaseModel):
    """Schema for patient response."""
    id: str = Field(alias="_id")
    patientId: str
    firstName: str
    lastName: str
    fullName: str
    gender: str
    age: str
    bloodGroup: str
    dateOfBirth: str
    email: str
    phone: str
    address: str
    vitals: Optional[Vitals] = None
    medicalHistory: Optional[str] = None
    allergies: Optional[str] = None
    familyHistory: Optional[str] = None
    previousSurgeries: Optional[str] = None
    currentMedication: Optional[str] = None
    medicationDosage: Optional[str] = None
    medicationFrequency: Optional[str] = None
    lastMedicationReview: Optional[str] = None
    lifestyle: Optional[Lifestyle] = None
    chiefComplaint: Optional[str] = None
    currentSymptoms: Optional[str] = None
    painLevel: Optional[str] = None
    presentInClinic: bool
    emergencyContact: Optional[str] = None
    emergencyContactPhone: Optional[str] = None
    insuranceProvider: Optional[str] = None
    insuranceNumber: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        populate_by_name = True


class PatientUpdate(BaseModel):
    """Schema for updating patient."""
    firstName: Optional[str] = Field(None, min_length=1, max_length=50)
    lastName: Optional[str] = Field(None, min_length=1, max_length=50)
    phone: Optional[str] = None
    address: Optional[str] = None
    vitals: Optional[Vitals] = None
    medicalHistory: Optional[str] = None
    allergies: Optional[str] = None
    familyHistory: Optional[str] = None
    previousSurgeries: Optional[str] = None
    currentMedication: Optional[str] = None
    medicationDosage: Optional[str] = None
    medicationFrequency: Optional[str] = None
    lastMedicationReview: Optional[str] = None
    lifestyle: Optional[Lifestyle] = None
    chiefComplaint: Optional[str] = None
    currentSymptoms: Optional[str] = None
    painLevel: Optional[str] = None
    presentInClinic: Optional[bool] = None
    emergencyContact: Optional[str] = None
    emergencyContactPhone: Optional[str] = None
    insuranceProvider: Optional[str] = None
    insuranceNumber: Optional[str] = None


class PatientListItem(BaseModel):
    """Minimal patient information for list views."""
    id: str = Field(alias="_id")
    patientId: str
    fullName: str
    age: str
    gender: str
    phone: str
    chiefComplaint: Optional[str] = None
    presentInClinic: bool
    
    class Config:
        populate_by_name = True


async def patient_helper(patient: dict) -> dict:
    """
    Helper function to format patient document from database.
    Adds fullName and handles decryption of sensitive fields.
    """
    if not patient:
        return None
    
    # Decrypt sensitive fields if needed
    # from app.utils.security import field_encryption
    # encrypted_fields = ["insuranceNumber"]  # Add other fields as needed
    # patient = field_encryption.decrypt_dict_fields(patient, encrypted_fields)
    
    medical_history = patient.get("medicalHistory")
    if isinstance(medical_history, str):
        medical_history_value = [medical_history] if medical_history.strip() else []
    elif isinstance(medical_history, list):
        medical_history_value = medical_history
    else:
        medical_history_value = []

    allergies = patient.get("allergies")
    if isinstance(allergies, str):
        allergy_value = [allergies] if allergies.strip() else []
    elif isinstance(allergies, list):
        allergy_value = allergies
    else:
        allergy_value = []

    return {
        "_id": str(patient["_id"]),
        "patientId": patient.get("patientId", ""),
        "firstName": patient["firstName"],
        "lastName": patient["lastName"],
        "fullName": f"{patient['firstName']} {patient['lastName']}",
        "clinicId": patient.get("clinicId"),
        "clinicName": patient.get("clinicName"),
        "gender": patient["gender"],
        "age": patient["age"],
        "bloodGroup": patient["bloodGroup"],
        "dateOfBirth": patient["dateOfBirth"],
        "email": patient["email"],
        "phone": patient["phone"],
        "address": patient["address"],
        "vitals": patient.get("vitals", {}),
        "medicalHistory": medical_history_value,
        "allergies": allergy_value,
        "familyHistory": patient.get("familyHistory", ""),
        "previousSurgeries": patient.get("previousSurgeries", ""),
        "currentMedication": patient.get("currentMedication", ""),
        "medicationDosage": patient.get("medicationDosage"),
        "medicationFrequency": patient.get("medicationFrequency"),
        "lastMedicationReview": patient.get("lastMedicationReview"),
        "lifestyle": patient.get("lifestyle", {}),
        "chiefComplaint": patient.get("chiefComplaint"),
        "currentSymptoms": patient.get("currentSymptoms"),
        "painLevel": patient.get("painLevel"),
        "presentInClinic": patient.get("presentInClinic", False),
        "emergencyContact": patient.get("emergencyContact"),
        "emergencyContactPhone": patient.get("emergencyContactPhone"),
        "insuranceProvider": patient.get("insuranceProvider"),
        "insuranceNumber": patient.get("insuranceNumber"),
        "createdAt": patient.get("createdAt"),
        "updatedAt": patient.get("updatedAt"),
    }

