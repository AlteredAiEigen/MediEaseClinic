"""
Consent service for HIPAA compliance - handles email verification and appointment consent.
"""

import logging
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict
from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.email_service import EmailService
from app.config import settings

logger = logging.getLogger(__name__)


class ConsentService:
    """Service for managing patient consent and email verification."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.patients_collection = db.patients
        self.appointments_collection = db.appointments
        self.pre_registration_verifications_collection = db.pre_registration_email_verifications
        self.email_service = EmailService()
    
    def _generate_verification_token(self) -> str:
        """Generate a secure verification token."""
        return secrets.token_urlsafe(32)
    
    def _get_email_verification_html(self, patient_name: str, verification_url: str) -> str:
        """Generate HTML email template for email verification."""
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
            max-width: 260px;
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
                <a href="{verification_url}&action=approve" class="button button-approve">I Approve</a>
                <a href="{verification_url}&action=reject" class="button button-reject">I Reject</a>
            </div>
            
            <p style="text-align: center; margin-top: 20px;">
                <a href="{verification_url}" style="color: #3498db; text-decoration: none;">Click here to view the consent form</a>
            </p>
            
            <p style="font-size: 14px; color: #7f8c8d;">
                If you did not register with MediEase Clinic, please ignore this email.
            </p>
        </div>
        <div class="footer">
            <p>© {datetime.now().year} MediEase Clinic. All rights reserved.</p>
            <p>This email was sent for HIPAA compliance purposes.</p>
        </div>
    </div>
</body>
</html>
"""
    
    def _get_appointment_consent_html(
        self, 
        patient_name: str, 
        doctor_name: str, 
        clinic_name: str,
        appointment_date: str,
        appointment_time: str,
        consent_url: str
    ) -> str:
        """Generate HTML email template for appointment consent."""
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
            max-width: 260px;
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
                <a href="{consent_url}&action=approve" class="button button-approve">Give Consent</a>
                <a href="{consent_url}&action=reject" class="button button-reject">Reject Consent</a>
            </div>
            
            <p style="text-align: center; margin-top: 20px;">
                <a href="{consent_url}" style="color: #3498db; text-decoration: none;">Click here to view the consent form</a>
            </p>
            
            <p style="font-size: 14px; color: #7f8c8d;">
                Your consent is required for HIPAA compliance. Without consent, the healthcare provider will not be able to view your medical history during the consultation.
            </p>
        </div>
        <div class="footer">
            <p>© {datetime.now().year} MediEase Clinic. All rights reserved.</p>
            <p>This email was sent for HIPAA compliance purposes.</p>
        </div>
    </div>
