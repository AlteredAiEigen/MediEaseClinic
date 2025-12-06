"""
Notification model for MongoDB.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from bson import ObjectId


class NotificationModel:
    """Notification MongoDB model."""
    
    @staticmethod
    def create_notification(
        recipient_id: str,
        recipient_role: str,
        notification_type: str,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        link: Optional[str] = None,
        clinic_id: Optional[str] = None
    ) -> dict:
        """Create a new notification document."""
        return {
            "recipientId": recipient_id,
            "recipientRole": recipient_role,  # admin, doctor, receptionist
            "type": notification_type,  # password_change, report_received, appointment_rescheduled
            "title": title,
            "message": message,
            "data": data or {},
            "link": link,
            "clinicId": clinic_id,
            "isRead": False,
            "readAt": None,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }


async def notification_helper(notification: dict) -> dict:
    """Helper to format notification document for API response."""
    if not notification:
        return None
    
    return {
        "_id": str(notification["_id"]),
        "id": str(notification["_id"]),
        "recipientId": str(notification.get("recipientId", "")),
        "recipientRole": notification.get("recipientRole", ""),
        "type": notification.get("type", ""),
        "title": notification.get("title", ""),
        "message": notification.get("message", ""),
        "data": notification.get("data", {}),
        "link": notification.get("link"),
        "clinicId": notification.get("clinicId"),
        "isRead": notification.get("isRead", False),
        "readAt": notification.get("readAt"),
        "createdAt": notification.get("createdAt"),
        "updatedAt": notification.get("updatedAt")
    }

