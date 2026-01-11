"""
Consent router for HIPAA compliance - handles email verification and appointment consent.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Body
from fastapi.responses import HTMLResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, Dict, Any
import logging

from app.database import get_db
from app.services.consent_service import ConsentService
from app.utils.response import success_response
from app.config import settings
from app.middleware.auth import require_any_role
from bson import ObjectId

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_verification_form_html(patient_name: str, patient_id: str, base_url: str) -> str:
    """Generate HTML form for email verification."""
    logo_url = f"{settings.frontend_base_url}/favicon.svg"
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification - MediEase Clinic</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }}
        .container {{
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .logo {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .logo img {{
            max-width: 200px;
            height: auto;
        }}
        h1 {{
            color: #2c3e50;
            text-align: center;
            margin-bottom: 20px;
        }}
        .content {{
            margin-bottom: 30px;
            font-size: 16px;
        }}
        .statement {{
            background-color: #f8f9fa;
            padding: 20px;
            border-left: 4px solid #3498db;
            margin: 20px 0;
            font-size: 15px;
            line-height: 1.8;
        }}
        .button-container {{
            text-align: center;
            margin: 30px 0;
        }}
        .button {{
            display: inline-block;
            padding: 15px 40px;
            margin: 10px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
            transition: background-color 0.3s;
            border: none;
            cursor: pointer;
        }}
        .button-approve {{
            background-color: #27ae60;
            color: #ffffff;
        }}
        .button-approve:hover {{
            background-color: #229954;
        }}
        .button-reject {{
            background-color: #e74c3c;
            color: #ffffff;
        }}
        .button-reject:hover {{
            background-color: #c0392b;
        }}
        .footer {{
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #7f8c8d;
        }}
        .success-message {{
            background-color: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        }}
        .error-message {{
            background-color: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="{logo_url}" alt="MediEase Clinic Logo">
        </div>
        <h1>Email Verification</h1>
        <div class="content">
            <p>Dear {patient_name},</p>
            <p>Thank you for registering with MediEase Clinic. To complete your registration and enable future consent emails for appointments, please verify your email address.</p>
            
            <div class="statement">
                <strong>Consent Statement:</strong><br>
                By verifying your email, you acknowledge that you will receive consent emails from MediEase Clinic whenever you book an appointment. These emails will allow you to grant or deny consent for healthcare providers to view your medical history during consultations.
            </div>
            
            <div class="button-container">
                <a href="{base_url}/api/consent/verify-email?patientId={patient_id}&action=approve" class="button button-approve">I Approve</a>
                <a href="{base_url}/api/consent/verify-email?patientId={patient_id}&action=reject" class="button button-reject">I Reject</a>
            </div>
            
            <p style="font-size: 14px; color: #7f8c8d;">
                If you did not register with MediEase Clinic, please ignore this email.
            </p>
        </div>
        <div class="footer">
            <p>© 2025 MediEase Clinic. All rights reserved.</p>
            <p>This email was sent for HIPAA compliance purposes.</p>
        </div>
    </div>
</body>
</html>
"""


