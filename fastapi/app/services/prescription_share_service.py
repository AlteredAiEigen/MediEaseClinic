"""Short public share links for prescription PDF downloads (WhatsApp-friendly)."""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import settings
from app.services.s3_service import s3_service

logger = logging.getLogger(__name__)

COLLECTION = "prescription_share_links"
DEFAULT_TTL_DAYS = 7


class PrescriptionShareService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.links = db[COLLECTION]

    async def create_share_url(
        self,
        *,
        s3_key: str,
        filename: str,
        appointment_id: Optional[str] = None,
        patient_id: Optional[str] = None,
        ttl_days: int = DEFAULT_TTL_DAYS,
    ) -> str:
        """Persist a short token and return the public share URL."""
        token = secrets.token_urlsafe(8)
        expires_at = datetime.utcnow() + timedelta(days=max(1, ttl_days))
        doc: Dict[str, Any] = {
            "token": token,
            "s3_key": s3_key,
            "filename": filename or "prescription.pdf",
            "appointment_id": appointment_id,
            "patient_id": patient_id,
            "expires_at": expires_at,
            "created_at": datetime.utcnow(),
        }
        await self.links.insert_one(doc)
        base = (settings.frontend_base_url or "").rstrip("/") or "https://app.clinic.alteredai.care"
        return f"{base}/api/prescriptions/share/{token}"

    async def resolve_redirect_url(self, token: str) -> Optional[str]:
        """Return a fresh presigned download URL for a valid, unexpired token."""
        if not token:
            return None
        doc = await self.links.find_one({"token": token})
        if not doc:
            return None
        expires_at = doc.get("expires_at")
        if isinstance(expires_at, datetime) and expires_at < datetime.utcnow():
            logger.info("Prescription share link expired: token=%s", token)
            return None
        s3_key = doc.get("s3_key")
        if not s3_key:
            return None
        try:
            return await s3_service.generate_prescription_download_url(
                s3_key,
                filename=doc.get("filename") or "prescription.pdf",
            )
        except Exception as exc:
            logger.error("Failed to resolve prescription share link %s: %s", token, exc)
            return None
