"""
Contact/inquiry endpoint to notify the team when a prospect requests details.
Sends an email to the configured recipient.
"""

import logging
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.config import settings
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)
router = APIRouter()


class ContactRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=5, max_length=30)
    # Relaxed to avoid 422 on very short messages; frontend already requires this field.
    query: str = Field(..., min_length=1, max_length=2000)
    providerName: str | None = Field(
        default=None, min_length=2, max_length=200, description="Clinic/Hospital name"
    )


@router.post("", response_model=dict, status_code=status.HTTP_200_OK)
async def create_contact(request: ContactRequest):
    """
    Receive a contact/inquiry request and send an email notification.
    """
    provider_part = request.providerName or "Clinic/Hospital"
    subject = f"Product Inquiry - {provider_part}"
    body = (
        f"A new product inquiry was submitted:\n\n"
        f"Name: {request.name}\n"
        f"Email: {request.email}\n"
        f"Phone: {request.phone}\n"
        f"Clinic/Hospital: {request.providerName or 'Not specified'}\n"
        f"Query:\n{request.query}\n"
    )

    # Target recipient for product inquiries (configurable)
    recipient = settings.contact_email_recipient or "alteredai@alteredai.care"

    try:
        email_service = EmailService()
        if not email_service.is_configured():
            logger.warning("Email service not configured; skipping contact email to %s", recipient)
            return {
                "success": False,
                "message": "Email service not configured on server.",
            }

        result = await email_service.send_email(
            to=recipient,
            subject=subject,
            body=body,
            reply_to=request.email,
        )
        if not result.get("success"):
            logger.error("Contact email send failed: %s", result.get("error"))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send inquiry email. Please try again later.",
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to send contact email: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send inquiry email. Please try again later.",
        )

    return {"success": True, "message": "Inquiry submitted successfully"}

