"""
Patient insights: cumulative longitudinal AI analysis stored on the patient record.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict

from bson import ObjectId
from fastapi import HTTPException, status

from app.database import Database
from app.services.ai_service import ai_service
from app.services.clinical_context_builder import iter_cumulative_patient_segments
from app.services.patient_rag_service import patient_rag_service
from app.utils.pii_sanitizer import strip_text_pii

logger = logging.getLogger(__name__)

# Max chars sent to summarizer / insights model (truncate safely)
_MAX_NARRATIVE = 24000


class PatientInsightsService:
    """Generate cumulative patient insights for consultation."""

    async def _build_cumulative_narrative(self, patient: Dict[str, Any]) -> str:
        db = Database.get_database()
        segments = await iter_cumulative_patient_segments(db, patient)
        parts = [f"[{st} {sid}]\n{txt}" for st, sid, txt in segments]
        combined = "\n\n".join(parts)
        if len(combined) > _MAX_NARRATIVE:
            combined = combined[:_MAX_NARRATIVE] + "\n...[truncated]"
        return strip_text_pii(combined)

    async def refresh_patient_insights(
        self,
        patient_id: str,
        *,
        trigger: str = "manual",
        triggered_by_appointment_id: str | None = None,
    ) -> Dict[str, Any]:
        """
        Regenerate cumulative insights and refresh RAG chunks for the patient.
        """
        if not ObjectId.is_valid(patient_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid patient ID",
            )

        db = Database.get_database()
        patients_collection = db.patients

        patient = await patients_collection.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found",
            )

        await patients_collection.update_one(
            {"_id": ObjectId(patient_id)},
            {
                "$set": {
                    "insightsMeta": {
                        "status": "pending",
                        "trigger": trigger,
                        "triggeredAt": datetime.utcnow().isoformat(),
                        "triggeredByAppointmentId": triggered_by_appointment_id,
                    }
                }
            },
        )

        cumulative_narrative = await self._build_cumulative_narrative(patient)
        patient_for_model = dict(patient)
        patient_for_model["cumulativeClinicalNarrative"] = cumulative_narrative

        # Optional: compress very long narrative for the main insights call
        history_summary = cumulative_narrative
        if len(cumulative_narrative) > 12000:
            try:
                history_summary = await ai_service.summarize_medical_history(
                    cumulative_narrative[:12000]
                )
            except Exception as exc:
                logger.warning("History summarization failed: %s", exc)
                history_summary = cumulative_narrative[:12000]

        patient_for_model["historySummary"] = strip_text_pii(history_summary)

        try:
            insights = await ai_service.generate_patient_insights(patient_for_model)
        except HTTPException:
            raise
        except Exception as exc:
            logger.error("Insights generation failed: %s", exc, exc_info=True)
            await patients_collection.update_one(
                {"_id": ObjectId(patient_id)},
                {
                    "$set": {
                        "insightsMeta": {
                            "status": "failed",
                            "error": str(exc)[:500],
                            "failedAt": datetime.utcnow().isoformat(),
                            "trigger": trigger,
                        }
                    }
                },
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate patient insights: {str(exc)}",
            )

        update_doc: Dict[str, Any] = {
            "insights": insights,
            "insightsMeta": {
                "status": "ready",
                "lastGeneratedAt": datetime.utcnow().isoformat(),
                "trigger": trigger,
                "triggeredByAppointmentId": triggered_by_appointment_id,
            },
            "updatedAt": datetime.utcnow(),
        }

        await patients_collection.update_one(
            {"_id": ObjectId(patient_id)},
            {"$set": update_doc},
        )

        # RAG sync (best effort)
        try:
            n = await patient_rag_service.sync_patient_chunks(patient_id)
            await patients_collection.update_one(
                {"_id": ObjectId(patient_id)},
                {"$set": {"insightsMeta.ragChunkCount": n}},
            )
        except Exception as exc:
            logger.warning("RAG sync failed (non-fatal): %s", exc)

        logger.info("Updated cumulative patient insights for %s", patient_id)
        return insights

    async def generate_patient_insights_on_checkin(self, patient_id: str) -> Dict[str, Any]:
        """Backward-compatible name: refresh insights (e.g. after check-in)."""
        return await self.refresh_patient_insights(patient_id, trigger="check_in")


patient_insights_service = PatientInsightsService()
