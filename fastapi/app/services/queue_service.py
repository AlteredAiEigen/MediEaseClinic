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

logger = logging.getLogger(__name__)


class QueueService:
    """Service for managing patient queue."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.queue_collection = db.queue

    @staticmethod
    async def generate_queue_id() -> str:
        """Generate unique queue ID."""
        timestamp = str(int(datetime.now().timestamp() * 1000))[-8:]
        return f"Q{timestamp}"
    
    async def get_next_queue_number(self, doctor_id: str) -> int:
        """Get next queue number for doctor today."""
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        
        count = await self.queue_collection.count_documents({
            "doctor": doctor_id,
            "created_at": {"$gte": today, "$lt": tomorrow}
        })
        
        return count + 1
    
    async def check_in_patient(self, check_in_data: QueueCheckIn, checked_in_by: str) -> QueueInDB:
        """Check in a patient to the queue."""
        try:
            # Check if patient is already in queue
            existing = await self.queue_collection.find_one({
                "patient": check_in_data.patient_id,
                "is_active": True,
                "status": {"$in": ["waiting", "in-consultation"]}
            })
            
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Patient is already in the queue"
                )
            
            # Check if patient exists
            patient = await db["patients"].find_one({"_id": ObjectId(check_in_data.patient_id)})
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Patient not found"
                )
            
            # Check if doctor exists
            doctor = await db["users"].find_one({"_id": ObjectId(check_in_data.doctor_id)})
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Doctor not found"
                )
            
            # Generate queue entry
            queue_id = await QueueService.generate_queue_id()
            queue_number = await self.get_next_queue_number(check_in_data.doctor_id)
            
            queue_dict = {
                "queue_id": queue_id,
                "patient": check_in_data.patient_id,
                "doctor": check_in_data.doctor_id,
                "appointment": check_in_data.appointment_id,
                "checked_in_by": checked_in_by,
                "checked_in_at": datetime.utcnow(),
                "status": "waiting",
                "queue_number": queue_number,
                "priority": check_in_data.priority,
                "reason": check_in_data.reason,
                "notes": check_in_data.notes,
                "wait_time": 0,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await self.queue_collection.insert_one(queue_dict)
            queue_dict["_id"] = str(result.inserted_id)
            
            logger.info(f"Checked in patient {check_in_data.patient_id} - Queue #{queue_number}")
            return QueueInDB(**queue_dict)
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error checking in patient: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to check in patient: {str(e)}"
            )
    
    async def get_active_queue(self) -> List[Dict]:
        """Get today's active queue."""
        try:
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            
            pipeline = [
                {
                    "$match": {
                        "checked_in_at": {"$gte": today},
                        "status": {"$in": ["waiting", "in-consultation"]},
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
            
            # Format response
            for entry in queue:
                entry["_id"] = str(entry["_id"])
                if entry.get("patient_info"):
                    entry["patient"] = entry["patient_info"][0]
                    entry["patient"]["_id"] = str(entry["patient"]["_id"])
                    del entry["patient_info"]
                if entry.get("doctor_info"):
                    entry["doctor"] = entry["doctor_info"][0]
                    entry["doctor"]["_id"] = str(entry["doctor"]["_id"])
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
            
            pipeline = [
                {
                    "$match": {
                        "doctor": doctor_id,
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
                    "$sort": {"queue_number": 1}
                }
            ]
            
            cursor = self.queue_collection.aggregate(pipeline)
            queue = await cursor.to_list(length=None)
            
            # Format response
            for entry in queue:
                entry["_id"] = str(entry["_id"])
                if entry.get("patient_info"):
                    entry["patient"] = entry["patient_info"][0]
                    entry["patient"]["_id"] = str(entry["patient"]["_id"])
                    del entry["patient_info"]
            
            return queue
        
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
                logger.info(f"Updated queue entry {entry_id} to status {status_update.status}")
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
        return await self.update_queue_status(
            entry_id,
            QueueStatusUpdate(status="in-consultation")
        )
    
    async def check_out_patient(self, entry_id: str) -> Optional[Dict]:
        """Check out patient from queue."""
        return await self.update_queue_status(
            entry_id,
            QueueStatusUpdate(status="checked-out")
        )
    
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
                updates.append(updated_entry)

        # Sort updates to match new queue_number ascending
        updates.sort(key=lambda entry: entry.get("queue_number", 0))
        return updates


# Note: No global service instance - use dependency injection instead

