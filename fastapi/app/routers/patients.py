"""
Patient management router with HIPAA compliance.
All endpoints require authentication and log PHI access.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Body
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, Dict, Any
from datetime import datetime
import json

from app.database import get_db
from app.schemas.patient import PatientCreateRequest, PatientUpdateRequest
from app.models.patient import PatientCreate
from app.services.patient_service import PatientService
from app.middleware.auth import get_current_active_user, require_any_role
from app.utils.response import success_response, paginated_response
from app.utils.cache import cache
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_patient(
    body: Dict[str, Any] = Body(...),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create a new patient.
    
    Requires authentication. Only doctors, receptionists, and admins can create patients.
    
    Patients are universal across all clinics. The clinic info is stored for reference
    (to track which clinic created the patient) but does not restrict patient access.
    
    Medical history field (medicalHistory) is automatically routed to the
    patient_medical_history collection instead of being stored on the patient.
    
    HIPAA Compliance: Sensitive fields are encrypted before storage.
    """
    try:
        # Extract medical history fields before Pydantic validation
        medical_history_fields = {}
        body_copy = body.copy()  # Work with a copy to avoid modifying the original
        for field in ["medicalHistory", "familyHistory", "previousSurgeries"]:
            if field in body_copy:
                medical_history_fields[field] = body_copy.pop(field)
        
        # Now validate the remaining fields with Pydantic
        patient_data = PatientCreateRequest(**body_copy)
        
        # Validate data storage consent - must be True to create patient
        if not patient_data.agreedToDataStorage:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient consent for data storage is required. agreedToDataStorage must be True."
            )
        
        # Convert camelCase to snake_case for backend model
        patient_payload = patient_data.model_dump(exclude_none=True)
        if "agreedToDataStorage" in patient_payload:
            patient_payload["agreed_to_data_storage"] = patient_payload.pop("agreedToDataStorage")
        # Convert communication consent fields from camelCase to snake_case
        if "consentWhatsApp" in patient_payload:
            patient_payload["consent_whatsapp"] = patient_payload.pop("consentWhatsApp")
        if "consentEmail" in patient_payload:
            patient_payload["consent_email"] = patient_payload.pop("consentEmail")
        if "consentSMS" in patient_payload:
            patient_payload["consent_sms"] = patient_payload.pop("consentSMS")
        if "consentPhoneCall" in patient_payload:
            patient_payload["consent_phone_call"] = patient_payload.pop("consentPhoneCall")
        
        patient_service = PatientService(db)
        logger.info("patient_payload for creating patient %s", patient_payload)

        # Get clinic info for reference (which clinic created this patient)
        # Patients are universal and not restricted to this clinic
        clinic_id = current_user.get("clinicId")
        clinic_name = current_user.get("clinicName")

        patient_model = PatientCreate(**patient_payload)

        patient = await patient_service.create_patient(
            patient_model,
            clinic_id=clinic_id,  # Stored as createdByClinicId for reference only
            clinic_name=clinic_name  # Stored as createdByClinicName for reference only
        )
        
        # Create medical history record if fields were provided
        if medical_history_fields:
            logger.info(f"Creating medical history record with fields: {list(medical_history_fields.keys())}")
            try:
                from app.services.patient_medical_history_service import PatientMedicalHistoryService
                from app.models.patient_medical_history import PatientMedicalHistoryCreate
                
                medical_history_service = PatientMedicalHistoryService(db)
                patient_obj_id = patient.get("_id") or patient.get("id")
                logger.info(f"Creating medical history for patient ID: {patient_obj_id}")
                
                create_history_data = PatientMedicalHistoryCreate(
                    patientId=str(patient_obj_id),
                    **medical_history_fields
                )
                result = await medical_history_service.create_medical_history(create_history_data)
                logger.info(f"✅ Medical history created successfully: {result.get('_id')}")
            except Exception as e:
                logger.error(f"❌ Failed to create medical history during patient creation: {e}", exc_info=True)
                # Don't fail the request, but log the error clearly
        
        return success_response(
            message="Patient created successfully",
            data={"patient": patient},
            status_code=201
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Patient creation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Patient creation failed: {str(e)}"
        )


