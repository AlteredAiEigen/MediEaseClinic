"""
Patient service with CRUD operations and PHI encryption.
HIPAA Compliance: Sensitive fields are encrypted before storage.
"""

from datetime import datetime
from typing import Optional, List, Dict
from copy import deepcopy
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.patient import (
    PatientCreate,
    PatientUpdate,
    patient_helper,
    PatientInsights,
    DEFAULT_PATIENT_INSIGHTS,
    MedicalHistoryEntry,
)
from app.utils.security import field_encryption


class PatientService:
    """Service for handling patient operations with HIPAA compliance."""
    
    # Fields that contain sensitive PHI and should be encrypted
    ENCRYPTED_FIELDS = [
        "insuranceNumber",
        # Add other sensitive fields as needed
    ]
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.patients_collection = db.patients
    
    @staticmethod
    def _normalize_medical_history_payload(value) -> List[Dict[str, str]]:
        """Normalize incoming medical history payload to the stored structure."""
        if value is None:
            return []

        def to_entry(item) -> Optional[Dict[str, str]]:
            if isinstance(item, MedicalHistoryEntry):
                data = {k: v for k, v in item.model_dump().items() if v}
                return data or None
            if isinstance(item, dict):
                data: Dict[str, str] = {}
                for key in ["title", "diagnosis", "treatedBy", "recordedOn", "notes"]:
                    val = item.get(key)
                    if isinstance(val, str) and val.strip():
                        data[key] = val.strip()
                return data or None
            if isinstance(item, str):
                text = item.strip()
                return {"title": text} if text else None
            return None

        normalized: List[Dict[str, str]] = []
        if isinstance(value, list):
            for entry in value:
                parsed = to_entry(entry)
                if parsed:
                    normalized.append(parsed)
        else:
            parsed = to_entry(value)
            if parsed:
                normalized.append(parsed)
        return normalized

    async def generate_patient_id(self) -> str:
        """
        Generate unique patient ID (e.g., P001, P002).
        
        Returns:
            Unique patient ID
        """
        # Get the last patient
        last_patient = await self.patients_collection.find_one(
            {},
            sort=[("patientId", -1)]
        )
        
        if not last_patient or not last_patient.get("patientId"):
            return "P001"
        
        # Extract number from last patient ID and increment
        last_id = last_patient["patientId"]
        try:
            last_number = int(last_id[1:])
            new_number = last_number + 1
            return f"P{new_number:03d}"
        except:
            return "P001"
    
    async def create_patient(
        self,
        patient_data: PatientCreate,
        clinic_id: Optional[str] = None,
        clinic_name: Optional[str] = None
    ) -> dict:
        """
        Create a new patient with encrypted sensitive fields.
        
        Args:
            patient_data: Patient creation data
        
        Returns:
            Created patient data
        
        Raises:
            HTTPException: If patient creation fails
        """
        # Check if patient already exists
        existing_patient = await self.patients_collection.find_one(
            {"email": patient_data.email.lower()}
        )
        
        if existing_patient:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient already exists with this email"
            )
        
        # Generate patient ID
        patient_id = await self.generate_patient_id()
        
        # Prepare patient document
        patient_dict = patient_data.model_dump()
        patient_dict["patientId"] = patient_id
        patient_dict["email"] = patient_dict["email"].lower()
        patient_dict["createdAt"] = datetime.utcnow()
        patient_dict["updatedAt"] = datetime.utcnow()
        patient_dict.setdefault("condition", None)
        patient_dict.setdefault("carePlanSummary", "")
        patient_dict.setdefault("followUpPlan", "")
        patient_dict.setdefault("lastVisit", None)
        if "medicalHistory" in patient_dict:
            patient_dict["medicalHistory"] = self._normalize_medical_history_payload(
                patient_dict.get("medicalHistory")
            )
        if not patient_dict.get("insights"):
            patient_dict["insights"] = deepcopy(DEFAULT_PATIENT_INSIGHTS)
        else:
            # Ensure insights contains all keys
            merged_insights = deepcopy(DEFAULT_PATIENT_INSIGHTS)
            merged_insights.update({k: v for k, v in (patient_dict.get("insights") or {}).items() if v is not None})
            patient_dict["insights"] = merged_insights
        # Store clinic info for reference (which clinic created the patient)
        # but patients are universal and not restricted to this clinic
        if clinic_id:
            patient_dict["createdByClinicId"] = clinic_id
        if clinic_name:
            patient_dict["createdByClinicName"] = clinic_name
        
        # Encrypt sensitive fields
        patient_dict = field_encryption.encrypt_dict_fields(
            patient_dict,
            self.ENCRYPTED_FIELDS
        )
        
        # Insert into database
        result = await self.patients_collection.insert_one(patient_dict)
        
        # Retrieve created patient
        created_patient = await self.patients_collection.find_one({"_id": result.inserted_id})
        
        # Decrypt before returning
        created_patient = field_encryption.decrypt_dict_fields(
            created_patient,
            self.ENCRYPTED_FIELDS
        )
        
        return await patient_helper(created_patient)
    
    async def get_patient(self, patient_id: str) -> Optional[dict]:
        """
        Get patient by ID with decrypted sensitive fields.
        
        Args:
            patient_id: Patient MongoDB ID
        
        Returns:
            Patient data or None if not found
        """
        if not ObjectId.is_valid(patient_id):
            return None
        
        patient = await self.patients_collection.find_one({"_id": ObjectId(patient_id)})
        
        if not patient:
            return None
        
        # Decrypt sensitive fields
        patient = field_encryption.decrypt_dict_fields(
            patient,
            self.ENCRYPTED_FIELDS
        )
        
        return await patient_helper(patient)
    
    async def get_patient_by_patient_id(self, patient_id: str) -> Optional[dict]:
        """
        Get patient by patientId (e.g., P001).
        
        Args:
            patient_id: Patient ID (e.g., P001)
        
        Returns:
            Patient data or None if not found
        """
        patient = await self.patients_collection.find_one({"patientId": patient_id})
        
        if not patient:
            return None
        
        # Decrypt sensitive fields
        patient = field_encryption.decrypt_dict_fields(
            patient,
            self.ENCRYPTED_FIELDS
        )
        
        return await patient_helper(patient)
    
    async def list_patients(
        self,
        page: int = 1,
        limit: int = 10,
        search: Optional[str] = None,
        gender: Optional[str] = None,
        present_in_clinic: Optional[bool] = None,
        clinic_id: Optional[str] = None  # Kept for backward compatibility but not used for filtering
    ) -> tuple[List[dict], int]:
        """
        List patients with pagination and filtering.
        
        Patients are universal across all clinics - not filtered by clinic.
        clinic_id parameter is kept for backward compatibility but not used.
        
        Args:
            page: Page number (1-indexed)
            limit: Items per page
            search: Search term for name, phone, email
            gender: Filter by gender
            present_in_clinic: Filter by clinic presence
        
        Returns:
            Tuple of (patient list, total count)
        """
        # Build query
        query = {}
        
        if search:
            query["$or"] = [
                {"firstName": {"$regex": search, "$options": "i"}},
                {"lastName": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search, "$options": "i"}},
                {"patientId": {"$regex": search, "$options": "i"}},
            ]
        
        if gender:
            query["gender"] = gender
        
        if present_in_clinic is not None:
            query["presentInClinic"] = present_in_clinic
        
        # Note: clinic_id is NOT used for filtering - patients are universal
        
        # Calculate skip
        skip = (page - 1) * limit
        
        # Get total count
        total = await self.patients_collection.count_documents(query)
        
        # Get patients
        cursor = self.patients_collection.find(query).sort("createdAt", -1).skip(skip).limit(limit)
        patients = await cursor.to_list(length=limit)
        
        # Decrypt and format patients
        formatted_patients = []
        for patient in patients:
            patient = field_encryption.decrypt_dict_fields(
                patient,
                self.ENCRYPTED_FIELDS
            )
            formatted_patients.append(await patient_helper(patient))
        
        return formatted_patients, total
    
    async def update_patient(self, patient_id: str, update_data: PatientUpdate, updated_by: Optional[dict] = None) -> Optional[dict]:
        """
        Update patient information.
        
        Args:
            patient_id: Patient MongoDB ID
            update_data: Update data
        
        Returns:
            Updated patient data or None if not found
        
        Raises:
            HTTPException: If patient not found
        """
        if not ObjectId.is_valid(patient_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Check if patient exists
        existing_patient = await self.patients_collection.find_one({"_id": ObjectId(patient_id)})
        if not existing_patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )

        decrypted_existing = field_encryption.decrypt_dict_fields(
            deepcopy(existing_patient),
            self.ENCRYPTED_FIELDS
        )
        previous_snapshot = await patient_helper(decrypted_existing)
        
        # Prepare update data
        update_dict = update_data.model_dump(exclude_unset=True)

        if "medicalHistory" in update_dict:
            update_dict["medicalHistory"] = self._normalize_medical_history_payload(
                update_dict.get("medicalHistory")
            )
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Encrypt sensitive fields
        if update_dict.get("email"):
            update_dict["email"] = update_dict["email"].lower()

        update_dict = field_encryption.encrypt_dict_fields(
            update_dict,
            self.ENCRYPTED_FIELDS
        )
        
        # Add updated timestamp
        update_dict["updatedAt"] = datetime.utcnow()
        
        # Update patient
        await self.patients_collection.update_one(
            {"_id": ObjectId(patient_id)},
            {"$set": update_dict}
        )
        
        # Retrieve updated patient
        updated_patient = await self.patients_collection.find_one({"_id": ObjectId(patient_id)})
        
        # Decrypt sensitive fields
        updated_patient = field_encryption.decrypt_dict_fields(
            updated_patient,
            self.ENCRYPTED_FIELDS
        )
        
        formatted_patient = await patient_helper(updated_patient)
        await self._log_patient_history(previous_snapshot, formatted_patient, updated_by)
        
        return formatted_patient
    
    async def _log_patient_history(
        self,
        previous_snapshot: Optional[dict],
        updated_snapshot: Optional[dict],
        updated_by: Optional[dict]
    ):
        """Record detailed patient change history."""
        if not updated_by or not previous_snapshot or not updated_snapshot:
            return
        
        tracked_fields = [
            ("firstName", "First Name"),
            ("lastName", "Last Name"),
            ("email", "Email"),
            ("phone", "Phone"),
            ("gender", "Gender"),
            ("dateOfBirth", "Date of Birth"),
            ("bloodGroup", "Blood Group"),
            ("address", "Address"),
            ("medicalHistory", "Medical History"),
            ("allergies", "Allergies"),
            ("emergencyContact", "Emergency Contact"),
            ("emergencyContactPhone", "Emergency Contact Phone"),
            ("carePlanSummary", "Care Plan Summary"),
            ("followUpPlan", "Follow-up Plan"),
            ("condition", "Current Condition"),
            ("chiefComplaint", "Chief Complaint"),
            ("presentInClinic", "Clinic Presence"),
            ("currentMedications", "Current Medications"),
        ]
        
        def normalize_value(field_name: str, value):
            if value is None:
                return ""
            if field_name == "medicalHistory":
                normalized_history = PatientService._normalize_medical_history_payload(value)
                if not normalized_history:
                    return ""
                formatted_entries = []
                for entry in normalized_history:
                    parts = [
                        entry.get("title"),
                        entry.get("diagnosis"),
                        entry.get("treatedBy"),
                        entry.get("recordedOn"),
                    ]
                    summary = ", ".join(part for part in parts if part)
                    notes = entry.get("notes")
                    if notes:
                        summary = f"{summary} - {notes}" if summary else notes
                    formatted_entries.append(summary.strip())
                return "; ".join(item for item in formatted_entries if item)
            if field_name == "allergies":
                if isinstance(value, list):
                    return ", ".join([str(item).strip() for item in value if str(item).strip()])
                return str(value).strip()
            if field_name == "currentMedications":
                if isinstance(value, list):
                    return "; ".join(
                        [
                            ", ".join(
                                f"{key}: {val}"
                                for key, val in entry.items()
                                if val
                            )
                            for entry in value
                        ]
                    )
                return str(value).strip()
            if field_name == "presentInClinic":
                return "Yes" if value else "No"
            return str(value).strip()
        
        changes = []
        for field, label in tracked_fields:
            old_value = normalize_value(field, previous_snapshot.get(field))
            new_value = normalize_value(field, updated_snapshot.get(field))
            if old_value == new_value:
                continue
            changes.append(
                {
                    "field": field,
                    "label": label,
                    "oldValue": old_value,
                    "newValue": new_value,
                }
            )
        
        if not changes:
            return
        
        user_name = " ".join(
            part
            for part in [
                updated_by.get("firstName", ""),
                updated_by.get("lastName", ""),
            ]
            if part
        ).strip() or updated_by.get("email")
        
        entry = {
            "patientObjectId": updated_snapshot.get("_id"),
            "patientId": updated_snapshot.get("patientId"),
            "changes": changes,
            "changedAt": datetime.utcnow(),
            "updatedBy": {
                "userId": str(updated_by.get("_id")) if updated_by.get("_id") else None,
                "name": user_name,
                "role": updated_by.get("role"),
                "email": updated_by.get("email"),
            },
        }
        
        await self.db.patient_history.insert_one(entry)
    
    async def get_patient_history(
        self,
        patient_id: str,
        field_filter: Optional[str] = None,
        limit: int = 50
    ) -> List[dict]:
        """Fetch patient history entries for auditing purposes."""
        query = {"patientId": patient_id}
        if field_filter:
            query["changes.field"] = field_filter
        
        cursor = (
            self.db.patient_history
            .find(query)
            .sort("changedAt", -1)
            .limit(limit)
        )
        entries = await cursor.to_list(length=limit)
        for entry in entries:
            entry["_id"] = str(entry["_id"])
        return entries
    
    async def delete_patient(self, patient_id: str) -> bool:
        """
        Soft delete patient (mark as inactive rather than removing).
        HIPAA requires maintaining records, so we don't hard delete.
        
        Args:
            patient_id: Patient MongoDB ID
        
        Returns:
            True if deleted successfully
        
        Raises:
            HTTPException: If patient not found
        """
        if not ObjectId.is_valid(patient_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        result = await self.patients_collection.update_one(
            {"_id": ObjectId(patient_id)},
            {
                "$set": {
                    "isActive": False,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        return True
    
    async def search_patients(self, query: str, clinic_id: Optional[str] = None) -> List[dict]:
        """
        Search patients by multiple fields.
        
        Patients are universal across all clinics - not filtered by clinic.
        clinic_id parameter is kept for backward compatibility but not used.
        
        Args:
            query: Search query
        
        Returns:
            List of matching patients
        """
        search_query = {
            "$or": [
                {"firstName": {"$regex": query, "$options": "i"}},
                {"lastName": {"$regex": query, "$options": "i"}},
                {"email": {"$regex": query, "$options": "i"}},
                {"phone": {"$regex": query, "$options": "i"}},
                {"patientId": {"$regex": query, "$options": "i"}},
            ]
        }
        
        # Note: clinic_id is NOT used for filtering - patients are universal
        
        cursor = self.patients_collection.find(search_query).limit(20)
        patients = await cursor.to_list(length=20)
        
        # Decrypt and format
        formatted_patients = []
        for patient in patients:
            patient = field_encryption.decrypt_dict_fields(
                patient,
                self.ENCRYPTED_FIELDS
            )
            formatted_patients.append(await patient_helper(patient))
        
        return formatted_patients

