"""
Schemas for messaging endpoints.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class ConversationCreateRequest(BaseModel):
    """Create or retrieve a conversation for a patient."""

    patientId: str = Field(..., description="Patient MongoDB ObjectId string")
    participants: List[str] = Field(
        ..., min_items=1, description="List of staff user ObjectId strings"
    )
    title: Optional[str] = Field(default=None, max_length=120)


class MessageCreateRequest(BaseModel):
    """Send a new message in a conversation."""

    body: str = Field(..., min_length=1, max_length=4000)
    attachments: Optional[List[str]] = Field(default_factory=list)


