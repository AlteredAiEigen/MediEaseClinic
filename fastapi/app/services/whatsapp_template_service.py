"""
WhatsApp Content API helper with dynamic template lookup.
Uses whatsapp_templates collection (fields: template_name, content_sid, variables[{position,key}]).
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase
from twilio.base.exceptions import TwilioException, TwilioRestException
from twilio.rest import Client

from app.config import settings

logger = logging.getLogger(__name__)


class WhatsAppTemplateService:
    """Send WhatsApp messages via Twilio Content API using DB templates."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.client: Optional[Client] = None
        self.from_number: str = ""

        if not settings.twilio_account_sid or not settings.twilio_auth_token:
            logger.warning("Twilio credentials not configured. WhatsApp messaging disabled.")
            return

        try:
            self.client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
            self.from_number = settings.twilio_whatsapp_number
            logger.info("Twilio Content API client initialized for WhatsApp.")
        except Exception as exc:
            logger.error("Failed to initialize Twilio client: %s", exc)
            self.client = None
            self.from_number = ""

    def is_configured(self) -> bool:
        return bool(self.client and self.from_number)

    async def fetch_template(self, scenario: str) -> Optional[Dict[str, Any]]:
        """Get template doc by template_name from whatsapp_templates collection."""
        
        logger.info(f"Looking for template with template_name: '{scenario}'")

        # Query by template_name field (not scenario)
        template = await self.db.whatsapp_templates.find_one({"template_name": scenario})
        
        if template:
            logger.info(f"✓ Template found: {template.get('template_name')} (Content SID: {template.get('content_sid') or template.get('contentSid')})")
            return template
        
        # If not found, list all available templates for debugging
        logger.warning(f"✗ Template not found for template_name: '{scenario}'")
        logger.info("Checking available templates in database...")
        all_templates = await self.db.whatsapp_templates.find({}).to_list(length=10)
        
        if all_templates:
            logger.info(f"Found {len(all_templates)} templates in database:")
            for t in all_templates:
                logger.info(f"  - template_name: '{t.get('template_name')}' (Content SID: {t.get('content_sid') or t.get('contentSid')})")
        else:
            logger.error("No templates found in whatsapp_templates collection!")
            logger.error("Please ensure templates are inserted with the 'template_name' field.")
        
        return None

    @staticmethod
    def _build_content_variables(template: Dict[str, Any], values: Dict[str, Any]) -> Dict[str, str]:
        """
        Map template variables to Twilio content variables.
        Supports two formats:
        1. List of strings: ["patient_name", "clinic_name", ...] - uses index+1 as position
        2. List of objects: [{"position": "1", "name": "patient_name"}, ...] - uses position from object
        """
        content_vars: Dict[str, str] = {}
        variables = template.get("variables", []) or []
        
        logger.info(f"Building content variables from template variables: {variables}")
        logger.info(f"Provided values: {values}")
        
        for index, var in enumerate(variables):
            # Handle two formats:
            # 1. String format: ["patient_name", "clinic_name"]
            # 2. Object format: [{"position": "1", "name": "patient_name"}]
            
            if isinstance(var, str):
                # Format 1: String - use index+1 as position (Twilio uses 1-based positions)
                position = str(index + 1)
                key = var
            elif isinstance(var, dict):
                # Format 2: Object - extract position and key
                position = str(var.get("position") or var.get("pos") or var.get("index") or (index + 1))
                key = var.get("name") or var.get("key") or var.get("variable_name") or var.get("field")
                if not key:
                    logger.warning(f"Variable object missing key at position {position}: {var}")
                    continue
            else:
                logger.warning(f"Unexpected variable format: {var} (type: {type(var)})")
                continue
            
            # Get value from provided values dict
            # If key is duplicate (like clinic_name for position 2 and 5), try header_clinic_name for position 5
            if position == "5" and key == "clinic_name":
                # Position 5 is header - try header_clinic_name first, then fallback to clinic_name
                value = values.get("header_clinic_name") or values.get("header_name") or values.get(key, "")
            else:
                value = values.get(key, "")
            
            # Twilio doesn't accept empty strings - provide defaults
            if not value or value.strip() == "":
                if "clinic" in key.lower() or "header" in key.lower():
                    value = values.get("clinic_name") or "MediEase Clinic"
                elif "patient" in key.lower():
                    value = "Patient"
                elif "doctor" in key.lower():
                    value = "Doctor"
                else:
                    value = "N/A"
                logger.warning(f"Empty value for {key} (position {position}), using: {value}")
            
            content_vars[position] = str(value)
            
            logger.info(f"  Mapped position {position} (key: {key}) = '{content_vars[position]}'")
        
        logger.info(f"Final content_vars: {content_vars}")
        return content_vars
    
    async def send(
        self,
        *,
        to: str,
        scenario: str,
        values: Dict[str, Any],
        patient_id: Optional[str] = None,
        appointment_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Send a WhatsApp message using a DB-backed template and Twilio Content API.
        """
        if not self.is_configured():
            return {"success": False, "error_message": "Twilio Content API not configured", "error_code": "CONFIG"}

        template = await self.fetch_template(scenario)
        if not template:
            return {"success": False, "error_message": f"Template not found for scenario '{scenario}'", "error_code": "TEMPLATE_MISSING"}

        content_sid = template.get("content_sid") or template.get("contentSid")
        if not content_sid:
            return {"success": False, "error_message": "Template content_sid missing", "error_code": "TEMPLATE_MISSING_SID"}

        content_vars = self._build_content_variables(template, values)

        logger.info(f"Template variables structure: {template.get('variables', [])}")
        logger.info(f"Content variables to send: {content_vars}")
        logger.info(f"Content variables JSON: {json.dumps(content_vars)}")

        try:
            logger.info(
                "Sending WhatsApp content message scenario=%s to=%s appointment=%s patient=%s content_variables=%s content_sid=%s",
                scenario,
                to,
                appointment_id,
                patient_id,
                content_vars,
                content_sid
            )
            msg = self.client.messages.create(
                from_=self.from_number,
                to=to,
                content_sid=content_sid,
                content_variables=json.dumps(content_vars),
            )
            return {
                "success": True,
                "message_sid": msg.sid,
                "status": msg.status,
                "to": msg.to,
                "from_number": msg.from_,
                "timestamp": datetime.utcnow(),
                "content_vars": content_vars,
            }
        except TwilioRestException as exc:
            logger.error("Twilio Content API error: %s", exc)
            return {
                "success": False,
                "error_message": exc.msg if hasattr(exc, "msg") else str(exc),
                "error_code": str(getattr(exc, "code", "TWILIO_ERROR")),
            }
        except TwilioException as exc:
            logger.error("Twilio exception: %s", exc)
            return {"success": False, "error_message": str(exc), "error_code": "TWILIO_ERROR"}
        except Exception as exc:
            logger.exception("Unexpected error sending WhatsApp content message")
            return {"success": False, "error_message": str(exc), "error_code": "INTERNAL_ERROR"}

