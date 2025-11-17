"""
Scheduled reminders for appointments (WhatsApp + email).
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.email_service import EmailService
from app.services.whatsapp_service import WhatsAppService

logger = logging.getLogger(__name__)


class AppointmentNotificationService:
    """Business logic for appointment reminder notifications."""

    PRE_VISIT_REMINDER_HOURS = 1
    LAB_RESULT_REMINDER_DAYS = 3

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.appointments = db.appointments
        self.patients = db.patients
        self.users = db.users
        self.whatsapp_service = WhatsAppService()
        self.email_service = EmailService()

    async def process_pre_appointment_reminders(self) -> None:
        """Send WhatsApp reminders 12 hours before the appointment."""
        if not self.whatsapp_service.is_configured():
            logger.debug("WhatsApp service not configured. Skipping reminders.")
            return

        now = datetime.utcnow()
        horizon = now + timedelta(hours=self.PRE_VISIT_REMINDER_HOURS + 2)

        query: Dict[str, Any] = {
            "status": {"$in": ["scheduled"]},
            "preVisitReminderSentAt": {"$exists": False},
            "date": {"$gte": now.strftime("%Y-%m-%d"), "$lte": horizon.strftime("%Y-%m-%d")},
        }
        cursor = self.appointments.find(query).limit(250)
        appointments = await cursor.to_list(length=250)

        for appointment in appointments:
            appointment_dt = self._parse_datetime(appointment.get("date"), appointment.get("time"))
            if not appointment_dt:
                continue

            delta = appointment_dt - now
            if timedelta(seconds=0) <= delta <= timedelta(hours=self.PRE_VISIT_REMINDER_HOURS, minutes=15):
                await self._send_whatsapp_reminder(appointment, appointment_dt)

    async def process_post_appointment_lab_emails(self) -> None:
        """Email doctors 3 days after appointment completion."""
        if not self.email_service.is_configured():
            logger.debug("Email service not configured. Skipping lab reminders.")
            return

        threshold = datetime.utcnow() - timedelta(days=self.LAB_RESULT_REMINDER_DAYS)
        query: Dict[str, Any] = {
            "status": "completed",
            "completedAt": {"$lte": threshold},
            "labResultReminderSentAt": {"$exists": False},
        }

        cursor = self.appointments.find(query).limit(250)
        appointments = await cursor.to_list(length=250)

        for appointment in appointments:
            await self._send_lab_email(appointment)

    async def _send_whatsapp_reminder(self, appointment: dict, appointment_dt: datetime) -> None:
        patient = await self._get_patient(appointment.get("patientId"))
        if not patient:
            return

        phone = self._get_patient_whatsapp_number(patient)
        recipient = self._format_whatsapp_number(phone)
        if not recipient:
            logger.warning("Patient %s has no valid phone for WhatsApp", patient.get("_id"))
            return

        doctor_name = appointment.get("doctorName") or await self._get_doctor_name(appointment.get("doctorId"))
        message = (
            f"Hi {patient.get('firstName', 'there')}, this is MediEase Clinic.\n"
            f"Reminder: Your appointment with {doctor_name or 'your doctor'} is scheduled "
            f"for {appointment.get('date')} at {appointment.get('time')}."
            "\nPlease call us if you need to reschedule or cancel your appointment."
        )

        result = await self.whatsapp_service.send_message(
            to=recipient,
            message=message,
            patient_id=str(patient.get("_id")),
            appointment_id=appointment.get("appointmentId"),
        )

        if result.get("success"):
            await self.appointments.update_one(
                {"_id": appointment["_id"]},
                {"$set": {"preVisitReminderSentAt": datetime.utcnow()}},
            )
            logger.info("WhatsApp reminder sent for appointment %s", appointment.get("appointmentId"))

    async def _send_lab_email(self, appointment: dict) -> None:
        doctor = await self._get_doctor(appointment.get("doctorId"))
        if not doctor:
            logger.warning("Doctor %s not found for appointment %s", appointment.get("doctorId"), appointment.get("appointmentId"))
            return

        patient = await self._get_patient(appointment.get("patientId"))
        patient_name = (
            appointment.get("patientName")
            or (f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip() if patient else "patient")
        )

        subject = f"Lab results reminder for {patient_name}"
        body = (
            "Hello from MediEase! Please remember to send your lab results to "
            "alteredai@alertedai.care for quick review. Your prompt response helps us support your health better. Thank you!"
        )

        result = await self.email_service.send_email(
            to=doctor.get("email"),
            subject=subject,
            body=body,
        )

        if result.get("success"):
            await self.appointments.update_one(
                {"_id": appointment["_id"]},
                {"$set": {"labResultReminderSentAt": datetime.utcnow()}},
            )
            logger.info("Lab reminder email sent for appointment %s", appointment.get("appointmentId"))

    async def _get_patient(self, patient_id: Optional[str]) -> Optional[dict]:
        if not patient_id or not ObjectId.is_valid(patient_id):
            return None
        return await self.patients.find_one({"_id": ObjectId(patient_id)})

    async def _get_doctor(self, doctor_id: Optional[str]) -> Optional[dict]:
        if not doctor_id or not ObjectId.is_valid(doctor_id):
            return None
        return await self.users.find_one({"_id": ObjectId(doctor_id)})

    async def _get_doctor_name(self, doctor_id: Optional[str]) -> Optional[str]:
        doctor = await self._get_doctor(doctor_id)
        if not doctor:
            return None
        return f"Dr. {doctor.get('firstName', '')} {doctor.get('lastName', '')}".strip()

    @staticmethod
    def _get_patient_whatsapp_number(patient: Optional[dict]) -> Optional[str]:
        """Pick WhatsApp-friendly number from patient record."""
        if not patient:
            return None

        candidates = [
            patient.get("whatsappNumber"),
            patient.get("phone"),
            patient.get("contactPhone"),
            patient.get("emergencyContactPhone"),
        ]

        for number in candidates:
            if isinstance(number, str) and number.strip():
                return number.strip()

        return None

    @staticmethod
    def _parse_datetime(date_str: Optional[str], time_str: Optional[str]) -> Optional[datetime]:
        if not date_str or not time_str:
            return None
        try:
            return datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        except ValueError:
            logger.warning("Unable to parse appointment datetime for %s %s", date_str, time_str)
            return None

    @staticmethod
    def _format_whatsapp_number(raw_phone: str) -> Optional[str]:
        if not raw_phone:
            return None
        phone = raw_phone.strip()
        if not phone:
            return None
        if phone.startswith("whatsapp:"):
            return phone
        if not phone.startswith("+"):
            # Assume local number; cannot send via WhatsApp without country code.
            logger.warning("Phone %s missing country code; skipping WhatsApp message.", phone)
            return None
        return f"whatsapp:{phone}"


class AppointmentNotificationScheduler:
    """Async loop that periodically triggers notification checks."""

    def __init__(self, db: AsyncIOMotorDatabase, interval_seconds: int = 300):
        self.service = AppointmentNotificationService(db)
        self.interval_seconds = interval_seconds
        self._task: Optional[asyncio.Task] = None
        self._stop_event = asyncio.Event()

    async def start(self) -> None:
        if self._task and not self._task.done():
            return
        self._stop_event.clear()
        self._task = asyncio.create_task(self._run_loop())
        logger.info("Appointment notification scheduler started.")

    async def stop(self) -> None:
        if not self._task:
            return
        self._stop_event.set()
        await self._task
        self._task = None
        logger.info("Appointment notification scheduler stopped.")

    async def _run_loop(self) -> None:
        while not self._stop_event.is_set():
            try:
                await self.service.process_pre_appointment_reminders()
                await self.service.process_post_appointment_lab_emails()
            except Exception as exc:
                logger.error("Notification scheduler iteration failed: %s", exc, exc_info=True)

            try:
                await asyncio.wait_for(self._stop_event.wait(), timeout=self.interval_seconds)
            except asyncio.TimeoutError:
                continue


