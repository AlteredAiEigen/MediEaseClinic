"""
Messaging models for provider-patient communications.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic v2."""

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema

        return core_schema.no_info_plain_validator_function(
            cls.validate,
            serialization=core_schema.to_string_ser_schema(),
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)


class ConversationBase(BaseModel):
    """Base conversation fields."""

    patientId: str
    participants: List[str] = Field(..., min_items=1)
    title: Optional[str] = Field(None, max_length=120)


class ConversationCreate(ConversationBase):
    """Schema for creating a conversation."""

    pass


class ConversationInDB(ConversationBase):
    """Conversation as stored in database."""

    id: Optional[PyObjectId] = Field(alias="_id")
    conversationId: str
    createdBy: str
    lastMessage: Optional[str] = None
    lastMessageAt: Optional[datetime] = None
    lastSenderId: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = True

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class MessageBase(BaseModel):
    """Base message fields."""

    conversationId: str
    senderId: str
    senderRole: str = Field(..., pattern=r"^(doctor|receptionist|admin)$")
    body: str = Field(..., min_length=1, max_length=4000)
    attachments: Optional[List[str]] = Field(default_factory=list)


class MessageCreate(MessageBase):
    """Schema for creating a new chat message."""

    pass


class MessageInDB(MessageBase):
    """Message as stored in database."""

    id: Optional[PyObjectId] = Field(alias="_id")
    patientId: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isRead: bool = False

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


async def conversation_helper(conversation: dict) -> dict:
    """Format conversation document."""
    if not conversation:
        return None

    return {
        "_id": str(conversation["_id"]),
        "conversationId": conversation.get("conversationId"),
        "patientId": conversation.get("patientId"),
        "participants": conversation.get("participants", []),
        "title": conversation.get("title"),
        "createdBy": conversation.get("createdBy"),
        "lastMessage": conversation.get("lastMessage"),
        "lastMessageAt": conversation.get("lastMessageAt"),
        "lastSenderId": conversation.get("lastSenderId"),
        "createdAt": conversation.get("createdAt"),
        "updatedAt": conversation.get("updatedAt"),
        "isActive": conversation.get("isActive", True),
    }


async def message_helper(message: dict) -> dict:
    """Format message document."""
    if not message:
        return None

    return {
        "_id": str(message["_id"]),
        "conversationId": message.get("conversationId"),
        "patientId": message.get("patientId"),
        "senderId": message.get("senderId"),
        "senderRole": message.get("senderRole"),
        "body": message.get("body"),
        "attachments": message.get("attachments", []),
        "createdAt": message.get("createdAt"),
        "updatedAt": message.get("updatedAt"),
        "isRead": message.get("isRead", False),
    }


