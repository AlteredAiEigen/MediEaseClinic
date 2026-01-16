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
        if not v:
            raise ValueError("Phone number is required")

        clean = v.strip().replace(' ', '').replace('-', '').replace('(', '').replace(')', '')

        # Normalize to whatsapp:+ format
        if clean.startswith('whatsapp:'):
            number_part = clean.replace('whatsapp:', '')
            if not number_part.startswith('+') and number_part.isdigit():
                number_part = f"+{number_part}"
            clean = f"whatsapp:{number_part}"
        elif clean.startswith('+'):
            clean = f"whatsapp:{clean}"
        elif clean.isdigit():
            # Best-effort normalization for common Indian formats
            if len(clean) == 10:
                clean = f"whatsapp:+91{clean}"
            elif len(clean) == 12 and clean.startswith('91'):
                clean = f"whatsapp:+{clean}"
            else:
                raise ValueError("Phone number must include country code. Use: whatsapp:+[country code][number]")
        else:
            raise ValueError("Invalid phone number format. Use: whatsapp:+[country code][number]")

        number_part = clean.replace('whatsapp:+', '')
        if not number_part.isdigit() or len(number_part) < 10:
            raise ValueError("Invalid phone number format. Use: whatsapp:+[country code][number]")
        return clean
    
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

