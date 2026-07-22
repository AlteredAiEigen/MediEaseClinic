"""
Contact/inquiry endpoint to notify the team when a prospect requests details.
Sends an email to the configured recipient using SMTP (same as consent emails).
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.config import settings
from app.services.email_service import EmailService

router = APIRouter()
email_service = EmailService()


class ContactRequest(BaseModel):
    """Contact form submission model."""

    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(...)
    phone: str = Field(..., min_length=10, max_length=15)
    query: str = Field(..., min_length=10, max_length=1000, alias="message")
    providerName: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Name of the healthcare provider if applicable",
    )


async def _process_contact_submission(request: ContactRequest):
    """Shared handler for contact form submissions."""
    logging.info(f"Contact form submission from {request.name} ({request.email})")

    if email_service.is_configured():
        subject = f"New Contact Form Submission from {request.name}"
        body = f"""
New contact form submission received:

Name: {request.name}
Email: {request.email}
Phone: {request.phone}
Provider Name: {request.providerName or 'Not provided'}

Message:
{request.query}

---
This message was sent from the MediEase Clinic contact form.
"""

        email_result = await email_service.send_email(
            to=settings.contact_email_recipient,
            subject=subject,
            body=body,
            reply_to=request.email,
        )

        if not email_result.get("success"):
            logging.error(f"Failed to send contact email: {email_result.get('error')}")
    else:
        logging.warning("Email service not configured - contact form submission logged but no email sent")

    return {
        "success": True,
        "message": "Thank you for your inquiry. We'll get back to you soon!",
    }


@router.post("/contact")
async def submit_contact_form(request: ContactRequest):
    """Submit a contact/inquiry form."""
    try:
        return await _process_contact_submission(request)
    except Exception as e:
        logging.error(f"Error processing contact form: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process contact form",
        )


@router.post("")
async def submit_contact_form_root(request: ContactRequest):
    """Alias for legacy clients posting to /api/contact."""
    try:
        return await _process_contact_submission(request)
    except Exception as e:
        logging.error(f"Error processing contact form: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process contact form",
        )
