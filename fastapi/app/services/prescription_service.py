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


def _parse_prescribed_tests_from_notes(notes: Optional[str]) -> str:
    for line in (notes or "").split("\n"):
        trimmed = line.strip()
        if trimmed.lower().startswith("tests:"):
            return trimmed[6:].strip()
    return ""


def _build_prescription_summary(medications) -> str:
    lines = []
    for med in medications:
        lines.append(f"{med.name} — {med.dosage} — {med.frequency} — {med.duration}")
    return "\n".join(lines)


def _medications_to_appointment_format(medications) -> List[dict]:
    return [
        {
            "name": med.name,
            "dosage": med.dosage,
            "frequency": med.frequency,
            "duration": med.duration,
            "instructions": med.instructions or "",
        }
        for med in medications
    ]


class PrescriptionService:
    """Service for handling prescription operations."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.prescriptions_collection = db.prescriptions
        self.patients_collection = db.patients
        self.users_collection = db.users
        self.appointments_collection = db.appointments
        self.queue_collection = db.queue
    
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

        if prescription_data.appointmentId:
            existing_for_appointment = await self.prescriptions_collection.find_one(
                {"appointmentId": prescription_data.appointmentId}
            )
            if existing_for_appointment:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "This appointment already has a prescription. "
                        "An appointment can have only one prescription."
                    ),
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

        try:
            from app.services.prescription_catalog_service import PrescriptionCatalogService

            catalog_service = PrescriptionCatalogService(self.db)
            await catalog_service.upsert_many_from_prescription(
                [med.model_dump() for med in prescription_data.medications],
                created_by=prescription_data.doctorId,
            )
        except Exception as e:
            logger.warning(f"Failed to update prescription catalog cache: {e}")

        await self._sync_consultation_after_prescription(
            prescription_data,
            str(result.inserted_id),
            prescription_id,
        )

        return await prescription_helper(created_prescription)
    
    async def _sync_consultation_after_prescription(
        self,
        prescription_data,
        prescription_mongo_id: str,
        prescription_id: str,
    ) -> None:
        """Mirror prescription fields onto linked appointment and queue entries."""
        prescribed_medications = _medications_to_appointment_format(prescription_data.medications)
        prescription_summary = _build_prescription_summary(prescription_data.medications)
        prescribed_test = _parse_prescribed_tests_from_notes(prescription_data.notes)
        diagnosis = (prescription_data.diagnosis or "").strip()

        appointment_id = getattr(prescription_data, "appointmentId", None)
        queue_id = getattr(prescription_data, "queueId", None)

        if appointment_id and ObjectId.is_valid(appointment_id):
            try:
                appointment_update = {
                    "prescribedMedications": prescribed_medications,
                    "prescription": prescription_summary,
                    "lastPrescriptionId": prescription_id,
                    "prescriptionId": prescription_mongo_id,
                    "updatedAt": datetime.utcnow(),
                }
                if diagnosis:
                    appointment_update["diagnosis"] = diagnosis
                if prescribed_test:
                    appointment_update["prescribedTest"] = prescribed_test

                await self.appointments_collection.update_one(
                    {"_id": ObjectId(appointment_id)},
                    {"$set": appointment_update},
                )
            except Exception as e:
                logger.warning(f"Failed to update appointment for prescription: {e}")

        if queue_id and ObjectId.is_valid(queue_id):
            try:
                queue_update = {
                    "prescription": prescription_summary,
                    "updated_at": datetime.utcnow(),
                }
                if diagnosis:
                    queue_update["diagnosis"] = diagnosis
                if prescribed_test:
                    queue_update["prescribedTest"] = prescribed_test

                await self.queue_collection.update_one(
                    {"_id": ObjectId(queue_id)},
                    {"$set": queue_update},
                )
            except Exception as e:
                logger.warning(f"Failed to update queue for prescription: {e}")

    async def get_latest_consultation_prescription(
        self,
        appointment_id: Optional[str] = None,
        queue_id: Optional[str] = None,
    ) -> Optional[dict]:
        """Return the most recent active prescription for a consultation appointment or queue entry."""
        if appointment_id:
            query: dict = {"appointmentId": appointment_id, "isActive": {"$ne": False}}
        elif queue_id:
            query = {"queueId": queue_id, "isActive": {"$ne": False}}
        else:
            return None

        prescription = await self.prescriptions_collection.find_one(
            query,
            sort=[("updatedAt", -1), ("prescribedAt", -1), ("createdAt", -1)],
        )
        if not prescription:
            return None
        return await prescription_helper(prescription)

    async def list_consultation_prescriptions(
        self,
        appointment_id: Optional[str] = None,
        queue_id: Optional[str] = None,
        include_inactive: bool = True,
    ) -> List[dict]:
        """List prescriptions for a consultation (newest first)."""
        if appointment_id:
            query: dict = {"appointmentId": appointment_id}
        elif queue_id:
            query = {"queueId": queue_id}
        else:
            return []

        if not include_inactive:
            query["isActive"] = {"$ne": False}

        cursor = self.prescriptions_collection.find(query).sort(
            [("updatedAt", -1), ("prescribedAt", -1), ("createdAt", -1)]
        )
        rows = await cursor.to_list(length=50)
        return [await prescription_helper(row) for row in rows]
    
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
        """Update prescription. Blocked after WhatsApp send for the linked appointment."""
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

        appointment_id = existing.get("appointmentId")
        if appointment_id and ObjectId.is_valid(str(appointment_id)):
            appointment = await self.appointments_collection.find_one(
                {"_id": ObjectId(str(appointment_id))}
            )
            if appointment and (
                appointment.get("prescriptionWhatsappSent")
                or appointment.get("prescriptionFinalized")
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "This prescription was already completed. "
                        "Create a new prescription if you need to change medicines or tests."
                    ),
                )
        
        update_dict = update_data.model_dump(exclude_unset=True)
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        update_dict["updatedAt"] = datetime.utcnow()
        # Ensure updates keep the draft active (fixes soft-delete + reopen PUT mismatch)
        update_dict["isActive"] = True
        
        await self.prescriptions_collection.update_one(
            {"_id": ObjectId(prescription_id)},
            {"$set": update_dict}
        )

        # A changed draft must not reuse an older PDF. Leave the old S3 object
        # for the PDF service to replace, but clear its appointment link so the
        # next Save, Print, or WhatsApp action regenerates it.
        changed_fields = (
            "medications",
            "diagnosis",
            "notes",
            "language",
            "imageUrl",
            "imagePublicId",
        )
        content_changed = any(
            field in update_dict and update_dict[field] != existing.get(field)
            for field in changed_fields
        )
        if content_changed and appointment_id and ObjectId.is_valid(str(appointment_id)):
            await self.appointments_collection.update_one(
                {"_id": ObjectId(str(appointment_id))},
                {
                    "$unset": {
                        "prescriptionFileUrl": "",
                        "prescriptionFileKey": "",
                        "prescriptionFileName": "",
                        "prescriptionFileType": "",
                        "prescriptionUploadedAt": "",
                        "prescriptionUploadedBy": "",
                        "prescriptionUploadedByName": "",
                    },
                    "$set": {"updatedAt": datetime.utcnow()},
                },
            )
            await self.prescriptions_collection.update_one(
                {"_id": ObjectId(prescription_id)},
                {
                    "$unset": {
                        "pdfS3Key": "",
                        "pdfUrl": "",
                        "pdfGeneratedAt": "",
                    }
                },
            )
        
        updated = await self.prescriptions_collection.find_one({"_id": ObjectId(prescription_id)})

        if update_data.medications is not None:
            from app.models.prescription import PrescriptionCreate

            sync_payload = PrescriptionCreate(
                patientId=str(existing["patientId"]),
                doctorId=str(existing["doctorId"]),
                appointmentId=existing.get("appointmentId"),
                queueId=existing.get("queueId"),
                medications=update_data.medications,
                diagnosis=update_data.diagnosis if update_data.diagnosis is not None else existing.get("diagnosis", ""),
                notes=update_data.notes if update_data.notes is not None else existing.get("notes", ""),
            )
            await self._sync_consultation_after_prescription(
                sync_payload,
                prescription_id,
                existing.get("prescriptionId", prescription_id),
            )

        return await prescription_helper(updated)
    
    async def get_latest_for_appointment(self, appointment_id: str) -> Optional[dict]:
        """Get the most recent active prescription linked to an appointment."""
        if not appointment_id:
            return None

        prescription = await self.prescriptions_collection.find_one(
            {"appointmentId": appointment_id, "isActive": {"$ne": False}},
            sort=[("updatedAt", -1), ("createdAt", -1)],
        )
        if not prescription:
            return None
        return await prescription_helper(prescription)
    
    async def start_new_prescription_after_send(self, appointment_id: str) -> dict:
        """Reject legacy create-new requests: one prescription belongs to one appointment."""
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This appointment already has its prescription. "
                "Creating another prescription for the same appointment is not allowed."
            ),
        )

    async def delete_prescription(self, prescription_id: str) -> bool:
        """Hard-delete prescription so no row remains in the prescriptions table."""
        if not ObjectId.is_valid(prescription_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found"
            )

        existing = await self.prescriptions_collection.find_one(
            {"_id": ObjectId(prescription_id)}
        )
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found"
            )

        result = await self.prescriptions_collection.delete_one(
            {"_id": ObjectId(prescription_id)}
        )

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found"
            )

        appointment_id = existing.get("appointmentId")
        if appointment_id and ObjectId.is_valid(str(appointment_id)):
            remaining = await self.prescriptions_collection.count_documents(
                {"appointmentId": str(appointment_id), "isActive": {"$ne": False}}
            )
            clear_fields = {
                "updatedAt": datetime.utcnow(),
            }
            if remaining == 0:
                clear_fields.update(
                    {
                        "prescriptionWhatsappSent": False,
                        "prescriptionWhatsappSentAt": None,
                        "diagnosis": "",
                        "prescribedTest": "",
                        "followUpInstructions": "",
                        "prescription": "",
                    }
                )
            await self.appointments_collection.update_one(
                {"_id": ObjectId(str(appointment_id))},
                {"$set": clear_fields},
            )

        return True

