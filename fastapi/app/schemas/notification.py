"""
Notification schemas for API requests and responses.
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class NotificationResponse(BaseModel):
    """Notification response schema."""
    id: str = Field(alias="_id")
    recipientId: str
    recipientRole: str
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = {}
    link: Optional[str] = None
    clinicId: Optional[str] = None
    isRead: bool = False
    readAt: Optional[datetime] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        populate_by_name = True


class NotificationListResponse(BaseModel):
    """Response for list of notifications."""
    notifications: List[NotificationResponse]
    total: int
    page: int
    limit: int
    unreadCount: int


class MarkAllReadResponse(BaseModel):
    """Response for marking all notifications as read."""
    message: str
    count: int


class CreateNotificationRequest(BaseModel):
    """Request to create a notification (admin only)."""
    recipientId: str
    recipientRole: str
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = {}
    link: Optional[str] = None
