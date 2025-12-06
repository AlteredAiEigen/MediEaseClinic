"""
Patient insights service.

Generates and updates AI-driven patient insights that power the
\"AI Recommendations\" section on the consultation page.
"""

import logging
from datetime import datetime
from typing import Dict, Any

from bson import ObjectId
from fastapi import HTTPException, status

from app.database import Database
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)


class PatientInsightsService:
    """Service for generating patient insights."""

    @staticmethod
    async def generate_patient_insights_on_checkin(patient_id: str) -> Dict[str, Any]:
        """
        Generate or refresh patient insights when the patient is checked in.

        This is designed to be called from the appointment check‑in flow so that
        the consultation page has up-to-date AI recommendations.
        """
        db = Database.get_database()
        patients_collection = db["patients"]
        history_collection = db.get("patient_medical_history")
        lab_reports_collection = db.get("lab_reports")
        clinical_notes_collection = db.get("clinical_notes")

        if not ObjectId.is_valid(patient_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid patient ID",
            )

        patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found",
            )

        # ------------------------------------------------------------------
        # Build longitudinal clinical context for better AI recommendations
        # ------------------------------------------------------------------
        longitudinal_sections: list[str] = []

        # 1) Structured medical history from patient_medical_history
        try:
            if history_collection is not None:
                history_cursor = (
                    history_collection.find(
                        {"patientId": str(patient["_id"])}
                    )
                    .sort("createdAt", -1)
                    .limit(3)
                )
                history_docs = await history_cursor.to_list(length=3)
                if history_docs:
                    parts: list[str] = []
                    for h in history_docs:
                        mh = h.get("medicalHistory")
                        fh = h.get("familyHistory")
                        ps = h.get("previousSurgeries")
                        if mh:
                            parts.append(f"Medical history: {mh}")
                        if fh:
                            parts.append(f"Family history: {fh}")
                        if ps:
                            parts.append(f"Previous surgeries: {ps}")
                    if parts:
                        longitudinal_sections.append("\n".join(parts))
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Failed to load patient medical history: %s", exc)

        # 2) Recent lab reports
        try:
            if lab_reports_collection is not None:
                lab_cursor = (
                    lab_reports_collection.find(
                        {"patientId": str(patient["_id"])}
                    )
                    .sort("reportedDate", -1)
                    .limit(3)
                )
                lab_docs = await lab_cursor.to_list(length=3)
                if lab_docs:
                    parts = []
                    for r in lab_docs:
                        title = r.get("title") or r.get("reportType") or ""
                        summary = r.get("summary") or r.get("interpretation") or ""
                        critical = r.get("isCritical")
                        label = "[CRITICAL]" if critical else ""
                        parts.append(
                            f"Lab report {label} {title}: {summary}".strip()
                        )
                    if parts:
                        longitudinal_sections.append("\n".join(parts))
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Failed to load lab reports for insights: %s", exc)

        # 3) Recent clinical notes
        try:
            if clinical_notes_collection is not None:
                notes_cursor = (
                    clinical_notes_collection.find(
                        {"patient": str(patient["_id"])}
                    )
                    .sort("created_at", -1)
                    .limit(5)
                )
                notes_docs = await notes_cursor.to_list(length=5)
                if notes_docs:
                    parts = []
                    for n in notes_docs:
                        title = n.get("title") or ""
                        content = n.get("content") or ""
                        category = n.get("category") or ""
                        parts.append(
                            f"Clinical note [{category}] {title}: {content}".strip()
                        )
                    if parts:
                        longitudinal_sections.append("\n".join(parts))
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Failed to load clinical notes for insights: %s", exc)

        longitudinal_context = "\n\n".join(
            s for s in longitudinal_sections if s.strip()
        )

        # Optionally summarize long history text using AI helper
        history_summary = longitudinal_context
        if longitudinal_context:
            try:
                history_summary = await ai_service.summarize_medical_history(
                    longitudinal_context
                )
            except Exception as exc:  # pragma: no cover
                logger.warning(
                    "Failed to summarize medical history for insights: %s", exc
                )

        # Attach longitudinal summary to patient data for the insights model
        if history_summary:
            patient["historySummary"] = history_summary

        try:
            insights = await ai_service.generate_patient_insights(patient)
        except HTTPException:
            # Bubble up FastAPI HTTP errors as-is
            raise
        except Exception as exc:  # pragma: no cover - defensive
            logger.error("Failed to generate patient insights: %s", exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate patient insights: {str(exc)}",
            )

        # Persist insights on the patient record
        update_doc: Dict[str, Any] = {
            "insights": insights,
            "updatedAt": datetime.utcnow(),
        }

        await patients_collection.update_one(
            {"_id": ObjectId(patient_id)},
            {"$set": update_doc},
        )

        logger.info("Updated patient insights for patient %s", patient_id)
        return insights


# Global service instance
patient_insights_service = PatientInsightsService()


