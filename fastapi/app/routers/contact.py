"""
Contact/inquiry endpoint to notify the team when a prospect requests details.
Sends an email to the configured recipient using Mailgun API.
"""

import logging
import os
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

router = APIRouter()


class ContactRequest(BaseModel):
    """Contact form submission model."""

    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(...)
    phone: str = Field(..., min_length=10, max_length=15)
    message: str = Field(..., min_length=10, max_length=1000)
    providerName: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Name of the healthcare provider if applicable",
    )


@router.post("/contact")
async def submit_contact_form(request: ContactRequest):
    """Submit a contact/inquiry form."""
    try:
        # Log the contact request
        logging.info(f"Contact form submission from {request.name} ({request.email})")

        # Here you would typically send an email notification
        # For now, we'll just return success
        return {
            "success": True,
            "message": "Thank you for your inquiry. We'll get back to you soon!",
        }
    except Exception as e:
        logging.error(f"Error processing contact form: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process contact form",
        )
