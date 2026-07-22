"""
General AI assistant endpoints.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.middleware.auth import require_any_role
from app.services.ai_audit_service import log_ai_event
from app.services.ai_service import ai_service
from app.services.patient_ai_chat_service import patient_ai_chat_service
from app.services.patient_rag_service import patient_rag_service
from app.utils.pii_sanitizer import redact_patient_identifiers
from app.utils.response import success_response

logger = logging.getLogger(__name__)

router = APIRouter()


class AIChatRequest(BaseModel):
    """Request payload for assistant chat."""

    model_config = ConfigDict(populate_by_name=True)

    prompt: Optional[str] = Field(None, max_length=4000)
    query: Optional[str] = Field(None, max_length=4000)
    context: Optional[str] = Field(
        default=None,
        max_length=8000,
        description="Optional extra context (session notes — avoid PHI if possible)",
    )
    patient_id: Optional[str] = Field(
        None,
        alias="patientId",
        description="Patient MongoDB ObjectId",
    )
    appointment_id: Optional[str] = Field(None, alias="appointmentId")
    conversation_id: Optional[str] = Field(None, alias="conversationId")

    @model_validator(mode="after")
    def require_prompt_or_query(self) -> "AIChatRequest":
        text = (self.prompt or self.query or "").strip()
        if len(text) < 2:
            raise ValueError("Provide 'prompt' or 'query' (min 2 characters)")
        return self


def _user_text(req: AIChatRequest) -> str:
    return (req.prompt or req.query or "").strip()


@router.post("/chat")
async def chat_with_assistant(
    request: AIChatRequest,
    user=Depends(require_any_role),
):
    """Chat with AI: optional patient-grounded RAG when patient_id is sent."""
    uid = str(user.get("_id", ""))
    role = user.get("role")
    text = _user_text(request)

    # --- Patient-scoped RAG consultation chat ---
    if request.patient_id:
        from bson import ObjectId

        if not ObjectId.is_valid(request.patient_id):
            raise HTTPException(status_code=400, detail="Invalid patient_id")

        conv_id = request.conversation_id
        if not conv_id:
            conv_id = await patient_ai_chat_service.create_conversation(
                patient_id=request.patient_id,
                appointment_id=request.appointment_id,
                doctor_id=uid,
            )

        prior = []
        if request.conversation_id:
            conv = await patient_ai_chat_service.get_conversation(request.conversation_id)
            if conv:
                prior = patient_ai_chat_service.messages_for_llm(conv.get("messages") or [])

        # Ensure chunks exist (first visit / new deploy) so profile + meds are searchable
        try:
            from app.database import Database

            db = Database.get_database()
            patient_doc = await db.patients.find_one({"_id": ObjectId(request.patient_id)})
            nchunks = await db.patient_rag_chunks.count_documents({"patientId": request.patient_id})
            if nchunks == 0:
                await patient_rag_service.sync_patient_chunks(request.patient_id)
        except Exception as exc:
            logger.warning("RAG auto-sync skipped: %s", exc)
            patient_doc = None

        source_hits = await patient_rag_service.search_with_sources(
            request.patient_id, text, top_k=12
        )
        chunk_texts = [h["text"] for h in source_hits if h.get("text")]

        extra = ""
        if request.context:
            sanitized_context = redact_patient_identifiers(request.context, patient_doc)
            extra = f"\n\nSession context (doctor-entered, de-identified):\n{sanitized_context}"

        sanitized_query = redact_patient_identifiers(text, patient_doc)

        if not chunk_texts:
            answer = (
                "No matching records in the de-identified chart index for this query. "
                "Try rephrasing, or verify the data was uploaded or indexed after check-in."
            )
        else:
            try:
                answer = await ai_service.chat_consultation_rag(
                    user_message=sanitized_query + extra,
                    retrieved_chunks=chunk_texts,
                    prior_messages=prior,
                )
            except HTTPException:
                raise

        sources = [
            {
                "sourceType": hit.get("sourceType"),
                "sourceLabel": hit.get("sourceLabel"),
                "excerpt": hit.get("excerpt"),
            }
            for hit in source_hits[:6]
            if hit.get("excerpt")
        ]

        await patient_ai_chat_service.append_pair(conv_id, text, answer)

        await log_ai_event(
            category="chat_rag",
            user_id=uid,
            user_role=role,
            patient_id=request.patient_id,
            appointment_id=request.appointment_id,
            conversation_id=conv_id,
            prompt_excerpt=text[:4000],
            response_excerpt=answer[:8000],
            metadata={"chunkCount": len(chunk_texts), "sourceCount": len(sources)},
        )

        return success_response(
            message="OK",
            data={
                "response": answer,
                "conversationId": conv_id,
                "sources": sources,
            },
        )

    # --- Legacy generic chat ---
    try:
        response = await ai_service.chat(text, request.context)
        await log_ai_event(
            category="chat_generic",
            user_id=uid,
            user_role=role,
            patient_id=None,
            appointment_id=None,
            conversation_id=None,
            prompt_excerpt=text[:4000],
            response_excerpt=response[:8000],
            metadata={},
        )
        return success_response(message="OK", data={"response": response})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


class RefreshInsightsBody(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    patient_id: str = Field(..., min_length=8, alias="patientId")


@router.post("/insights/refresh")
async def refresh_patient_insights(
    body: RefreshInsightsBody,
    user=Depends(require_any_role),
):
    """Regenerate cumulative patient insights (doctor retry)."""
    from app.services.patient_insights_service import patient_insights_service

    insights = await patient_insights_service.refresh_patient_insights(
        body.patient_id,
        trigger="manual_refresh",
    )
    return success_response(message="Insights refreshed", data={"insights": insights})
