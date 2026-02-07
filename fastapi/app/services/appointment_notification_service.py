"""
Scheduled reminders for appointments (WhatsApp + email).
"""

import asyncio
import logging
import re
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import settings
from app.services.whatsapp_template_service import WhatsAppTemplateService

logger = logging.getLogger(__name__)


class AppointmentNotificationService:
    """Business logic for appointment reminder notifications."""

    APPOINTMENT_REMINDER_LOOKAHEAD_HOURS = settings.whatsapp_appointment_reminder_lookahead_hours
    LAB_RESULT_HOURS_AFTER_COMPLETION = settings.whatsapp_lab_result_hours_after_completion
    FOLLOWUP_DAYS_BEFORE = settings.whatsapp_followup_days_before
    REMINDER_DISPATCH_HOUR = settings.whatsapp_reminder_dispatch_hour

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.appointments = db.appointments
        self.patients = db.patients
        self.users = db.users
        self.providers = db.healthcare_providers
        self.whatsapp_template_service = WhatsAppTemplateService(db)


    async def _get_patient_phone(self, patient_id: Optional[str]) -> Optional[str]:
        """Get patient phone number from patient table (only field not in appointment)."""
        if not patient_id or not ObjectId.is_valid(patient_id):
            return None
        patient = await self.patients.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            return None
        phone = patient.get("phone")
        return phone.strip() if isinstance(phone, str) and phone.strip() else None
    
    async def _check_whatsapp_consent(self, patient_id: Optional[str]) -> bool:
        """Check if patient has given consent for WhatsApp messages."""
        if not patient_id or not ObjectId.is_valid(patient_id):
            return False
        patient = await self.patients.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            return False
        return patient.get("consent_whatsapp", False) is True


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

    def _build_message_body(self, scenario: str, content_values: Dict[str, Any], appointment: dict) -> str:
        """Build the full message body from template variables for logging purposes."""
        if scenario == "appointment_reminder" or scenario == "appointment_reminder_payloads":
            # Build full appointment reminder message matching the template structure
            clinic_name = content_values.get("clinic_name", "MediEase Clinic")
            patient_name = content_values.get("patient_name", appointment.get("patientName", "Patient"))
            doctor_name = content_values.get("doctor_name", appointment.get("doctorName", "Doctor"))
            appointment_datetime = content_values.get("appointment_datetime", f"{appointment.get('date')} {appointment.get('time')}")
            clinic_phone = content_values.get("clinic_phone", "")
            
            # Build message matching the template structure
            message = f"Dear {patient_name},\n\n"
            message += f"Your appointment with {doctor_name} on {appointment_datetime}.\n"
            message += f"Please reply to confirm/cancel"
            if clinic_phone:
                message += f" or CALL {clinic_phone}."
            else:
                message += "."
            message += f"\n\nThank you, {clinic_name} Team"
            return message
        elif scenario == "post_visit_lab_request":
            return "Lab result reminder"
        elif scenario == "followup_appointment_reminder":
            return "Follow-up appointment reminder"
        else:
            return f"Message for {scenario}"

    @staticmethod
    def _format_whatsapp_number(raw_phone: str) -> Optional[str]:
        if not raw_phone:
            return None
        phone = raw_phone.strip()
        if not phone:
            return None
        if phone.startswith("whatsapp:"):
            # Remove spaces from existing whatsapp: prefix
            phone = phone.replace(" ", "")
            return phone
        if not phone.startswith("+"):
            # Assume local number; cannot send via WhatsApp without country code.
            logger.warning("Phone %s missing country code; skipping WhatsApp message.", phone)
            return None
        # Remove all spaces, dashes, and parentheses from phone number
        phone = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        return f"whatsapp:{phone}"
        

    async def _get_provider(self, clinic_id: Optional[str]) -> Optional[dict]:
        """Get healthcare provider/clinic information by clinicId."""
        if not clinic_id:
            logger.debug("_get_provider called with None/empty clinic_id")
            return None
        
        logger.debug(f"Fetching provider for clinicId: {clinic_id}")
        provider = await self.providers.find_one({"clinicId": clinic_id})
        
        if provider:
            logger.debug(f"✅ Provider found: {provider.get('name', 'N/A')} (phone: {provider.get('phone', 'N/A')})")
        else:
            logger.warning(f"⚠️  No provider found for clinicId: {clinic_id}")
        
        return provider

    async def _log_whatsapp_attempt(
        self,
        appointment: dict,
        scenario: str,
        success: bool,
        details: Dict[str, Any],
        set_flag: Optional[str] = None,
        extra_set: Optional[Dict[str, Any]] = None,
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
        if extra_set:
            update.update(extra_set)
        await self.appointments.update_one({"_id": appointment["_id"]}, {"$set": update})
        
        # Also store in whatsapp_messages collection for robust tracking
        if success and details.get("message_sid"):
            message_sid = details.get("message_sid")
            patient_id = str(appointment.get("patientId", ""))
            appointment_id = appointment.get("appointmentId", "")
            
            # Check if message already exists (prevent duplicates from status webhook)
            existing = await self.db.whatsapp_messages.find_one({"message_sid": message_sid})
            if existing:
                logger.info(f"Message {message_sid} already exists in whatsapp_messages, skipping duplicate insert")
                # Update existing message with body from Twilio if available and current body is empty/incomplete
                if details.get("body") and (not existing.get("body") or len(existing.get("body", "")) < 50):
                    await self.db.whatsapp_messages.update_one(
                        {"message_sid": message_sid},
                        {"$set": {"body": details.get("body", existing.get("body", ""))}}
                    )
                    logger.info(f"Updated message {message_sid} with message body from Twilio")
                return
            
            # Get message body from Twilio API response (already fetched in send method)
            message_body = details.get("body", "")
            if not message_body:
                # Fallback: use scenario name if body not available
                if scenario == "appointment_reminder" or scenario == "appointment_reminder_payloads":
                    message_body = f"Appointment reminder for {appointment.get('date')} {appointment.get('time')}"
                elif scenario == "post_visit_lab_request":
                    message_body = "Lab result reminder"
                elif scenario == "followup_appointment_reminder":
                    message_body = "Follow-up appointment reminder"
                else:
                    message_body = f"Message for {scenario}"
            
            # Get patient phone
            patient_phone = None
            if patient_id and ObjectId.is_valid(patient_id):
                patient = await self.patients.find_one({"_id": ObjectId(patient_id)})
                if patient:
                    patient_phone = patient.get("phone", "")
            
            message_doc = {
                "message_sid": message_sid,
                "direction": "outbound",
                "from": details.get("from_number", ""),
                "to": details.get("to", ""),
                "body": message_body,
                "patient_id": patient_id if patient_id else None,
                "appointment_id": appointment_id,
                "sent_by": "scheduler",
                "sent_by_role": "system",
                "sent_by_name": "Automated Scheduler",
                "status": details.get("status", "sent"),
                "message_type": "scheduler",
                "scenario": scenario,
                "created_at": datetime.utcnow(),
                "received_at": datetime.utcnow().isoformat(),
                "processed": True,
            }
            await self.db.whatsapp_messages.insert_one(message_doc)
            logger.info(f"Stored scheduler WhatsApp message in MongoDB: {message_sid} (scenario: {scenario})")
            
            # Broadcast WebSocket update for real-time UI refresh
            try:
                from app.services.websocket_service import WebSocketService
                websocket_service = WebSocketService()
                await websocket_service.broadcast_whatsapp_message_update(
                    message_doc,
                    patient_id
                )
                logger.info(f"Broadcasted scheduler WhatsApp message update via WebSocket")
            except Exception as ws_error:
                logger.warning(f"Failed to broadcast scheduler WhatsApp message update: {ws_error}")

    async def _send_template(
        self,
        *,
        appointment: dict,
        scenario: str,
        to: str,
        content_values: Dict[str, Any],
        flag_field: str,
    ) -> None:
        if appointment.get(flag_field):
            logger.info("Skipping %s for appointment %s (already sent).", scenario, appointment.get("appointmentId"))
            return
        if not self.whatsapp_template_service.is_configured():
            logger.warning("Twilio Content API not configured; skipping scenario %s", scenario)
            return

        result = await self.whatsapp_template_service.send(
            to=to,
            scenario=scenario,
            values=content_values,
            patient_id=str(appointment.get("patientId")),
            appointment_id=appointment.get("appointmentId"),
        )
        
        await self._log_whatsapp_attempt(
            appointment=appointment,
            scenario=scenario,
            success=result.get("success", False),
            details=result,
            set_flag=flag_field if result.get("success") else None,
        )


    async def process_appointment_reminders_24h(self) -> None:
        """
        Send appointment reminders 24 hours before appointment time.
        Finds all scheduled appointments where appointment_date + time is approximately 24 hours from now.
        Runs hourly to catch all appointments that need reminders.
        """
        if not self.whatsapp_template_service.is_configured():
            logger.warning("WhatsApp template service not configured; skipping 24h reminders.")
            return

        now = datetime.utcnow()
        # Calculate target window: appointments that are 24 hours away (within ±1 hour window for hourly cron)
        target_time = now + timedelta(hours=self.APPOINTMENT_REMINDER_LOOKAHEAD_HOURS)
        window_start = target_time - timedelta(hours=1)  # Widen to 1 hour before
        window_end = target_time + timedelta(hours=1)    # Widen to 1 hour after
        
        logger.info(f"Current time: {now}")
        logger.info(f"Looking for appointments between {window_start} and {window_end}")
        logger.info(f"Target: {target_time} (24 hours from now)")
        
        # Query for scheduled appointments that haven't had reminders sent
        # We'll filter by date range first, then check exact time
        query = {
            "status": {"$in": ["scheduled"]},
            "appointmentReminderSent": {"$ne": True},
            "date": {"$gte": window_start.strftime("%Y-%m-%d"), "$lte": window_end.strftime("%Y-%m-%d")},
        }
        
        logger.info(f"Query: {query}")
        cursor = self.appointments.find(query)
        appointments = await cursor.to_list(length=None)  # Get all matching appointments

        logger.info("Found %d scheduled appointments to check for 24h reminders", len(appointments))
        
        sent_count = 0
        skipped_count = 0

        for appointment in appointments:
            appointment_id = appointment.get("appointmentId")
            patient_name = appointment.get("patientName", "Unknown")
            appointment_date = appointment.get("date")
            appointment_time = appointment.get("time")
            
            logger.info(f"Checking appointment {appointment_id} for {patient_name} on {appointment_date} at {appointment_time}")
            
            appointment_dt = self._parse_datetime(appointment_date, appointment_time)
            if not appointment_dt:
                logger.warning(f"  ✗ Could not parse datetime for {appointment_id}")
                continue
            
            # Check if appointment is within the 24-hour window
            delta = appointment_dt - now
            hours_until = delta.total_seconds() / 3600
            
            logger.info(f"  Appointment datetime: {appointment_dt}")
            logger.info(f"  Hours until appointment: {hours_until:.2f}")
            logger.info(f"  Target window: {self.APPOINTMENT_REMINDER_LOOKAHEAD_HOURS - 1} to {self.APPOINTMENT_REMINDER_LOOKAHEAD_HOURS + 1} hours")
            
            # Send reminder if appointment is between 23 and 25 hours away (wider window)
            min_hours = self.APPOINTMENT_REMINDER_LOOKAHEAD_HOURS - 1
            max_hours = self.APPOINTMENT_REMINDER_LOOKAHEAD_HOURS + 1
            
            if hours_until < min_hours or hours_until > max_hours:
                logger.info(f"  ⚠ Skipping {appointment_id} - {hours_until:.2f} hours away (outside {min_hours}-{max_hours} hour window)")
                skipped_count += 1
                continue

            logger.info(f"  ✓ Appointment {appointment_id} is within window, sending reminder...")

            # Check WhatsApp consent first
            patient_id = appointment.get("patientId")
            if not await self._check_whatsapp_consent(patient_id):
                logger.info(f"  ⚠ Skipping {appointment_id} - patient has not consented to WhatsApp messages")
                skipped_count += 1
                continue

            patient_phone = await self._get_patient_phone(patient_id)
            provider = await self._get_provider(appointment.get("clinicId"))
            recipient = self._format_whatsapp_number(patient_phone)
            if not recipient:
                logger.warning(f"  ✗ No valid phone number for {appointment_id}")
                await self._log_whatsapp_attempt(
                    appointment,
                    "appointment_reminder_payloads",
                    False,
                    {"error_message": "missing or invalid patient WhatsApp number"},
                )
                continue

            # Get appointment MongoDB _id to include in button payload
            appointment_mongo_id = str(appointment.get("_id"))
            
            # Get clinic phone number for call button ({{5}})
            clinic_phone = provider.get("phone") if provider else ""
            
            # Map variables to match Twilio template structure:
            # {{1}} = Clinic name (header)
            # {{2}} = Patient name
            # {{3}} = Doctor name
            # {{4}} = Appointment datetime
            # {{5}} = Clinic phone (for CALL button)
            # {{6}} = Appointment ID (button payload)
            variables = {
                "clinic_name": provider.get("name") if provider else "MediEase Clinic",  # {{1}} - Header
                "patient_name": appointment.get("patientName", ""),  # {{2}} - Body
                "doctor_name": appointment.get("doctorName", ""),  # {{3}} - Body
                "appointment_datetime": f"{appointment.get('date')} {appointment.get('time')}",  # {{4}} - Body
                "clinic_phone": clinic_phone,  # {{5}} - Body (for CALL button)
                "appointment_id": appointment_mongo_id,  # {{6}} - Button payload
            }
            await self._send_template(
                appointment=appointment,
                scenario="appointment_reminder_payloads",  # Use new template with appointment ID
                to=recipient,
                content_values=variables,
                flag_field="appointmentReminderSent",
            )
            sent_count += 1
            logger.info(
                "  ✓ Sent 24h appointment reminder for appointment %s (patient: %s, date: %s %s)",
                appointment_id,
                patient_name,
                appointment_date,
                appointment_time
            )
        
        logger.info(
            "Appointment reminder processing complete: %d sent, %d skipped (outside time window)",
            sent_count,
            skipped_count
        )

    @staticmethod
    def _should_run_at_hour(target_hour: int) -> bool:
        """Check if current hour matches target hour."""
        now = datetime.utcnow()
        return now.hour == target_hour

    async def process_lab_result_reminders(self) -> None:
        """
        Send post-visit lab result WhatsApp reminders 24 hours after appointment completion.
        Finds all completed appointments with prescribedTest that were completed exactly 24 hours ago.
        Runs only at configured dispatch hour (default 10 AM) to send all eligible reminders at once.
        """
        if not self.whatsapp_template_service.is_configured():
            logger.warning("WhatsApp template service not configured; skipping lab result reminders.")
            return
        if not self._should_run_at_hour(self.REMINDER_DISPATCH_HOUR):
            return

        now = datetime.utcnow()
        # Find appointments completed exactly 24 hours ago (within ±1 hour window for daily dispatch)
        target_completion_time = now - timedelta(hours=self.LAB_RESULT_HOURS_AFTER_COMPLETION)
        window_start = target_completion_time - timedelta(hours=1)
        window_end = target_completion_time + timedelta(hours=1)

        logger.info(f"Looking for appointments between {window_start} and {window_end}")
        logger.info(f"Target: {target_completion_time} (24 hours after completion)")
        
        query = {
            "status": "completed",
            "labResultReminderSent": {"$ne": True},
            "completedAt": {
                "$gte": window_start,
                "$lte": window_end
            },
            "prescribedTest": {"$exists": True, "$ne": None, "$ne": ""},
        }
        cursor = self.appointments.find(query)
        appointments = await cursor.to_list(length=None)  # Get all matching appointments
        
        logger.info("Found %d completed appointments with lab tests eligible for reminder", len(appointments))
        
        sent_count = 0
        failed_count = 0

        for appointment in appointments:
            # Check WhatsApp consent first
            patient_id = appointment.get("patientId")
            if not await self._check_whatsapp_consent(patient_id):
                logger.info(f"Skipping lab result reminder for appointment {appointment.get('appointmentId')} - patient has not consented to WhatsApp messages")
                failed_count += 1
                continue

            patient_phone = await self._get_patient_phone(patient_id)
            provider = await self._get_provider(appointment.get("clinicId"))
            recipient = self._format_whatsapp_number(patient_phone)
            if not recipient:
                failed_count += 1
                await self._log_whatsapp_attempt(
                    appointment,
                    "post_visit_lab_request",
                    False,
                    {"error_message": "missing or invalid patient WhatsApp number"},
                )
                continue

            # Get clinic email from patient table (not in appointment)
            patient_id = appointment.get("patientId")
            clinic_email = ""
            if patient_id and ObjectId.is_valid(patient_id):
                patient = await self.patients.find_one({"_id": ObjectId(patient_id)})
                if patient:
                    clinic_email = patient.get("medieaseClinicEmail", "")

            variables = {
                "patient_name": appointment.get("patientName", ""),
                "clinic_email": clinic_email,
                "clinic_name": provider.get("name") if provider else "",
            }
            await self._send_template(
                appointment=appointment,
                scenario="post_visit_lab_request",
                to=recipient,
                content_values=variables,
                flag_field="labResultReminderSent",
            )
            sent_count += 1
            logger.info(
                "Sent lab result reminder for appointment %s (patient: %s, completed: %s)",
                appointment.get("appointmentId"),
                appointment.get("patientName"),
                appointment.get("completedAt")
            )
        
        logger.info(
            "Lab result reminder processing complete: %d sent, %d failed (missing phone/invalid)",
            sent_count,
            failed_count
        )

    async def process_followup_reminders(self) -> None:
        """
        Send follow-up WhatsApp reminders based on followup_days.
        Finds all past appointments where followUpRequired=True and reminder date has passed.
        Calculates: reminder_date = (completedAt + followup_days) - FOLLOWUP_DAYS_BEFORE
        Runs only at configured dispatch hour (default 10 AM) to send all eligible reminders at once.
        """
        if not self.whatsapp_template_service.is_configured():
            logger.warning("WhatsApp template service not configured; skipping follow-up reminders.")
            return
        if not self._should_run_at_hour(self.REMINDER_DISPATCH_HOUR):
            return

        now = datetime.utcnow()
        # Find all appointments that need follow-up reminders
        query = {
            "followUpRequired": True,
            "followupWhatsappSent": {"$ne": True},
            "status": {"$in": ["completed", "checkout", "checkout-pending"]},
            "completedAt": {"$exists": True, "$ne": None},
        }
        cursor = self.appointments.find(query)
        appointments = await cursor.to_list(length=None)  # Get all matching appointments
        
        logger.info("Found %d appointments with followUpRequired=True to check for reminders", len(appointments))
        
        sent_count = 0
        skipped_count = 0
        failed_count = 0

        for appointment in appointments:
            completed_at = appointment.get("completedAt")
            if not completed_at:
                continue
            
            # Get followup_days from appointment or parse from followUpInstructions
            followup_days = appointment.get("followup_days")
            if not followup_days:
                # Try to parse from followUpInstructions if available
                followup_instructions = appointment.get("followUpInstructions", "")
                if followup_instructions:
                    match = re.search(r'(\d+)\s*days?', followup_instructions, re.IGNORECASE)
                    if match:
                        followup_days = int(match.group(1))
            
            if not followup_days or followup_days <= 0:
                continue
            
            # Calculate follow-up date: completedAt + followup_days
            if isinstance(completed_at, str):
                try:
                    # Handle ISO format strings
                    if 'T' in completed_at:
                        completed_at = datetime.fromisoformat(completed_at.replace('Z', '+00:00'))
                    else:
                        # Fallback for other formats
                        completed_at = datetime.strptime(completed_at, "%Y-%m-%d %H:%M:%S")
                except Exception as e:
                    logger.warning(f"Could not parse completedAt for appointment {appointment.get('appointmentId')}: {e}")
                    continue
            elif not isinstance(completed_at, datetime):
                continue
            
            # Calculate: reminder should be sent X days before the follow-up date
            # Follow-up date = completedAt + followup_days
            # Reminder date = follow-up date - FOLLOWUP_DAYS_BEFORE
            followup_date = completed_at + timedelta(days=followup_days)
            reminder_date = followup_date - timedelta(days=self.FOLLOWUP_DAYS_BEFORE)
            
            # Only send if current time is past the reminder date (reminder is due)
            # Since this runs at 10 AM daily, send if reminder_date is today or in the past
            if now < reminder_date:
                skipped_count += 1
                continue

            # Check WhatsApp consent first
            patient_id = appointment.get("patientId")
            if not await self._check_whatsapp_consent(patient_id):
                logger.info(f"Skipping follow-up reminder for appointment {appointment.get('appointmentId')} - patient has not consented to WhatsApp messages")
                failed_count += 1
                continue

            patient_phone = await self._get_patient_phone(patient_id)
            provider = await self._get_provider(appointment.get("clinicId"))
            recipient = self._format_whatsapp_number(patient_phone)
            if not recipient:
                failed_count += 1
                await self._log_whatsapp_attempt(
                    appointment,
                    "followup_appointment_reminder",
                    False,
                    {"error_message": "missing or invalid patient WhatsApp number"},
                )
                continue

            variables = {
                "patient_name": appointment.get("patientName", ""),
                "clinic_name": provider.get("name") if provider else "",
                "doctor_name": appointment.get("doctorName", ""),
                "visit_date": appointment.get("date", ""),
                "visit_time": appointment.get("time", ""),
                "clinic_phone": provider.get("phone") if provider else "",
            }
            await self._send_template(
                appointment=appointment,
                scenario="followup_appointment_reminder",
                to=recipient,
                content_values=variables,
                flag_field="followupWhatsappSent",
            )
            sent_count += 1
            logger.info(
                "Sent follow-up reminder for appointment %s (patient: %s, follow-up in %d days)",
                appointment.get("appointmentId"),
                appointment.get("patientName"),
                followup_days
            )
        
        logger.info(
            "Follow-up reminder processing complete: %d sent, %d skipped (reminder not due), %d failed (missing phone/invalid)",
            sent_count,
            skipped_count,
            failed_count
        )


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
                await self.service.process_appointment_reminders_24h()
                await self.service.process_lab_result_reminders()
                await self.service.process_followup_reminders()
                logger.info("Notification scheduler iteration #%s completed.", iteration)
            except Exception as exc:
                logger.error("Notification scheduler iteration #%s failed: %s", iteration, exc, exc_info=True)

            try:
                await asyncio.wait_for(self._stop_event.wait(), timeout=self.interval_seconds)
            except asyncio.TimeoutError:
                continue