@router.get("/")
async def list_patients(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name, email, phone, or patient ID"),
    gender: Optional[str] = Query(None, pattern="^(Male|Female|Other)$"),
    present_in_clinic: Optional[bool] = Query(None, description="Filter by clinic presence"),
    phone: Optional[str] = Query(None, description="Filter by phone number"),
    date_of_birth: Optional[str] = Query(None, description="Filter by date of birth (YYYY-MM-DD)"),
    address: Optional[str] = Query(None, description="Filter by address"),
    email: Optional[str] = Query(None, description="Filter by email address"),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List patients with pagination and filtering.
    
    Requires authentication. Accessible to all authenticated users.
    
    HIPAA Compliance: PHI access is logged in audit trail.
    """
    try:
        # Try cache for non-search queries (30 second TTL)
        cache_key = f"patients:list:{page}:{limit}:{search}:{gender}:{present_in_clinic}:{phone}:{date_of_birth}:{address}:{email}"
        if not search and not phone and not date_of_birth and not address and not email:  # Only cache non-search queries
            cached = await cache.get(cache_key)
            if cached is not None:
                return cached
        
        patient_service = PatientService(db)
        # Patients are universal - not filtered by clinic
        # clinic_id is not passed to maintain universal patient access

        patients, total = await patient_service.list_patients(
            page=page,
            limit=limit,
            search=search,
            gender=gender,
            present_in_clinic=present_in_clinic,
            phone=phone,
            date_of_birth=date_of_birth,
            address=address,
            email=email,
            clinic_id=None  # Not used for filtering - patients are universal
        )
        
        result = paginated_response(
            message="Patients retrieved successfully",
            data=patients,
            total=total,
            page=page,
            limit=limit
        )
        
        # Cache the result if no search or filter queries
        if not search and not phone and not date_of_birth and not address and not email:
            await cache.set(cache_key, result, ttl_seconds=30)
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve patients: {str(e)}"
        )


@router.get("/search")
async def search_patients(
    q: str = Query(..., min_length=1, description="Search query"),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Search patients by name, email, phone, or patient ID.

    Supports single character searches with regex pattern matching.
    Returns up to 20 matching results.
    """
    try:
        patient_service = PatientService(db)
        # Patients are universal - not filtered by clinic
        patients = await patient_service.search_patients(q, clinic_id=None)
        
        return success_response(
            message=f"Found {len(patients)} matching patients",
            data={"patients": patients}
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )


@router.get("/{patient_id}")
async def get_patient(
    patient_id: str,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get patient details by ID.
    
    Requires authentication. PHI access is logged for audit trail.
    """
    patient_service = PatientService(db)
    patient = await patient_service.get_patient(patient_id)
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # Attach current medical history fields from the separate collection so that
    # the API response still exposes `medicalHistory`, `familyHistory`, and
    # `previousSurgeries` while the patients collection itself does not store them.
    try:
        from app.services.patient_medical_history_service import PatientMedicalHistoryService

        history_service = PatientMedicalHistoryService(db)
        current_history = await history_service.get_current_medical_history(patient_id)
        if current_history:
            if "medicalHistory" in current_history:
                patient["medicalHistory"] = current_history["medicalHistory"]
            if "familyHistory" in current_history:
                patient["familyHistory"] = current_history["familyHistory"]
            if "previousSurgeries" in current_history:
                patient["previousSurgeries"] = current_history["previousSurgeries"]
    except Exception as e:
        logger.warning(f"Failed to enrich patient with medical history: {e}", exc_info=True)
    
    return success_response(
        message="Patient retrieved successfully",
        data={"patient": patient}
    )


@router.get("/patient-id/{patient_id}")
async def get_patient_by_patient_id(
    patient_id: str,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get patient details by patient ID (e.g., P001).
    
    Requires authentication.
    """
    patient_service = PatientService(db)
    patient = await patient_service.get_patient_by_patient_id(patient_id)
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )

    # Enrich patient response with current medical history fields from the
    # patient_medical_history collection.
    try:
        from app.services.patient_medical_history_service import PatientMedicalHistoryService

        history_service = PatientMedicalHistoryService(db)
        # patient_id here is the human-readable ID (e.g. P001), so we need
        # the actual Mongo ObjectId for fetching history.
        patient_obj_id = patient.get("_id")
        if patient_obj_id:
            current_history = await history_service.get_current_medical_history(patient_obj_id)
            if current_history:
                if "medicalHistory" in current_history:
                    patient["medicalHistory"] = current_history["medicalHistory"]
                if "familyHistory" in current_history:
                    patient["familyHistory"] = current_history["familyHistory"]
                if "previousSurgeries" in current_history:
                    patient["previousSurgeries"] = current_history["previousSurgeries"]
    except Exception as e:
        logger.warning(f"Failed to enrich patient (by patientId) with medical history: {e}", exc_info=True)
    
    return success_response(
        message="Patient retrieved successfully",
        data={"patient": patient}
    )


@router.put("/{patient_id}")
async def update_patient(
    patient_id: str,
    body: Dict[str, Any] = Body(...),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update patient information.
    
    Requires authentication. Only provided fields will be updated.
    
    Medical history field (medicalHistory) is automatically routed to the
    patient_medical_history collection instead of being stored on the patient.
    
    HIPAA Compliance: Updates are logged in audit trail.
    """
    try:
        # Log incoming request for debugging
        logger.info(f"Update patient request for {patient_id}: received fields: {list(body.keys())}")
        
        # Extract medical history fields before Pydantic validation
        medical_history_fields = {}
        for field in ["medicalHistory", "familyHistory", "previousSurgeries"]:
            if field in body:
                medical_history_fields[field] = body.pop(field)
                logger.info(
                    f"Extracted {field} from patient update request: "
                    f"{str(medical_history_fields[field])[:50] if medical_history_fields[field] else 'empty'}..."
                )
        
        # Now validate the remaining fields with Pydantic
        try:
            update_data = PatientUpdateRequest(**body)
        except Exception as e:
            logger.error(f"Pydantic validation error: {e}, body keys: {list(body.keys())}")
            raise
        
        # Handle medical history fields first
        if medical_history_fields:
            logger.info(f"Processing medical history fields: {list(medical_history_fields.keys())}")
            try:
                from app.services.patient_medical_history_service import PatientMedicalHistoryService
                from app.models.patient_medical_history import PatientMedicalHistoryCreate, PatientMedicalHistoryUpdate
                
                medical_history_service = PatientMedicalHistoryService(db)
                current_history = await medical_history_service.get_current_medical_history(patient_id)
                
                if current_history:
                    # Update existing record (creates new version)
                    logger.info(f"Updating existing medical history record: {current_history['_id']}")
                    update_history_data = PatientMedicalHistoryUpdate(**medical_history_fields)
                    result = await medical_history_service.update_medical_history(
                        current_history["_id"],
                        update_history_data
                    )
                    logger.info(f"Medical history updated successfully: {result.get('_id')}")
                else:
                    # Create new record
                    logger.info(f"Creating new medical history record for patient: {patient_id}")
                    create_history_data = PatientMedicalHistoryCreate(
                        patientId=patient_id,
                        **medical_history_fields
                    )
                    result = await medical_history_service.create_medical_history(create_history_data)
                    logger.info(f"Medical history created successfully: {result.get('_id')}")
            except Exception as e:
                logger.error(f"Failed to update medical history during patient update: {e}", exc_info=True)
                # Don't fail the request, but log the error

        # If there are no remaining fields after stripping medical history,
        # we don't need to update the main patient document. Just return
        # the latest patient state.
        if not body:
            patient_service = PatientService(db)
            patient = await patient_service.get_patient(patient_id)
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Patient not found",
                )
        else:
            # Update patient with remaining fields
            patient_service = PatientService(db)
            patient = await patient_service.update_patient(
                patient_id,
                update_data,
                updated_by=current_user,
            )
        
        return success_response(
            message="Patient updated successfully",
            data={"patient": patient}
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Patient update failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Patient update failed: {str(e)}"
        )


@router.delete("/{patient_id}")
async def delete_patient(
    patient_id: str,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Soft delete patient (mark as inactive).
    
    HIPAA Compliance: Records are retained but marked inactive.
    Only admins and authorized users can delete patients.
    """
    try:
        patient_service = PatientService(db)
        await patient_service.delete_patient(patient_id)
        
        return success_response(
            message="Patient deleted successfully",
            data={"patientId": patient_id}
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Patient deletion failed: {str(e)}"
        )


@router.post("/backfill-mediease-emails")
async def backfill_mediease_emails(
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Backfill MediEase clinic emails for all patients that don't have one.
    
    Requires authentication. Only admins should run this.
    
    This endpoint will:
    1. Find all patients without medieaseClinicEmail
    2. Generate unique emails for each based on name and DOB
    3. Update the patients in the database
    
    Returns count of patients updated.
    """
    try:
        patient_service = PatientService(db)
        
        # Find all patients without medieaseClinicEmail
        patients_without_email = await db["patients"].find({
            "$or": [
                {"medieaseClinicEmail": {"$exists": False}},
                {"medieaseClinicEmail": None},
                {"medieaseClinicEmail": ""}
            ]
        }).to_list(length=None)
        
        if not patients_without_email:
            return success_response(
                message="All patients already have MediEase clinic emails",
                data={"updated": 0, "total": 0}
            )
        
        updated_count = 0
        failed_count = 0
        
        for patient in patients_without_email:
            try:
                patient_id = patient.get("_id")
                first_name = patient.get("firstName", "")
                last_name = patient.get("lastName", "")
                date_of_birth = patient.get("dateOfBirth", "")
                
                if first_name and date_of_birth:
                    clinic_email = await patient_service.generate_mediease_clinic_email(
                        first_name=first_name,
                        last_name=last_name,
                        date_of_birth=date_of_birth,
                    )
                    
                    await db["patients"].update_one(
                        {"_id": patient_id},
                        {"$set": {"medieaseClinicEmail": clinic_email, "updatedAt": datetime.utcnow()}}
                    )
                    updated_count += 1
                    logger.info(f"Generated MediEase email for patient {patient_id}: {clinic_email}")
                else:
                    failed_count += 1
                    logger.warning(f"Skipping patient {patient_id}: missing firstName or dateOfBirth")
            except Exception as e:
                failed_count += 1
                logger.error(f"Failed to generate email for patient {patient.get('_id')}: {e}")
        
        return success_response(
            message=f"Backfill completed: {updated_count} patients updated, {failed_count} failed",
            data={
                "updated": updated_count,
                "failed": failed_count,
                "total": len(patients_without_email)
            }
        )
    
    except Exception as e:
        logger.error(f"Backfill failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Backfill failed: {str(e)}"
        )


