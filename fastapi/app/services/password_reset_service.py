"""
Utility service for issuing and validating password reset tokens.
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
from app.utils.security import hash_password
from app.utils.validators import validate_password_strength

logger = logging.getLogger(__name__)


class PasswordResetService:
    """Handle password reset token lifecycle and notifications."""

    def __init__(self) -> None:
        self.email_service = EmailService()

    @property
    def _collection(self):
        return Database.get_database()["password_reset_tokens"]

    @property
    def _users_collection(self):
        return Database.get_database()["users"]

    def _hash_token(self, token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    def _expiry(self) -> datetime:
        minutes = max(5, settings.password_reset_token_exp_minutes or 60)
        return datetime.utcnow() + timedelta(minutes=minutes)

    async def issue_token(self, user_id: str, *, purpose: str = "password_reset") -> Tuple[str, ObjectId]:
        """Create and persist a token for the given user."""
        token = secrets.token_urlsafe(48)
        token_hash = self._hash_token(token)
        doc = {
            "userId": ObjectId(user_id),
            "tokenHash": token_hash,
            "purpose": purpose,
            "createdAt": datetime.utcnow(),
            "expiresAt": self._expiry(),
            "consumedAt": None,
        }
        result = await self._collection.insert_one(doc)
        logger.info("Created password reset token for user %s", user_id)
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

    async def send_password_reset_email(
        self,
        user: dict,
        *,
        is_new_account: bool = False,
    ) -> dict:
        """
        Generate a token and email it to the user. Returns metadata about the send attempt.
        """
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        token, _ = await self.issue_token(user["_id"])
        reset_link = f"{settings.password_reset_url}?token={token}"

        if is_new_account:
            subject = "Your MediEase account is ready"
            intro = (
                f"Hi {user.get('firstName', 'there')},\n\n"
                "An administrator just created a MediEase account for you."
            )
        else:
            subject = "Reset your MediEase password"
            intro = f"Hi {user.get('firstName', 'there')},\n\nYou requested to reset your MediEase password."

        body = (
            f"{intro}\n\n"
            f"Username: {user.get('email')}\n"
            f"Reset link: {reset_link}\n\n"
            "The link expires soon to keep your account secure. "
            "If you did not request this, please contact support immediately.\n\n"
            "— MediEase Clinic"
        )

        if not self.email_service.is_configured():
            logger.warning("Email service not configured; skipping password email to %s", user.get("email"))
            return {"success": False, "error": "email service not configured", "resetLink": reset_link}

        send_result = await self.email_service.send_email(
            to=user.get("email"),
            subject=subject,
            body=body,
        )
        send_result["resetLink"] = reset_link
        return send_result

    async def reset_password_with_token(self, token: str, new_password: str) -> dict:
        """Validate token and update the user's password."""
        token_doc = await self._find_valid_token(token)
        if not token_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset token",
            )

        is_valid, error_message = validate_password_strength(new_password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message,
            )

        hashed_password = hash_password(new_password)
        update_result = await self._users_collection.update_one(
            {"_id": token_doc["userId"]},
            {
                "$set": {
                    "password": hashed_password,
                    "updatedAt": datetime.utcnow(),
                    "lastPasswordResetAt": datetime.utcnow(),
                }
            },
        )

        if update_result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found for token",
            )

        await self._collection.update_one(
            {"_id": token_doc["_id"]},
            {"$set": {"consumedAt": datetime.utcnow()}},
        )

        logger.info("Password reset successfully for user %s", token_doc["userId"])
        return {"userId": str(token_doc["userId"])}


password_reset_service = PasswordResetService()


