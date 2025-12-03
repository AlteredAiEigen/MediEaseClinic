"""
Mailgun webhook endpoint for ingesting emailed patient reports.
"""

from __future__ import annotations

import hmac
import hashlib
import logging
import mimetypes
import re
import time
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from fastapi import (
    APIRouter,
    Depends,
    Form,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from motor.motor_asyncio import AsyncIOMotorDatabase

from PIL import Image, UnidentifiedImageError

from app.config import settings
from app.database import get_db
from app.models.s3_report import s3_report_helper
from app.services.email_service import EmailAttachment, EmailService
from app.services.s3_service import s3_service
from app.utils.response import success_response

logger = logging.getLogger(__name__)

router = APIRouter()

email_service = EmailService()


def _sanitize_filename(name: str) -> str:
    safe = "".join(ch for ch in name if ch.isalnum() or ch in {"-", "_", "."})
    return safe or "attachment.bin"


def _verify_mailgun_signature(token: str, timestamp: str, signature: str) -> bool:
    signing_key = settings.mailgun_signing_key
    if token in settings.mailgun_test_tokens:
        return True
    if not signing_key:
        return True
    if not (token and timestamp and signature):
        return False
    try:
        ts_int = int(timestamp)
    except ValueError:
        return False
    now = int(time.time())
    if abs(now - ts_int) > 15 * 60:
        logger.warning("Mailgun signature timestamp outside allowed window")
        return False

    expected = hmac.new(
        signing_key.encode(),
        f"{timestamp}{token}".encode(),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, signature)


def _ensure_pdf_attachment(
    filename: str,
    content: bytes,
    content_type: str,
) -> Tuple[str, bytes, str]:
    lower_name = filename.lower()
    if lower_name.endswith(".pdf") or content_type == "application/pdf":
        if lower_name.endswith(".pdf"):
            return filename, content, "application/pdf"
        return f"{Path(filename).stem or 'document'}.pdf", content, "application/pdf"

    if content_type.startswith("image/"):
        try:
            with Image.open(BytesIO(content)) as image:
                pdf_buffer = BytesIO()
                image_to_save = image.convert("RGB")
                image_to_save.save(pdf_buffer, format="PDF")
                pdf_buffer.seek(0)
                new_name = f"{Path(filename).stem or 'attachment'}.pdf"
                return new_name, pdf_buffer.read(), "application/pdf"
        except UnidentifiedImageError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported image format for attachment {filename}.",
            )
        except Exception as exc:
            logger.error("Failed to convert image %s to PDF: %s", filename, exc)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to convert {filename} to PDF.",
            )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Attachment {filename} must be a PDF or supported image format.",
    )


async def _collect_attachments(
    form_items: List[Tuple[str, object]],
    max_size_bytes: int,
) -> List[Dict[str, object]]:
    attachments: List[Tuple[str, object]] = []
    for key, value in form_items:
        if not key.startswith("attachment-"):
            continue
        # Only collect actual numbered attachments, not attachment-count or other fields
        try:
            int(key.split("-")[1])  # Check if it's attachment-N where N is a number
            logger.info("Mailgun attachment candidate %s -> %s", key, type(value))
            attachments.append((key, value))
        except (IndexError, ValueError):
            continue  # Skip non-numeric attachment keys like attachment-count

    attachments.sort(key=lambda pair: pair[0])

    files: List[Dict[str, object]] = []
    for key, upload in attachments:
        content = None
        filename = None
        content_type = None

        if isinstance(upload, UploadFile) or hasattr(upload, 'filename'):
            content = await upload.read()
            filename = upload.filename or f"{key}.bin"
            content_type = upload.content_type
        elif isinstance(upload, str):
            content = upload.encode('utf-8')
            filename = f"{key}.bin"
            content_type = "application/octet-stream"
        elif isinstance(upload, (bytes, bytearray)):
            content = bytes(upload)
            filename = f"{key}.bin"
            content_type = "application/octet-stream"
        else:
            continue

        logger.info("Mailgun attachment %s received %s bytes", filename, len(content) if content else 0)

        if not content:
            continue
        if len(content) > max_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Attachment exceeds maximum allowed size",
            )

        filename = _sanitize_filename(filename)
        content_type = content_type or mimetypes.guess_type(filename)[0] or "application/octet-stream"
        converted_name, converted_content, converted_type = _ensure_pdf_attachment(
            filename,
            content,
            content_type,
        )

        files.append(
            {
                "filename": converted_name,
                "content": converted_content,
                "content_type": converted_type,
            }
        )

    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid attachments found in email",
        )

    return files


async def _save_reports_to_s3(
    patient: dict,
    attachments: List[Dict[str, object]],
) -> List[Dict[str, object]]:
    reports_bucket = settings.s3_transcripts_bucket or settings.s3_bucket_name
    if not reports_bucket:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="S3 bucket configuration missing",
        )

    clinic_id = patient.get("createdByClinicId") or "general"
    patient_id = patient.get("patientId") or "unknown"
    date_prefix = datetime.utcnow().strftime("%Y/%m/%d")
    folder = f"clinic/{clinic_id}/patient/{patient_id}/reports/mailgun/{date_prefix}"

    uploads: List[Dict[str, object]] = []
    for attachment in attachments:
        upload_result = await s3_service.upload_file(
            file_content=attachment["content"],
            file_name=attachment["filename"],
            content_type=attachment["content_type"],
            folder=folder,
            bucket_override=reports_bucket,
        )
        uploads.append(
            {
                "documentName": attachment["filename"],
                "s3Key": upload_result["s3_key"],
                "s3Url": upload_result["file_url"],
                "bucket": upload_result["bucket"],
            }
        )
    return uploads


