"""
WhatsApp messaging API endpoints.
"""

from fastapi import APIRouter, Depends, status, HTTPException
from typing import Dict, Any

from app.schemas.whatsapp import (
    WhatsAppMessageRequest,
    WhatsAppMessageResponse,
    WhatsAppMessageStatusRequest,
    WhatsAppMessageStatusResponse,
)
from app.services.whatsapp_service import WhatsAppService
from app.middleware.auth import get_current_user, require_roles
from app.utils.response import success_response, error_response

router = APIRouter()

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

