"""
S3 Reports API endpoints for patient lab reports stored in AWS S3.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import logging

from app.config import settings
from app.database import get_db
from app.middleware.auth import require_any_role
from app.models.s3_report import s3_report_helper
from app.services.lab_report_compare_service import (
    build_comparison,
    build_longitudinal_comparison,
    derive_compare_profile,
    find_prior_report_by_id,
    list_compare_candidates,
    pick_best_prior_report,
    report_meta,
)
from app.services.lab_report_parse_service import schedule_lab_parse_background
from app.services.s3_service import s3_service
from app.utils.response import success_response

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/patient/{patient_id}/upload", status_code=status.HTTP_201_CREATED)
async def upload_patient_s3_report(
    patient_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    force: bool = Query(False, description="Re-parse if already successful"),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Upload a lab report PDF (or image converted client-side to PDF) for a patient.

    Writes ONLY to the `s3_reports` collection (never `s3_prescriptions`).
    Prescription PDFs are created separately via generate-prescription-pdf / WhatsApp send.
    """
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient ID format",
        )

    patient_oid = ObjectId(patient_id)
    patient = await db["patients"].find_one({"_id": patient_oid})
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    content = await file.read()
    max_bytes = getattr(settings, "max_upload_size_mb", 100) * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {getattr(settings, 'max_upload_size_mb', 100)}MB limit",
        )

    filename = file.filename or "lab-report.pdf"
    if not filename.lower().endswith(".pdf"):
        filename = f"{filename}.pdf"

    reports_bucket = settings.s3_transcripts_bucket or settings.s3_bucket_name
    if not reports_bucket:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="S3 bucket configuration missing",
        )

    clinic_id = patient.get("createdByClinicId") or "general"
    friendly_pid = patient.get("patientId") or str(patient_oid)
    date_prefix = datetime.utcnow().strftime("%Y/%m/%d")
    folder = f"clinic/{clinic_id}/patient/{friendly_pid}/reports/manual/{date_prefix}"

    upload_result = await s3_service.upload_file(
        file_content=content,
        file_name=filename,
        content_type="application/pdf",
        folder=folder,
        bucket_override=reports_bucket,
    )

    now = datetime.utcnow()
    doc = {
        "patientId": friendly_pid,
        "patientMongoId": patient_oid,
        "patientEmail": patient.get("email") or "",
        "documentName": filename,
        "s3Key": upload_result["s3_key"],
        "s3Url": upload_result["file_url"],
        "emailSentToPatient": False,
        "mailgunRecipient": None,
        "mailgunSender": None,
        "mailgunSubject": None,
        "mailgunMessageId": None,
        "metadata": {
            "bucket": upload_result["bucket"],
            "receivedAt": now,
            "uploadedByUserId": str(current_user.get("_id")),
        },
        "clinicId": patient.get("createdByClinicId"),
        "createdAt": now,
        "updatedAt": now,
        "parseStatus": "pending",
    }

    # Lab reports belong only in s3_reports — never mirror into s3_prescriptions.
    ins = await db["s3_reports"].insert_one(doc)
    rid = str(ins.inserted_id)
    logger.info(
        "Lab report uploaded to s3_reports only (id=%s, patient=%s, key=%s)",
        rid,
        friendly_pid,
        upload_result["s3_key"],
    )
    schedule_lab_parse_background(background_tasks, rid, content, force=force)

    saved = await db["s3_reports"].find_one({"_id": ins.inserted_id})
    formatted = await s3_report_helper(saved)

    if formatted.get("s3Key"):
        try:
            formatted["presignedUrl"] = await s3_service.generate_presigned_url(
                formatted["s3Key"],
                bucket_override=upload_result.get("bucket"),
            )
        except Exception as e:
            logger.error("Presigned URL after upload failed: %s", e)
            formatted["presignedUrl"] = None

    return success_response(
        message="Report uploaded; parsing scheduled",
        data={"report": formatted},
    )


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
                        meta = report.get("metadata") or {}
                        bucket_ov = meta.get("bucket")
                        presigned_url = await s3_service.generate_presigned_url(
                            formatted_report["s3Key"],
                            bucket_override=bucket_ov,
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
    inline: bool = Query(False, description="Inline display for PDF iframe (Content-Disposition: inline)"),
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
        
        meta = report.get("metadata") or {}
        bucket_ov = meta.get("bucket")
        doc_name = report.get("documentName") or "lab-report.pdf"
        disposition = None
        content_type = None
        if inline:
            safe_name = doc_name.replace('"', "").strip() or "lab-report.pdf"
            disposition = f'inline; filename="{safe_name}"'
            if safe_name.lower().endswith(".pdf"):
                content_type = "application/pdf"

        presigned_url = await s3_service.generate_presigned_url(
            s3_key,
            bucket_override=bucket_ov,
            response_content_disposition=disposition,
            response_content_type=content_type,
        )

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


@router.get("/patient/{patient_id}/compare")
async def compare_s3_report_with_prior(
    patient_id: str,
    reportId: str = Query(..., alias="reportId"),
    priorReportId: Optional[str] = Query(None, alias="priorReportId"),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Compare parsed tests with a selected prior report.

    Auto-selection when priorReportId is omitted:
    - Sample date must be before current report's sample date
    - Prefer same reportType / panel + highest test overlap
    """
    if not ObjectId.is_valid(patient_id) or not ObjectId.is_valid(reportId):
        raise HTTPException(status_code=400, detail="Invalid patient or report ID")

    patient_oid = ObjectId(patient_id)
    report_oid = ObjectId(reportId)

    current = await db["s3_reports"].find_one(
        {"_id": report_oid, "patientMongoId": patient_oid},
    )
    if not current:
        raise HTTPException(status_code=404, detail="Report not found")

    current_tests = (current.get("parsedLabReport") or {}).get("tests") or []
    if not current_tests:
        return success_response(
            message="No parsed tests on current report",
            data={
                "comparisons": [],
                "previousReportDate": None,
                "compareCandidates": [],
                "currentReportMeta": report_meta(current),
                "compareProfile": derive_compare_profile(current).get("profileLabel"),
            },
        )

    prior_cursor = (
        db["s3_reports"]
        .find(
            {
                "patientMongoId": patient_oid,
                "parseStatus": "success",
                "_id": {"$ne": report_oid},
            }
        )
        .sort("createdAt", -1)
        .limit(50)
    )
    prior_reports = await prior_cursor.to_list(length=50)
    candidates = list_compare_candidates(current, prior_reports)

    candidate_ids = {candidate["reportId"] for candidate in candidates}
    relevant_prior_reports = [
        report for report in prior_reports
        if str(report.get("_id")) in candidate_ids
    ]

    prior_report = None
    if priorReportId:
        if not ObjectId.is_valid(priorReportId):
            raise HTTPException(status_code=400, detail="Invalid prior report ID")
        prior_report = find_prior_report_by_id(prior_reports, priorReportId)
        if not prior_report:
            raise HTTPException(status_code=404, detail="Prior report not found")
        if priorReportId not in candidate_ids:
            raise HTTPException(
                status_code=400,
                detail="Selected prior report is not eligible (no overlap, wrong panel, or not before current sample date)",
            )
    else:
        prior_report = pick_best_prior_report(current, relevant_prior_reports)

    if not relevant_prior_reports:
        return success_response(
            message="No prior parsed report found",
            data={
                "comparisons": [],
                "previousReportDate": None,
                "compareCandidates": candidates,
                "currentReportMeta": report_meta(current),
                "compareProfile": derive_compare_profile(current).get("profileLabel"),
                "longitudinal": {
                    "reports": [{**report_meta(current), "isCurrent": True}],
                    "reportCount": 1,
                    "priorReportCount": 0,
                    "trends": [],
                    "groupedTrends": [],
                    "priorityTrends": [],
                },
            },
        )

    # Longitudinal data is the default doctor-facing view. Keep a single
    # comparison payload for compatibility and optional detail drill-down.
    result = build_comparison(current, prior_report)
    result["longitudinal"] = build_longitudinal_comparison(
        current, relevant_prior_reports
    )
    result["compareCandidates"] = candidates
    result["selectedPriorReportId"] = str(prior_report.get("_id"))
    result["compareProfile"] = derive_compare_profile(current).get("profileLabel")

    return success_response(
        message="Comparison ready",
        data=result,
    )

