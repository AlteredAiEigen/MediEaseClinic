"""
Prescription service for managing patient prescriptions.
"""

from datetime import datetime
from typing import Optional, List
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.prescription import PrescriptionCreate, PrescriptionUpdate, prescription_helper


class PrescriptionService:
    """Service for handling prescription operations."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.prescriptions_collection = db.prescriptions
        self.patients_collection = db.patients
        self.users_collection = db.users
    
    async def generate_prescription_id(self) -> str:
        """Generate unique prescription ID."""
        timestamp = int(datetime.now().timestamp() * 1000)
        return f"RX{str(timestamp)[-8:]}"
    
    async def populate_names(self, prescription: dict) -> dict:
        """Populate patient and doctor names."""
        if prescription.get("patientId"):
            patient = await self.patients_collection.find_one({"_id": ObjectId(prescription["patientId"])})
            if patient:
                prescription["patientName"] = f"{patient['firstName']} {patient['lastName']}"
        
        if prescription.get("doctorId"):
            doctor = await self.users_collection.find_one({"_id": ObjectId(prescription["doctorId"])})
            if doctor:
                prescription["doctorName"] = f"{doctor['firstName']} {doctor['lastName']}"
        
        return prescription
    
    async def create_prescription(self, prescription_data: PrescriptionCreate) -> dict:
        """Create new prescription."""
        # Validate patient
        patient = await self.patients_collection.find_one({"_id": ObjectId(prescription_data.patientId)})
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Validate doctor
        doctor = await self.users_collection.find_one({"_id": ObjectId(prescription_data.doctorId)})
        if not doctor or doctor.get("role") != "doctor":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )
        
        # Generate prescription ID
        prescription_id = await self.generate_prescription_id()
        
        # Prepare document
        prescription_dict = prescription_data.model_dump()
        prescription_dict["prescriptionId"] = prescription_id
        prescription_dict["prescribedAt"] = datetime.utcnow()
        prescription_dict["createdAt"] = datetime.utcnow()
        prescription_dict["updatedAt"] = datetime.utcnow()
        
        # Populate names
        prescription_dict = await self.populate_names(prescription_dict)
        
        # Insert
        result = await self.prescriptions_collection.insert_one(prescription_dict)
        created_prescription = await self.prescriptions_collection.find_one({"_id": result.inserted_id})
        
        return await prescription_helper(created_prescription)
    
    async def get_prescription(self, prescription_id: str) -> Optional[dict]:
        """Get prescription by ID."""
        if not ObjectId.is_valid(prescription_id):
            return None
        
        prescription = await self.prescriptions_collection.find_one({"_id": ObjectId(prescription_id)})
        
        if not prescription:
            return None
        
        return await prescription_helper(prescription)
    
    async def list_prescriptions(
        self,
        page: int = 1,
        limit: int = 10,
        patient_id: Optional[str] = None,
        doctor_id: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> tuple[List[dict], int]:
        """List prescriptions with filtering."""
        query = {}
        
        if patient_id:
            query["patientId"] = patient_id
        
        if doctor_id:
            query["doctorId"] = doctor_id
        
        if is_active is not None:
            query["isActive"] = is_active
        
        skip = (page - 1) * limit
        total = await self.prescriptions_collection.count_documents(query)
        
        cursor = self.prescriptions_collection.find(query).sort("prescribedAt", -1).skip(skip).limit(limit)
        prescriptions = await cursor.to_list(length=limit)
        
        formatted = []
        for prescription in prescriptions:
            formatted.append(await prescription_helper(prescription))
        
        return formatted, total
    
    async def update_prescription(self, prescription_id: str, update_data: PrescriptionUpdate) -> Optional[dict]:
        """Update prescription."""
        if not ObjectId.is_valid(prescription_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found"
            )
        
        existing = await self.prescriptions_collection.find_one({"_id": ObjectId(prescription_id)})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found"
            )
        
        update_dict = update_data.model_dump(exclude_unset=True)
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        update_dict["updatedAt"] = datetime.utcnow()
        
        await self.prescriptions_collection.update_one(
            {"_id": ObjectId(prescription_id)},
            {"$set": update_dict}
        )
        
        updated = await self.prescriptions_collection.find_one({"_id": ObjectId(prescription_id)})
        return await prescription_helper(updated)
    
    async def delete_prescription(self, prescription_id: str) -> bool:
        """Soft delete prescription."""
        if not ObjectId.is_valid(prescription_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found"
            )
        
        result = await self.prescriptions_collection.update_one(
            {"_id": ObjectId(prescription_id)},
            {"$set": {"isActive": False, "updatedAt": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found"
            )
        
        return True

