"""
Prescription service for managing patient prescriptions.
"""

from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import re
import logging

from app.models.prescription import PrescriptionCreate, PrescriptionUpdate, prescription_helper

logger = logging.getLogger(__name__)


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
        
        # Insert prescription
        result = await self.prescriptions_collection.insert_one(prescription_dict)
        created_prescription = await self.prescriptions_collection.find_one({"_id": result.inserted_id})
        
        # Update patient's current medications list
        try:
            # Convert medications to patient medication format
            patient_medications = []
            for med in prescription_data.medications:
                # Get instructions from medication or from prescription notes
                med_instructions = ""
                if hasattr(med, 'instructions') and med.instructions:
                    med_instructions = med.instructions
                elif prescription_data.notes:
                    med_instructions = prescription_data.notes
                
                medication_entry = {
                    "name": med.name,
                    "dosage": med.dosage,
                    "frequency": med.frequency,
                    "duration": med.duration,
                    "instructions": med_instructions,
                    "startDate": datetime.utcnow().strftime("%Y-%m-%d"),
                    "endDate": "",  # No end date for active medications
                }
                # Calculate end date from duration if provided
                if med.duration:
                    try:
                        # Try to parse duration like "2 weeks", "1 month", etc.
                        duration_match = re.match(r'(\d+)\s*(day|days|week|weeks|month|months)', med.duration.lower())
                        if duration_match:
                            amount = int(duration_match.group(1))
                            unit = duration_match.group(2)
                            if 'week' in unit:
                                delta = timedelta(weeks=amount)
                            elif 'month' in unit:
                                delta = timedelta(days=amount * 30)
                            else:
                                delta = timedelta(days=amount)
                            end_date = datetime.utcnow() + delta
                            medication_entry["endDate"] = end_date.strftime("%Y-%m-%d")
                    except:
                        pass  # If duration parsing fails, leave endDate empty
                
                patient_medications.append(medication_entry)
            
            # Get existing medications or initialize empty list
            existing_medications = patient.get("currentMedications", [])
            if not isinstance(existing_medications, list):
                existing_medications = []
            
            # Merge new medications with existing ones (avoid duplicates based on name)
            existing_names = {med.get("name", "").lower() for med in existing_medications if isinstance(med, dict)}
            new_medications = [med for med in patient_medications if med["name"].lower() not in existing_names]
            
            if new_medications:
                updated_medications = existing_medications + new_medications
                await self.patients_collection.update_one(
                    {"_id": ObjectId(prescription_data.patientId)},
                    {"$set": {
                        "currentMedications": updated_medications,
                        "updatedAt": datetime.utcnow()
                    }}
                )
        except Exception as e:
            # Log error but don't fail prescription creation if medication update fails
            logger.warning(f"Failed to update patient medications for prescription: {e}")
        
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

