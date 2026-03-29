"""
Extract structured lab data from PDF bytes (OpenAI + PyMuPDF).
"""

from __future__ import annotations

import asyncio
import base64
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import fitz  # PyMuPDF
from bson import ObjectId
from fastapi import HTTPException

from app.config import settings
from app.database import Database
from app.models.s3_report import ParsedLabReportPayload
from app.services.ai_service import ai_service
from app.services.patient_insights_service import patient_insights_service
from app.services.patient_rag_service import patient_rag_service
from app.services.s3_service import s3_service

logger = logging.getLogger(__name__)


def _extract_text_and_images_from_pdf(
    pdf_bytes: bytes, max_pages: int
) -> tuple[str, List[str]]:
    """Return concatenated text and list of PNG base64 strings (one per page, capped)."""
    text_parts: List[str] = []
    images_b64: List[str] = []
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        n = min(len(doc), max_pages)
        for i in range(n):
            page = doc.load_page(i)
            t = page.get_text("text") or ""
            if t.strip():
                text_parts.append(t)
            # Render page for vision (moderate DPI)
            mat = fitz.Matrix(150 / 72, 150 / 72)
            pix = page.get_pixmap(matrix=mat, alpha=False)
            png_bytes = pix.tobytes("png")
            images_b64.append(base64.b64encode(png_bytes).decode("ascii"))
    finally:
        doc.close()
    return "\n".join(text_parts), images_b64