async def _notify_patient(
    patient: dict,
    sender_display: str,
    subject: str,
    attachments: List[Dict[str, object]],
) -> bool:
    if not email_service.is_configured():
        logger.warning("Email service not configured; cannot notify patient %s", patient.get("email"))
        return False

    attachment_payload: List[EmailAttachment] = [
        {
            "filename": att["filename"],
            "content": att["content"],
            "mime_type": att["content_type"],
        }
        for att in attachments
    ]

    body = (
        f"Hi {patient.get('firstName', 'there')},\n\n"
        f"We received new documents sent by {sender_display} to your MediEase clinic email "
        "and stored them securely in your records.\n\n"
        f"Subject: {subject or 'New report'}\n"
        f"Attachments: {', '.join(att['filename'] for att in attachments)}\n\n"
        "If you believe this was sent in error, please contact the clinic.\n\n"
        "— MediEase Clinic"
    )

    result = await email_service.send_email(
        to=patient.get("email"),
        subject="New medical documents received",
        body=body,
        attachments=attachment_payload,
    )

    return result.get("success", False)


@router.post("/webhooks/mailgun", tags=["Mailgun"])
async def mailgun_webhook(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    signature: str = Form(default=""),
    token: str = Form(default=""),
    timestamp: str = Form(default=""),
):
    """Handle inbound Mailgun messages for patient aliases."""
    if not _verify_mailgun_signature(token, timestamp, signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature")

    form = await request.form()
    form_items = list(form.multi_items())
    logger.info("Mailgun form keys: %s", [key for key, _ in form_items])
    form_dict: Dict[str, object] = {}
    for key, value in form_items:
        if key not in form_dict or not isinstance(form_dict[key], UploadFile):
            form_dict[key] = value

    recipient = (form_dict.get("recipient") or "").lower().strip()
    if not recipient:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing recipient address")

    expected_domain = (settings.mailgun_expected_recipient_domain or "").lower().strip()
    if expected_domain and not recipient.endswith(f"@{expected_domain}"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipient domain not allowed for this webhook",
        )

    logger.info(
        "Mailgun webhook received",
        extra={
            "mailgun_recipient": recipient,
            "mailgun_subject": form_dict.get("subject"),
            "mailgun_message_id": form_dict.get("Message-Id") or form_dict.get("message-id"),
        },
    )

    patient = await db["patients"].find_one({"medieaseClinicEmail": recipient})
    if not patient:
        patient = await db["patients"].find_one(
            {"medieaseClinicEmail": {"$regex": f"^{re.escape(recipient)}$", "$options": "i"}}
        )
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found for provided alias",
        )

    max_upload_size_mb = getattr(settings, "max_upload_size_mb", 10)
    try:
        attachments = await _collect_attachments(form_items, max_upload_size_mb * 1024 * 1024)
    except HTTPException as exc:
        logger.error("Mailgun webhook attachment error: %s", exc.detail)
        raise

    logger.info("Mailgun webhook received %s attachment(s)", len(attachments))

    try:
        uploads = await _save_reports_to_s3(patient, attachments)
    except HTTPException as exc:
        logger.error("Mailgun webhook S3 save error: %s", exc.detail)
        raise
    except Exception as exc:
        logger.exception("Unexpected error while saving Mailgun attachments to S3")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store attachments",
        ) from exc
    logger.info(
        "Stored %s Mailgun attachments for patient %s",
        len(uploads),
        patient.get("patientId"),
    )

    sender_display = form_dict.get("from") or form_dict.get("sender") or "Unknown sender"
    subject = form_dict.get("subject") or "New patient report"
    message_id = form_dict.get("Message-Id") or form_dict.get("message-id") or form_dict.get("Message-ID")

    report_docs = []
    for upload in uploads:
        doc = {
            "patientId": patient.get("patientId"),
            "patientMongoId": patient.get("_id"),
            "patientEmail": patient.get("email"),
            "documentName": upload["documentName"],
            "s3Key": upload["s3Key"],
            "s3Url": upload["s3Url"],
            "emailSentToPatient": False,
            "mailgunRecipient": recipient,
            "mailgunSender": sender_display,
            "mailgunSubject": subject,
            "mailgunMessageId": message_id,
            "metadata": {
                "bucket": upload["bucket"],
                "receivedAt": datetime.utcnow(),
            },
            "clinicId": patient.get("createdByClinicId"),
        }
        result = await db["s3_reports"].insert_one(doc)
        doc["_id"] = result.inserted_id
        report_docs.append(doc)

    try:
        email_sent = await _notify_patient(patient, sender_display, subject, attachments)
    except Exception as exc:
        logger.exception("Failed to notify patient %s about Mailgun upload", patient.get("email"))
        email_sent = False
    if email_sent:
        ids = [doc["_id"] for doc in report_docs]
        await db["s3_reports"].update_many(
            {"_id": {"$in": ids}},
            {"$set": {"emailSentToPatient": True, "emailSentAt": datetime.utcnow()}},
        )

    formatted_reports = [await s3_report_helper(doc) for doc in report_docs]

    logger.info(
        "Mailgun webhook processed",
        extra={
            "mailgun_recipient": recipient,
            "patientId": patient.get("patientId"),
            "reportsSaved": len(formatted_reports),
            "emailSentToPatient": email_sent,
        },
    )

    return success_response(
        message="Report processed successfully",
        data={
            "patientId": patient.get("patientId"),
            "alias": recipient,
            "reports": formatted_reports,
            "emailSentToPatient": email_sent,
        },
    )


