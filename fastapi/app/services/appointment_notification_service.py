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
            logger.warning("WhatsApp service not configured. Skipping reminders. Check Twilio credentials in .env file.")
            return

        # Use local time for comparison since appointments are likely stored in local time
        # This ensures the time delta calculation is correct
        now = datetime.now()
        horizon = now + timedelta(hours=self.PRE_VISIT_REMINDER_HOURS + 2)
        
        logger.info("Current local time: %s", now.strftime("%Y-%m-%d %H:%M:%S"))

        query: Dict[str, Any] = {
            "status": {"$in": ["scheduled"]},
            "preVisitReminderSentAt": {"$exists": False},
            "preVisitReminderError": {"$exists": False},  # Exclude appointments with phone number errors
            "date": {"$gte": now.strftime("%Y-%m-%d"), "$lte": horizon.strftime("%Y-%m-%d")},
        }
        logger.info(
            "Scanning for pre-visit reminders: status=scheduled, date between %s and %s, no preVisitReminderSentAt, no preVisitReminderError.",
            now.strftime("%Y-%m-%d"),
            horizon.strftime("%Y-%m-%d"),
        )
        cursor = self.appointments.find(query).limit(250)
        appointments = await cursor.to_list(length=250)
        logger.info(
            "Pre-visit reminder scan found %s pending appointments (window=%sh).",
            len(appointments),
            self.PRE_VISIT_REMINDER_HOURS,
        )
        
        # Log all appointment IDs found for debugging
        if appointments:
            apt_ids = [apt.get("appointmentId", "UNKNOWN") for apt in appointments]
            logger.info("Appointments found in query: %s", ", ".join(apt_ids))

        for appointment in appointments:
            apt_id = appointment.get("appointmentId", "UNKNOWN")
            appointment_dt = self._parse_datetime(appointment.get("date"), appointment.get("time"))
            if not appointment_dt:
                logger.warning(
                    "Appointment %s skipped: failed to parse datetime (date=%s, time=%s).",
                    apt_id,
                    appointment.get("date"),
                    appointment.get("time"),
                )
                continue

            delta = appointment_dt - now
            minutes_until = delta.total_seconds() / 60
            
            # Log detailed time comparison for debugging
            logger.info(
                "Appointment %s time check: appointment_dt=%s (parsed from date=%s, time=%s), now(local)=%s, delta=%.1f minutes",
                apt_id,
                appointment_dt,
                appointment.get("date"),
                appointment.get("time"),
                now,
                minutes_until,
            )
            
            if timedelta(seconds=0) <= delta <= timedelta(hours=self.PRE_VISIT_REMINDER_HOURS, minutes=15):
                logger.info(
                    "Appointment %s eligible for reminder (starts in %.1f minutes).",
                    apt_id,
                    minutes_until,
                )
                await self._send_whatsapp_reminder(appointment, appointment_dt)
            else:
                logger.info(
                    "Appointment %s not in reminder window: %.1f minutes until appointment (window: 0 to %.1f minutes).",
                    apt_id,
                    minutes_until,
                    (self.PRE_VISIT_REMINDER_HOURS * 60) + 15,
                )

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
        logger.debug(
            "Lab reminder scan found %s completed appointments awaiting notification.",
            len(appointments),
        )

        for appointment in appointments:
            await self._send_lab_email(appointment)

    async def _send_whatsapp_reminder(self, appointment: dict, appointment_dt: datetime) -> None:
        apt_id = appointment.get("appointmentId", "UNKNOWN")
        patient_id = appointment.get("patientId")
        
        logger.info("Processing reminder for appointment %s (patientId=%s)", apt_id, patient_id)
        
        patient = await self._get_patient(patient_id)
        if not patient:
            logger.warning(
                "Appointment %s skipped: patient %s not found in database.",
                apt_id,
                patient_id,
            )
            return

        phone = self._get_patient_whatsapp_number(patient)
        recipient = self._format_whatsapp_number(phone)
        if not recipient:
            error_message = f"Invalid or missing WhatsApp phone number for patient {patient_id}. Raw phone: {phone or 'None'}"
            logger.error(
                "Appointment %s REMINDER FAILED: %s. Marking appointment with error to prevent repeated attempts.",
                apt_id,
                error_message,
            )
            # Mark appointment with error to prevent repeated attempts
            await self.appointments.update_one(
                {"_id": appointment["_id"]},
                {
                    "$set": {
                        "preVisitReminderError": {
                            "error": "INVALID_PHONE_NUMBER",
                            "message": error_message,
                            "patientId": patient_id,
                            "rawPhone": phone,
                            "occurredAt": datetime.utcnow(),
                        },
                        "updatedAt": datetime.utcnow(),
                    }
                },
            )
            return

        doctor_name = appointment.get("doctorName") or await self._get_doctor_name(appointment.get("doctorId"))
        message = (
            f"Hi {patient.get('firstName', 'there')}, this is MediEase Clinic.\n"
            f"Reminder: Your appointment with {doctor_name or 'your doctor'} is scheduled "
            f"for {appointment.get('date')} at {appointment.get('time')}."
            "\nPlease call us if you need to reschedule or cancel your appointment."
        )

        logger.info(
            "Triggering WhatsApp reminder for appointment %s (patient=%s).",
            appointment.get("appointmentId"),
            patient.get("_id"),
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
            logger.info("WhatsApp reminder sent successfully for appointment %s", appointment.get("appointmentId"))
        else:
            error_code = result.get("error_code", "UNKNOWN_ERROR")
            error_msg = result.get("error_message", str(result))
            
            # Check if it's a phone number related error
            is_phone_error = (
                "phone" in error_msg.lower() 
                or "invalid" in error_msg.lower() 
                or error_code in ["INVALID_TO_NUMBER", "TWILIO_ERROR"]
            )
            
            if is_phone_error:
                # Mark with error to prevent repeated attempts
                logger.error(
                    "Appointment %s REMINDER FAILED (phone error): %s. Marking appointment with error.",
                    apt_id,
                    error_msg,
                )
                await self.appointments.update_one(
                    {"_id": appointment["_id"]},
                    {
                        "$set": {
                            "preVisitReminderError": {
                                "error": error_code,
                                "message": error_msg,
                                "patientId": patient_id,
                                "phoneNumber": recipient,
                                "occurredAt": datetime.utcnow(),
                            },
                            "updatedAt": datetime.utcnow(),
                        }
                    },
                )
            else:
                # Other errors (Twilio config, network, etc.) - log but don't mark as permanent error
                logger.warning(
                    "WhatsApp reminder failed for appointment %s (non-phone error): %s. Will retry on next scheduler run.",
                    apt_id,
                    error_msg,
                )

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

        logger.info(
            "Triggering lab reminder email for appointment %s (doctor=%s).",
            appointment.get("appointmentId"),
            doctor.get("_id"),
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
        else:
            logger.warning(
                "Lab reminder email failed for appointment %s: %s",
                appointment.get("appointmentId"),
                result.get("error"),
            )

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
        """
        Parse appointment date/time strings into a datetime.
        Assumes the stored time is in UTC (or server local time if consistent).
        Returns naive datetime for comparison with datetime.utcnow().
        """
        if not date_str or not time_str:
            return None
        try:
            # Parse as naive datetime - will be compared with UTC time
            # If appointments are stored in local time, this needs timezone conversion
            parsed = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
            return parsed
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
        logger.info("Notification scheduler loop started (checking every %s seconds).", self.interval_seconds)
        iteration = 0
        while not self._stop_event.is_set():
            iteration += 1
            logger.info("Notification scheduler iteration #%s starting...", iteration)
            try:
                await self.service.process_pre_appointment_reminders()
                await self.service.process_post_appointment_lab_emails()
                logger.info("Notification scheduler iteration #%s completed.", iteration)
            except Exception as exc:
                logger.error("Notification scheduler iteration #%s failed: %s", iteration, exc, exc_info=True)

            try:
                await asyncio.wait_for(self._stop_event.wait(), timeout=self.interval_seconds)
            except asyncio.TimeoutError:
                continue


