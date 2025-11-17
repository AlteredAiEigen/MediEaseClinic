"""
WhatsApp messaging schemas for API requests and responses.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


class WhatsAppMessageRequest(BaseModel):
    """Request schema for sending WhatsApp messages."""
    to: str = Field(..., description="Recipient WhatsApp number in format: whatsapp:+[country code][number]")
    message: str = Field(..., min_length=1, max_length=1600, description="Message content (max 1600 characters)")
    patient_id: Optional[str] = Field(None, description="Optional patient ID for tracking")
    appointment_id: Optional[str] = Field(None, description="Optional appointment ID for tracking")
    
    @field_validator('to')
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        """Validate phone number format."""
        if not v.startswith('whatsapp:+'):
            raise ValueError("Phone number must start with 'whatsapp:+'")
        # Remove 'whatsapp:+' and check if remaining is numeric
        number_part = v.replace('whatsapp:+', '').replace(' ', '').replace('-', '')
        if not number_part.isdigit() or len(number_part) < 10:
            raise ValueError("Invalid phone number format. Use: whatsapp:+[country code][number]")
        return v
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v: str) -> str:
        """Validate message content."""
        if not v or not v.strip():
            raise ValueError("Message cannot be empty")
        return v.strip()


class WhatsAppMessageResponse(BaseModel):
    """Response schema for WhatsApp message sending."""
    success: bool
    message_sid: Optional[str] = None
    status: Optional[str] = None
    to: Optional[str] = None
    from_number: Optional[str] = None
    message: Optional[str] = None
    timestamp: Optional[datetime] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None


class WhatsAppMessageStatusRequest(BaseModel):
    """Request schema for checking message status."""
    message_sid: str = Field(..., description="Twilio message SID to check status")


class WhatsAppMessageStatusResponse(BaseModel):
    """Response schema for message status check."""
    success: bool
    message_sid: str
    status: str
    to: str
    from_number: str
    body: Optional[str] = None
    date_created: Optional[datetime] = None
    date_sent: Optional[datetime] = None
    date_updated: Optional[datetime] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None