</body>
</html>
"""
    
    async def send_email_verification(self, patient_id: str) -> bool:
        """
        Send email verification link to patient after registration.
        
        Args:
            patient_id: Patient MongoDB ObjectId string
            
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            patient = await self.patients_collection.find_one({"_id": ObjectId(patient_id)})
            if not patient:
                logger.error(f"Patient not found: {patient_id}")
                return False
            
            email = patient.get("email")
            if not email:
                logger.error(f"Patient {patient_id} has no email address")
                return False
            
            # Generate verification URL - points to form page (no action parameter)
            verification_url = f"{settings.frontend_base_url}/api/consent/verify-email?patientId={patient_id}"
            
            # Generate HTML email
            patient_name = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip() or "Patient"
            html_content = self._get_email_verification_html(patient_name, verification_url)
            
            # Send email with HTML content
            result = await self.email_service.send_email(
                to=email,
                subject="Verify Your Email - MediEase Clinic",
                body=f"Please verify your email by clicking the link: {verification_url}",
                html=html_content,
            )
            
            if result.get("success"):
                logger.info(f"Email verification sent to {email} for patient {patient_id}")
                return True
            else:
                logger.error(f"Failed to send email verification: {result.get('error')}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email verification: {e}", exc_info=True)
            return False
    
    async def verify_email(self, patient_id: str, action: str) -> bool:
        """
        Verify patient email based on action (approve/reject).
        
        Args:
            patient_id: Patient MongoDB ObjectId string
            action: "approve" or "reject"
            
        Returns:
            True if verification successful, False otherwise
        """
        try:
            if action not in ["approve", "reject"]:
                raise ValueError("Action must be 'approve' or 'reject'")
            
            patient = await self.patients_collection.find_one({"_id": ObjectId(patient_id)})
            if not patient:
                logger.error(f"Patient not found: {patient_id}")
                return False
            
            # Update email verification status
            update_data = {
                "emailVerified": action == "approve",
                "updatedAt": datetime.utcnow()
            }
            
            await self.patients_collection.update_one(
                {"_id": ObjectId(patient_id)},
                {"$set": update_data}
            )
            
            logger.info(f"Email verification {'approved' if action == 'approve' else 'rejected'} for patient {patient_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error verifying email: {e}", exc_info=True)
            return False
    
    async def send_appointment_consent(self, appointment_id: str) -> bool:
        """
        Send appointment consent email to patient.
        
        Args:
            appointment_id: Appointment MongoDB ObjectId string
            
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            appointment = await self.appointments_collection.find_one({"_id": ObjectId(appointment_id)})
            if not appointment:
                logger.error(f"Appointment not found: {appointment_id}")
                return False
            
            patient_id = appointment.get("patientId")
            doctor_id = appointment.get("doctorId")
            
            if not patient_id:
                logger.error(f"Appointment {appointment_id} has no patient ID")
                return False
            
            # Get patient details
            patient = await self.patients_collection.find_one({"_id": ObjectId(patient_id)})
            if not patient:
                logger.error(f"Patient not found: {patient_id}")
                return False
            
            email = patient.get("email")
            if not email:
                logger.error(f"Patient {patient_id} has no email address")
                return False
            
            # Get doctor details if doctor_id exists
            doctor_name = "Lab Technician"
            clinic_name = "MediEase Clinic"
            
            if doctor_id:
                doctor = await self.db.users.find_one({"_id": ObjectId(doctor_id)})
                if doctor:
                    doctor_name = f"Dr. {doctor.get('firstName', '')} {doctor.get('lastName', '')}".strip()
            
            # Get clinic name from appointment or patient
            clinic_name = appointment.get("clinicName") or patient.get("createdByClinicName") or "MediEase Clinic"
            
            # Generate consent URL - points to form page (no action parameter)
            consent_url = f"{settings.frontend_base_url}/api/consent/appointment-consent?appointmentId={appointment_id}"
            
            # Generate HTML email
            patient_name = f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip() or "Patient"
            appointment_date = appointment.get("date", "")
            appointment_time = appointment.get("time", "")
            
            html_content = self._get_appointment_consent_html(
                patient_name=patient_name,
                doctor_name=doctor_name,
                clinic_name=clinic_name,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
                consent_url=consent_url
            )
            
            # Send email with HTML content
            result = await self.email_service.send_email(
                to=email,
                subject=f"Appointment Consent Required - {appointment_date} at {appointment_time}",
                body=f"Please provide consent for your appointment: {consent_url}",
                html=html_content,
            )
            
            if result.get("success"):
                # Set consent status to pending
                await self.appointments_collection.update_one(
                    {"_id": ObjectId(appointment_id)},
                    {
                        "$set": {
                            "consentStatus": "pending",
                            "updatedAt": datetime.utcnow()
                        }
                    }
                )
                logger.info(f"Appointment consent email sent to {email} for appointment {appointment_id}")
                return True
            else:
                logger.error(f"Failed to send appointment consent email: {result.get('error')}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending appointment consent email: {e}", exc_info=True)
            return False
    
    async def update_appointment_consent(self, appointment_id: str, action: str) -> bool:
        """
        Update appointment consent status.
        
        Args:
            appointment_id: Appointment MongoDB ObjectId string
            action: "approve" or "reject"
            
        Returns:
            True if consent updated successfully, False otherwise
        """
        try:
            if action not in ["approve", "reject"]:
                raise ValueError("Action must be 'approve' or 'reject'")
            
            appointment = await self.appointments_collection.find_one({"_id": ObjectId(appointment_id)})
            if not appointment:
                logger.error(f"Appointment not found: {appointment_id}")
                return False
            
            # Update consent status
            update_data = {
                "consentStatus": "accepted" if action == "approve" else "rejected",
                "consentDate": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            await self.appointments_collection.update_one(
                {"_id": ObjectId(appointment_id)},
                {"$set": update_data}
            )
            
            # Clear appointments cache to ensure frontend gets updated consent status
            try:
                from app.utils.cache import cache
                await cache.clear_pattern("appointments:*")
                logger.info("Cleared appointments cache after consent update")
            except Exception as cache_error:
                logger.warning(f"Failed to clear appointments cache: {cache_error}")
            
            # Broadcast WebSocket event for real-time updates
            try:
                from app.services.websocket_service import WebSocketService
                websocket_service = WebSocketService()
                # Get updated appointment to broadcast
                updated_appointment = await self.appointments_collection.find_one({"_id": ObjectId(appointment_id)})
                if updated_appointment:
                    await websocket_service.broadcast_appointment_status_update(updated_appointment)
                    logger.info(f"Broadcasted consent update via WebSocket for appointment {appointment_id}")
            except Exception as ws_error:
                logger.warning(f"Failed to broadcast consent update via WebSocket: {ws_error}")
            
            logger.info(f"Appointment consent {'approved' if action == 'approve' else 'rejected'} for appointment {appointment_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating appointment consent: {e}", exc_info=True)
            return False
    
    async def check_consent_for_appointment(self, appointment_id: str) -> bool:
        """
        Check if consent has been granted for an appointment.
        
        Args:
            appointment_id: Appointment MongoDB ObjectId string
            
        Returns:
            True if consent is granted, False otherwise
        """
        try:
            appointment = await self.appointments_collection.find_one({"_id": ObjectId(appointment_id)})
            if not appointment:
                return False
            
            consent_status = appointment.get("consentStatus")
            return consent_status == "accepted"
            
        except Exception as e:
            logger.error(f"Error checking consent: {e}", exc_info=True)
            return False
    
    async def send_pre_registration_email_verification(self, email: str, patient_name: str = "Patient") -> Dict:
        """
        Send email verification link before patient registration.
        
        Args:
            email: Email address to verify
            patient_name: Patient name (optional, defaults to "Patient")
            
        Returns:
            Dict with success status and message
        """
        try:
            email = email.strip().lower()
            
            # Generate verification token
            token = self._generate_verification_token()
            
            # Create or update pre-registration verification record
            verification_url = f"{settings.frontend_base_url}/api/consent/verify-pre-registration-email?email={email}&token={token}"
            
            # Store verification record (expires in 24 hours)
            expires_at = datetime.utcnow() + timedelta(hours=24)
            verification_data = {
                "email": email,
                "token": token,
                "verified": False,
                "createdAt": datetime.utcnow(),
                "expiresAt": expires_at,
                "patientName": patient_name
            }
            
            # Upsert verification record
            await self.pre_registration_verifications_collection.update_one(
                {"email": email},
                {"$set": verification_data},
                upsert=True
            )
            
            # Generate HTML email
            html_content = self._get_email_verification_html(patient_name, verification_url)
            
            # Send email
            result = await self.email_service.send_email(
                to=email,
                subject="Verify Your Email - MediEase Clinic Registration",
                body=f"Please verify your email by clicking the link: {verification_url}",
                html=html_content,
            )
            
            if result.get("success"):
                logger.info(f"Pre-registration email verification sent to {email}")
                return {
                    "success": True,
                    "message": "Verification email sent successfully"
                }
            else:
                logger.error(f"Failed to send pre-registration email verification: {result.get('error')}")
                return {
                    "success": False,
                    "error": result.get("error", "Failed to send verification email")
                }
                
        except Exception as e:
            logger.error(f"Error sending pre-registration email verification: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }
    
    async def verify_pre_registration_email(self, email: str, token: str, action: str) -> bool:
        """
        Verify email before registration based on action (approve/reject).
        
        Args:
            email: Email address
            token: Verification token
            action: "approve" or "reject"
            
        Returns:
            True if verification successful, False otherwise
        """
        try:
            if action not in ["approve", "reject"]:
                raise ValueError("Action must be 'approve' or 'reject'")
            
            email = email.strip().lower()
            
            # Find verification record
            verification = await self.pre_registration_verifications_collection.find_one({
                "email": email,
                "token": token
            })
            
            if not verification:
                logger.error(f"Verification record not found for email {email}")
                return False
            
            # Check if expired
            if verification.get("expiresAt") < datetime.utcnow():
                logger.error(f"Verification token expired for email {email}")
                return False
            
            # Update verification status
            update_data = {
                "verified": action == "approve",
                "verifiedAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            await self.pre_registration_verifications_collection.update_one(
                {"email": email, "token": token},
                {"$set": update_data}
            )
            
            logger.info(f"Pre-registration email verification {'approved' if action == 'approve' else 'rejected'} for {email}")
            return True
            
        except Exception as e:
            logger.error(f"Error verifying pre-registration email: {e}", exc_info=True)
            return False
    
    async def check_pre_registration_email_verified(self, email: str) -> bool:
        """
        Check if email is verified before registration.
        
        Args:
            email: Email address to check
            
        Returns:
            True if email is verified, False otherwise
        """
        try:
            email = email.strip().lower()
            
            # Check in pre-registration verifications
            verification = await self.pre_registration_verifications_collection.find_one({
                "email": email,
                "verified": True
            })
            
            if verification:
                # Check if not expired
                if verification.get("expiresAt") and verification.get("expiresAt") >= datetime.utcnow():
                    return True
            
            # Also check if patient already exists and is verified
            patient = await self.patients_collection.find_one({"email": email})
            if patient and patient.get("emailVerified"):
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking pre-registration email verification: {e}", exc_info=True)
            return False

