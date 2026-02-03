"""
WhatsApp messaging API endpoints.
"""

from fastapi import APIRouter, Depends, status, HTTPException, Request, Form, Response
from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import logging
try:
    from twilio.twiml.messaging_response import MessagingResponse
except ImportError:
    # Fallback if TwiML is not available
    MessagingResponse = None
    import logging
    logging.warning("twilio.twiml.messaging_response not available - TwiML responses will use fallback")

from app.schemas.whatsapp import (
    WhatsAppMessageRequest,
    WhatsAppMessageResponse,
    WhatsAppMessageStatusRequest,
    WhatsAppMessageStatusResponse,
)
from app.services.whatsapp_service import WhatsAppService
from app.services.appointment_service import AppointmentService
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
    current_user: dict = Depends(require_roles(["receptionist", "admin", "doctor"])),
    db: AsyncIOMotorDatabase = Depends(get_db),
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
            # Store message in MongoDB for robust tracking
            message_doc = {
                "message_sid": result["message_sid"],
                "direction": "outbound",
                "from": result["from_number"],
                "to": result["to"],
                "body": request.message,
                "patient_id": request.patient_id,
                "appointment_id": request.appointment_id,
                "sent_by": str(current_user.get("_id") or current_user.get("id")),
                "sent_by_role": current_user.get("role"),
                "sent_by_name": f"{current_user.get('firstName', '')} {current_user.get('lastName', '')}".strip(),
                "status": result["status"],
                "message_type": "manual",
                "scenario": None,
                "created_at": datetime.utcnow(),
                "received_at": datetime.utcnow().isoformat(),
                "processed": True,
            }
            await db.whatsapp_messages.insert_one(message_doc)
            logger.info(f"Stored manual WhatsApp message in MongoDB: {result['message_sid']}")
            
            # Broadcast WebSocket update for real-time UI refresh
            try:
                from app.services.websocket_service import WebSocketService
                websocket_service = WebSocketService()
                await websocket_service.broadcast_whatsapp_message_update(
                    message_doc,
                    request.patient_id
                )
                logger.info(f"Broadcasted WhatsApp message update via WebSocket")
            except Exception as ws_error:
                logger.warning(f"Failed to broadcast WhatsApp message update: {ws_error}")
            
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


