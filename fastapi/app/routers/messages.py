"""
Messaging API endpoints.
"""

from fastapi import APIRouter, Depends, Query, status
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.middleware.auth import optional_auth, require_any_role
from app.schemas.message import (
    ConversationCreateRequest,
    MessageCreateRequest,
)
from app.services.message_service import MessageService
from app.utils.response import success_response, paginated_response, error_response
from app.models.message import ConversationCreate, MessageCreate

router = APIRouter()


def get_service(db: AsyncIOMotorDatabase = Depends(get_db)) -> MessageService:
    return MessageService(db)


@router.post("/conversations", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    payload: ConversationCreateRequest,
    current_user: dict = Depends(require_any_role),
    service: MessageService = Depends(get_service),
):
    """Create (or fetch existing) conversation thread for a patient."""
    conversation = await service.get_or_create_conversation(
        ConversationCreate(**payload.model_dump()),
        created_by=str(current_user["_id"]),
    )
    return success_response(
        message="Conversation ready",
        data=conversation,
        status_code=status.HTTP_201_CREATED,
    )


@router.get("/conversations", response_model=dict)
async def list_conversations(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(require_any_role),
    service: MessageService = Depends(get_service),
):
    """List conversations accessible to the current user."""
    conversations, total = await service.list_conversations(
        user_id=str(current_user["_id"]),
        role=current_user["role"],
        page=page,
        limit=limit,
    )
    return paginated_response(
        message="Conversations retrieved successfully",
        data=conversations,
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/conversations/{conversation_id}", response_model=dict)
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(require_any_role),
    service: MessageService = Depends(get_service),
):
    """Fetch conversation details."""
    conversation = await service.get_conversation(conversation_id)
    if not conversation:
        return error_response("Conversation not found", status_code=status.HTTP_404_NOT_FOUND)

    if (
        current_user["role"] != "admin"
        and str(current_user["_id"]) not in conversation["participants"]
    ):
        return error_response("Access denied", status_code=status.HTTP_403_FORBIDDEN)

    return success_response(
        message="Conversation retrieved successfully",
        data=conversation,
    )


@router.get("/conversations/{conversation_id}/messages", response_model=dict)
async def list_conversation_messages(
    conversation_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_any_role),
    service: MessageService = Depends(get_service),
):
    """Fetch messages for the conversation."""
    conversation = await service.get_conversation(conversation_id)
    if not conversation:
        return error_response("Conversation not found", status_code=status.HTTP_404_NOT_FOUND)

    if (
        current_user["role"] != "admin"
        and str(current_user["_id"]) not in conversation["participants"]
    ):
        return error_response("Access denied", status_code=status.HTTP_403_FORBIDDEN)

    messages, total = await service.list_messages(
        conversation_id=conversation_id,
        page=page,
        limit=limit,
    )
    return paginated_response(
        message="Messages retrieved successfully",
        data=messages,
        total=total,
        page=page,
        limit=limit,
    )


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    conversation_id: str,
    payload: MessageCreateRequest,
    current_user: dict = Depends(require_any_role),
    service: MessageService = Depends(get_service),
):
    """Send a message within a conversation."""
    conversation = await service.get_conversation(conversation_id)
    if not conversation:
        return error_response("Conversation not found", status_code=status.HTTP_404_NOT_FOUND)

    if (
        current_user["role"] != "admin"
        and str(current_user["_id"]) not in conversation["participants"]
    ):
        return error_response("Access denied", status_code=status.HTTP_403_FORBIDDEN)

    message = await service.create_message(
        conversation_id=conversation_id,
        message_data=MessageCreate(
            conversationId=conversation_id,
            senderId=str(current_user["_id"]),
            senderRole=current_user["role"],
            body=payload.body,
            attachments=payload.attachments or [],
        ),
        patient_id=conversation["patientId"],
    )
    return success_response(
        message="Message sent successfully",
        data=message,
        status_code=status.HTTP_201_CREATED,
    )


