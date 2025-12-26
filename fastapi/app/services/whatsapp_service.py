"""
WhatsApp messaging service using Twilio.
Handles sending WhatsApp messages and checking message status.
"""

import logging
from typing import Optional, Dict, Any
from datetime import datetime
from twilio.rest import Client
from twilio.base.exceptions import TwilioException, TwilioRestException

from ..config import settings

logger = logging.getLogger(__name__)


class WhatsAppService:
    """Service for sending WhatsApp messages via Twilio."""
    
    def __init__(self):
        """Initialize Twilio client."""
        if not settings.twilio_account_sid or not settings.twilio_auth_token:
            logger.warning("Twilio credentials not configured. WhatsApp messaging will not be available.")
            self.client = None
            self.from_number = settings.twilio_whatsapp_number
        else:
            try:
                self.client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
                self.from_number = settings.twilio_whatsapp_number # Default Twilio sandbox
                logger.info("Twilio WhatsApp service initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Twilio client: {e}")
                self.client = None
                self.from_number = ""
    
    def is_configured(self) -> bool:
        """Check if Twilio is properly configured."""
        return self.client is not None and bool(self.from_number)
    
    async def send_message(
        self,
        to: str,
        message: str,
        patient_id: Optional[str] = None,
        appointment_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send a WhatsApp message.
        
        Args:
            to: Recipient WhatsApp number (format: whatsapp:+[country code][number])
            message: Message content
            patient_id: Optional patient ID for tracking
            appointment_id: Optional appointment ID for tracking
            
        Returns:
            Dictionary with message details or error information
        """
        if not self.is_configured():
            return {
                "success": False,
                "error_message": "WhatsApp service is not configured. Please check Twilio credentials.",
                "error_code": "CONFIGURATION_ERROR"
            }
        
        try:
            logger.info(f"Sending WhatsApp message to {to} (Patient: {patient_id}, Appointment: {appointment_id})")
            
            # Send message via Twilio
            twilio_message = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to
            )
            
            logger.info(f"WhatsApp message sent successfully. SID: {twilio_message.sid}")
            
            return {
                "success": True,
                "message_sid": twilio_message.sid,
                "status": twilio_message.status,
                "to": twilio_message.to,
                "from_number": twilio_message.from_,
                "message": message,
                "timestamp": datetime.utcnow(),
                "error_code": None,
                "error_message": None
            }
            
        except TwilioRestException as e:
            error_msg = f"Twilio API error: {e.msg}"
            logger.error(f"Failed to send WhatsApp message: {error_msg}")
            return {
                "success": False,
                "error_message": error_msg,
                "error_code": str(e.code) if hasattr(e, 'code') else "TWILIO_ERROR",
                "message_sid": None,
                "status": None
            }
        except TwilioException as e:
            error_msg = f"Twilio error: {str(e)}"
            logger.error(f"Failed to send WhatsApp message: {error_msg}")
            return {
                "success": False,
                "error_message": error_msg,
                "error_code": "TWILIO_ERROR",
                "message_sid": None,
                "status": None
            }
        except Exception as e:
            error_msg = f"Unexpected error sending WhatsApp message: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                "success": False,
                "error_message": error_msg,
                "error_code": "INTERNAL_ERROR",
                "message_sid": None,
                "status": None
            }
    
    async def get_message_status(self, message_sid: str) -> Dict[str, Any]:
        """
        Get the status of a sent message.
        
        Args:
            message_sid: Twilio message SID
            
        Returns:
            Dictionary with message status details
        """
        if not self.is_configured():
            return {
                "success": False,
                "error_message": "WhatsApp service is not configured.",
                "error_code": "CONFIGURATION_ERROR"
            }
        
        try:
            logger.info(f"Checking status for message: {message_sid}")
            message = self.client.messages(message_sid).fetch()
            
            return {
                "success": True,
                "message_sid": message.sid,
                "status": message.status,
                "to": message.to,
                "from_number": message.from_,
                "body": message.body,
                "date_created": message.date_created,
                "date_sent": message.date_sent,
                "date_updated": message.date_updated,
                "error_code": message.error_code,
                "error_message": message.error_message
            }
            
        except TwilioRestException as e:
            error_msg = f"Twilio API error: {e.msg}"
            logger.error(f"Failed to get message status: {error_msg}")
            return {
                "success": False,
                "error_message": error_msg,
                "error_code": str(e.code) if hasattr(e, 'code') else "TWILIO_ERROR"
            }
        except Exception as e:
            error_msg = f"Error getting message status: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                "success": False,
                "error_message": error_msg,
                "error_code": "INTERNAL_ERROR"
            }