@router.get("/conversations", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def get_whatsapp_conversations(
    limit: int = 50,
    current_user: dict = Depends(require_roles(["receptionist", "admin", "doctor"])),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Get all patients who have WhatsApp conversations (messages sent or received).
    Returns patients sorted by most recent message first.
    """
    try:
        # Get distinct patient IDs from whatsapp_messages collection
        pipeline = [
            {"$match": {"patient_id": {"$ne": None}}},
            {"$group": {
                "_id": "$patient_id",
                "last_message_at": {"$max": "$created_at"},
                "message_count": {"$sum": 1}
            }},
            {"$sort": {"last_message_at": -1}},
            {"$limit": limit}
        ]
        
        conversations = await db.whatsapp_messages.aggregate(pipeline).to_list(length=limit)
        
        # Get patient details for each conversation
        patient_ids = [conv["_id"] for conv in conversations]
        
        if not patient_ids:
            return success_response(
                data={"patients": []},
                message="No conversations found"
            )
        
        # Fetch patients
        patients_cursor = db.patients.find({
            "_id": {"$in": [ObjectId(pid) for pid in patient_ids if ObjectId.is_valid(pid)]}
        })
        patients = await patients_cursor.to_list(length=limit)
        
        # Create a map for quick lookup
        patients_map = {str(p.get("_id")): p for p in patients}
        
        # Build results with conversation metadata
        results = []
        for conv in conversations:
            patient_id = conv["_id"]
            patient_id_str = str(patient_id)
            if not ObjectId.is_valid(patient_id_str):
                continue
                
            patient = patients_map.get(patient_id_str)
            if not patient:
                continue
            
            patient_name = (
                patient.get("fullName") or 
                patient.get("name") or 
                f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip() or
                patient.get("firstName") or
                "Unknown"
            )
            
            phone = patient.get("phone", "")
            whatsapp_phone = None
            if phone:
                phone_clean = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
                if phone_clean.startswith("+"):
                    whatsapp_phone = f"whatsapp:{phone_clean}"
            
            results.append({
                "patient_id": patient_id_str,
                "patientId": patient.get("patientId", ""),
                "name": patient_name,
                "email": patient.get("email", ""),
                "phone": phone,
                "whatsapp_phone": whatsapp_phone,
                "consent_whatsapp": patient.get("consent_whatsapp", False),
                "last_message_at": conv.get("last_message_at"),
                "message_count": conv.get("message_count", 0),
            })
        
        return success_response(
            data={"patients": results},
            message=f"Found {len(results)} conversations"
        )
    except Exception as e:
        logger.error(f"Error getting conversations: {e}", exc_info=True)
        return error_response(
            message=f"Failed to get conversations: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/search-patients", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def search_patients_for_whatsapp(
    query: str,
    limit: int = 10,
    current_user: dict = Depends(require_roles(["receptionist", "admin", "doctor"])),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Search patients by name, email, or phone number for WhatsApp messaging.
    """
    try:
        # Build comprehensive search query covering all possible name fields
        search_conditions = [
            {"firstName": {"$regex": query, "$options": "i"}},
            {"lastName": {"$regex": query, "$options": "i"}},
            {"fullName": {"$regex": query, "$options": "i"}},
            {"name": {"$regex": query, "$options": "i"}},
            {"email": {"$regex": query, "$options": "i"}},
            {"phone": {"$regex": query, "$options": "i"}},
            {"patientId": {"$regex": query, "$options": "i"}},
        ]
        
        # Also try searching for full name combination
        query_parts = query.strip().split()
        if len(query_parts) > 1:
            # If query has multiple words, try matching firstName and lastName together
            search_conditions.append({
                "$and": [
                    {"firstName": {"$regex": query_parts[0], "$options": "i"}},
                    {"lastName": {"$regex": query_parts[-1], "$options": "i"}},
                ]
            })
        
        search_query = {"$or": search_conditions}
        
        cursor = db.patients.find(search_query).limit(limit)
        patients = await cursor.to_list(length=limit)
        
        results = []
        for patient in patients:
            patient_id = str(patient.get("_id") or patient.get("id"))
            phone = patient.get("phone", "")
            
            # Get patient name - try multiple fields
            patient_name = (
                patient.get("fullName") or 
                patient.get("name") or 
                f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip() or
                patient.get("firstName") or
                "Unknown"
            )
            
            # Format phone for WhatsApp if it has country code
            whatsapp_phone = None
            if phone:
                # Clean phone number
                phone_clean = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
                if phone_clean.startswith("+"):
                    whatsapp_phone = f"whatsapp:{phone_clean}"
                elif phone_clean.isdigit() and len(phone_clean) >= 10:
                    # Try to detect if it's a valid number (10+ digits)
                    # For now, assume it needs country code, but still allow it
                    whatsapp_phone = None  # Will need manual formatting
            
            results.append({
                "patient_id": patient_id,
                "patientId": patient.get("patientId", ""),
                "name": patient_name,
                "email": patient.get("email", ""),
                "phone": phone,
                "whatsapp_phone": whatsapp_phone,
                "consent_whatsapp": patient.get("consent_whatsapp", False),
            })
        
        return success_response(
            data={"patients": results},
            message=f"Found {len(results)} patients"
        )
    except Exception as e:
        logger.error(f"Error searching patients: {e}", exc_info=True)
        return error_response(
            message=f"Failed to search patients: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get("/messages/{patient_id}", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def get_patient_whatsapp_messages(
    patient_id: str,
    limit: int = 50,
    current_user: dict = Depends(require_roles(["receptionist", "admin", "doctor"])),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Get WhatsApp message history for a patient, including scheduler messages.
    """
    try:
        # Get patient to find phone number
        if ObjectId.is_valid(patient_id):
            patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
        else:
            patient = await db.patients.find_one({"patientId": patient_id})
        
        if not patient:
            return error_response(
                message="Patient not found",
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        patient_phone = patient.get("phone", "")
        
        # Get messages from whatsapp_messages collection
        # Search by patient_id first, then by phone number
        messages_query = {"patient_id": str(patient.get("_id"))}
        if patient_phone:
            # Also search by phone number variations for messages that might not have patient_id set
            phone_clean = patient_phone.replace("whatsapp:", "").replace("+", "").replace(" ", "").replace("-", "")
            whatsapp_phone = f"whatsapp:+{patient_phone.replace('+', '')}" if patient_phone.startswith('+') else f"whatsapp:{patient_phone}"
            messages_query = {
                "$or": [
                    {"patient_id": str(patient.get("_id"))},
                    {"from": {"$regex": phone_clean, "$options": "i"}},
                    {"to": {"$regex": phone_clean, "$options": "i"}},
                    {"from": whatsapp_phone},
                    {"to": whatsapp_phone},
                ]
            }
        
        cursor = db.whatsapp_messages.find(messages_query).sort("received_at", -1).limit(limit)
        whatsapp_messages = await cursor.to_list(length=limit)
        
        # Get scheduler messages from appointments
        appointments_query = {"patientId": str(patient.get("_id"))}
        appointments_cursor = db.appointments.find(appointments_query)
        appointments = await appointments_cursor.to_list(length=100)
        
        scheduler_messages = []
        for apt in appointments:
            whatsapp_logs = apt.get("whatsappLogs", {})
            for scenario, log_data in whatsapp_logs.items():
                if isinstance(log_data, dict):
                    details = log_data.get("details", {})
                    message_sid = details.get("message_sid") or details.get("sid")
                    status_val = log_data.get("status", "unknown")
                    attempted_at = log_data.get("attemptedAt")
                    
                    if message_sid:
                        # Determine message content based on scenario
                        message_body = ""
                        if scenario == "appointment_reminder" or scenario == "appointment_reminder_payloads":
                            message_body = f"Appointment reminder for {apt.get('date')} {apt.get('time')}"
                        elif scenario == "post_visit_lab_request":
                            message_body = "Lab result reminder"
                        elif scenario == "followup_appointment_reminder":
                            message_body = "Follow-up appointment reminder"
                        
                        scheduler_messages.append({
                            "message_sid": message_sid,
                            "direction": "outbound",
                            "body": message_body,
                            "status": status_val,
                            "scenario": scenario,
                            "appointment_id": apt.get("appointmentId"),
                            "received_at": attempted_at.isoformat() if isinstance(attempted_at, datetime) else str(attempted_at),
                            "from": whatsapp_service.from_number if whatsapp_service.is_configured() else None,
                            "to": patient_phone,
                            "type": "scheduler",
                        })
        
        # Combine and sort all messages
        all_messages = []
        
        # Add WhatsApp messages
        for msg in whatsapp_messages:
            direction = msg.get("direction", "unknown")
            message_type = msg.get("message_type") or ("manual" if direction == "outbound" else "inbound")
            received_at = msg.get("received_at") or msg.get("created_at")
            if isinstance(received_at, datetime):
                received_at = received_at.isoformat()

            all_messages.append({
                "message_sid": msg.get("message_sid"),
                "direction": direction,
                "body": msg.get("body", ""),
                "status": msg.get("status", "unknown"),
                "received_at": received_at,
                "from": msg.get("from"),
                "to": msg.get("to"),
                "type": message_type,
                "scenario": msg.get("scenario"),
            })
        
        # Add scheduler messages
        all_messages.extend(scheduler_messages)
        
        # Sort by date (most recent first)
        all_messages.sort(key=lambda x: x.get("received_at", ""), reverse=True)
        
        return success_response(
            data={
                "patient": {
                    "patient_id": str(patient.get("_id")),
                    "patientId": patient.get("patientId", ""),
                    "name": patient.get("name", "Unknown"),
                    "phone": patient_phone,
                    "whatsapp_phone": f"whatsapp:{patient_phone}" if patient_phone and patient_phone.startswith("+") else None,
                    "consent_whatsapp": patient.get("consent_whatsapp", False),
                },
                "messages": all_messages[:limit],
                "total": len(all_messages),
            },
            message="Message history retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error getting message history: {e}", exc_info=True)
        return error_response(
            message=f"Failed to get message history: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
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
        update_result = await db.whatsapp_messages.update_one(
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
        
        # Broadcast WebSocket update for real-time UI refresh
        try:
            # Get the updated message to broadcast
            updated_message = await db.whatsapp_messages.find_one({"message_sid": MessageSid})
            if updated_message:
                from app.services.websocket_service import WebSocketService
                websocket_service = WebSocketService()
                patient_id = updated_message.get("patient_id")
                await websocket_service.broadcast_whatsapp_message_update(
                    updated_message,
                    patient_id
                )
                logger.info(f"Broadcasted WhatsApp message status update via WebSocket: {MessageStatus}")
        except Exception as ws_error:
            logger.warning(f"Failed to broadcast WhatsApp message status update: {ws_error}")
        
        # Return 200 OK to Twilio (required) with plain text to avoid 12300
        return Response(content="ok", media_type="text/plain")
        
    except Exception as e:
        logger.error(f"Error processing Twilio status webhook: {e}", exc_info=True)
        # Still return 200 to prevent Twilio from retrying
        return Response(content="error", media_type="text/plain")


@router.get("/webhooks/test", tags=["WhatsApp Webhooks"])
async def test_webhook_endpoint():
    """Simple test endpoint to verify webhook route is accessible"""
    return {"status": "ok", "message": "Webhook endpoint is accessible"}

@router.post("/webhooks/incoming", tags=["WhatsApp Webhooks"])
async def twilio_incoming_webhook(
    request: Request,
    MessageSid: str = Form(...),
    From: str = Form(...),
    To: str = Form(...),
    Body: str = Form(None),  # May be empty if button was clicked
    AccountSid: str = Form(...),
    ButtonPayload: Optional[str] = Form(None),  # Payload from interactive button click
    ButtonText: Optional[str] = Form(None),  # Text of clicked button
    ReferredMessageSid: Optional[str] = Form(None),  # Original message SID when button is clicked
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Twilio webhook endpoint for incoming WhatsApp messages from patients.
    Receives messages sent by patients to your WhatsApp number.
    """
    # Initialize reply_text early to ensure it's always defined
    reply_text = None
    
    try:
        logger.info("=" * 60)
        logger.info(f"📥 Twilio incoming message webhook received")
        logger.info(f"   From={From}, To={To}, Body={Body[:100] if Body else '(empty)'}")
        logger.info(f"   ButtonPayload={ButtonPayload}, ButtonText={ButtonText}, ReferredMessageSid={ReferredMessageSid}")
        logger.info("=" * 60)
        
        # Extract appointment ID directly from ButtonPayload ({{6}} is the button payload itself)
        logger.info(f"🔍 Step 1: Extracting appointment ID from ButtonPayload: '{ButtonPayload}'")
        appointment_id = None
        intent = None
        
        if ButtonPayload:
            # ButtonPayload is directly the appointment ID ({{6}}) from template
            # Format: "697b31d062e74816ac9e3882" (just the MongoDB _id, no prefix)
            appointment_id = ButtonPayload.strip()
            logger.info(f"   ✅ Extracted appointment ID from ButtonPayload: {appointment_id}")
        else:
            logger.warning(f"   ⚠️  No ButtonPayload provided")
        
        # Extract intent from Body (WhatsApp automatically copies ButtonText to Body)
        logger.info(f"🔍 Step 2: Extracting intent from Body: '{Body}'")
        if Body:
            normalized_text = Body.strip().lower()
            if normalized_text.startswith("confirm") or normalized_text == "confirm" or "confirm" in normalized_text:
                intent = "confirm"
                logger.info(f"   ✅ Intent detected from Body: CONFIRM")
            elif normalized_text.startswith("cancel") or normalized_text == "cancel" or "cancel" in normalized_text:
                intent = "cancel"
                logger.info(f"   ✅ Intent detected from Body: CANCEL")
            else:
                logger.info(f"   ℹ️  Body '{Body}' does not match confirm/cancel")
        
        # Fallback: If no intent from Body, check ButtonText (for edge cases)
        if not intent and ButtonText:
            logger.info(f"🔍 Step 2b: Checking ButtonText for intent (fallback): '{ButtonText}'")
            normalized_text = ButtonText.strip().lower()
            if normalized_text.startswith("confirm") or normalized_text == "confirm" or "confirm" in normalized_text:
                intent = "confirm"
                logger.info(f"   ✅ Intent detected from ButtonText: CONFIRM")
            elif normalized_text.startswith("cancel") or normalized_text == "cancel" or "cancel" in normalized_text:
                intent = "cancel"
                logger.info(f"   ✅ Intent detected from ButtonText: CANCEL")
        
        if not intent:
            logger.info(f"   ℹ️  No intent detected from Body or ButtonText (generic message)")
        
        if appointment_id:
            logger.info(f"   🎯 Appointment ID determined: {appointment_id}")
        else:
            logger.warning(f"   ⚠️  No appointment ID found in ButtonPayload: '{ButtonPayload}'")

        logger.info(
            f"📊 Summary: From={From}, Body='{Body}', Intent={intent}, AppointmentID={appointment_id}"
        )
        logger.info(
            f"📊 ButtonPayload='{ButtonPayload}', ButtonText='{ButtonText}'"
        )
        
        # Initialize reply text - will be set based on intent and appointment processing
        reply_text = None
        logger.info(f"🔍 Step 2: Processing appointment based on ButtonPayload...")
        logger.info(f"   Checking conditions: appointment_id={appointment_id is not None}, intent={intent is not None}")
        
        # Process appointment directly using appointment_id from ButtonPayload
        # If we have appointment_id but no intent, try to detect intent from Body again (WhatsApp copies ButtonText to Body)
        if appointment_id and not intent:
            logger.warning(f"   ⚠️  Appointment ID found but no intent detected. Re-checking Body...")
            normalized_text = (Body or ButtonText or "").strip().lower()
            if normalized_text.startswith("confirm") or normalized_text == "confirm" or "confirm" in normalized_text:
                intent = "confirm"
                logger.info(f"   ✅ Intent detected from Body: CONFIRM")
            elif normalized_text.startswith("cancel") or normalized_text == "cancel" or "cancel" in normalized_text:
                intent = "cancel"
                logger.info(f"   ✅ Intent detected from Body: CANCEL")
        
        if appointment_id and intent:
            if intent == "confirm":
                logger.info(f"   🔍 Processing CONFIRM intent for appointment: {appointment_id}")
                try:
                    if appointment_id:
                        logger.info(f"      Using appointment ID from ButtonPayload: {appointment_id}")
                        
                        # Find appointment by MongoDB _id (appointment_id from payload is the _id)
                        try:
                            appointment_oid = ObjectId(appointment_id)
                            appointment = await db.appointments.find_one(
                                {
                                    "_id": appointment_oid,
                                    "status": {"$nin": ["cancelled", "no-show", "completed"]},
                                }
                            )
                        except Exception as oid_error:
                            logger.warning(f"      ⚠️  Invalid ObjectId format: {appointment_id} - {oid_error}")
                            appointment = None

                        if appointment:
                            logger.info(
                                f"WhatsApp confirm intent detected for appointment {appointment_id} (phone: {From})."
                            )
                            # Appointment is already confirmed (status is "scheduled" or similar)
                            # Just log the confirmation acknowledgment
                            reply_text = "Thank you, your appointment is confirmed."
                        else:
                            logger.warning(f"      ⚠️  Appointment {appointment_id} not found or already completed/cancelled")
                            reply_text = "Thank you for confirming. We have received your message."
                    else:
                        logger.warning(f"      ⚠️  No appointment ID available in ButtonPayload for confirm intent")
                        reply_text = "Thank you for confirming. We have received your message."
                except Exception as confirm_error:
                    logger.error(
                        f"Failed to process WhatsApp confirm intent for appointment {appointment_id} (phone: {From}): {confirm_error}",
                        exc_info=True,
                    )
                    reply_text = "Thank you for confirming. We have received your message."
            
            elif intent == "cancel":
                logger.info(f"   🔍 Processing CANCEL intent...")
                try:
                    if appointment_id:
                        logger.info(f"      Using appointment ID from ButtonPayload: {appointment_id}")
                        
                        # Find appointment by MongoDB _id (appointment_id from payload is the _id)
                        try:
                            appointment_oid = ObjectId(appointment_id)
                            appointment = await db.appointments.find_one(
                                {
                                    "_id": appointment_oid,
                                    "status": {"$nin": ["cancelled", "no-show", "completed"]},
                                }
                            )
                        except Exception as oid_error:
                            logger.warning(f"      ⚠️  Invalid ObjectId format: {appointment_id} - {oid_error}")
                            appointment = None

                        if appointment:
                            appointment_db_id = str(appointment.get("_id"))

                            logger.info(
                                f"      ✅ Found appointment: {appointment_id} ({appointment_db_id})"
                            )
                            logger.info(
                                f"WhatsApp cancel intent detected. "
                                f"Cancelling appointment {appointment_id} ({appointment_db_id}) (phone: {From})."
                            )

                            try:
                                appointment_service = AppointmentService(db)
                                logger.info(f"      Calling AppointmentService.update_status...")
                                await appointment_service.update_status(
                                    appointment_db_id,
                                    "cancelled",
                                    cancellation_reason="Cancelled via WhatsApp by patient",
                                )
                                logger.info(f"      ✅ Successfully cancelled appointment")
                                reply_text = "Thank you, your appointment has been cancelled."
                            except Exception as update_error:
                                logger.error(
                                    f"      ❌ Failed to update appointment status: {update_error}",
                                    exc_info=True
                                )
                                reply_text = "Thank you for your message. We have received your cancellation request."
                        else:
                            logger.warning(f"      ⚠️  Appointment {appointment_id} not found or already completed/cancelled")
                            reply_text = "Thank you for your message. We have received your cancellation request."
                    else:
                        logger.warning(f"      ⚠️  No appointment ID available in ButtonPayload for cancel intent")
                        reply_text = "Thank you for your message. We have received your cancellation request."
                except Exception as cancel_error:
                    logger.error(
                        f"Failed to auto-cancel appointment from WhatsApp cancel intent "
                        f"for appointment {appointment_id} (phone: {From}): {cancel_error}",
                        exc_info=True,
                    )
                    reply_text = "Thank you for your message. We have received your cancellation request."
            
            else:
                reply_text = "Message received, thank you."
                logger.info(f"   ℹ️  Unknown intent: {intent}, using generic reply")
        elif appointment_id and not intent:
            # Appointment ID found but no intent detected
            logger.warning(f"   ⚠️  Appointment ID found ({appointment_id}) but no intent detected")
            logger.warning(f"   ⚠️  ButtonText='{ButtonText}', Body='{Body}'")
            reply_text = "Thank you for your message. We have received it."
        elif intent and not appointment_id:
            # Intent detected but no appointment ID
            logger.warning(f"   ⚠️  Intent detected ({intent}) but no appointment ID in ButtonPayload")
            reply_text = "Thank you for your message. We have received it."
        else:
            # No appointment ID and no intent
            logger.info(f"   ⚠️  No appointment ID or intent found, using generic acknowledgment")
            reply_text = "Message received, thank you."

        # Ensure reply_text is always set
        if not reply_text:
            reply_text = "Message received, thank you."
            logger.warning(f"No reply text generated for message from {From}, using default")

        logger.info(f"📤 Step 3: Prepared reply text: '{reply_text}'")

        # Store incoming message in MongoDB (without patient lookup)
        logger.info(f"🔍 Step 4: Storing incoming message in MongoDB...")
        message_doc = {
            "message_sid": MessageSid,
            "direction": "inbound",
            "from": From,
            "to": To,
            "body": Body,
            "patient_id": None,  # No patient lookup
            "appointment_id": appointment_id,  # Appointment ID from ButtonPayload
            "sent_by": None,
            "sent_by_role": None,
            "sent_by_name": None,
            "status": "received",
            "message_type": "inbound",
            "scenario": None,
            "intent": intent,
            "button_payload": ButtonPayload,
            "button_text": ButtonText,
            "referred_message_sid": ReferredMessageSid,
            "created_at": datetime.utcnow(),
            "received_at": datetime.now(timezone.utc).isoformat(),
            "processed": True,
        }
        
        try:
            await db.whatsapp_messages.insert_one(message_doc)
            logger.info(f"   ✅ Stored incoming WhatsApp message in MongoDB: {MessageSid}")
        except Exception as insert_error:
            if "duplicate key" in str(insert_error).lower() or "E11000" in str(insert_error):
                logger.info(f"   ℹ️  Message {MessageSid} already exists (webhook retry), skipping insert")
            else:
                logger.warning(f"   ⚠️  Failed to store message in MongoDB: {insert_error}")

        # Log the reply message in MongoDB
        logger.info(f"🔍 Step 5: Logging reply message to MongoDB...")
        try:
            reply_message_sid = f"webhook_reply_{MessageSid}"
            await db.whatsapp_messages.insert_one({
                "message_sid": reply_message_sid,
                "direction": "outbound",
                "from": To,  # Our WhatsApp number
                "to": From,  # Patient's number
                "body": reply_text,
                "patient_id": None,  # No patient lookup
                "appointment_id": appointment_id,  # Link to appointment
                "sent_by": "system",
                "sent_by_role": "system",
                "sent_by_name": "WhatsApp Webhook Auto-Reply",
                "status": "sent",
                "message_type": "auto_reply",
                "scenario": f"reply_to_{intent}" if intent else "generic_reply",
                "created_at": datetime.utcnow(),
                "received_at": datetime.utcnow().isoformat(),
                "processed": True,
            })
            logger.info(f"   ✅ Logged auto-reply message in MongoDB: {reply_message_sid}")
        except Exception as log_error:
            if "duplicate key" in str(log_error).lower() or "E11000" in str(log_error):
                logger.info(f"   ℹ️  Reply message {reply_message_sid} already exists (webhook retry), skipping")
            else:
                logger.warning(f"   ⚠️  Failed to log auto-reply message: {log_error}")

        # Create TwiML response
        logger.info(f"🔍 Step 8: Creating TwiML response...")
        if MessagingResponse is not None:
            try:
                twiml_response = MessagingResponse()
                twiml_response.message(reply_text)
                logger.info(f"✅ Successfully created TwiML response for {From}: '{reply_text}'")
                logger.info("=" * 60)
                # Return TwiML response - this will send the message to the patient
                return Response(content=str(twiml_response), media_type="text/xml")
            except Exception as twiml_error:
                logger.error(f"❌ Error creating TwiML response: {twiml_error}", exc_info=True)
                # Fallback to XML format manually
                twiml_xml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{reply_text}</Message></Response>'
                logger.info("   Using manual TwiML XML fallback")
                return Response(content=twiml_xml, media_type="text/xml")
        else:
            # Fallback: create TwiML XML manually if MessagingResponse is not available
            logger.warning("MessagingResponse not available, using manual TwiML XML")
            twiml_xml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{reply_text}</Message></Response>'
            logger.info(f"✅ Created manual TwiML XML response")
            logger.info("=" * 60)
            return Response(content=twiml_xml, media_type="text/xml")
        
    except Exception as e:
        import traceback
        error_msg = str(e)
        error_type = type(e).__name__
        error_traceback = traceback.format_exc()
        
        logger.error(
            f"❌ Error processing Twilio incoming webhook: {error_type}: {error_msg}",
            exc_info=True
        )
        logger.error(f"Full traceback:\n{error_traceback}")
        
        # Try to return a proper TwiML error response instead of plain "error"
        try:
            error_reply = "We're sorry, there was an error processing your message. Please try again later."
            if MessagingResponse is not None:
                error_twiml = MessagingResponse()
                error_twiml.message(error_reply)
                return Response(content=str(error_twiml), media_type="text/xml")
            else:
                # Manual TwiML XML
                error_xml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{error_reply}</Message></Response>'
                return Response(content=error_xml, media_type="text/xml")
        except Exception as fallback_error:
            logger.error(f"Failed to create error TwiML response: {fallback_error}", exc_info=True)
            # Last resort: return plain text with error details for debugging
            # Include error details in response so we can see what's wrong
            debug_response = f"Error: {error_type}: {error_msg}"
            logger.error(f"Returning debug response: {debug_response}")
            return Response(
                content=debug_response,
                media_type="text/plain"
            )