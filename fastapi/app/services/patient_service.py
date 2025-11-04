"""
Patient service with CRUD operations and PHI encryption.
HIPAA Compliance: Sensitive fields are encrypted before storage.
"""

from datetime import datetime
from typing import Optional, List, Dict
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.patient import PatientCreate, PatientUpdate, patient_helper
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
    
    async def create_patient(self, patient_data: PatientCreate) -> dict:
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
        present_in_clinic: Optional[bool] = None
    ) -> tuple[List[dict], int]:
        """
        List patients with pagination and filtering.
        
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
    
    async def update_patient(self, patient_id: str, update_data: PatientUpdate) -> Optional[dict]:
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
        
        # Prepare update data
        update_dict = update_data.model_dump(exclude_unset=True)
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Encrypt sensitive fields
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
        
        return await patient_helper(updated_patient)
    
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
    
    async def search_patients(self, query: str) -> List[dict]:
        """
        Search patients by multiple fields.
        
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

