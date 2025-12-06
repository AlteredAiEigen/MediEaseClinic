"""
Notification service for managing in-app notifications.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status

from app.models.notification import NotificationModel, notification_helper


class NotificationService:
    """Service for managing notifications."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.notifications_collection = db.notifications
        self.users_collection = db.users
    
    async def create_notification(
        self,
        recipient_id: str,
        recipient_role: str,
        notification_type: str,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        link: Optional[str] = None,
        clinic_id: Optional[str] = None
    ) -> dict:
        """Create a new notification."""
        notification = NotificationModel.create_notification(
            recipient_id=recipient_id,
            recipient_role=recipient_role,
            notification_type=notification_type,
            title=title,
            message=message,
            data=data,
            link=link,
            clinic_id=clinic_id
        )
        
        result = await self.notifications_collection.insert_one(notification)
        created = await self.notifications_collection.find_one({"_id": result.inserted_id})
        return await notification_helper(created)
    
    async def get_notifications_for_user(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 20,
        unread_only: bool = False
    ) -> tuple[List[dict], int]:
        """Get notifications for a specific user."""
        query = {"recipientId": user_id}
        
        if unread_only:
            query["isRead"] = False
        
        # Get total count
        total = await self.notifications_collection.count_documents(query)
        
        # Calculate skip
        skip = (page - 1) * limit
        
        # Get notifications, sorted by newest first
        cursor = (
            self.notifications_collection.find(query)
            .sort("createdAt", -1)
            .skip(skip)
            .limit(limit)
        )
        
        notifications = []
        async for notification in cursor:
            notifications.append(await notification_helper(notification))
        
        return notifications, total
    
    async def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications for a user."""
        return await self.notifications_collection.count_documents({
            "recipientId": user_id,
            "isRead": False
        })
    
    async def mark_as_read(self, notification_id: str, user_id: str) -> Optional[dict]:
        """Mark a single notification as read."""
        if not ObjectId.is_valid(notification_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid notification ID"
            )
        
        result = await self.notifications_collection.find_one_and_update(
            {
                "_id": ObjectId(notification_id),
                "recipientId": user_id
            },
            {
                "$set": {
                    "isRead": True,
                    "readAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
            },
            return_document=True
        )
        
        if result:
            return await notification_helper(result)
        return None
    
    async def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications as read for a user."""
        result = await self.notifications_collection.update_many(
            {
                "recipientId": user_id,
                "isRead": False
            },
            {
                "$set": {
                    "isRead": True,
                    "readAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        return result.modified_count
    
    async def delete_notification(self, notification_id: str, user_id: str) -> bool:
        """Delete a notification."""
        if not ObjectId.is_valid(notification_id):
            return False
        
        result = await self.notifications_collection.delete_one({
            "_id": ObjectId(notification_id),
            "recipientId": user_id
        })
        return result.deleted_count > 0
    
    # ==================== NOTIFICATION TRIGGERS ====================
    
    async def notify_admin_password_change(
        self,
        user_id: str,
        user_name: str,
        user_role: str,
        clinic_id: str
    ):
        """Notify admin when a user changes their password."""
        # Find all admins in the same clinic
        admins = await self.users_collection.find({
            "role": "admin",
            "clinicId": clinic_id
        }).to_list(length=None)
        
        for admin in admins:
            await self.create_notification(
                recipient_id=str(admin["_id"]),
                recipient_role="admin",
                notification_type="password_change",
                title="Password Changed",
                message=f"{user_name} ({user_role}) has changed their password.",
                data={
                    "userId": user_id,
                    "userName": user_name,
                    "userRole": user_role
                },
                link=f"/admin/users/{user_id}",
                clinic_id=clinic_id
            )
    
    async def notify_doctor_report_received(
        self,
        doctor_id: str,
        patient_id: str,
        patient_name: str,
        report_type: str,
        report_id: str,
        clinic_id: Optional[str] = None
    ):
        """Notify doctor when a patient report is received."""
        await self.create_notification(
            recipient_id=doctor_id,
            recipient_role="doctor",
            notification_type="report_received",
            title="New Report Received",
            message=f"New {report_type} report received for patient {patient_name}.",
            data={
                "patientId": patient_id,
                "patientName": patient_name,
                "reportType": report_type,
                "reportId": report_id
            },
            link=f"/patient-overview/{patient_id}",
            clinic_id=clinic_id
        )
    
    async def notify_doctor_appointment_rescheduled(
        self,
        doctor_id: str,
        appointment_id: str,
        patient_name: str,
        old_date: str,
        old_time: str,
        new_date: str,
        new_time: str,
        rescheduled_by: str,
        clinic_id: Optional[str] = None
    ):
        """Notify doctor when an appointment is rescheduled."""
        await self.create_notification(
            recipient_id=doctor_id,
            recipient_role="doctor",
            notification_type="appointment_rescheduled",
            title="Appointment Rescheduled",
            message=f"Appointment with {patient_name} has been rescheduled from {old_date} {old_time} to {new_date} {new_time}.",
            data={
                "appointmentId": appointment_id,
                "patientName": patient_name,
                "oldDate": old_date,
                "oldTime": old_time,
                "newDate": new_date,
                "newTime": new_time,
                "rescheduledBy": rescheduled_by
            },
            link=f"/doctor-appointments",
            clinic_id=clinic_id
        )

