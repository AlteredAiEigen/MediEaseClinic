"""
Clinical Note service - Business logic for clinical notes management.
"""

import logging
from datetime import datetime
from typing import List, Optional, Dict
from bson import ObjectId
from fastapi import HTTPException, status

from app.database import db
from app.models.clinical_note import ClinicalNote, ClinicalNoteInDB
from app.schemas.clinical_note import (
    ClinicalNoteCreate,
    ClinicalNoteUpdate,
    GenerateFromTranscriptRequest
)
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

def get_notes_collection():
    """Get clinical notes collection."""
    if db is None:
        raise Exception("Database not initialized")
    return db["clinical_notes"]


class ClinicalNoteService:
    """Service for managing clinical notes."""
    
    @staticmethod
    async def generate_note_id() -> str:
        """Generate unique note ID."""
        timestamp = str(int(datetime.now().timestamp() * 1000))[-8:]
        return f"NOTE{timestamp}"
    
    @staticmethod
    async def create_note(note_data: ClinicalNoteCreate, created_by: str) -> ClinicalNoteInDB:
        """Create a new clinical note."""
        try:
            # Generate note ID
            note_id = await ClinicalNoteService.generate_note_id()
            
            # Prepare note document
            note_dict = note_data.dict(by_alias=True, exclude_unset=True)
            note_dict["note_id"] = note_id
            note_dict["created_at"] = datetime.utcnow()
            note_dict["updated_at"] = datetime.utcnow()
            
            # Populate patient and doctor names
            patient = await db["patients"].find_one({"_id": ObjectId(note_data.patient)})
            if patient:
                note_dict["patient_name"] = f"{patient['firstName']} {patient['lastName']}"
            
            doctor = await db["users"].find_one({"_id": ObjectId(note_data.doctor)})
            if doctor:
                note_dict["doctor_name"] = f"{doctor['firstName']} {doctor['lastName']}"
            
            # Insert note
            result = await get_notes_collection().insert_one(note_dict)
            note_dict["_id"] = str(result.inserted_id)
            
            logger.info(f"Created clinical note {note_id} for patient {note_data.patient}")
            return ClinicalNoteInDB(**note_dict)
        
        except Exception as e:
            logger.error(f"Error creating clinical note: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create clinical note: {str(e)}"
            )
    
    @staticmethod
    async def get_notes(
        patient_id: Optional[str] = None,
        doctor_id: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        actionable: Optional[bool] = None,
        page: int = 1,
        limit: int = 10
    ) -> tuple[List[Dict], int]:
        """Get clinical notes with filters."""
        try:
            # Build query
            query = {}
            if patient_id:
                query["patient"] = patient_id
            if doctor_id:
                query["doctor"] = doctor_id
            if category:
                query["category"] = category
            if priority:
                query["priority"] = priority
            if actionable is not None:
                query["actionable"] = actionable
            
            # Get total count
            total = await get_notes_collection().count_documents(query)
            
            # Get paginated results
            skip = (page - 1) * limit
            cursor = get_notes_collection().find(query).sort("created_at", -1).skip(skip).limit(limit)
            notes = await cursor.to_list(length=limit)
            
            # Convert ObjectId to string
            for note in notes:
                note["_id"] = str(note["_id"])
            
            return notes, total
        
        except Exception as e:
            logger.error(f"Error fetching clinical notes: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch clinical notes: {str(e)}"
            )
    
    @staticmethod
    async def get_note_by_id(note_id: str) -> Optional[Dict]:
        """Get clinical note by ID."""
        try:
            note = await get_notes_collection().find_one({"_id": ObjectId(note_id)})
            if note:
                note["_id"] = str(note["_id"])
                return note
            return None
        
        except Exception as e:
            logger.error(f"Error fetching clinical note: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch clinical note: {str(e)}"
            )
    
    @staticmethod
    async def update_note(note_id: str, update_data: ClinicalNoteUpdate) -> Optional[Dict]:
        """Update clinical note."""
        try:
            update_dict = update_data.dict(exclude_unset=True)
            update_dict["updated_at"] = datetime.utcnow()
            
            result = await get_notes_collection().find_one_and_update(
                {"_id": ObjectId(note_id)},
                {"$set": update_dict},
                return_document=True
            )
            
            if result:
                result["_id"] = str(result["_id"])
                logger.info(f"Updated clinical note {note_id}")
                return result
            return None
        
        except Exception as e:
            logger.error(f"Error updating clinical note: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update clinical note: {str(e)}"
            )
    
    @staticmethod
    async def delete_note(note_id: str) -> bool:
        """Delete clinical note."""
        try:
            result = await get_notes_collection().delete_one({"_id": ObjectId(note_id)})
            if result.deleted_count > 0:
                logger.info(f"Deleted clinical note {note_id}")
                return True
            return False
        
        except Exception as e:
            logger.error(f"Error deleting clinical note: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete clinical note: {str(e)}"
            )
    
    @staticmethod
    async def get_actionable_notes(
        patient_id: Optional[str] = None,
        doctor_id: Optional[str] = None
    ) -> List[Dict]:
        """Get actionable notes (pending action items)."""
        try:
            query = {
                "actionable": True,
                "completed": False
            }
            if patient_id:
                query["patient"] = patient_id
            if doctor_id:
                query["doctor"] = doctor_id
            
            cursor = get_notes_collection().find(query).sort([("priority", -1), ("created_at", -1)])
            notes = await cursor.to_list(length=None)
            
            for note in notes:
                note["_id"] = str(note["_id"])
            
            return notes
        
        except Exception as e:
            logger.error(f"Error fetching actionable notes: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch actionable notes: {str(e)}"
            )
    
    @staticmethod
    async def mark_note_complete(note_id: str, completed_by: str) -> Optional[Dict]:
        """Mark note as complete."""
        try:
            result = await get_notes_collection().find_one_and_update(
                {"_id": ObjectId(note_id)},
                {
                    "$set": {
                        "completed": True,
                        "completed_at": datetime.utcnow(),
                        "completed_by": completed_by,
                        "updated_at": datetime.utcnow()
                    }
                },
                return_document=True
            )
            
            if result:
                result["_id"] = str(result["_id"])
                logger.info(f"Marked clinical note {note_id} as complete")
                return result
            return None
        
        except Exception as e:
            logger.error(f"Error marking note complete: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to mark note complete: {str(e)}"
            )
    
    @staticmethod
    async def generate_from_transcript(request: GenerateFromTranscriptRequest) -> Dict:
        """Generate clinical note from transcript using AI."""
        try:
            # Get patient context
            patient = await db["patients"].find_one({"_id": ObjectId(request.patient_id)})
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Patient not found"
                )
            
            # Build patient context
            patient_context = f"""
Patient: {patient.get('firstName')} {patient.get('lastName')}
Age: {patient.get('age')}
Medical History: {patient.get('medicalHistory', 'None')}
Allergies: {', '.join(patient.get('allergies', []))}
Current Medications: {patient.get('currentMedication', 'None')}
"""
            
            # Generate notes using AI
            ai_notes = await ai_service.generate_clinical_notes(
                request.transcript,
                patient_context
            )
            
            logger.info(f"Generated AI clinical notes for patient {request.patient_id}")
            return ai_notes
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error generating notes from transcript: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate notes: {str(e)}"
            )


# Service instance
clinical_note_service = ClinicalNoteService()