def _normalize_parsed(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and coerce to stored shape."""
    tests_in = raw.get("tests") if isinstance(raw.get("tests"), list) else []
    tests_out = []
    for t in tests_in:
        if not isinstance(t, dict):
            continue
        tests_out.append(
            {
                "name": str(t.get("name") or "").strip() or "Unknown",
                "result": str(t.get("result") or "").strip() or "—",
                "unit": t.get("unit"),
                "normalRange": t.get("normalRange"),
                "status": t.get("status"),
                "flag": t.get("flag"),
            }
        )
    payload = {
        "reportType": str(raw.get("reportType") or "Laboratory report").strip() or "Laboratory report",
        "labName": raw.get("labName"),
        "collectedDate": raw.get("collectedDate"),
        "reportedDate": raw.get("reportedDate"),
        "interpretation": raw.get("interpretation"),
        "notes": raw.get("notes"),
        "tests": tests_out,
        "summaryText": raw.get("summaryText"),
    }
    try:
        validated = ParsedLabReportPayload(**payload)
        return validated.model_dump()
    except Exception as exc:
        logger.warning("ParsedLabReportPayload validation soft-fail: %s", exc)
        return payload


async def parse_pdf_bytes_to_lab_report(pdf_bytes: bytes) -> Dict[str, Any]:
    """Run text-first then vision fallback."""
    max_pages = max(1, getattr(settings, "lab_parse_max_pages", 3))
    min_chars = max(0, getattr(settings, "lab_parse_min_text_chars", 120))

    text, page_images = await asyncio.to_thread(_extract_text_and_images_from_pdf, pdf_bytes, max_pages)
    text = (text or "").strip()

    if len(text) >= min_chars:
        raw = await ai_service.parse_lab_report_from_text(text)
        return _normalize_parsed(raw)

    if not page_images:
        raw = await ai_service.parse_lab_report_from_text(text or "No extractable text.")
        return _normalize_parsed(raw)

    raw = await ai_service.parse_lab_report_from_images(page_images)
    return _normalize_parsed(raw)


def _bucket_for_report(doc: dict) -> str:
    meta = doc.get("metadata") or {}
    return meta.get("bucket") or settings.s3_transcripts_bucket or settings.s3_bucket_name


async def run_s3_lab_parse_pipeline(
    report_id: str,
    pdf_bytes: Optional[bytes] = None,
    *,
    force: bool = False,
) -> None:
    """
    Load s3_report, parse PDF, update Mongo, sync RAG, refresh insights (best effort).
    """
    db = Database.get_database()
    coll = db["s3_reports"]
    if not ObjectId.is_valid(report_id):
        logger.error("Invalid s3_report id: %s", report_id)
        return

    oid = ObjectId(report_id)
    doc = await coll.find_one({"_id": oid})
    if not doc:
        logger.error("s3_report not found: %s", report_id)
        return

    if not force and doc.get("parseStatus") == "success" and doc.get("parsedLabReport"):
        logger.info("Lab parse skipped (already success): %s", report_id)
        return

    if not settings.openai_api_key:
        logger.warning("Skipping lab parse: OPENAI_API_KEY not set (report %s)", report_id)
        await coll.update_one(
            {"_id": oid},
            {
                "$set": {
                    "parseStatus": "failed",
                    "parseError": "OPENAI_API_KEY not configured",
                    "updatedAt": datetime.utcnow(),
                }
            },
        )
        return

    patient_mongo = doc.get("patientMongoId")
    patient_id_str = str(patient_mongo) if patient_mongo else None
    if not patient_id_str:
        await coll.update_one(
            {"_id": oid},
            {
                "$set": {
                    "parseStatus": "failed",
                    "parseError": "Missing patientMongoId",
                    "updatedAt": datetime.utcnow(),
                }
            },
        )
        return

    await coll.update_one(
        {"_id": oid},
        {"$set": {"parseStatus": "processing", "parseError": None, "updatedAt": datetime.utcnow()}},
    )

    data: bytes
    if pdf_bytes is not None:
        data = pdf_bytes
    else:
        key = doc.get("s3Key")
        if not key:
            await coll.update_one(
                {"_id": oid},
                {
                    "$set": {
                        "parseStatus": "failed",
                        "parseError": "Missing s3Key",
                        "updatedAt": datetime.utcnow(),
                    }
                },
            )
            return
        try:
            data = await s3_service.download_file_bytes_async(key, _bucket_for_report(doc))
        except Exception as exc:
            logger.exception("S3 download failed for lab parse %s: %s", report_id, exc)
            await coll.update_one(
                {"_id": oid},
                {
                    "$set": {
                        "parseStatus": "failed",
                        "parseError": f"S3 download failed: {str(exc)[:500]}",
                        "updatedAt": datetime.utcnow(),
                    }
                },
            )
            return

    try:
        parsed = await parse_pdf_bytes_to_lab_report(data)
    except HTTPException as exc:
        err = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        await coll.update_one(
            {"_id": oid},
            {
                "$set": {
                    "parseStatus": "failed",
                    "parseError": err[:2000],
                    "updatedAt": datetime.utcnow(),
                }
            },
        )
        return
    except Exception as exc:
        logger.exception("Lab parse failed for %s", report_id)
        await coll.update_one(
            {"_id": oid},
            {
                "$set": {
                    "parseStatus": "failed",
                    "parseError": str(exc)[:2000],
                    "updatedAt": datetime.utcnow(),
                }
            },
        )
        return

    await coll.update_one(
        {"_id": oid},
        {
            "$set": {
                "parseStatus": "success",
                "parseError": None,
                "parsedAt": datetime.utcnow(),
                "parsedLabReport": parsed,
                "updatedAt": datetime.utcnow(),
            }
        },
    )

    # RAG + insights
    try:
        await patient_rag_service.sync_patient_chunks(patient_id_str)
    except Exception as exc:
        logger.warning("RAG sync after lab parse failed: %s", exc)

    try:
        await patient_insights_service.refresh_patient_insights(
            patient_id_str, trigger="lab_report_parse"
        )
    except Exception as exc:
        logger.warning("Insights refresh after lab parse failed (non-fatal): %s", exc)


def schedule_lab_parse_background(
    background_tasks,
    report_id: str,
    pdf_bytes: Optional[bytes] = None,
    *,
    force: bool = False,
) -> None:
    """FastAPI BackgroundTasks helper."""

    async def _job() -> None:
        await run_s3_lab_parse_pipeline(report_id, pdf_bytes, force=force)

    background_tasks.add_task(_job)
