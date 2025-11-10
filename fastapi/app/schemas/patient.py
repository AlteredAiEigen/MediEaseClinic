"""
Pydantic schemas for patient endpoints.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.models.patient import Vitals, Lifestyle


class PatientCreateRequest(BaseModel):
    """Patient creation request schema."""
    firstName: str = Field(..., min_length=1, max_length=50)
    lastName: str = Field(..., min_length=1, max_length=50)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")
    age: str
    bloodGroup: str = Field(..., pattern="^(A\\+|A-|B\\+|B-|AB\\+|AB-|O\\+|O-)$")
    dateOfBirth: str
    email: EmailStr
    phone: str
    address: str
    
    # Optional medical information
    vitals: Optional[Vitals] = None
    medicalHistory: Optional[str] = ""
    allergies: Optional[str] = ""
    familyHistory: Optional[str] = ""
    previousSurgeries: Optional[str] = ""
    currentMedication: Optional[str] = ""
    medicationDosage: Optional[str] = None
    medicationFrequency: Optional[str] = None
    lifestyle: Optional[Lifestyle] = None
    
    # Clinical information
    chiefComplaint: Optional[str] = None
    currentSymptoms: Optional[str] = None
    painLevel: Optional[str] = None
    
    # Emergency contact
    emergencyContact: Optional[str] = None
    emergencyContactPhone: Optional[str] = None
    
    # Insurance
    insuranceProvider: Optional[str] = None
    insuranceNumber: Optional[str] = None
    
    # Note: Patients are universal. Clinic info is stored for reference only (which clinic created the patient)
    # This is injected server-side and not used for filtering


class PatientUpdateRequest(BaseModel):
    """Patient update request schema."""
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
    # Note: Patients are universal. Clinic info is for reference only


class PatientSearchQuery(BaseModel):
    """Patient search query parameters."""
    search: Optional[str] = None
    gender: Optional[str] = None
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    presentInClinic: Optional[bool] = None

