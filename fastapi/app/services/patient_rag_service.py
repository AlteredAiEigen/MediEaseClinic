"""
Patient-scoped RAG: embeddings stored in MongoDB, similarity search in-process.
"""

from __future__ import annotations

import logging
import math
from datetime import datetime
from typing import Any, Dict, List, Optional, Sequence, Tuple

from bson import ObjectId
from fastapi import HTTPException, status

from app.config import settings
from app.database import Database
from app.services.ai_service import ai_service
from app.services.clinical_context_builder import chunk_text, iter_cumulative_patient_segments

logger = logging.getLogger(__name__)

# Cap chunks loaded per search to limit RAM on small instances (~4GB).
MAX_RAG_CHUNKS_PER_SEARCH = 150


def _keyword_score(text: str, query: str) -> float:
    """Simple token overlap score in [0,1]."""
    if not text or not query:
        return 0.0
    toks = [t.lower() for t in query.replace("?", " ").split() if len(t) > 2][:12]
    if not toks:
        return 0.0
    low = text.lower()
    hits = sum(1 for t in toks if t in low)
    return min(1.0, hits / max(3, len(toks)))


def _cosine(a: Sequence[float], b: Sequence[float]) -> float:
    if len(a) != len(b) or not a:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


class PatientRAGService:
    COLLECTION = "patient_rag_chunks"

    async def sync_patient_chunks(self, patient_id: str) -> int:
        """Rebuild embedding chunks for a patient from longitudinal data."""
        if not ObjectId.is_valid(patient_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid patient ID")

        db = Database.get_database()
        patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

        segments = await iter_cumulative_patient_segments(db, patient)
        docs: List[Dict[str, Any]] = []
        chunk_index = 0
        for source_type, source_id, text in segments:
            for piece in chunk_text(text):
                docs.append(
                    {
                        "patientId": patient_id,
                        "sourceType": source_type,
                        "sourceId": source_id,
                        "chunkIndex": chunk_index,
                        "text": piece,
                        "createdAt": datetime.utcnow(),
                    }
                )
                chunk_index += 1

        coll = db[self.COLLECTION]
        await coll.delete_many({"patientId": patient_id})

        if not docs:
            return 0

        if not settings.openai_api_key:
            logger.warning("OPENAI_API_KEY missing; skipping embedding sync")
            for d in docs:
                d["embedding"] = []
            await coll.insert_many(docs)
            return len(docs)

        texts = [d["text"] for d in docs]
        embeddings = await ai_service.embed_texts(texts)
        if len(embeddings) != len(docs):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Embedding batch size mismatch",
            )
        for d, emb in zip(docs, embeddings):
            d["embedding"] = emb

        await coll.insert_many(docs)
        return len(docs)

    async def search(
        self,
        patient_id: str,
        query: str,
        top_k: int = 12,
    ) -> List[Tuple[str, float]]:
        """Return list of (chunk_text, score) for the patient."""
        if not query.strip():
            return []

        db = Database.get_database()
        coll = db[self.COLLECTION]

        cur = coll.find(
            {"patientId": patient_id},
            {"text": 1, "embedding": 1},
        ).limit(MAX_RAG_CHUNKS_PER_SEARCH)
        rows = await cur.to_list(length=MAX_RAG_CHUNKS_PER_SEARCH)
        if not rows:
            return []

        if not settings.openai_api_key:
            scored_kw: List[Tuple[str, float]] = []
            for r in rows:
                t = r.get("text") or ""
                sc = _keyword_score(t, query) * 10.0
                if sc > 0:
                    scored_kw.append((t, sc))
            scored_kw.sort(key=lambda x: -x[1])
            return scored_kw[:top_k]

        q_emb = (await ai_service.embed_texts([query]))[0]
        scored: List[Tuple[str, float]] = []
        for r in rows:
            text = r.get("text") or ""
            emb = r.get("embedding") or []
            vec = _cosine(q_emb, emb) if emb else 0.0
            kw = _keyword_score(text, query)
            # Hybrid: semantic + keyword (medications names often need keyword overlap)
            combined = 0.62 * vec + 0.38 * kw
            scored.append((text, combined))
        scored.sort(key=lambda x: -x[1])
        return scored[:top_k]


patient_rag_service = PatientRAGService()
