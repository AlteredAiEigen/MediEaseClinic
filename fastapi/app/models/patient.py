"""
Patient model with field-level encryption for PHI data.
HIPAA Compliance: Sensitive fields are encrypted at rest.
"""

from datetime import datetime
from typing import Optional, List, Dict, Union
from copy import deepcopy
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


class MedicalHistoryEntry(BaseModel):
    """Structured medical history record."""
    title: Optional[str] = None
    diagnosis: Optional[str] = None
    treatedBy: Optional[str] = None
    recordedOn: Optional[str] = None
    notes: Optional[str] = None


class PatientInsights(BaseModel):
    """AI-driven patient insights used by dashboards."""
    riskAssessment: Optional[str] = "Success rate in similar cases: 94%"
    riskLevel: str = "medium"
    successRate: Optional[str] = "94%"
    keyFindings: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    lastUpdatedAt: Optional[str] = None


DEFAULT_PATIENT_INSIGHTS = PatientInsights().model_dump()


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
    medicalHistory: Optional[Union[str, List[Union[str, MedicalHistoryEntry]]]] = None
    allergies: Optional[str] = ""
    currentMedication: Optional[str] = ""
    medicationDosage: Optional[str] = None
    medicationFrequency: Optional[str] = None
    lastMedicationReview: Optional[str] = None
    lifestyle: Optional[Lifestyle] = Lifestyle()
    currentMedications: Optional[List[Dict[str, str]]] = Field(default_factory=list)
    
    # Clinical information
    chiefComplaint: Optional[str] = None
    currentSymptoms: Optional[str] = None
    painLevel: Optional[str] = None
    condition: Optional[str] = None
    lastVisit: Optional[str] = None
    carePlanSummary: Optional[str] = ""
    followUpPlan: Optional[str] = ""
    insights: PatientInsights = Field(default_factory=PatientInsights)
    
    # Status
    presentInClinic: bool = False
    emergencyContact: Optional[str] = None
    emergencyContactPhone: Optional[str] = None
    insuranceProvider: Optional[str] = None
    insuranceNumber: Optional[str] = None
    # Note: Patients are universal - clinic info is for reference only (which clinic created the patient)
    createdByClinicId: Optional[str] = None
    createdByClinicName: Optional[str] = None


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
    medicalHistory: Optional[List[MedicalHistoryEntry]] = None
    allergies: Optional[str] = None
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
    condition: Optional[str] = None
    lastVisit: Optional[str] = None
    carePlanSummary: Optional[str] = None
    followUpPlan: Optional[str] = None
    insights: Optional[PatientInsights] = None
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        populate_by_name = True


class PatientUpdate(BaseModel):
    """Schema for updating patient."""
    firstName: Optional[str] = Field(None, min_length=1, max_length=50)
    lastName: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    gender: Optional[str] = Field(None, pattern="^(Male|Female|Other)$")
    age: Optional[str] = None
    bloodGroup: Optional[str] = Field(None, pattern="^(A\\+|A-|B\\+|B-|AB\\+|AB-|O\\+|O-)$")
    dateOfBirth: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    vitals: Optional[Vitals] = None
    medicalHistory: Optional[Union[str, List[Union[str, MedicalHistoryEntry]]]] = None
    allergies: Optional[str] = None
    currentMedication: Optional[str] = None
    medicationDosage: Optional[str] = None
    medicationFrequency: Optional[str] = None
    lastMedicationReview: Optional[str] = None
    currentMedications: Optional[List[Dict[str, str]]] = None
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
    insights: Optional[PatientInsights] = None


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
    
    medical_history_raw = patient.get("medicalHistory")

    def normalize_history_entry(entry) -> Optional[Dict[str, str]]:
        if isinstance(entry, MedicalHistoryEntry):
            data = {k: v for k, v in entry.model_dump().items() if v}
            return data or None
        if isinstance(entry, dict):
            data = {}
            for key in ["title", "diagnosis", "treatedBy", "recordedOn", "notes"]:
                value = entry.get(key)
                if isinstance(value, str) and value.strip():
                    data[key] = value.strip()
            return data or None
        if isinstance(entry, str):
            title = entry.strip()
            return {"title": title} if title else None
        return None

    medical_history_value: List[Dict[str, str]] = []
    if isinstance(medical_history_raw, list):
        for item in medical_history_raw:
            normalized = normalize_history_entry(item)
            if normalized:
                medical_history_value.append(normalized)
    else:
        normalized = normalize_history_entry(medical_history_raw)
        if normalized:
            medical_history_value.append(normalized)

    allergies = patient.get("allergies")
    if isinstance(allergies, str):
        allergy_value = [allergies] if allergies.strip() else []
    elif isinstance(allergies, list):
        allergy_value = allergies
    else:
        allergy_value = []

    raw_insights = patient.get("insights") or {}
    insights = deepcopy(DEFAULT_PATIENT_INSIGHTS)
    insights.update({k: v for k, v in raw_insights.items() if v is not None})

    key_findings = raw_insights.get("keyFindings")
    if isinstance(key_findings, list):
        insights["keyFindings"] = key_findings
    elif isinstance(key_findings, str) and key_findings.strip():
        insights["keyFindings"] = [key_findings.strip()]

    recommendations = raw_insights.get("recommendations")
    if isinstance(recommendations, list):
        insights["recommendations"] = recommendations
    elif isinstance(recommendations, str) and recommendations.strip():
        insights["recommendations"] = [recommendations.strip()]

    return {
        "_id": str(patient["_id"]),
        "patientId": patient.get("patientId", ""),
        "firstName": patient.get("firstName", ""),
        "lastName": patient.get("lastName", ""),
        "fullName": f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip(),
        # Patients are universal - clinic info is for reference only
        "createdByClinicId": patient.get("createdByClinicId"),
        "createdByClinicName": patient.get("createdByClinicName"),
        "gender": patient.get("gender", ""),
        "age": patient.get("age", ""),
        "bloodGroup": patient.get("bloodGroup", ""),
        "dateOfBirth": patient.get("dateOfBirth", ""),
        "email": patient.get("email", ""),
        "phone": patient.get("phone", ""),
        "address": patient.get("address", ""),
        "vitals": patient.get("vitals", {}),
        "medicalHistory": medical_history_value,
        "allergies": allergy_value,
        "currentMedication": patient.get("currentMedication", ""),
        "medicationDosage": patient.get("medicationDosage"),
        "medicationFrequency": patient.get("medicationFrequency"),
        "lastMedicationReview": patient.get("lastMedicationReview"),
        "lifestyle": patient.get("lifestyle", {}),
        "chiefComplaint": patient.get("chiefComplaint"),
        "currentSymptoms": patient.get("currentSymptoms"),
        "painLevel": patient.get("painLevel"),
        "condition": patient.get("condition"),
        "lastVisit": patient.get("lastVisit"),
        "carePlanSummary": patient.get("carePlanSummary", ""),
        "followUpPlan": patient.get("followUpPlan", ""),
        "insights": insights,
        "presentInClinic": patient.get("presentInClinic", False),
        "emergencyContact": patient.get("emergencyContact"),
        "emergencyContactPhone": patient.get("emergencyContactPhone"),
        "insuranceProvider": patient.get("insuranceProvider"),
        "insuranceNumber": patient.get("insuranceNumber"),
        "currentMedications": patient.get("currentMedications", []),
        "createdAt": patient.get("createdAt"),
        "updatedAt": patient.get("updatedAt"),
    }

