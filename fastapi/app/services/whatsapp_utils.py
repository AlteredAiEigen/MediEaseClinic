"""Shared helpers for WhatsApp messaging across MediEase services."""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def format_whatsapp_number(raw_phone: Optional[str]) -> Optional[str]:
    """Normalize a patient phone number for Twilio WhatsApp."""
    if not raw_phone:
        return None
    phone = raw_phone.strip()
    if not phone:
        return None
    if phone.startswith("whatsapp:"):
        return phone.replace(" ", "")

    digits = re.sub(r"\D", "", phone)
    if phone.startswith("+"):
        return f"whatsapp:{phone.replace(' ', '').replace('-', '')}"
    if len(digits) == 10:
        return f"whatsapp:+91{digits}"
    if len(digits) == 12 and digits.startswith("91"):
        return f"whatsapp:+{digits}"
    if len(digits) >= 11:
        return f"whatsapp:+{digits}"

    logger.warning("Phone %s missing valid country code; skipping WhatsApp message.", raw_phone)
    return None


def render_template_body(template: Dict[str, Any], values: Dict[str, Any]) -> str:
    """
    Render a stored template body by replacing {{1}}, {{2}}, ... placeholders.
    Falls back to template_name when body is not stored.
    """
    body = (template.get("body") or "").strip()
    if not body:
        return f"Message for {template.get('template_name', 'template')}"

    from app.services.whatsapp_template_service import WhatsAppTemplateService

    content_vars = WhatsAppTemplateService._build_content_variables(template, values)
    rendered = body
    for position, value in content_vars.items():
        rendered = rendered.replace(f"{{{{{position}}}}}", str(value))
    return rendered
