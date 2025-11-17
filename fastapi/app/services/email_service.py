"""
Email service for sending transactional notifications via SMTP.
"""

import logging
from email.message import EmailMessage
from typing import Iterable, List, Optional, Sequence, Union

import aiosmtplib

from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Lightweight SMTP email sender."""

    def __init__(self):
        self.host = settings.smtp_host
        self.port = settings.smtp_port
        self.username = settings.smtp_user
        self.password = settings.smtp_password
        self.from_address = settings.smtp_from

    def is_configured(self) -> bool:
        """Return True when SMTP credentials are usable."""
        return all(
            [
                bool(self.host),
                bool(self.port),
                bool(self.username),
                bool(self.password),
                bool(self.from_address),
            ]
        )

    async def send_email(
        self,
        to: Union[str, Sequence[str]],
        subject: str,
        body: str,
        reply_to: Optional[str] = None,
    ) -> dict:
        """
        Send an email using SMTP.

        Args:
            to: Recipient or list of recipients.
            subject: Email subject.
            body: Plain-text body.
            reply_to: Optional reply-to address.
        """
        if not self.is_configured():
            message = "Email service is not configured. Skip sending."
            logger.warning(message)
            return {"success": False, "error": message}

        recipients: List[str] = (
            [to] if isinstance(to, str) else [addr for addr in to if addr]
        )
        recipients = [addr.strip() for addr in recipients if addr and addr.strip()]

        if not recipients:
            message = "No valid email recipients supplied."
            logger.warning(message)
            return {"success": False, "error": message}

        email = EmailMessage()
        email["From"] = self.from_address
        email["To"] = ", ".join(recipients)
        email["Subject"] = subject
        if reply_to:
            email["Reply-To"] = reply_to
        email.set_content(body)

        try:
            logger.info("Sending email to %s", recipients)
            await aiosmtplib.send(
                email,
                hostname=self.host,
                port=self.port,
                username=self.username,
                password=self.password,
                start_tls=True,
            )
            logger.info("Email sent to %s", recipients)
            return {"success": True}
        except Exception as exc:
            logger.error("Failed to send email: %s", exc, exc_info=True)
            return {"success": False, "error": str(exc)}


