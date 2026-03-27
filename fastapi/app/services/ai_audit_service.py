"""
Structured audit logging for AI features (insights generation and consultation chat).
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, Optional

from app.config import settings
from app.database import Database

logger = logging.getLogger(__name__)


async def log_ai_event(
    *,
    category: str,
    user_id: Optional[str],
    user_role: Optional[str],
    patient_id: Optional[str],
    appointment_id: Optional[str],
    conversation_id: Optional[str],
    prompt_excerpt: str,
    response_excerpt: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Persist AI interactions for compliance and later analysis.
    Stores full excerpts in MongoDB; ensure deployment access controls match policy.
    """
    if not getattr(settings, "enable_audit_logging", True):
        return

    try:
        db = Database.get_database()
        doc = {
            "timestamp": datetime.utcnow(),
            "category": category,
            "userId": user_id,
            "userRole": user_role,
            "patientId": patient_id,
            "appointmentId": appointment_id,
            "conversationId": conversation_id,
            "promptExcerpt": prompt_excerpt or "",
            "responseExcerpt": response_excerpt or "",
            "metadata": metadata or {},
        }
        await db.ai_audit_logs.insert_one(doc)

        # Also mirror a lightweight row into generic audit_logs for unified reporting
        await db.audit_logs.insert_one(
            {
                "timestamp": doc["timestamp"],
                "userId": user_id,
                "userRole": user_role,
                "action": "POST",
                "resourceType": "ai",
                "resourceId": patient_id or conversation_id or "unknown",
                "endpoint": f"/api/ai/{category}",
                "method": "POST",
                "statusCode": 200,
                "success": True,
                "metadata": {
                    "aiCategory": category,
                    "appointmentId": appointment_id,
                    "conversationId": conversation_id,
                },
            }
        )
    except Exception as exc:  # pragma: no cover
        logger.warning("AI audit log failed: %s", exc)
