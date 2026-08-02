"""
Prescription management router.
"""

from datetime import datetime, timedelta
import json
import logging
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.database import get_db
from app.models.prescription import (
    PrescriptionCreate,
    PrescriptionUpdate,
)
from app.models.s3_prescription import (
    PrescriptionStructuredDetails,
    PrescriptionMedication,
    PrescriptionTest,
)
from app.services.prescription_service import PrescriptionService
from app.services.prescription_share_service import PrescriptionShareService
from app.services.ai_service import ai_service
from app.middleware.auth import require_any_role, require_doctor_or_admin
from app.utils.response import success_response, paginated_response

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/share/{token}", include_in_schema=False)
async def open_prescription_share_link(
    token: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Public short link for prescription downloads (used in WhatsApp messages).
    Redirects to a fresh S3 presigned URL; no auth required.
    """
    share_service = PrescriptionShareService(db)
    download_url = await share_service.resolve_redirect_url(token)
    if not download_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This prescription link is invalid or has expired",
        )
    return RedirectResponse(url=download_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_prescription(
    prescription_data: PrescriptionCreate,
    current_user: dict = Depends(require_doctor_or_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create new prescription. Only doctors and admins can create prescriptions."""
    try:
        # Override doctorId with current user's ID for security
        prescription_dict = prescription_data.model_dump()
        prescription_dict["doctorId"] = str(current_user["_id"])
        
        # Create a new PrescriptionCreate object with the updated doctorId
        from app.models.prescription import PrescriptionCreate
        updated_prescription_data = PrescriptionCreate(**prescription_dict)
        
        prescription_service = PrescriptionService(db)
        prescription = await prescription_service.create_prescription(updated_prescription_data)
        
        return success_response(
            message="Prescription created successfully",
            data={"prescription": prescription},
            status_code=201
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prescription creation failed: {str(e)}"
        )


@router.get("/")
async def list_prescriptions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    patient_id: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List prescriptions with filtering."""
    try:
        prescription_service = PrescriptionService(db)
        prescriptions, total = await prescription_service.list_prescriptions(
            page=page,
            limit=limit,
            patient_id=patient_id,
            doctor_id=doctor_id,
            is_active=is_active
        )
        
        return paginated_response(
            message="Prescriptions retrieved successfully",
            data=prescriptions,
            total=total,
            page=page,
            limit=limit
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve prescriptions: {str(e)}"
        )


@router.get("/consultation/latest")
async def get_latest_consultation_prescription(
    appointment_id: Optional[str] = Query(None, alias="appointmentId"),
    queue_id: Optional[str] = Query(None, alias="queueId"),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get the most recent active prescription saved for this consultation."""
    if not appointment_id and not queue_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="appointmentId or queueId is required",
        )

    prescription_service = PrescriptionService(db)
    prescription = await prescription_service.get_latest_consultation_prescription(
        appointment_id=appointment_id,
        queue_id=queue_id,
    )

    return success_response(
        message="Prescription retrieved successfully" if prescription else "No prescription found for this consultation",
        data={"prescription": prescription},
    )


@router.get("/consultation/list")
async def list_consultation_prescriptions(
    appointment_id: Optional[str] = Query(None, alias="appointmentId"),
    queue_id: Optional[str] = Query(None, alias="queueId"),
    include_inactive: bool = Query(True, alias="includeInactive"),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """List all prescriptions for this consultation (for selector when multiple exist)."""
    if not appointment_id and not queue_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="appointmentId or queueId is required",
        )

    prescription_service = PrescriptionService(db)
    prescriptions = await prescription_service.list_consultation_prescriptions(
        appointment_id=appointment_id,
        queue_id=queue_id,
        include_inactive=include_inactive,
    )

    return success_response(
        message="Prescriptions retrieved successfully",
        data={"prescriptions": prescriptions, "count": len(prescriptions)},
    )


