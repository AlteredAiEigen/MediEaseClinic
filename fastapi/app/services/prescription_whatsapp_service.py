"""
Send prescription PDF download links to patients via approved Twilio WhatsApp template.

Template metadata (name, content_sid, body, variables) lives in whatsapp_templates,
same as appointment reminders and follow-up messages.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.constants.whatsapp_templates import PRESCRIPTION_TEMPLATE_NAME
from app.services.healthcare_provider_service import HealthcareProviderService
from app.services.prescription_share_service import PrescriptionShareService
from app.services.whatsapp_service import WhatsAppService
from app.services.whatsapp_template_service import WhatsAppTemplateService
from app.services.whatsapp_utils import (
    format_whatsapp_number,
    mask_download_url_as_prescription,
    render_template_body,
)

logger = logging.getLogger(__name__)

PRESCRIPTION_FLAG_FIELD = "prescriptionWhatsappSent"
PRESCRIPTION_FINALIZED_FIELD = "prescriptionFinalized"
DELIVERY_FAILED_STATUSES = {"failed", "undelivered"}
STATUS_POLL_ATTEMPTS = 6
STATUS_POLL_INTERVAL_SEC = 1.0


class PrescriptionWhatsAppService:
    """Deliver prescription PDFs to patients using DB-backed WhatsApp templates."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.appointments = db.appointments
        self.patients = db.patients
        self.s3_prescriptions = db.s3_prescriptions
        self.provider_service = HealthcareProviderService(db)
        self.whatsapp_template_service = WhatsAppTemplateService(db)

    async def _get_patient(self, patient_id: Optional[str]) -> Optional[dict]:
        if not patient_id:
            return None
        if ObjectId.is_valid(patient_id):
            patient = await self.patients.find_one({"_id": ObjectId(patient_id)})
            if patient:
                return patient
        return await self.patients.find_one({"patientId": patient_id})

    async def _check_whatsapp_consent(self, patient: Optional[dict]) -> bool:
        return bool(patient and patient.get("consent_whatsapp", False) is True)

    async def _log_whatsapp_attempt(
        self,
        appointment: dict,
        scenario: str,
        success: bool,
        details: Dict[str, Any],
        *,
        set_flag: Optional[str] = None,
        sent_by: Optional[str] = None,
        sent_by_name: Optional[str] = None,
    ) -> None:
        update: Dict[str, Any] = {
            "updatedAt": datetime.utcnow(),
            f"whatsappLogs.{scenario}": {
                "status": "sent" if success else "failed",
                "attemptedAt": datetime.utcnow(),
                "details": details,
            },
        }
        if success and set_flag:
            update[set_flag] = True
            update["prescriptionWhatsappSentAt"] = datetime.utcnow()
            update[PRESCRIPTION_FINALIZED_FIELD] = True
            update["prescriptionFinalizedAt"] = datetime.utcnow()
            update["prescriptionFinalizedVia"] = "whatsapp"
            update["prescriptionWhatsappDeliveryFailed"] = False
            update["prescriptionWhatsappDeliveryError"] = None
        elif not success and scenario == PRESCRIPTION_TEMPLATE_NAME:
            # A WhatsApp attempt is terminal for this appointment's single
            # prescription, whether it reaches the patient or not.
            update[PRESCRIPTION_FLAG_FIELD] = False
            update[PRESCRIPTION_FINALIZED_FIELD] = True
            update["prescriptionFinalizedAt"] = datetime.utcnow()
            update["prescriptionFinalizedVia"] = "whatsapp_failed"
            update["prescriptionWhatsappDeliveryFailed"] = True
            update["prescriptionWhatsappDeliveryError"] = (
                details.get("error_message")
                or details.get("error_code")
                or "WhatsApp delivery failed"
            )

        await self.appointments.update_one({"_id": appointment["_id"]}, {"$set": update})

        # Track WhatsApp outcome only on digital prescription rows for this appointment
        await self.s3_prescriptions.update_many(
            {
                "appointmentId": str(appointment["_id"]),
                "metadata.source": "digital",
            },
            {
                "$set": {
                    "whatsappSentToPatient": success,
                    "whatsappSentAt": datetime.utcnow() if success else None,
                    "emailSentToPatient": success,
                    "emailSentAt": datetime.utcnow() if success else None,
                    "updatedAt": datetime.utcnow(),
                }
            },
        )

        message_sid = details.get("message_sid")
        if not success or not message_sid:
            return

        existing = await self.db.whatsapp_messages.find_one({"message_sid": message_sid})
        if existing:
            if details.get("body") and (
                not existing.get("body") or len(existing.get("body", "")) < 50
            ):
                await self.db.whatsapp_messages.update_one(
                    {"message_sid": message_sid},
                    {"$set": {"body": details.get("body", existing.get("body", ""))}},
                )
            return

        patient_id = str(appointment.get("patientId", ""))
        message_body = details.get("body") or "Prescription download link sent via WhatsApp template."
        link_url = details.get("link_url")
        message_doc = {
            "message_sid": message_sid,
            "direction": "outbound",
            "from": details.get("from_number", ""),
            "to": details.get("to", ""),
            "body": message_body,
            "link_url": link_url,
            "patient_id": patient_id or None,
            "appointment_id": str(appointment.get("_id")),
            "sent_by": sent_by or "system",
            "sent_by_role": "doctor" if sent_by else "system",
            "sent_by_name": sent_by_name or "MediEase",
            "status": details.get("status", "sent"),
            "message_type": "prescription",
            "scenario": scenario,
            "created_at": datetime.utcnow(),
            "received_at": datetime.utcnow().isoformat(),
            "processed": True,
        }
        await self.db.whatsapp_messages.insert_one(message_doc)

        try:
            from app.services.websocket_service import WebSocketService

            websocket_service = WebSocketService()
            await websocket_service.broadcast_whatsapp_message_update(message_doc, patient_id)
        except Exception as ws_error:
            logger.warning("Failed to broadcast prescription WhatsApp update: %s", ws_error)

    async def _send_template(
        self,
        *,
        appointment: dict,
        to: str,
        content_values: Dict[str, Any],
        force: bool = False,
        uploaded_by: Optional[str] = None,
        uploaded_by_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        if appointment.get(PRESCRIPTION_FLAG_FIELD) and not force:
            # If last delivery failed, allow automatic retry (flag may be stale)
            last_log = (appointment.get("whatsappLogs") or {}).get(PRESCRIPTION_TEMPLATE_NAME) or {}
            if last_log.get("status") not in ("failed", "undelivered"):
                logger.info(
                    "Skipping %s for appointment %s (already sent).",
                    PRESCRIPTION_TEMPLATE_NAME,
                    appointment.get("appointmentId") or appointment.get("_id"),
                )
                return {"success": True, "skipped": True, "reason": "already_sent"}
            logger.info(
                "Previous prescription WhatsApp delivery failed for %s — retrying.",
                appointment.get("appointmentId") or appointment.get("_id"),
            )

        if not self.whatsapp_template_service.is_configured():
            result = {
                "success": False,
                "error_message": "Twilio WhatsApp is not configured",
                "error_code": "CONFIG",
            }
            await self._log_whatsapp_attempt(
                appointment,
                PRESCRIPTION_TEMPLATE_NAME,
                False,
                result,
                sent_by=uploaded_by,
                sent_by_name=uploaded_by_name,
            )
            return {"success": False, "skipped": False, "reason": "twilio_not_configured"}

        # Load template from whatsapp_templates — content_sid, body, variables come from DB
        template = await self.whatsapp_template_service.fetch_template(PRESCRIPTION_TEMPLATE_NAME)
        if not template:
            result = {
                "success": False,
                "error_message": (
                    f"Template '{PRESCRIPTION_TEMPLATE_NAME}' not found in whatsapp_templates"
                ),
                "error_code": "TEMPLATE_MISSING",
            }
            await self._log_whatsapp_attempt(
                appointment,
                PRESCRIPTION_TEMPLATE_NAME,
                False,
                result,
                sent_by=uploaded_by,
                sent_by_name=uploaded_by_name,
            )
            return {"success": False, "skipped": False, "reason": "template_missing"}

        template_name = template.get("template_name", PRESCRIPTION_TEMPLATE_NAME)

        result = await self.whatsapp_template_service.send_by_template_name(
            template_name=PRESCRIPTION_TEMPLATE_NAME,
            to=to,
            values=content_values,
            patient_id=str(appointment.get("patientId")),
            appointment_id=str(appointment.get("_id")),
        )

        # Always store a clinic-facing body with "prescription" instead of the raw URL.
        download_url = content_values.get("prescription_download_url") or ""
        rendered_body = render_template_body(template, content_values)
        result["body"] = mask_download_url_as_prescription(rendered_body, download_url)
        if download_url:
            result["link_url"] = download_url

        # Twilio often accepts the message (queued) then fails delivery moments later.
        # Poll status briefly so the doctor gets a failure popup instead of a false success.
        if result.get("success") and result.get("message_sid"):
            delivery = await self._await_delivery_status(result["message_sid"])
            result["delivery_status"] = delivery.get("status")
            if delivery.get("status") in DELIVERY_FAILED_STATUSES:
                result["success"] = False
                result["error_code"] = str(
                    delivery.get("error_code") or result.get("error_code") or "DELIVERY_FAILED"
                )
                result["error_message"] = (
                    delivery.get("error_message")
                    or f"WhatsApp delivery failed (status={delivery.get('status')})."
                )
                logger.warning(
                    "Prescription WhatsApp delivery failed during poll for %s: status=%s error=%s",
                    appointment.get("_id"),
                    delivery.get("status"),
                    result["error_message"],
                )

        await self._log_whatsapp_attempt(
            appointment,
            template_name,
            result.get("success", False),
            result,
            set_flag=PRESCRIPTION_FLAG_FIELD if result.get("success") else None,
            sent_by=uploaded_by,
            sent_by_name=uploaded_by_name,
        )

        if result.get("success"):
            return {
                "success": True,
                "skipped": False,
                "message_sid": result.get("message_sid"),
                "downloadUrl": content_values.get("prescription_download_url"),
                "delivery_status": result.get("delivery_status"),
            }

        return {
            "success": False,
            "skipped": False,
            "reason": result.get("error_code") or "send_failed",
            "error_message": result.get("error_message"),
            "delivery_status": result.get("delivery_status"),
        }

    async def _await_delivery_status(self, message_sid: str) -> Dict[str, Any]:
        """Poll Twilio until delivered/failed or attempts exhausted."""
        whatsapp_service = WhatsAppService()
        last: Dict[str, Any] = {"status": "queued"}
        for attempt in range(STATUS_POLL_ATTEMPTS):
            status_result = await whatsapp_service.get_message_status(message_sid)
            if status_result.get("success"):
                last = status_result
                status = (status_result.get("status") or "").lower()
                if status in DELIVERY_FAILED_STATUSES or status in {
                    "delivered",
                    "read",
                }:
                    return status_result
            if attempt < STATUS_POLL_ATTEMPTS - 1:
                await asyncio.sleep(STATUS_POLL_INTERVAL_SEC)
        return last

    async def finalize_prescription_for_print(self, appointment_id: str) -> Dict[str, Any]:
        """Mark prescription done/non-editable after doctor prints (e.g. WhatsApp failed)."""
        if not ObjectId.is_valid(appointment_id):
            return {"success": False, "error_message": "Invalid appointment ID"}

        appointment = await self.appointments.find_one({"_id": ObjectId(appointment_id)})
        if not appointment:
            return {"success": False, "error_message": "Appointment not found"}

        await self.appointments.update_one(
            {"_id": ObjectId(appointment_id)},
            {
                "$set": {
                    PRESCRIPTION_FINALIZED_FIELD: True,
                    "prescriptionFinalizedAt": datetime.utcnow(),
                    "prescriptionFinalizedVia": "print",
                    "updatedAt": datetime.utcnow(),
                }
            },
        )
        return {
            "success": True,
            "prescriptionFinalized": True,
            "prescriptionFinalizedVia": "print",
        }

    async def send_prescription_whatsapp(
        self,
        appointment_id: str,
        *,
        uploaded_by: Optional[str] = None,
        uploaded_by_name: Optional[str] = None,
        force: bool = False,
    ) -> Dict[str, Any]:
        """
        Send prescription download link to patient via WhatsApp template.

        Returns dict with success flag and details. Idempotent unless force=True.
        """
        if not ObjectId.is_valid(appointment_id):
            return {
                "success": False,
                "skipped": True,
                "reason": "invalid_appointment_id",
            }

        appointment = await self.appointments.find_one({"_id": ObjectId(appointment_id)})
        if not appointment:
            return {
                "success": False,
                "skipped": True,
                "reason": "appointment_not_found",
            }

        if appointment.get(PRESCRIPTION_FINALIZED_FIELD):
            return {
                "success": False,
                "skipped": True,
                "reason": "prescription_completed",
                "error_message": "This appointment's prescription is already completed and cannot be sent again.",
            }

        s3_key = appointment.get("prescriptionFileKey")
        if not s3_key:
            return {
                "success": False,
                "skipped": True,
                "reason": "no_prescription_file",
            }

        patient = await self._get_patient(str(appointment.get("patientId")))
        if not patient:
            await self._log_whatsapp_attempt(
                appointment,
                PRESCRIPTION_TEMPLATE_NAME,
                False,
                {"error_message": "Patient not found", "error_code": "PATIENT_NOT_FOUND"},
                sent_by=uploaded_by,
                sent_by_name=uploaded_by_name,
            )
            return {"success": False, "skipped": False, "reason": "patient_not_found"}

        if not await self._check_whatsapp_consent(patient):
            await self._log_whatsapp_attempt(
                appointment,
                PRESCRIPTION_TEMPLATE_NAME,
                False,
                {
                    "error_message": "Patient has not consented to WhatsApp messages",
                    "error_code": "NO_CONSENT",
                },
                sent_by=uploaded_by,
                sent_by_name=uploaded_by_name,
            )
            return {"success": False, "skipped": True, "reason": "no_whatsapp_consent"}

        recipient = format_whatsapp_number(patient.get("phone"))
        if not recipient:
            await self._log_whatsapp_attempt(
                appointment,
                PRESCRIPTION_TEMPLATE_NAME,
                False,
                {
                    "error_message": "Invalid or missing patient WhatsApp phone number",
                    "error_code": "INVALID_PHONE",
                },
                sent_by=uploaded_by,
                sent_by_name=uploaded_by_name,
            )
            return {"success": False, "skipped": False, "reason": "invalid_phone"}

        provider = await self.provider_service.get_provider_by_id(appointment.get("clinicId"))
        clinic_name = (
            appointment.get("clinicName")
            or (provider or {}).get("name")
            or "MediEase Clinic"
        )
        clinic_phone = (provider or {}).get("phone") or appointment.get("clinicPhone") or ""

        patient_name = appointment.get("patientName") or (
            f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
        )
        filename = appointment.get("prescriptionFileName") or "prescription.pdf"

        try:
            share_service = PrescriptionShareService(self.db)
            download_url = await share_service.create_share_url(
                s3_key=s3_key,
                filename=filename,
                appointment_id=str(appointment.get("_id")),
                patient_id=str(appointment.get("patientId") or ""),
            )
        except Exception as exc:
            await self._log_whatsapp_attempt(
                appointment,
                PRESCRIPTION_TEMPLATE_NAME,
                False,
                {
                    "error_message": f"Failed to generate prescription download URL: {exc}",
                    "error_code": "PRESIGNED_URL_FAILED",
                },
                sent_by=uploaded_by,
                sent_by_name=uploaded_by_name,
            )
            return {"success": False, "skipped": False, "reason": "presigned_url_failed"}

        content_values = {
            "patient_name": patient_name or "Patient",
            "prescription_download_url": download_url,
            "clinic_phone": clinic_phone or "your clinic",
            "clinic_name": clinic_name,
        }

        result = await self._send_template(
            appointment=appointment,
            to=recipient,
            content_values=content_values,
            force=force,
            uploaded_by=uploaded_by,
            uploaded_by_name=uploaded_by_name,
        )

        if result.get("success") and not result.get("skipped"):
            logger.info(
                "Prescription WhatsApp sent for appointment %s to %s",
                appointment_id,
                recipient,
            )

        return result

    async def send_if_not_already_sent(
        self,
        appointment_id: str,
        *,
        uploaded_by: Optional[str] = None,
        uploaded_by_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send prescription WhatsApp only when it has not been sent yet."""
        return await self.send_prescription_whatsapp(
            appointment_id,
            uploaded_by=uploaded_by,
            uploaded_by_name=uploaded_by_name,
            force=False,
        )


def get_prescription_whatsapp_service(db: AsyncIOMotorDatabase) -> PrescriptionWhatsAppService:
    return PrescriptionWhatsAppService(db)