def _get_consent_form_html(patient_name: str, doctor_name: str, clinic_name: str, 
                           appointment_date: str, appointment_time: str, 
                           appointment_id: str, base_url: str) -> str:
    """Generate HTML form for appointment consent."""
    logo_url = f"{settings.frontend_base_url}/favicon.svg"
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Consent - MediEase Clinic</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }}
        .container {{
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .logo {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .logo img {{
            max-width: 200px;
            height: auto;
        }}
        h1 {{
            color: #2c3e50;
            text-align: center;
            margin-bottom: 20px;
        }}
        .content {{
            margin-bottom: 30px;
            font-size: 16px;
        }}
        .appointment-details {{
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }}
        .appointment-details p {{
            margin: 8px 0;
        }}
        .statement {{
            background-color: #fff3cd;
            padding: 20px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
            font-size: 15px;
            line-height: 1.8;
        }}
        .button-container {{
            text-align: center;
            margin: 30px 0;
        }}
        .button {{
            display: inline-block;
            padding: 15px 40px;
            margin: 10px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
            transition: background-color 0.3s;
        }}
        .button-approve {{
            background-color: #27ae60;
            color: #ffffff;
        }}
        .button-approve:hover {{
            background-color: #229954;
        }}
        .button-reject {{
            background-color: #e74c3c;
            color: #ffffff;
        }}
        .button-reject:hover {{
            background-color: #c0392b;
        }}
        .footer {{
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #7f8c8d;
        }}
        .success-message {{
            background-color: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        }}
        .error-message {{
            background-color: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="{logo_url}" alt="MediEase Clinic Logo">
        </div>
        <h1>Appointment Consent Request</h1>
        <div class="content">
            <p>Dear {patient_name},</p>
            <p>You have an upcoming appointment that requires your consent for the healthcare provider to view your medical history.</p>
            
            <div class="appointment-details">
                <p><strong>Doctor:</strong> {doctor_name}</p>
                <p><strong>Clinic:</strong> {clinic_name}</p>
                <p><strong>Date:</strong> {appointment_date}</p>
                <p><strong>Time:</strong> {appointment_time}</p>
            </div>
            
            <div class="statement">
                <strong>Consent Statement:</strong><br>
                I hereby give consent to {doctor_name} and {clinic_name} for my appointment on {appointment_date} at {appointment_time} to view my medical history at the time of consultation only.
            </div>
            
            <div class="button-container">
                <a href="{base_url}/api/consent/appointment-consent?appointmentId={appointment_id}&action=approve" class="button button-approve">Give Consent</a>
                <a href="{base_url}/api/consent/appointment-consent?appointmentId={appointment_id}&action=reject" class="button button-reject">Reject Consent</a>
            </div>
            
            <p style="font-size: 14px; color: #7f8c8d;">
                Your consent is required for HIPAA compliance. Without consent, the healthcare provider will not be able to view your medical history during the consultation.
            </p>
        </div>
        <div class="footer">
            <p>© 2025 MediEase Clinic. All rights reserved.</p>
            <p>This email was sent for HIPAA compliance purposes.</p>
        </div>
    </div>
</body>
</html>
"""


def _get_success_page_html(title: str, message: str, is_success: bool = True, acknowledgment: str = None) -> str:
    """Generate success/error confirmation page."""
    logo_url = f"{settings.frontend_base_url}/favicon.svg"
    message_class = "success-message" if is_success else "error-message"
    icon = "✓" if is_success else "✗"
    icon_color = "#27ae60" if is_success else "#e74c3c"
    acknowledgment_html = f'<div class="acknowledgment">{acknowledgment}</div>' if acknowledgment else ""
    
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - MediEase Clinic</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }}
        .container {{
            background-color: #ffffff;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .logo {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .logo img {{
            max-width: 200px;
            height: auto;
        }}
        h1 {{
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
            font-size: 28px;
        }}
        .icon {{
            font-size: 80px;
            text-align: center;
            margin: 20px 0;
            color: {icon_color};
            font-weight: bold;
        }}
        .success-message {{
            background-color: #d4edda;
            color: #155724;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
            font-size: 18px;
            font-weight: 500;
            border: 2px solid #c3e6cb;
        }}
        .error-message {{
            background-color: #f8d7da;
            color: #721c24;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
            font-size: 18px;
            font-weight: 500;
            border: 2px solid #f5c6cb;
        }}
        .acknowledgment {{
            background-color: #e7f3ff;
            color: #004085;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            text-align: center;
            font-size: 16px;
            border-left: 4px solid #3498db;
            line-height: 1.8;
        }}
        .acknowledgment strong {{
            display: block;
            font-size: 18px;
            margin-bottom: 10px;
            color: #2c3e50;
        }}
        .footer {{
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #7f8c8d;
        }}
        .close-note {{
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #7f8c8d;
            font-style: italic;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="{logo_url}" alt="MediEase Clinic Logo">
        </div>
        <div class="icon">{icon}</div>
        <h1>{title}</h1>
        <div class="{message_class}">
            {message}
        </div>
        {acknowledgment_html}
        <div class="close-note">
            You can safely close this window.
        </div>
        <div class="footer">
            <p>© 2025 MediEase Clinic. All rights reserved.</p>
            <p>This confirmation was generated for HIPAA compliance purposes.</p>
        </div>
    </div>
</body>
</html>
"""


@router.get("/verify-email", response_class=HTMLResponse)
async def verify_email(
    patientId: str = Query(..., description="Patient ID"),
    action: Optional[str] = Query(None, pattern="^(approve|reject)$", description="Action: approve or reject"),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Verify patient email address.
    
    Shows form if no action, processes and shows confirmation if action provided.
    """
    try:
        if not ObjectId.is_valid(patientId):
            return HTMLResponse(
                content=_get_success_page_html(
                    "Error",
                    "Invalid patient ID format",
                    is_success=False
                ),
                status_code=400
            )
        
        consent_service = ConsentService(db)
        
        # Get patient info
        patient = await consent_service.patients_collection.find_one({"_id": ObjectId(patientId)})
        if not patient:
            return HTMLResponse(
                content=_get_success_page_html(
                    "Error",
                    "Patient not found",
                    is_success=False
                ),
                status_code=404
            )
        
        patient_name = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip() or "Patient"
        
        # If action is provided, process it
        if action:
            success = await consent_service.verify_email(patientId, action)
            
            if success:
                if action == "approve":
                    title = "Email Verification Approved ✓"
                    message = "Your email has been verified successfully!"
                    acknowledgment = "<strong>✓ Acknowledgment Received</strong><br>You have successfully verified your email address. You will now receive consent emails from MediEase Clinic whenever you book an appointment. These emails will allow you to grant or deny consent for healthcare providers to view your medical history during consultations."
                else:
                    title = "Email Verification Rejected"
                    message = "Email verification has been rejected."
                    acknowledgment = None
                
                return HTMLResponse(
                    content=_get_success_page_html(
                        title,
                        message,
                        is_success=(action == "approve"),
                        acknowledgment=acknowledgment
                    )
                )
            else:
                return HTMLResponse(
                    content=_get_success_page_html(
                        "Error",
                        "Failed to verify email. Please try again or contact support.",
                        is_success=False
                    ),
                    status_code=400
                )
        else:
            # Show the form
            base_url = settings.frontend_base_url.rstrip("/")
            return HTMLResponse(
                content=_get_verification_form_html(patient_name, patientId, base_url)
            )
    
    except Exception as e:
        logger.error(f"Error verifying email: {e}", exc_info=True)
        return HTMLResponse(
            content=_get_success_page_html(
                "Error",
                f"An error occurred: {str(e)}",
                is_success=False
            ),
            status_code=500
        )


@router.get("/appointment-consent", response_class=HTMLResponse)
async def handle_appointment_consent(
    appointmentId: str = Query(..., description="Appointment ID"),
    action: Optional[str] = Query(None, pattern="^(approve|reject)$", description="Action: approve or reject"),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Handle appointment consent.
    
    Shows form if no action, processes and shows confirmation if action provided.
    """
    try:
        if not ObjectId.is_valid(appointmentId):
            return HTMLResponse(
                content=_get_success_page_html(
                    "Error",
                    "Invalid appointment ID format",
                    is_success=False
                ),
                status_code=400
            )
        
        consent_service = ConsentService(db)
        
        # Get appointment info
        appointment = await consent_service.appointments_collection.find_one({"_id": ObjectId(appointmentId)})
        if not appointment:
            return HTMLResponse(
                content=_get_success_page_html(
                    "Error",
                    "Appointment not found",
                    is_success=False
                ),
                status_code=404
            )
        
        # Get patient info
        patient_id = appointment.get("patientId")
        if not patient_id:
            return HTMLResponse(
                content=_get_success_page_html(
                    "Error",
                    "Appointment is missing patient information",
                    is_success=False
                ),
                status_code=400
            )
        
        patient = await consent_service.patients_collection.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            return HTMLResponse(
                content=_get_success_page_html(
                    "Error",
                    "Patient not found",
                    is_success=False
                ),
                status_code=404
            )
        
        patient_name = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip() or "Patient"
        
        # Get doctor info
        doctor_id = appointment.get("doctorId")
        doctor_name = "Lab Technician"
        if doctor_id:
            doctor = await db.users.find_one({"_id": ObjectId(doctor_id)})
            if doctor:
                doctor_name = f"Dr. {doctor.get('firstName', '')} {doctor.get('lastName', '')}".strip()
        
        clinic_name = appointment.get("clinicName") or patient.get("createdByClinicName") or "MediEase Clinic"
        appointment_date = appointment.get("date", "")
        appointment_time = appointment.get("time", "")
        
        # If action is provided, process it
        if action:
            success = await consent_service.update_appointment_consent(appointmentId, action)
            
            if success:
                if action == "approve":
                    title = "Consent Granted ✓"
                    message = "Your consent has been successfully recorded!"
                    acknowledgment = f"<strong>✓ Consent Acknowledgment</strong><br>You have granted consent to {doctor_name} and {clinic_name} to view your medical history during your appointment on {appointment_date} at {appointment_time}. This consent is valid only for the time of consultation and complies with HIPAA regulations."
                else:
                    title = "Consent Rejected"
                    message = "Your consent has been rejected."
                    acknowledgment = f"<strong>Consent Status</strong><br>You have rejected consent for {doctor_name} and {clinic_name} to view your medical history during your appointment on {appointment_date} at {appointment_time}. The healthcare provider will not be able to access your medical history during the consultation."
                
                return HTMLResponse(
                    content=_get_success_page_html(
                        title,
                        message,
                        is_success=(action == "approve"),
                        acknowledgment=acknowledgment
                    )
                )
            else:
                return HTMLResponse(
                    content=_get_success_page_html(
                        "Error",
                        "Failed to update appointment consent. Please try again or contact support.",
                        is_success=False
                    ),
                    status_code=400
                )
        else:
            # Show the form
            base_url = settings.frontend_base_url.rstrip("/")
            return HTMLResponse(
                content=_get_consent_form_html(
                    patient_name, doctor_name, clinic_name,
                    appointment_date, appointment_time,
                    appointmentId, base_url
                )
            )
    
    except Exception as e:
        logger.error(f"Error handling appointment consent: {e}", exc_info=True)
        return HTMLResponse(
            content=_get_success_page_html(
                "Error",
                f"An error occurred: {str(e)}",
                is_success=False
            ),
            status_code=500
        )


@router.post("/resend-appointment-consent")
async def resend_appointment_consent(
    appointmentId: str = Query(..., description="Appointment ID"),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Resend appointment consent email to patient.
    """
    try:
        if not ObjectId.is_valid(appointmentId):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid appointment ID format"
            )
        
        consent_service = ConsentService(db)
        
        # Check if appointment exists
        appointment = await consent_service.appointments_collection.find_one({"_id": ObjectId(appointmentId)})
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        # Resend consent email
        success = await consent_service.send_appointment_consent(appointmentId)
        
        if success:
            return success_response(
                message="Consent email resent successfully",
                data={"appointmentId": appointmentId}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to resend consent email"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resending appointment consent: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


@router.post("/send-pre-registration-verification")
async def send_pre_registration_verification(
    body: Dict[str, Any] = Body(...),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Send email verification link before patient registration.
    
    This endpoint allows sending verification emails during the registration process
    before the patient record is created.
    """
    try:
        email = body.get("email", "").strip()
        patient_name = body.get("patientName", "Patient")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is required"
            )
        
        consent_service = ConsentService(db)
        result = await consent_service.send_pre_registration_email_verification(
            email=email,
            patient_name=patient_name
        )
        
        if result.get("success"):
            return success_response(
                message=result.get("message", "Verification email sent successfully"),
                data={"email": email}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to send verification email")
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending pre-registration verification: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


@router.get("/check-pre-registration-verification")
async def check_pre_registration_verification(
    email: str = Query(..., description="Email address to check"),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Check if email is verified before registration.
    
    Returns verification status for an email address.
    """
    try:
        consent_service = ConsentService(db)
        is_verified = await consent_service.check_pre_registration_email_verified(email)
        
        return success_response(
            message="Verification status retrieved",
            data={
                "email": email,
                "verified": is_verified
            }
        )
    
    except Exception as e:
        logger.error(f"Error checking pre-registration verification: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )


@router.get("/verify-pre-registration-email", response_class=HTMLResponse)
async def verify_pre_registration_email(
    email: str = Query(..., description="Email address"),
    token: str = Query(..., description="Verification token"),
    action: Optional[str] = Query(None, pattern="^(approve|reject)$", description="Action: approve or reject"),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Verify email before registration.
    
    Shows form if no action, processes and shows confirmation if action provided.
    """
    try:
        consent_service = ConsentService(db)
        
        # Get verification record
        verification = await consent_service.pre_registration_verifications_collection.find_one({
            "email": email.strip().lower(),
            "token": token
        })
        
        if not verification:
            return HTMLResponse(
                content=_get_success_page_html(
                    "Error",
                    "Invalid verification link",
                    is_success=False
                ),
                status_code=400
            )
        
        patient_name = verification.get("patientName", "Patient")
        
        # If action is provided, process it
        if action:
            success = await consent_service.verify_pre_registration_email(email, token, action)
            
            if success:
                if action == "approve":
                    title = "Email Verification Approved ✓"
                    message = "Your email has been verified successfully! You can now complete your registration."
                    acknowledgment = "<strong>✓ Acknowledgment Received</strong><br>You have successfully verified your email address. You can now complete your patient registration."
                else:
                    title = "Email Verification Rejected"
                    message = "Email verification has been rejected."
                    acknowledgment = None
                
                return HTMLResponse(
                    content=_get_success_page_html(
                        title,
                        message,
                        is_success=(action == "approve"),
                        acknowledgment=acknowledgment
                    )
                )
            else:
                return HTMLResponse(
                    content=_get_success_page_html(
                        "Error",
                        "Failed to verify email. Please try again or contact support.",
                        is_success=False
                    ),
                    status_code=400
                )
        else:
            # Show the form
            base_url = settings.frontend_base_url.rstrip("/")
            verification_url_approve = f"{base_url}/api/consent/verify-pre-registration-email?email={email}&token={token}&action=approve"
            verification_url_reject = f"{base_url}/api/consent/verify-pre-registration-email?email={email}&token={token}&action=reject"
            logo_url = f"{settings.frontend_base_url}/favicon.svg"
            
            html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification - MediEase Clinic</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }}
        .container {{
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .logo {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .logo img {{
            max-width: 200px;
            height: auto;
        }}
        h1 {{
            color: #2c3e50;
            text-align: center;
            margin-bottom: 20px;
        }}
        .content {{
            margin-bottom: 30px;
            font-size: 16px;
        }}
        .statement {{
            background-color: #f8f9fa;
            padding: 20px;
            border-left: 4px solid #3498db;
            margin: 20px 0;
            font-size: 15px;
            line-height: 1.8;
        }}
        .button-container {{
            text-align: center;
            margin: 30px 0;
        }}
        .button {{
            display: inline-block;
            padding: 15px 40px;
            margin: 10px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            font-size: 16px;
            transition: background-color 0.3s;
            border: none;
            cursor: pointer;
        }}
        .button-approve {{
            background-color: #27ae60;
            color: #ffffff;
        }}
        .button-approve:hover {{
            background-color: #229954;
        }}
        .button-reject {{
            background-color: #e74c3c;
            color: #ffffff;
        }}
        .button-reject:hover {{
            background-color: #c0392b;
        }}
        .footer {{
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #7f8c8d;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="{logo_url}" alt="MediEase Clinic Logo">
        </div>
        <h1>Email Verification</h1>
        <div class="content">
            <p>Dear {patient_name},</p>
            <p>Thank you for registering with MediEase Clinic. To complete your registration and enable future consent emails for appointments, please verify your email address.</p>
            
            <div class="statement">
                <strong>Consent Statement:</strong><br>
                By verifying your email, you acknowledge that you will receive consent emails from MediEase Clinic whenever you book an appointment. These emails will allow you to grant or deny consent for healthcare providers to view your medical history during consultations.
            </div>
            
            <div class="button-container">
                <a href="{verification_url_approve}" class="button button-approve">I Approve</a>
                <a href="{verification_url_reject}" class="button button-reject">I Reject</a>
            </div>
            
            <p style="font-size: 14px; color: #7f8c8d;">
                If you did not register with MediEase Clinic, please ignore this email.
            </p>
        </div>
        <div class="footer">
            <p>© 2025 MediEase Clinic. All rights reserved.</p>
            <p>This email was sent for HIPAA compliance purposes.</p>
        </div>
    </div>
</body>
</html>
"""
            return HTMLResponse(content=html_content)
    
    except Exception as e:
        logger.error(f"Error verifying pre-registration email: {e}", exc_info=True)
        return HTMLResponse(
            content=_get_success_page_html(
                "Error",
                f"An error occurred: {str(e)}",
                is_success=False
            ),
            status_code=500
        )

