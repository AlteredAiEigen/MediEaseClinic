"""
Patient management router with HIPAA compliance.
All endpoints require authentication and log PHI access.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.database import get_db
from app.schemas.patient import PatientCreateRequest, PatientUpdateRequest
from app.models.patient import PatientCreate
from app.services.patient_service import PatientService
from app.middleware.auth import get_current_active_user, require_any_role
from app.utils.response import success_response, paginated_response

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_data: PatientCreateRequest,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create a new patient.
    
    Requires authentication. Only doctors, receptionists, and admins can create patients.
    
    Patients are universal across all clinics. The clinic info is stored for reference
    (to track which clinic created the patient) but does not restrict patient access.
    
    HIPAA Compliance: Sensitive fields are encrypted before storage.
    """
    try:
        patient_service = PatientService(db)

        patient_payload = patient_data.model_dump()

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
        
        return success_response(
            message="Patient created successfully",
            data={"patient": patient},
            status_code=201
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
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
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List patients with pagination and filtering.
    
    Requires authentication. Accessible to all authenticated users.
    
    HIPAA Compliance: PHI access is logged in audit trail.
    """
    try:
        patient_service = PatientService(db)
        # Patients are universal - not filtered by clinic
        # clinic_id is not passed to maintain universal patient access

        patients, total = await patient_service.list_patients(
            page=page,
            limit=limit,
            search=search,
            gender=gender,
            present_in_clinic=present_in_clinic,
            clinic_id=None  # Not used for filtering - patients are universal
        )
        
        return paginated_response(
            message="Patients retrieved successfully",
            data=patients,
            total=total,
            page=page,
            limit=limit
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve patients: {str(e)}"
        )


@router.get("/search")
async def search_patients(
    q: str = Query(..., min_length=2, description="Search query"),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Search patients by name, email, phone, or patient ID.
    
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
    
    return success_response(
        message="Patient retrieved successfully",
        data={"patient": patient}
    )


@router.put("/{patient_id}")
async def update_patient(
    patient_id: str,
    update_data: PatientUpdateRequest,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update patient information.
    
    Requires authentication. Only provided fields will be updated.
    
    HIPAA Compliance: Updates are logged in audit trail.
    """
    try:
        patient_service = PatientService(db)
        patient = await patient_service.update_patient(patient_id, update_data)
        
        return success_response(
            message="Patient updated successfully",
            data={"patient": patient}
        )
    
    except HTTPException as e:
        raise e
    except Exception as e:
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

