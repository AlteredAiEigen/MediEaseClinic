"""
Contact/inquiry endpoint to notify the team when a prospect requests details.
Sends an email to the configured recipient.
"""

import logging
import anyio
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from email_mailgun import send_email_via_mailgun
from app.config import settings

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
        # Fast-fail if Mailgun is not configured – but do not block the user.
        from email_mailgun import MAILGUN_API_KEY, MAILGUN_DOMAIN
        if not MAILGUN_API_KEY or not MAILGUN_DOMAIN:
            logger.warning("Mailgun config missing; skipping email send for contact request.")
            return {
                "success": True,
                "message": "Inquiry received. Email delivery is temporarily disabled.",
            }

        # Run the blocking Mailgun call off the event loop with a timeout
        async with anyio.fail_after(12):
            response = await anyio.to_thread.run_sync(
                send_email_via_mailgun,
                recipient,
                subject,
                body,
            )
        if response.status_code >= 400:
            logger.error("Mailgun send failed: %s - %s", response.status_code, response.text)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send inquiry email. Please try again later.",
            )
    except (HTTPException, anyio.get_cancelled_exc_class()):
        raise
    except Exception as exc:
        logger.error("Failed to send contact email via Mailgun: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send inquiry email. Please try again later.",
        )

    return {"success": True, "message": "Inquiry submitted successfully"}