@router.get("/{prescription_id}")
async def get_prescription(
    prescription_id: str,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get prescription by ID."""
    prescription_service = PrescriptionService(db)
    prescription = await prescription_service.get_prescription(prescription_id)
    
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )
    
    return success_response(
        message="Prescription retrieved successfully",
        data={"prescription": prescription}
    )


@router.put("/{prescription_id}")
async def update_prescription(
    prescription_id: str,
    update_data: PrescriptionUpdate,
    current_user: dict = Depends(require_doctor_or_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update prescription. Only doctors and admins can update."""
    try:
        prescription_service = PrescriptionService(db)
        prescription = await prescription_service.update_prescription(prescription_id, update_data)
        
        return success_response(
            message="Prescription updated successfully",
            data={"prescription": prescription}
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prescription update failed: {str(e)}"
        )


@router.delete("/{prescription_id}")
async def delete_prescription(
    prescription_id: str,
    current_user: dict = Depends(require_doctor_or_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Hard-delete prescription so no row remains before WhatsApp send."""
    try:
        prescription_service = PrescriptionService(db)
        await prescription_service.delete_prescription(prescription_id)
        
        return success_response(
            message="Prescription deleted successfully",
            data={"prescriptionId": prescription_id}
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prescription deletion failed: {str(e)}"
        )


@router.post("/{prescription_id}/analyze-image", status_code=status.HTTP_200_OK)
async def analyze_prescription_image(
    prescription_id: str,
    current_user: dict = Depends(require_doctor_or_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Analyze a prescription image stored in S3 using GPT-4o (vision) and
    store structured medicines/tests in the s3_prescriptions collection.
    
    This endpoint accepts an s3_prescription document ID (from s3_prescriptions table).
    The prescription_id parameter should be the MongoDB _id of the s3_prescription document.
    
    **Authentication Required:** Include Bearer token in Authorization header.
    
    **Error Codes:**
    - `PRESCRIPTION_NOT_FOUND`: s3_prescription document not found
    - `INVALID_PRESCRIPTION_ID`: Invalid ObjectId format
    - `MISSING_IMAGE_URL`: Prescription does not have an s3Url
    """
    # Validate ObjectId format
    if not ObjectId.is_valid(prescription_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid prescription ID format",
            headers={"X-Error-Code": "INVALID_PRESCRIPTION_ID"}
        )

    # Find in s3_prescriptions table (only table used for prescriptions)
    s3_prescription = await db.s3_prescriptions.find_one({"_id": ObjectId(prescription_id)})
    
    if not s3_prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prescription not found with ID: {prescription_id}",
            headers={"X-Error-Code": "PRESCRIPTION_NOT_FOUND"}
        )
    
    # Generate a fresh presigned URL from s3Key (required for GPT-4o to access the image)
    # The stored s3Url is just a base URL without presigned parameters
    s3_key = s3_prescription.get("s3Key")
    if not s3_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prescription does not have an s3Key to generate presigned URL",
            headers={"X-Error-Code": "MISSING_S3_KEY"}
        )
    
    # Generate presigned URL for GPT-4o to access the image
    from app.services.s3_service import s3_service
    try:
        image_url = await s3_service.generate_presigned_url(s3_key)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate presigned URL for prescription: {str(e)}",
            headers={"X-Error-Code": "PRESIGNED_URL_GENERATION_FAILED"}
        )
    
    # Analyze using GPT-4o vision with the presigned URL
    ai_result = await ai_service.analyze_prescription_image(image_url=image_url)
    
    # Parse and structure the results
    medicines_data = ai_result.get("medicines") or []
    tests_data = ai_result.get("tests") or []
    
    # Extract patient information (handle "Not available" as None)
    patient_name = ai_result.get("patientName")
    patient_age = ai_result.get("patientAge")
    patient_gender = ai_result.get("patientGender")
    
    # Extract doctor information (handle "Not available" as None)
    doctor_name = ai_result.get("doctorName")
    doctor_license = ai_result.get("doctorLicenseNumber")
    
    # Extract prescription date (handle "Not available" as None)
    prescription_date = ai_result.get("prescriptionDate")
    
    # Extract additional notes (handle "Not available" as None)
    additional_notes = ai_result.get("additionalNotes")
    
    # Helper function to normalize "Not available" to None
    def normalize_value(value):
        if not value or not isinstance(value, str):
            return None
        value = value.strip()
        if value.lower() in ["not available", "n/a", "na", ""]:
            return None
        return value
    
    structured = PrescriptionStructuredDetails(
        # Patient Information
        patientName=normalize_value(patient_name),
        patientAge=normalize_value(patient_age),
        patientGender=normalize_value(patient_gender),
        
        # Doctor Information
        doctorName=normalize_value(doctor_name),
        doctorLicenseNumber=normalize_value(doctor_license),
        
        # Prescription Metadata
        prescriptionDate=normalize_value(prescription_date),
        
        # Medications
        medicines=[
            PrescriptionMedication(
                name=(m.get("name") or "").strip(),
                dosage=(m.get("dosage") or "").strip(),
                frequency=(m.get("frequency") or "").strip(),
                duration=(m.get("duration") or "").strip(),
                instructions=(m.get("instructions") or "").strip(),
            )
            for m in medicines_data
            if isinstance(m, dict) and (m.get("name") or "").strip()
        ],
        
        # Tests
        tests=[
            PrescriptionTest(
                name=(t.get("name") or "").strip(),
                instructions=(t.get("instructions") or "").strip(),
            )
            for t in tests_data
            if isinstance(t, dict) and (t.get("name") or "").strip()
        ],
        
        # Additional Notes
        additionalNotes=normalize_value(additional_notes),
    )
    
    # Save to s3_prescriptions collection
    await db.s3_prescriptions.update_one(
        {"_id": ObjectId(prescription_id)},
        {
            "$set": {
                "structuredDetails": structured.model_dump(),
                "updatedAt": datetime.utcnow(),
            }
        },
    )
    
    # Get appointment to find patientId and update medications/tests
    appointment_id = s3_prescription.get("appointmentId")
    if appointment_id:
        try:
            appointment = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
            if appointment:
                patient_id = appointment.get("patientId")
                
                # Add medicines to patient's currentMedications
                if patient_id and structured.medicines:
                    try:
                        patient = await db.patients.find_one({"patientId": patient_id})
                        if patient:
                            existing_medications = patient.get("currentMedications", [])
                            
                            # Create new medication entries from prescription
                            new_medication_entries = []
                            for med in structured.medicines:
                                # Check if medication already exists (by name and dosage to avoid duplicates)
                                med_name_lower = med.name.lower().strip() if med.name else ""
                                med_dosage = med.dosage.strip() if med.dosage else ""
                                
                                # Check for duplicates
                                is_duplicate = False
                                for existing_med in existing_medications:
                                    existing_name = existing_med.get("name", "").lower().strip()
                                    existing_dosage = existing_med.get("dosage", "").strip()
                                    if existing_name == med_name_lower and existing_dosage == med_dosage:
                                        is_duplicate = True
                                        break
                                
                                if not is_duplicate and med_name_lower:
                                    # Use the same duration parsing logic as recording_service.py
                                    def _parse_duration_to_end_date(duration_text: str) -> str:
                                        """
                                        Convert duration text like '5 days', '2 weeks', '1 month'
                                        into an ISO date string (YYYY-MM-DD). Falls back to empty
                                        string if parsing fails. Empty endDate means ongoing/active medication.
                                        """
                                        if not duration_text:
                                            return ""
                                        import re
                                        
                                        text = duration_text.strip().lower()
                                        match = re.match(r"(\d+)\s*(day|days|week|weeks|month|months)", text)
                                        if not match:
                                            return ""
                                        amount = int(match.group(1))
                                        unit = match.group(2)
                                        
                                        if "week" in unit:
                                            delta = timedelta(weeks=amount)
                                        elif "month" in unit:
                                            delta = timedelta(days=amount * 30)  # Approximate months as 30 days
                                        else:
                                            delta = timedelta(days=amount)
                                        
                                        end_date = datetime.utcnow() + delta
                                        return end_date.strftime("%Y-%m-%d")
                                    
                                    # Calculate end date from duration if provided
                                    # Empty endDate means ongoing/active medication (frontend logic: if (!med.endDate) return true)
                                    duration_text = med.duration.strip() if med.duration else ""
                                    end_date = _parse_duration_to_end_date(duration_text)
                                    
                                    medication_entry = {
                                        "name": med.name.strip(),
                                        "dosage": med.dosage.strip() if med.dosage else "",
                                        "frequency": med.frequency.strip() if med.frequency else "",
                                        "duration": duration_text,  # Keep original duration text
                                        "instructions": med.instructions.strip() if med.instructions else "",
                                        "startDate": datetime.utcnow().strftime("%Y-%m-%d"),
                                        "endDate": end_date,  # Empty string if no duration or parsing fails = active medication
                                    }
                                    new_medication_entries.append(medication_entry)
                            
                            # Update patient's currentMedications if there are new medications
                            if new_medication_entries:
                                updated_medications = existing_medications + new_medication_entries
                                await db.patients.update_one(
                                    {"patientId": patient_id},
                                    {
                                        "$set": {
                                            "currentMedications": updated_medications,
                                            "updatedAt": datetime.utcnow(),
                                        }
                                    }
                                )
                                logger.info(f"Added {len(new_medication_entries)} new medications to patient {patient_id} profile")
                    except Exception as e:
                        logger.error(f"Failed to add medications to patient profile: {e}", exc_info=True)
                        # Don't fail the whole operation if medication update fails
                
                # Add tests to appointment's prescribedTest field
                if structured.tests:
                    try:
                        test_names = [test.name.strip() for test in structured.tests if test.name and test.name.strip()]
                        if test_names:
                            # Get existing prescribedTest from appointment
                            existing_tests = appointment.get("prescribedTest", "")
                            existing_test_list = [t.strip() for t in existing_tests.split(",") if t.strip()] if existing_tests else []
                            
                            # Merge new tests with existing ones (avoid duplicates)
                            all_tests = list(set(existing_test_list + test_names))
                            prescribed_test_str = ", ".join(all_tests)
                            
                            await db.appointments.update_one(
                                {"_id": ObjectId(appointment_id)},
                                {
                                    "$set": {
                                        "prescribedTest": prescribed_test_str,
                                        "updatedAt": datetime.utcnow(),
                                    }
                                }
                            )
                            logger.info(f"Added {len(test_names)} tests to appointment {appointment_id}: {prescribed_test_str}")
                    except Exception as e:
                        logger.error(f"Failed to add tests to appointment: {e}", exc_info=True)
                        # Don't fail the whole operation if test update fails
        except Exception as e:
            logger.error(f"Failed to update patient medications or appointment tests: {e}", exc_info=True)
            # Don't fail the whole operation
    
    return success_response(
        message="Prescription image analyzed successfully",
        data={
            "s3PrescriptionId": prescription_id,
            "appointmentId": s3_prescription.get("appointmentId"),
            "structuredDetails": structured.model_dump(),
        }
    )

