from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.schemas.lead import LeadCreate
from app.services.email_service import EmailService
from app.utils.response import success_response
from app.config import settings

router = APIRouter(prefix="/leads", tags=["Leads"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_lead(
    lead_data: LeadCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),  # kept for potential future persistence
):
    """
    Capture a marketing/contact lead from the landing page and notify the sales team via email.
    """

    recipient_email = settings.lead_email_recipient
    if not recipient_email:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lead email recipient not configured.",
        )

    email_service = EmailService()
    subject = f"New Lead Query from {lead_data.name}"
    body = (
        f"Name: {lead_data.name}\n"
        f"Email: {lead_data.email}\n"
        f"Phone: {lead_data.phone}\n"
        f"Query: {lead_data.query or 'No additional details provided.'}"
    )

    send_result = await email_service.send_email(
        to=recipient_email,
        subject=subject,
        body=body,
        reply_to=lead_data.email,
    )

    if not send_result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=send_result.get("error", "Failed to deliver lead notification email."),
        )

    return success_response(
        message="Lead submitted successfully. Our team will contact you shortly.",
        status_code=status.HTTP_201_CREATED,
    )
from fastapi import APIRouter, HTTPException, status

from app.config import settings
from app.schemas.lead import LeadCreate
from app.services.email_service import EmailService
from app.utils.response import success_response

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_lead(lead_data: LeadCreate):
    """Receive marketing leads and notify the sales team via email."""
    recipient = settings.lead_email_recipient

    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lead notification email is not configured.",
        )

    email_service = EmailService()
    subject = f"New Lead Inquiry from {lead_data.name}"
    body = (
        f"Name: {lead_data.name}\n"
        f"Email: {lead_data.email}\n"
        f"Phone: {lead_data.phone}\n"
        f"Query:\n{lead_data.query or 'No additional details provided.'}"
    )

    send_result = await email_service.send_email(
        to=recipient,
        subject=subject,
        body=body,
        reply_to=lead_data.email,
    )

    if not send_result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=send_result.get(
                "error", "Failed to notify the team about the new lead."
            ),
        )

    return success_response(
        message="Lead submitted successfully. Our team will get in touch shortly.",
        status_code=status.HTTP_201_CREATED,
    )

