"""
Service for issuing and validating email verification tokens for new accounts.
"""

from __future__ import annotations

import hashlib
import logging
import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple

from bson import ObjectId
from fastapi import HTTPException, status

from app.config import settings
from app.database import Database
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)


class EmailVerificationService:
    """Handle email verification token lifecycle and notifications."""

    def __init__(self) -> None:
        self.email_service = EmailService()

    @property
    def _collection(self):
        return Database.get_database()["email_verification_tokens"]

    @property
    def _users_collection(self):
        return Database.get_database()["users"]

    def _hash_token(self, token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    def _expiry(self) -> datetime:
        # Reuse password reset expiry configuration for consistency
        minutes = max(5, settings.password_reset_token_exp_minutes or 60)
        return datetime.utcnow() + timedelta(minutes=minutes)

    async def issue_token(self, user_id: str) -> Tuple[str, ObjectId]:
        """Create and persist a verification token for the given user."""
        token = secrets.token_urlsafe(48)
        token_hash = self._hash_token(token)
        doc = {
            "userId": ObjectId(user_id),
            "tokenHash": token_hash,
            "createdAt": datetime.utcnow(),
            "expiresAt": self._expiry(),
            "consumedAt": None,
        }
        result = await self._collection.insert_one(doc)
        logger.info("Created email verification token for user %s", user_id)
        return token, result.inserted_id

    async def _find_valid_token(self, token: str) -> Optional[dict]:
        token_hash = self._hash_token(token)
        now = datetime.utcnow()
        return await self._collection.find_one(
            {
                "tokenHash": token_hash,
                "expiresAt": {"$gt": now},
                "consumedAt": None,
            }
        )

    async def send_verification_email(self, user: dict) -> dict:
        """
        Generate a verification token and email it to the user.

        Returns metadata about the send attempt, including the verification link.
        """
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        token, _ = await self.issue_token(user["_id"])

        # Build absolute verification URL that hits the FastAPI /api/auth/verify-email endpoint
        base = (settings.frontend_base_url or "").rstrip("/") or "https://app.clinic.alteredai.care"
        verification_link = f"{base}/api/auth/verify-email?token={token}"

        subject = "Verify your MediEase admin account"
        intro = (
            f"Hi {user.get('firstName', 'there')},\n\n"
            "Thanks for signing up as an admin for MediEase Clinic.\n"
            "Please confirm your Gmail address to activate your account."
        )

        body = (
            f"{intro}\n\n"
            f"Verification link: {verification_link}\n\n"
            "Once verified, you can sign in at:\n"
            f"{settings.frontend_base_url.rstrip('/')}/auth?role=admin\n\n"
            "If you did not request this, you can safely ignore this email.\n\n"
            "— MediEase Clinic"
        )

        if not self.email_service.is_configured():
            logger.warning(
                "Email service not configured; skipping verification email to %s",
                user.get("email"),
            )
            return {
                "success": False,
                "error": "email service not configured",
                "verificationLink": verification_link,
            }

        send_result = await self.email_service.send_email(
            to=user.get("email"),
            subject=subject,
            body=body,
        )
        send_result["verificationLink"] = verification_link
        return send_result

    async def verify_with_token(self, token: str) -> dict:
        """Validate verification token and activate the user's account."""
        token_doc = await self._find_valid_token(token)
        if not token_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification link",
            )

        user = await self._users_collection.find_one({"_id": token_doc["userId"]})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found for verification token",
            )

        # Activate account: mark as active and set accountStatus to active
        update_result = await self._users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "isActive": True,
                    "accountStatus": "active",
                    "updatedAt": datetime.utcnow(),
                }
            },
        )

        if update_result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found for verification token",
            )

        # Mark token as consumed so it cannot be reused
        await self._collection.update_one(
            {"_id": token_doc["_id"]},
            {"$set": {"consumedAt": datetime.utcnow()}},
        )

        logger.info("Email verified successfully for user %s", token_doc["userId"])
        return {"userId": str(token_doc["userId"]), "email": user.get("email")}


email_verification_service = EmailVerificationService()



