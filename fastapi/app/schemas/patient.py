"""
Pydantic schemas for patient endpoints.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Union, Dict
from app.models.patient import Vitals, Lifestyle, MedicalHistoryEntry


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
    medicalHistory: Optional[
        Union[str, List[MedicalHistoryEntry], List[str], List[Dict[str, str]]]
    ] = None
    allergies: Optional[str] = ""
    currentMedication: Optional[str] = ""
    medicationDosage: Optional[str] = None
    medicationFrequency: Optional[str] = None
    lifestyle: Optional[Lifestyle] = None
    currentMedications: Optional[list] = None
    
    # Clinical information
    chiefComplaint: Optional[str] = None
    currentSymptoms: Optional[str] = None
    painLevel: Optional[str] = None
    condition: Optional[str] = None
    lastVisit: Optional[str] = None
    carePlanSummary: Optional[str] = ""
    followUpPlan: Optional[str] = ""
    insights: Optional[dict] = None
    
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
    email: Optional[EmailStr] = None
    gender: Optional[str] = Field(None, pattern="^(Male|Female|Other)$")
    bloodGroup: Optional[str] = Field(None, pattern="^(A\\+|A-|B\\+|B-|AB\\+|AB-|O\\+|O-)$")
    dateOfBirth: Optional[str] = None
    age: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    vitals: Optional[Vitals] = None
    medicalHistory: Optional[
        Union[str, List[MedicalHistoryEntry], List[str], List[Dict[str, str]]]
    ] = None
    allergies: Optional[str] = None
    currentMedication: Optional[str] = None
    medicationDosage: Optional[str] = None
    medicationFrequency: Optional[str] = None
    currentMedications: Optional[list] = None
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
    condition: Optional[str] = None
    lastVisit: Optional[str] = None
    carePlanSummary: Optional[str] = None
    followUpPlan: Optional[str] = None
    chiefComplaint: Optional[str] = None
    insights: Optional[dict] = None
    # Note: Patients are universal. Clinic info is for reference only


class PatientSearchQuery(BaseModel):
    """Patient search query parameters."""
    search: Optional[str] = None
    gender: Optional[str] = None
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    presentInClinic: Optional[bool] = None

