"""
Notification API endpoints.
"""
from fastapi import APIRouter, Depends, Query, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.middleware.auth import get_current_user
from app.services.notification_service import NotificationService
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    MarkAllReadResponse
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def get_notification_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> NotificationService:
    """Get notification service instance."""
    return NotificationService(db)


@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: dict = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service)
):
    """Get notifications for the current user."""
    user_id = str(current_user["_id"])
    
    notifications, total = await service.get_notifications_for_user(
        user_id=user_id,
        page=page,
        limit=limit,
        unread_only=unread_only
    )
    
    unread_count = await service.get_unread_count(user_id)
    
    return NotificationListResponse(
        notifications=notifications,
        total=total,
        page=page,
        limit=limit,
        unreadCount=unread_count
    )


@router.get("/unread-count")
async def get_unread_count(
    current_user: dict = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service)
):
    """Get count of unread notifications."""
    user_id = str(current_user["_id"])
    count = await service.get_unread_count(user_id)
    return {"unreadCount": count}


@router.patch("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service)
):
    """Mark a single notification as read."""
    user_id = str(current_user["_id"])
    
    notification = await service.mark_as_read(notification_id, user_id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return notification


@router.post("/mark-all-read", response_model=MarkAllReadResponse)
async def mark_all_as_read(
    current_user: dict = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service)
):
    """Mark all notifications as read for the current user."""
    user_id = str(current_user["_id"])
    count = await service.mark_all_as_read(user_id)
    
    return MarkAllReadResponse(
        message="All notifications marked as read",
        count=count
    )


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service)
):
    """Delete a notification."""
    user_id = str(current_user["_id"])
    
    deleted = await service.delete_notification(notification_id, user_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return {"message": "Notification deleted successfully"}

