"""
Contact/inquiry endpoint to notify the team when a prospect requests details.
Sends an email to the configured recipient using Mailgun API.
"""

import logging
import os
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
import requests

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


def send_email_via_mailgun(
    to_address: str,
    subject: str,
    text_body: str,
    reply_to: str = None,
) -> dict:
    """
    Send an email using Mailgun API.
    Uses the same approach as email_mailgun.py for consistency.
    Returns dict with 'success' and optional 'error' keys.
    """
    # Get Mailgun config from environment (same way as email_mailgun.py)
    mailgun_api_key = os.getenv("MAILGUN_API_KEY") or settings.mailgun_api_key
    mailgun_domain = os.getenv("MAILGUN_DOMAIN") or settings.mailgun_domain
    mailgun_api_base_url = os.getenv("MAILGUN_API_BASE_URL", "https://api.mailgun.net/v3")
    
    if not mailgun_api_key or not mailgun_domain:
        error_msg = "Mailgun API key or domain not configured"
        logger.error(error_msg)
        return {"success": False, "error": error_msg}

    url = f"{mailgun_api_base_url.rstrip('/')}/{mailgun_domain}/messages"
    
    # Use the same from address format as email_mailgun.py
    # Ensure the from address uses the same domain as mailgun_domain
    default_from = f"Mediease Clinic <reports@{mailgun_domain}>"
    from_address = os.getenv(
        "MAILGUN_NOTIFY_FROM_ADDRESS",
        settings.mailgun_reports_from if settings.mailgun_reports_from and f"@{mailgun_domain}" in settings.mailgun_reports_from else default_from
    )
    
    data = {
        "from": from_address,
        "to": to_address,
        "subject": subject,
        "text": text_body,
    }
    
    if reply_to:
        data["h:Reply-To"] = reply_to

    try:
        logger.info("Sending email via Mailgun to %s from %s", to_address, from_address)
        response = requests.post(
            url,
            auth=("api", mailgun_api_key),
            data=data,
            timeout=30,
        )
        
        if response.status_code >= 400:
            error_text = response.text
            if response.status_code == 401:
                if "Invalid private key" in error_text:
                    error_msg = "Mailgun API key is invalid or expired. Please check your Mailgun dashboard and update MAILGUN_API_KEY in .env"
                else:
                    error_msg = f"Mailgun authentication failed (401): {error_text}. Check API key and domain verification in Mailgun dashboard."
            else:
                error_msg = f"Mailgun send failed ({response.status_code}): {error_text}"
            logger.error(error_msg)
            logger.error("Mailgun URL: %s", url)
            logger.error("Mailgun Domain: %s", mailgun_domain)
            logger.error("API Key (first 10 chars): %s", mailgun_api_key[:10] if mailgun_api_key else "NOT SET")
            return {"success": False, "error": error_msg}
        
        logger.info("Email sent successfully via Mailgun to %s", to_address)
        response_data = response.json()
        return {"success": True, "message_id": response_data.get("id", "")}
    except Exception as exc:
        error_msg = f"Failed to send email via Mailgun: {str(exc)}"
        logger.error(error_msg, exc_info=True)
        return {"success": False, "error": error_msg}


@router.post("", response_model=dict, status_code=status.HTTP_200_OK)
async def create_contact(request: ContactRequest):
    """
    Receive a contact/inquiry request and send an email notification via Mailgun.
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
        # Check if Mailgun is configured
        if not settings.mailgun_api_key or not settings.mailgun_domain:
            logger.warning("Mailgun not configured; skipping contact email to %s", recipient)
            return {
                "success": False,
                "message": "Email service not configured on server.",
            }

        result = send_email_via_mailgun(
            to_address=recipient,
            subject=subject,
            text_body=body,
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

