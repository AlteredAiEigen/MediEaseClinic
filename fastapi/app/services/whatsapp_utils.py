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


# Matches http(s) URLs; trailing sentence punctuation is excluded by the caller when needed.
_URL_IN_TEXT_RE = re.compile(r"https?://[^\s<>\"']+")


def mask_download_url_as_prescription(
    body: str,
    download_url: Optional[str] = None,
) -> str:
    """
    Replace a prescription download URL in stored message text with the label
    \"prescription\" so the WhatsApp Messages UI never shows a raw S3/presigned URL.
    The real URL should be stored separately as link_url for click-through.
    """
    if not body:
        return body

    text = body
    if download_url:
        text = text.replace(download_url, "prescription")

    def _replace(match: re.Match) -> str:
        raw = match.group(0)
        url = raw.rstrip(".,;:!?) ]}\"'" )
        trailing = raw[len(url) :]
        lowered = url.lower()
        if (
            "s3.amazonaws.com" in lowered
            or "/prescriptions/share/" in lowered
            or "prescription" in lowered
            or "amazonaws.com" in lowered
        ):
            return "prescription" + trailing
        return raw

    return _URL_IN_TEXT_RE.sub(_replace, text)
