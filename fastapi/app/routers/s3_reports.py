"""
S3 Reports API endpoints for patient lab reports stored in AWS S3.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import logging

from app.database import get_db
from app.middleware.auth import require_any_role
from app.models.s3_report import s3_report_helper
from app.services.s3_service import s3_service
from app.utils.response import success_response

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/patient/{patient_id}")
async def get_patient_s3_reports(
    patient_id: str,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get all S3 reports for a patient with pre-signed URLs.
    
    The patient_id should be the MongoDB ObjectId that matches the patientMongoId
    in the s3_reports collection.
    
    Returns:
        List of reports with pre-signed URLs for accessing the files in S3.
    """
    try:
        # Validate ObjectId format
        if not ObjectId.is_valid(patient_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid patient ID format"
            )
        
        patient_object_id = ObjectId(patient_id)
        
        # Query s3_reports collection where patientMongoId matches
        cursor = db["s3_reports"].find({"patientMongoId": patient_object_id})
        reports = await cursor.to_list(length=None)
        
        if not reports:
            return success_response(
                message="No reports found for this patient",
                data={"reports": []}
            )
        
        # Process each report and generate pre-signed URL
        formatted_reports = []
        for report in reports:
            try:
                # Format the report using the helper
                formatted_report = await s3_report_helper(report)
                
                # Generate pre-signed URL using the s3Key
                if formatted_report.get("s3Key"):
                    try:
                        presigned_url = await s3_service.generate_presigned_url(
                            formatted_report["s3Key"]
                        )
                        formatted_report["presignedUrl"] = presigned_url
                    except Exception as e:
                        logger.error(
                            f"Failed to generate presigned URL for s3Key {formatted_report.get('s3Key')}: {e}",
                            exc_info=True
                        )
                        formatted_report["presignedUrl"] = None
                        formatted_report["presignedUrlError"] = str(e)
                else:
                    formatted_report["presignedUrl"] = None
                
                formatted_reports.append(formatted_report)
                
            except Exception as e:
                logger.error(
                    f"Error processing report {report.get('_id')}: {e}",
                    exc_info=True
                )
                # Continue processing other reports even if one fails
                continue
        
        return success_response(
            message="Reports retrieved successfully",
            data={"reports": formatted_reports, "count": len(formatted_reports)}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error fetching S3 reports for patient {patient_id}: {e}",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve reports: {str(e)}"
        )


@router.get("/{report_id}/presigned-url")
async def get_report_presigned_url(
    report_id: str,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get a pre-signed URL for a specific S3 report by report ID.
    
    Args:
        report_id: MongoDB ObjectId of the s3_report document
        
    Returns:
        Pre-signed URL for accessing the file in S3
    """
    try:
        # Validate ObjectId format
        if not ObjectId.is_valid(report_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid report ID format"
            )
        
        report_object_id = ObjectId(report_id)
        
        # Find the report
        report = await db["s3_reports"].find_one({"_id": report_object_id})
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
        
        # Get s3Key from the report
        s3_key = report.get("s3Key")
        if not s3_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Report does not have an S3 key"
            )
        
        # Generate pre-signed URL
        presigned_url = await s3_service.generate_presigned_url(s3_key)
        
        return success_response(
            message="Pre-signed URL generated successfully",
            data={
                "reportId": str(report_object_id),
                "presignedUrl": presigned_url,
                "s3Key": s3_key,
                "documentName": report.get("documentName")
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error generating presigned URL for report {report_id}: {e}",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate presigned URL: {str(e)}"
        )

