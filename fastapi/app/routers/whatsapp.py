"""
WhatsApp messaging API endpoints.
"""

from fastapi import APIRouter, Depends, status, HTTPException, Request, Form, Response
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
                        if scenario == "copy_appointment_reminder":
                            message_body = f"Appointment reminder for {apt.get('date')} {apt.get('time')}"
                        elif scenario == "copy_post_visit_lab_request":
                            message_body = "Lab result reminder"
                        elif scenario == "copy_followup_appointment_reminder":
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
        
        # Store incoming message robustly in MongoDB
        message_doc = {
            "message_sid": MessageSid,
            "direction": "inbound",
            "from": From,
            "to": To,
            "body": Body,
            "patient_id": str(patient["_id"]) if patient else None,
            "appointment_id": None,  # Incoming messages don't have appointment context
            "sent_by": None,
            "sent_by_role": None,
            "sent_by_name": None,
            "status": "received",
            "message_type": "inbound",
            "scenario": None,
            "created_at": datetime.utcnow(),
            "received_at": datetime.now(timezone.utc).isoformat(),
            "processed": False,
        }
        
        await db.whatsapp_messages.insert_one(message_doc)
        logger.info(f"Stored incoming WhatsApp message in MongoDB: {MessageSid} (from: {From})")
        
        # Broadcast WebSocket update for real-time UI refresh
        patient_id_str = str(patient["_id"]) if patient else None
        try:
            from app.services.websocket_service import WebSocketService
            websocket_service = WebSocketService()
            await websocket_service.broadcast_whatsapp_message_update(
                message_doc,
                patient_id_str
            )
            logger.info(f"Broadcasted incoming WhatsApp message update via WebSocket")
        except Exception as ws_error:
            logger.warning(f"Failed to broadcast incoming WhatsApp message update: {ws_error}")
        
        # If patient found, you can process the message (e.g., auto-reply, store in messages collection)
        if patient:
            logger.info(f"Incoming message from patient {patient.get('patientId')}: {Body[:50]}")
            
            # Store in messages collection for clinic staff to see
            await db.messages.insert_one({
                "patientId": str(patient["_id"]),
                "sender": "patient",
                "message": Body,
                "type": "whatsapp",
                "whatsapp_message_sid": MessageSid,
                "createdAt": datetime.utcnow(),
                "read": False,
            })
            
            # Note: Auto-reply disabled - staff will respond manually via dashboard
            # If you want to enable auto-reply, uncomment below:
            # await whatsapp_service.send_message(
            #     to=From,
            #     message="Thank you for your message. We will get back to you soon."
            # )
        
        # Return 200 OK to Twilio (required) with plain text to avoid 12300
        return Response(content="ok", media_type="text/plain")
        
    except Exception as e:
        logger.error(f"Error processing Twilio incoming webhook: {e}", exc_info=True)
        # Still return 200 to prevent Twilio from retrying
        return Response(content="error", media_type="text/plain")