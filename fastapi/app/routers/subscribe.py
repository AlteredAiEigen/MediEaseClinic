"""
Newsletter subscription endpoint to capture email addresses and store them in the database.
Sends a confirmation email to the subscriber.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

from app.database import get_db
from app.services.email_service import EmailService
from app.utils.response import success_response

router = APIRouter()
email_service = EmailService()


class SubscribeRequest(BaseModel):
    """Newsletter subscription request model."""

    email: EmailStr = Field(..., description="Subscriber's email address")
    source: Optional[str] = Field(default="landing_page", description="Where the subscription came from")


@router.post("/subscribe")
async def subscribe_newsletter(
    request: SubscribeRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Subscribe to newsletter and store email in database."""

    try:
        # Check if email already exists
        existing = await db["subscriptions"].find_one({"email": request.email})
        if existing:
            return success_response(
                message="You're already subscribed to our newsletter!",
                data={"already_subscribed": True}
            )

        # Store subscription in database
        subscription_data = {
            "email": request.email,
            "source": request.source,
            "subscribed_at": datetime.utcnow(),
            "is_active": True,
            "preferences": {
                "product_updates": True,
                "security_updates": True,
                "feature_announcements": True
            }
        }

        result = await db["subscriptions"].insert_one(subscription_data)

        # Send welcome email
        if email_service.is_configured():
            subject = "Welcome to MediEase Clinic Newsletter!"
            body = f"""
Welcome to the MediEase Clinic newsletter!

Thank you for subscribing. You'll receive updates about:
• New features and product updates
• Security and compliance announcements
• Healthcare technology insights
• Special offers and promotions

If you no longer wish to receive these emails, you can unsubscribe at any time.

Best regards,
The MediEase Clinic Team

---
This email was sent to {request.email}
Subscription ID: {result.inserted_id}
"""

            email_result = await email_service.send_email(
                to=request.email,
                subject=subject,
                body=body
            )

            if not email_result.get("success"):
                logging.warning(f"Failed to send welcome email to {request.email}: {email_result.get('error')}")
        else:
            logging.warning("Email service not configured - welcome email not sent")

        return success_response(
            message="Successfully subscribed to our newsletter!",
            data={
                "subscription_id": str(result.inserted_id),
                "welcome_email_sent": email_service.is_configured()
            }
        )

    except Exception as e:
        logging.error(f"Error processing newsletter subscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process subscription"
        )