"""
Queue service - Business logic for patient queue management.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Sequence
from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.queue import Queue, QueueInDB
from app.schemas.queue import QueueCheckIn, QueueStatusUpdate
from app.services.websocket_service import WebSocketService

logger = logging.getLogger(__name__)


class QueueService:
    """Service for managing patient queue."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.queue_collection = db.queue
        self.websocket_service = WebSocketService()

    @staticmethod
    async def generate_queue_id() -> str:
        """Generate unique queue ID."""
        timestamp = str(int(datetime.now().timestamp() * 1000))[-8:]
        return f"Q{timestamp}"
    
    async def get_next_queue_number(self, doctor_id: str) -> int:
        """Get next queue number for doctor today."""
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        
        # Convert doctor_id to ObjectId if it's a valid ObjectId string
        doctor_object_id = ObjectId(doctor_id) if ObjectId.is_valid(doctor_id) else doctor_id
        
        count = await self.queue_collection.count_documents({
            "doctor": doctor_object_id,
            "created_at": {"$gte": today, "$lt": tomorrow}
        })
        
        return count + 1
    
    async def cleanup_all_stale_entries(self) -> None:
        """Run all cleanup tasks to remove stale queue entries and appointments."""
        await self._cleanup_stale_queue_entries()
        await self._cleanup_old_checked_in_appointments()

    async def _cleanup_stale_queue_entries(self) -> None:
        """Cancel queue entries from previous days that never started."""
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        stale_entries = await self.queue_collection.find({
            "checked_in_at": {"$lt": today_start},
            "is_active": True,
            "status": {"$in": ["waiting", "in-consultation"]}
        }).to_list(length=None)

        for entry in stale_entries:
            entry_id = entry["_id"]
            logger.info("Cancelling stale queue entry %s", entry_id)

            await self.queue_collection.update_one(
                {"_id": entry_id},
                {
                    "$set": {
                        "status": "cancelled",
                        "is_active": False,
                        "cancelled_at": datetime.utcnow(),
                        "cancellation_reason": "Auto-cancelled: Checked-in entry from previous day",
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            appointment_id = entry.get("appointment")
            if appointment_id:
                if isinstance(appointment_id, str) and ObjectId.is_valid(appointment_id):
                    appointment_id = ObjectId(appointment_id)
                await self.db["appointments"].update_one(
                    {"_id": appointment_id},
                    {
                        "$set": {
                            "status": "cancelled",
                            "cancelledAt": datetime.utcnow(),
                            "cancellationReason": "Auto-cancelled: Queue entry from previous day",
                            "updatedAt": datetime.utcnow()
                        }
                    }
                )

    async def _cleanup_old_checked_in_appointments(self) -> None:
        """Cancel appointments that remain checked-in after their scheduled date."""
        today_str = datetime.utcnow().strftime("%Y-%m-%d")

        stale_appointments = await self.db["appointments"].find({
            "status": "checked-in",
            "date": {"$lt": today_str}
        }).to_list(length=None)

        for appointment in stale_appointments:
            appointment_id = appointment["_id"]
            logger.info("Cancelling stale checked-in appointment %s", appointment_id)

            await self.db["appointments"].update_one(
                {"_id": appointment_id},
                {
                    "$set": {
                        "status": "cancelled",
                        "cancelledAt": datetime.utcnow(),
                        "cancellationReason": "Auto-cancelled: Checked-in from previous day",
                        "updatedAt": datetime.utcnow()
                    }
                }
            )

            await self.queue_collection.update_many(
                {
                    "appointment": appointment_id,
                    "is_active": True
                },
                {
                    "$set": {
                        "status": "cancelled",
                        "is_active": False,
                        "cancelled_at": datetime.utcnow(),
                        "cancellation_reason": "Auto-cancelled: Associated appointment from previous day",
                        "updated_at": datetime.utcnow()
                    }
                }
            )
    
    async def check_in_patient(self, check_in_data: QueueCheckIn, checked_in_by: str) -> QueueInDB:
        """Check in a patient to the queue via appointment."""
        try:
            # Validate appointment_id
            if not check_in_data.appointment_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Appointment ID is required for check-in"
                )
            
            try:
                appointment_object_id = ObjectId(check_in_data.appointment_id)
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid appointment ID format"
                )
            
            # Get appointment details
            appointment = await self.db["appointments"].find_one({"_id": appointment_object_id})
            if not appointment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Appointment not found"
                )
            
            # Check appointment status - should be scheduled
            if appointment.get("status") not in ["scheduled"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot check in appointment with status: {appointment.get('status')}"
                )
            
            # Get patient and doctor IDs from appointment
            patient_object_id = appointment.get("patientId")
            doctor_object_id = appointment.get("doctorId")
            
            if not patient_object_id or not doctor_object_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Appointment is missing patient or doctor information"
                )
            
            # Convert to ObjectId if they're strings
            if isinstance(patient_object_id, str):
                patient_object_id = ObjectId(patient_object_id)
            if isinstance(doctor_object_id, str):
                doctor_object_id = ObjectId(doctor_object_id)
            
            # Clean up any stale entries before attempting check-in
            await self.cleanup_all_stale_entries()

            # Check if patient already has an active queue entry for the same appointment time
            appointment_date = appointment.get("date")
            appointment_time = appointment.get("time")

            if appointment_date and appointment_time:
                existing_entries = await self.queue_collection.find({
                    "patient": patient_object_id,
                    "is_active": True,
                    "status": {"$in": ["waiting", "in-consultation"]}
                }).to_list(length=None)

                for entry in existing_entries:
                    existing_appointment_id = entry.get("appointment")
                    if existing_appointment_id:
                        if isinstance(existing_appointment_id, str) and ObjectId.is_valid(existing_appointment_id):
                            existing_appointment_id = ObjectId(existing_appointment_id)
                        existing_appointment = await self.db["appointments"].find_one({"_id": existing_appointment_id})
                        if existing_appointment:
                            if (
                                existing_appointment.get("date") == appointment_date
                                and existing_appointment.get("time") == appointment_time
                            ):
                                raise HTTPException(
                                    status_code=status.HTTP_400_BAD_REQUEST,
                                    detail="Patient already has an active appointment in the queue for this time"
                                )
                    else:
                        # No appointment reference but entry still active
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Patient is already in the queue"
                        )
            else:
                existing = await self.queue_collection.find_one({
                    "patient": patient_object_id,
                    "is_active": True,
                    "status": {"$in": ["waiting", "in-consultation"]}
                })
                if existing:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Patient is already in the queue"
                    )
            
            # Check if patient exists
            patient = await self.db["patients"].find_one({"_id": patient_object_id})
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Patient not found"
                )
            
            # Check if doctor exists
            doctor = await self.db["users"].find_one({"_id": doctor_object_id})
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Doctor not found"
                )
            
            # Verify doctor role
            if doctor.get("role") != "doctor":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Selected user is not a doctor"
                )
            
            # Generate queue entry
            queue_id = await QueueService.generate_queue_id()
            queue_number = await self.get_next_queue_number(str(doctor_object_id))
            
            queue_dict = {
                "queue_id": queue_id,
                "patient": patient_object_id,
                "doctor": doctor_object_id,
                "appointment": appointment_object_id,
                "checked_in_by": ObjectId(checked_in_by) if ObjectId.is_valid(checked_in_by) else checked_in_by,
                "checked_in_at": datetime.utcnow(),
                "status": "waiting",
                "queue_number": queue_number,
                "priority": check_in_data.priority,
                "reason": check_in_data.reason or "General Consultation",
                "notes": check_in_data.notes or "",
                "wait_time": 0,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await self.queue_collection.insert_one(queue_dict)
            queue_dict["_id"] = str(result.inserted_id)
            
            # Convert ObjectIds to strings for Pydantic model
            queue_dict["patient"] = str(patient_object_id)
            queue_dict["doctor"] = str(doctor_object_id)
            if appointment_object_id:
                queue_dict["appointment"] = str(appointment_object_id)
            if queue_dict.get("checked_in_by") and isinstance(queue_dict["checked_in_by"], ObjectId):
                queue_dict["checked_in_by"] = str(queue_dict["checked_in_by"])
            
            # Update patient's presentInClinic status to True
            await self.db["patients"].update_one(
                {"_id": patient_object_id},
                {
                    "$set": {
                        "presentInClinic": True,
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            
            # Update appointment status to "checked-in"
            await self.db["appointments"].update_one(
                {"_id": appointment_object_id},
                {
                    "$set": {
                        "status": "checked-in",
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            
            logger.info(f"Checked in appointment {check_in_data.appointment_id} - Queue #{queue_number}")

            # Emit WebSocket event for real-time updates
            try:
                # Get the queue entry with populated patient and doctor info for broadcasting
                queue_entry_for_broadcast = await self._get_populated_queue_entry(str(result.inserted_id))
                if queue_entry_for_broadcast:
                    await self.websocket_service.broadcast_patient_checked_in(queue_entry_for_broadcast)
            except Exception as e:
                logger.warning(f"Failed to broadcast queue check-in event: {e}")

            return QueueInDB(**queue_dict)
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error checking in patient: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to check in patient: {str(e)}"
            )

    async def _get_populated_queue_entry(self, entry_id: str) -> Optional[Dict]:
        """Get a queue entry with populated patient and doctor information."""
        try:
            pipeline = [
                {"$match": {"_id": ObjectId(entry_id)}},
                {
                    "$lookup": {
                        "from": "patients",
                        "localField": "patient",
                        "foreignField": "_id",
                        "as": "patient_info"
                    }
                },
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "doctor",
                        "foreignField": "_id",
                        "as": "doctor_info"
                    }
                }
            ]

            cursor = self.queue_collection.aggregate(pipeline)
            entries = await cursor.to_list(length=None)

            if not entries:
                return None

            entry = entries[0]

            # Convert ObjectIds to strings and format response
            entry["_id"] = str(entry["_id"])
            if entry.get("patient") and isinstance(entry["patient"], ObjectId):
                entry["patient"] = str(entry["patient"])
            if entry.get("doctor") and isinstance(entry["doctor"], ObjectId):
                entry["doctor"] = str(entry["doctor"])
            if entry.get("appointment") and isinstance(entry["appointment"], ObjectId):
                entry["appointment"] = str(entry["appointment"])
            if entry.get("checked_in_by") and isinstance(entry["checked_in_by"], ObjectId):
                entry["checked_in_by"] = str(entry["checked_in_by"])

            # Format patient info
            if entry.get("patient_info") and len(entry["patient_info"]) > 0:
                patient = entry["patient_info"][0]
                patient["_id"] = str(patient["_id"])
                for key, value in patient.items():
                    if isinstance(value, ObjectId):
                        patient[key] = str(value)
                if "fullName" not in patient:
                    firstName = patient.get("firstName", "")
                    lastName = patient.get("lastName", "")
                    patient["fullName"] = f"{firstName} {lastName}".strip()
                entry["patient"] = patient
                del entry["patient_info"]

            # Format doctor info
            if entry.get("doctor_info") and len(entry["doctor_info"]) > 0:
                doctor = entry["doctor_info"][0]
                doctor["_id"] = str(doctor["_id"])
                for key, value in doctor.items():
                    if isinstance(value, ObjectId):
                        doctor[key] = str(value)
                if "fullName" not in doctor:
                    firstName = doctor.get("firstName", "")
                    lastName = doctor.get("lastName", "")
                    doctor["fullName"] = f"{firstName} {lastName}".strip()
                entry["doctor"] = doctor
                del entry["doctor_info"]

            return entry

        except Exception as e:
            logger.error(f"Error getting populated queue entry {entry_id}: {e}")
            return None
    
    async def get_active_queue(self) -> List[Dict]:
        """Get today's active queue."""
        try:
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            
            pipeline = [
                {
                    "$match": {
                        "checked_in_at": {"$gte": today},
                        "status": {"$in": ["waiting", "in-consultation", "checkout", "completed"]},
                        "is_active": True
                    }
                },
                {
                    "$lookup": {
                        "from": "patients",
                        "localField": "patient",
                        "foreignField": "_id",
                        "as": "patient_info"
                    }
                },
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "doctor",
                        "foreignField": "_id",
                        "as": "doctor_info"
                    }
                },
                {
                    "$sort": {"priority": -1, "queue_number": 1}
                }
            ]
            
            cursor = self.queue_collection.aggregate(pipeline)
            queue = await cursor.to_list(length=None)
            
            # Format response - convert all ObjectIds to strings
            for entry in queue:
                entry["_id"] = str(entry["_id"])
                # Convert any remaining ObjectId fields to strings
                if entry.get("patient") and isinstance(entry["patient"], ObjectId):
                    entry["patient"] = str(entry["patient"])
                if entry.get("doctor") and isinstance(entry["doctor"], ObjectId):
                    entry["doctor"] = str(entry["doctor"])
                if entry.get("appointment") and isinstance(entry["appointment"], ObjectId):
                    entry["appointment"] = str(entry["appointment"])
                if entry.get("checked_in_by") and isinstance(entry["checked_in_by"], ObjectId):
                    entry["checked_in_by"] = str(entry["checked_in_by"])
                
                if entry.get("patient_info") and len(entry["patient_info"]) > 0:
                    patient = entry["patient_info"][0]
                    patient["_id"] = str(patient["_id"])
                    # Convert any ObjectIds in patient document
                    for key, value in patient.items():
                        if isinstance(value, ObjectId):
                            patient[key] = str(value)
                    # Add fullName if not present
                    if "fullName" not in patient:
                        firstName = patient.get("firstName", "")
                        lastName = patient.get("lastName", "")
                        patient["fullName"] = f"{firstName} {lastName}".strip()
                    entry["patient"] = patient
                    del entry["patient_info"]
                if entry.get("doctor_info") and len(entry["doctor_info"]) > 0:
                    doctor = entry["doctor_info"][0]
                    doctor["_id"] = str(doctor["_id"])
                    # Convert any ObjectIds in doctor document
                    for key, value in doctor.items():
                        if isinstance(value, ObjectId):
                            doctor[key] = str(value)
                    # Add fullName if not present
                    if "fullName" not in doctor:
                        firstName = doctor.get("firstName", "")
                        lastName = doctor.get("lastName", "")
                        doctor["fullName"] = f"{firstName} {lastName}".strip()
                    entry["doctor"] = doctor
                    del entry["doctor_info"]
            
            return queue
        
        except Exception as e:
            logger.error(f"Error fetching active queue: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch queue: {str(e)}"
            )
    
    async def get_doctor_queue(self, doctor_id: str) -> List[Dict]:
        """Get today's queue for a specific doctor."""
        try:
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Convert doctor_id string to ObjectId for proper matching
            try:
                doctor_object_id = ObjectId(doctor_id)
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid doctor ID format"
                )
            
            pipeline = [
                {
                    "$match": {
                        "doctor": doctor_object_id,
                        "checked_in_at": {"$gte": today},
                        "is_active": True
                    }
                },
                {
                    "$lookup": {
                        "from": "patients",
                        "localField": "patient",
                        "foreignField": "_id",
                        "as": "patient_info"
                    }
                },
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "doctor",
                        "foreignField": "_id",
                        "as": "doctor_info"
                    }
                },
                {
                    "$sort": {"priority": -1, "queue_number": 1}
                }
            ]
            
            cursor = self.queue_collection.aggregate(pipeline)
            queue = await cursor.to_list(length=None)
            
            # Format response - convert all ObjectIds to strings
            for entry in queue:
                entry["_id"] = str(entry["_id"])
                # Convert any remaining ObjectId fields to strings
                if entry.get("patient") and isinstance(entry["patient"], ObjectId):
                    entry["patient"] = str(entry["patient"])
                if entry.get("doctor") and isinstance(entry["doctor"], ObjectId):
                    entry["doctor"] = str(entry["doctor"])
                if entry.get("appointment") and isinstance(entry["appointment"], ObjectId):
                    entry["appointment"] = str(entry["appointment"])
                if entry.get("checked_in_by") and isinstance(entry["checked_in_by"], ObjectId):
                    entry["checked_in_by"] = str(entry["checked_in_by"])
                
                if entry.get("patient_info") and len(entry["patient_info"]) > 0:
                    patient = entry["patient_info"][0]
                    patient["_id"] = str(patient["_id"])
                    # Convert any ObjectIds in patient document
                    for key, value in patient.items():
                        if isinstance(value, ObjectId):
                            patient[key] = str(value)
                    # Add fullName if not present
                    if "fullName" not in patient:
                        firstName = patient.get("firstName", "")
                        lastName = patient.get("lastName", "")
                        patient["fullName"] = f"{firstName} {lastName}".strip()
                    entry["patient"] = patient
                    del entry["patient_info"]
                
                if entry.get("doctor_info") and len(entry["doctor_info"]) > 0:
                    doctor = entry["doctor_info"][0]
                    doctor["_id"] = str(doctor["_id"])
                    # Convert any ObjectIds in doctor document
                    for key, value in doctor.items():
                        if isinstance(value, ObjectId):
                            doctor[key] = str(value)
                    # Add fullName if not present
                    if "fullName" not in doctor:
                        firstName = doctor.get("firstName", "")
                        lastName = doctor.get("lastName", "")
                        doctor["fullName"] = f"{firstName} {lastName}".strip()
                    entry["doctor"] = doctor
                    del entry["doctor_info"]
            
            return queue
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching doctor queue: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch doctor queue: {str(e)}"
            )
    
    async def get_queue_entry(self, entry_id: str) -> Optional[Dict]:
        """Get queue entry by ID."""
        try:
            entry = await self.queue_collection.find_one({"_id": ObjectId(entry_id)})
            if entry:
                entry["_id"] = str(entry["_id"])
                # Convert all ObjectIds to strings
                for key, value in entry.items():
                    if isinstance(value, ObjectId):
                        entry[key] = str(value)
                return entry
            return None
        
        except Exception as e:
            logger.error(f"Error fetching queue entry: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch queue entry: {str(e)}"
            )
    
    async def update_queue_status(self, entry_id: str, status_update: QueueStatusUpdate) -> Optional[Dict]:
        """Update queue entry status."""
        try:
            update_data = {
                "status": status_update.status,
                "updated_at": datetime.utcnow()
            }
            
            # Handle specific status transitions
            if status_update.status == "in-consultation":
                update_data["consultation_started_at"] = datetime.utcnow()
            elif status_update.status == "completed":
                update_data["consultation_ended_at"] = datetime.utcnow()
                # Calculate wait time
                entry = await self.queue_collection.find_one({"_id": ObjectId(entry_id)})
                if entry and entry.get("consultation_started_at"):
                    wait_time = (entry["consultation_started_at"] - entry["checked_in_at"]).total_seconds() / 60
                    update_data["wait_time"] = int(wait_time)
            elif status_update.status in ["checked-out", "cancelled"]:
                update_data["is_active"] = False
            
            result = await self.queue_collection.find_one_and_update(
                {"_id": ObjectId(entry_id)},
                {"$set": update_data},
                return_document=True
            )
            
            if result:
                result["_id"] = str(result["_id"])
                # Convert all ObjectIds to strings
                for key, value in result.items():
                    if isinstance(value, ObjectId):
                        result[key] = str(value)
                logger.info(f"Updated queue entry {entry_id} to status {status_update.status}")

                # Also update appointment status if appointment is linked
                appointment_id = result.get("appointment")
                if appointment_id:
                    try:
                        if isinstance(appointment_id, str) and ObjectId.is_valid(appointment_id):
                            appointment_object_id = ObjectId(appointment_id)
                        elif isinstance(appointment_id, ObjectId):
                            appointment_object_id = appointment_id
                        else:
                            appointment_object_id = None
                        
                        if appointment_object_id:
                            appointment_status_update = {}
                            
                            # Map queue status to appointment status
                            if status_update.status == "checkout":
                                appointment_status_update["status"] = "checkout"
                                appointment_status_update["completedAt"] = datetime.utcnow()
                            elif status_update.status == "completed":
                                appointment_status_update["status"] = "completed"
                                appointment_status_update["completedAt"] = datetime.utcnow()
                            
                            if appointment_status_update:
                                appointment_status_update["updatedAt"] = datetime.utcnow()
                                await self.db["appointments"].update_one(
                                    {"_id": appointment_object_id},
                                    {"$set": appointment_status_update}
                                )
                                logger.info(f"Updated appointment {appointment_id} status to {appointment_status_update.get('status')}")
                                
                                # Broadcast appointment status update via WebSocket
                                try:
                                    updated_appointment = await self.db["appointments"].find_one({"_id": appointment_object_id})
                                    if updated_appointment:
                                        await self.websocket_service.broadcast_appointment_status_update(updated_appointment)
                                except Exception as e:
                                    logger.warning(f"Failed to broadcast appointment status update: {e}")
                    except Exception as e:
                        logger.warning(f"Failed to update appointment status: {e}")
                        # Don't fail the queue status update if appointment update fails

                # Emit WebSocket event for real-time updates
                try:
                    populated_entry = await self._get_populated_queue_entry(entry_id)
                    if populated_entry:
                        await self.websocket_service.broadcast_patient_status_updated(populated_entry)
                except Exception as e:
                    logger.warning(f"Failed to broadcast queue status update event: {e}")

                return result
            return None
        
        except Exception as e:
            logger.error(f"Error updating queue status: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update queue status: {str(e)}"
            )
    
    async def start_consultation(self, entry_id: str) -> Optional[Dict]:
        """Start consultation for a queue entry."""
        # First, get the queue entry to find the appointment ID
        entry = await self.queue_collection.find_one({"_id": ObjectId(entry_id)})
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Queue entry not found"
            )
        logger.info(f"Starting consultation for queue entry {entry_id}")
        # Update queue status to in-consultation
        result = await self.update_queue_status(
            entry_id,
            QueueStatusUpdate(status="in-consultation")
        )
        
        # Also update the appointment status to "in-progress" if appointment is linked
        appointment_id = entry.get("appointment")
        if appointment_id:
            try:
                if isinstance(appointment_id, str) and ObjectId.is_valid(appointment_id):
                    appointment_object_id = ObjectId(appointment_id)
                elif isinstance(appointment_id, ObjectId):
                    appointment_object_id = appointment_id
                else:
                    appointment_object_id = None
                
                if appointment_object_id:
                    # Update appointment status to "in-progress"
                    await self.db["appointments"].update_one(
                        {"_id": appointment_object_id},
                        {
                            "$set": {
                                "status": "in-progress",
                                "startedAt": datetime.utcnow(),
                                "updatedAt": datetime.utcnow()
                            }
                        }
                    )
                    logger.info(f"Updated appointment {appointment_id} status to in-progress")
                    
                    # Broadcast appointment status update via WebSocket
                    try:
                        updated_appointment = await self.db["appointments"].find_one({"_id": appointment_object_id})
                        if updated_appointment:
                            await self.websocket_service.broadcast_appointment_status_update(updated_appointment)
                    except Exception as e:
                        logger.warning(f"Failed to broadcast appointment status update: {e}")
            except Exception as e:
                logger.warning(f"Failed to update appointment status: {e}")
                # Don't fail the consultation start if appointment update fails
        
        return result
    
    async def check_out_patient(self, entry_id: str) -> Optional[Dict]:
        """Check out patient from queue."""
        # Get queue entry to find patient ID
        entry = await self.queue_collection.find_one({"_id": ObjectId(entry_id)})
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Queue entry not found"
            )
        
        # Update queue status
        result = await self.update_queue_status(
            entry_id,
            QueueStatusUpdate(status="checked-out")
        )
        
        # Update patient's presentInClinic status to False
        if result and entry.get("patient"):
            await self.db["patients"].update_one(
                {"_id": ObjectId(entry["patient"])},
                {
                    "$set": {
                        "presentInClinic": False,
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
        
        return result
    
    async def get_queue_stats(self) -> Dict:
        """Get today's queue statistics."""
        try:
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            
            pipeline = [
                {
                    "$match": {
                        "checked_in_at": {"$gte": today}
                    }
                },
                {
                    "$group": {
                        "_id": "$status",
                        "count": {"$sum": 1},
                        "avg_wait_time": {"$avg": "$wait_time"}
                    }
                }
            ]
            
            cursor = self.queue_collection.aggregate(pipeline)
            results = await cursor.to_list(length=None)
            
            stats = {
                "total_patients": 0,
                "waiting": 0,
                "in_consultation": 0,
                "completed": 0,
                "checked_out": 0,
                "cancelled": 0,
                "average_wait_time": 0
            }
            
            total_wait = 0
            wait_count = 0
            
            for result in results:
                status_key = result["_id"].replace("-", "_")
                stats[status_key] = result["count"]
                stats["total_patients"] += result["count"]
                if result.get("avg_wait_time"):
                    total_wait += result["avg_wait_time"] * result["count"]
                    wait_count += result["count"]
            
            if wait_count > 0:
                stats["average_wait_time"] = round(total_wait / wait_count, 2)
            
            return stats
        
        except Exception as e:
            logger.error(f"Error fetching queue stats: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch queue stats: {str(e)}"
            )

    async def reorder_queue(self, doctor_id: str, queue_order: Sequence[str]) -> List[Dict]:
        """
        Reorder queue entries for a doctor.

        Args:
            doctor_id: Doctor MongoDB ObjectId string
            queue_order: Ordered list of queue entry IDs (MongoDB ObjectIds)
        Returns:
            Updated queue entries after reordering
        """
        if not ObjectId.is_valid(doctor_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid doctor ID",
            )

        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        # Validate queue entries
        entries = await self.queue_collection.find(
            {
                "_id": {"$in": [ObjectId(entry_id) for entry_id in queue_order]},
                "doctor": doctor_id,
                "checked_in_at": {"$gte": today},
                "is_active": True,
            }
        ).to_list(length=None)

        if len(entries) != len(queue_order):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Queue entries mismatch or entries not found for doctor",
            )

        # Update queue numbers based on provided order
        updates = []
        for position, entry_id in enumerate(queue_order, start=1):
            await self.queue_collection.update_one(
                {"_id": ObjectId(entry_id)},
                {
                    "$set": {
                        "queue_number": position,
                        "updated_at": datetime.utcnow(),
                    }
                },
            )
            updated_entry = await self.queue_collection.find_one({"_id": ObjectId(entry_id)})
            if updated_entry:
                updated_entry["_id"] = str(updated_entry["_id"])
                # Convert all ObjectIds to strings
                for key, value in updated_entry.items():
                    if isinstance(value, ObjectId):
                        updated_entry[key] = str(value)
                updates.append(updated_entry)

        # Sort updates to match new queue_number ascending
        updates.sort(key=lambda entry: entry.get("queue_number", 0))

        # Emit WebSocket event for queue reordering
        try:
            await self.websocket_service.broadcast_queue_reordered(doctor_id, updates)
        except Exception as e:
            logger.warning(f"Failed to broadcast queue reorder event: {e}")

        return updates


# Note: No global service instance - use dependency injection instead

