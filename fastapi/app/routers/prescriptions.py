"""
Prescription management router.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.database import get_db
from app.models.prescription import PrescriptionCreate, PrescriptionUpdate
from app.services.prescription_service import PrescriptionService
from app.middleware.auth import require_any_role, require_doctor_or_admin
from app.utils.response import success_response, paginated_response

router = APIRouter()


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
    """Soft delete prescription."""
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

