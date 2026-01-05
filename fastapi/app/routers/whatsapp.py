"""
WhatsApp messaging API endpoints.
"""

from fastapi import APIRouter, Depends, status, HTTPException, Request, Form
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import logging

from app.schemas.whatsapp import (
    WhatsAppMessageRequest,
    WhatsAppMessageResponse,
    WhatsAppMessageStatusRequest,
    WhatsAppMessageStatusResponse,
)
from app.services.whatsapp_service import WhatsAppService
from app.middleware.auth import get_current_user, require_roles
from app.utils.response import success_response, error_response
from app.database import get_db
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize WhatsApp service
whatsapp_service = WhatsAppService()


@router.post("/send", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def send_whatsapp_message(
    request: WhatsAppMessageRequest,
    current_user: dict = Depends(require_roles(["receptionist", "admin", "doctor"]))
):
    """
    Send a WhatsApp message to a patient.
    
    Requires authentication and one of: receptionist, admin, or doctor role.
    """
    try:
        # Check if service is configured
        if not whatsapp_service.is_configured():
            return error_response(
                message="WhatsApp service is not configured. Please configure Twilio credentials.",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Send message
        result = await whatsapp_service.send_message(
            to=request.to,
            message=request.message,
            patient_id=request.patient_id,
            appointment_id=request.appointment_id
        )
        
        if result["success"]:
            return success_response(
                data={
                    "message_sid": result["message_sid"],
                    "status": result["status"],
                    "to": result["to"],
                    "from_number": result["from_number"],
                    "timestamp": result["timestamp"].isoformat() if result.get("timestamp") else None
                },
                message="WhatsApp message sent successfully"
            )
        else:
            return error_response(
                message=result.get("error_message", "Failed to send WhatsApp message"),
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code=result.get("error_code")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        return error_response(
            message=f"Failed to send WhatsApp message: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.post("/status", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def get_whatsapp_message_status(
    request: WhatsAppMessageStatusRequest,
    current_user: dict = Depends(require_roles(["receptionist", "admin", "doctor"]))
):
    """
    Check the status of a sent WhatsApp message.
    
    Requires authentication and one of: receptionist, admin, or doctor role.
    """
    try:
        # Check if service is configured
        if not whatsapp_service.is_configured():
            return error_response(
                message="WhatsApp service is not configured.",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Get message status
        result = await whatsapp_service.get_message_status(request.message_sid)
        
        if result["success"]:
            return success_response(
                data={
                    "message_sid": result["message_sid"],
                    "status": result["status"],
                    "to": result["to"],
                    "from_number": result["from_number"],
                    "body": result.get("body"),
                    "date_created": result.get("date_created").isoformat() if result.get("date_created") else None,
                    "date_sent": result.get("date_sent").isoformat() if result.get("date_sent") else None,
                    "date_updated": result.get("date_updated").isoformat() if result.get("date_updated") else None,
                    "error_code": result.get("error_code"),
                    "error_message": result.get("error_message")
                },
                message="Message status retrieved successfully"
            )
        else:
            return error_response(
                message=result.get("error_message", "Failed to get message status"),
                status_code=status.HTTP_400_BAD_REQUEST,
                error_code=result.get("error_code")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        return error_response(
            message=f"Failed to get message status: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/config", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def get_whatsapp_config(
    current_user: dict = Depends(require_roles(["admin"]))
):
    """
    Get WhatsApp service configuration status (admin only).
    """
    return success_response(
        data={
            "configured": whatsapp_service.is_configured(),
            "from_number": whatsapp_service.from_number if whatsapp_service.is_configured() else None
        },
        message="Configuration status retrieved"
    )

@router.post("/webhooks/status", tags=["WhatsApp Webhooks"])
async def twilio_status_webhook(
    request: Request,
    MessageSid: str = Form(...),
    MessageStatus: str = Form(...),
    To: str = Form(...),
    From: str = Form(...),
    ErrorCode: Optional[str] = Form(None),
    ErrorMessage: Optional[str] = Form(None),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Twilio webhook endpoint for message status updates.
    Receives delivery status updates (sent, delivered, failed, etc.)
    """
    try:
        logger.info(
            f"Twilio status webhook received: MessageSid={MessageSid}, Status={MessageStatus}, To={To}, From={From}"
        )
        
        # Find the appointment or message record by MessageSid
        # Check appointments' whatsappLogs for this message_sid
        appointment = await db.appointments.find_one({
            "whatsappLogs": {
                "$elemMatch": {
                    "$or": [
                        {"details.message_sid": MessageSid},
                        {"details.sid": MessageSid}
                    ]
                }
            }
        })
        
        if appointment:
            # Update the status in whatsappLogs
            scenario = None
            for key, log_entry in appointment.get("whatsappLogs", {}).items():
                if isinstance(log_entry, dict):
                    details = log_entry.get("details", {})
                    if details.get("message_sid") == MessageSid or details.get("sid") == MessageSid:
                        scenario = key
                        break
            
            if scenario:
                update_data = {
                    f"whatsappLogs.{scenario}.status": MessageStatus,
                    f"whatsappLogs.{scenario}.statusUpdatedAt": datetime.utcnow(),
                    f"whatsappLogs.{scenario}.details.status": MessageStatus,
                    "updatedAt": datetime.utcnow(),
                }
                
                if ErrorCode:
                    update_data[f"whatsappLogs.{scenario}.details.error_code"] = ErrorCode
                if ErrorMessage:
                    update_data[f"whatsappLogs.{scenario}.details.error_message"] = ErrorMessage
                
                await db.appointments.update_one(
                    {"_id": appointment["_id"]},
                    {"$set": update_data}
                )
                logger.info(f"Updated status for appointment {appointment.get('appointmentId')}: {MessageStatus}")
        
        # Also store in a messages collection for tracking
        await db.whatsapp_messages.update_one(
            {"message_sid": MessageSid},
            {
                "$set": {
                    "status": MessageStatus,
                    "status_updated_at": datetime.utcnow(),
                    "error_code": ErrorCode,
                    "error_message": ErrorMessage,
                    "to": To,
                    "from": From,
                },
                "$setOnInsert": {
                    "message_sid": MessageSid,
                    "created_at": datetime.utcnow(),
                }
            },
            upsert=True
        )
        
        # Return 200 OK to Twilio (required)
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Error processing Twilio status webhook: {e}", exc_info=True)
        # Still return 200 to prevent Twilio from retrying
        return {"status": "error", "message": str(e)}


@router.post("/webhooks/incoming", tags=["WhatsApp Webhooks"])
async def twilio_incoming_webhook(
    request: Request,
    MessageSid: str = Form(...),
    From: str = Form(...),
    To: str = Form(...),
    Body: str = Form(...),
    AccountSid: str = Form(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Twilio webhook endpoint for incoming WhatsApp messages from patients.
    Receives messages sent by patients to your WhatsApp number.
    """
    try:
        logger.info(
            f"Twilio incoming message webhook: From={From}, To={To}, Body={Body[:100]}"
        )
        
        # Extract phone number from From (format: whatsapp:+1234567890)
        phone_number = From.replace("whatsapp:", "").strip()
        
        # Find patient by phone number
        patient = await db.patients.find_one({"phone": phone_number})
        
        if not patient:
            # Try without country code variations
            patient = await db.patients.find_one({
                "$or": [
                    {"phone": {"$regex": phone_number[-10:]}},  # Last 10 digits
                    {"phone": phone_number},
                ]
            })
        
        # Store incoming message
        message_doc = {
            "message_sid": MessageSid,
            "direction": "inbound",
            "from": From,
            "to": To,
            "body": Body,
            "patient_id": str(patient["_id"]) if patient else None,
            "received_at": datetime.now(timezone.utc).isoformat(),
            "processed": False,
        }
        
        await db.whatsapp_messages.insert_one(message_doc)
        
        # If patient found, you can process the message (e.g., auto-reply, store in messages collection)
        if patient:
            logger.info(f"Incoming message from patient {patient.get('patientId')}: {Body[:50]}")
            
            # Optionally: Store in messages collection for clinic staff to see
            await db.messages.insert_one({
                "patientId": str(patient["_id"]),
                "sender": "patient",
                "message": Body,
                "type": "whatsapp",
                "whatsapp_message_sid": MessageSid,
                "createdAt": datetime.utcnow(),
                "read": False,
            })
            
            # Optionally: Send auto-reply
            await whatsapp_service.send_message(
                to=From,
                message="Thank you for your message. We will get back to you soon."
            )
        
        # Return 200 OK to Twilio (required)
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Error processing Twilio incoming webhook: {e}", exc_info=True)
        # Still return 200 to prevent Twilio from retrying
        return {"status": "error", "message": str(e)}