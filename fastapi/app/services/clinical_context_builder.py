"""
Aggregate longitudinal patient data into text segments for AI insights and RAG chunking.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Tuple

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.utils.pii_sanitizer import strip_text_pii

logger = logging.getLogger(__name__)


def _format_lab_tests_lines(tests: Any) -> List[str]:
    """Turn lab test dicts into readable lines for RAG (de-identified downstream)."""
    lines: List[str] = []
    if not isinstance(tests, list):
        return lines
    for t in tests:
        if not isinstance(t, dict):
            continue
        name = (t.get("name") or "").strip()
        result = (t.get("result") or "").strip()
        if not name and not result:
            continue
        unit = (t.get("unit") or "").strip()
        ref = (t.get("normalRange") or "").strip()
        st = (t.get("status") or "").strip()
        flag = (t.get("flag") or "").strip()
        seg = f"- {name}: {result}"
        if unit:
            seg += f" {unit}"
        if ref:
            seg += f" (ref {ref})"
        if st or flag:
            seg += f" [{st}{(' ' + flag) if flag else ''}]"
        lines.append(seg)
    return lines


async def iter_cumulative_patient_segments(
    db: AsyncIOMotorDatabase,
    patient: Dict[str, Any],
) -> List[Tuple[str, str, str]]:
    """
    Returns list of (source_type, source_id, text) de-identified segments.
    """
    pid = str(patient["_id"])
    segments: List[Tuple[str, str, str]] = []

    def add(st: str, sid: str, body: str) -> None:
        body = strip_text_pii(body)
        if body and len(body.strip()) > 2:
            segments.append((st, sid, body.strip()))

    # Patient profile snapshot (allergies, meds, complaints) — must be in RAG for chat parity with Quick Info
    try:
        snap_parts: List[str] = []
        ag = patient.get("allergies")
        if ag is not None and ag != "":
            if isinstance(ag, list):
                snap_parts.append("Allergies: " + ", ".join(str(x) for x in ag))
            else:
                snap_parts.append(f"Allergies: {ag}")
        meds = patient.get("currentMedications") or patient.get("medications")
        if meds is not None and meds != "":
            if isinstance(meds, list):
                snap_parts.append("Current medications: " + ", ".join(str(x) for x in meds))
            else:
                snap_parts.append(f"Current medications: {meds}")
        for fld in ("chiefComplaint", "condition", "currentSymptoms", "carePlanSummary", "followUpPlan"):
            v = patient.get(fld)
            if v:
                snap_parts.append(f"{fld}: {v}")
        mh = patient.get("medicalHistory")
        if mh:
            if isinstance(mh, list) and mh:
                snap_parts.append("Medical history (summary): " + "; ".join(str(x) for x in mh[:20]))
            elif isinstance(mh, str) and mh.strip():
                snap_parts.append(f"Medical history: {mh[:2000]}")
        ins = patient.get("insights")
        if isinstance(ins, dict):
            kf = ins.get("keyFindings") or []
            rec = ins.get("recommendations") or []
            if kf:
                snap_parts.append(
                    "Stored AI insights key findings: " + "; ".join(str(x) for x in kf[:12])
                )
            if rec:
                snap_parts.append(
                    "Stored AI recommendations: " + "; ".join(str(x) for x in rec[:12])
                )
        if snap_parts:
            add("patient_profile", f"profile-{pid}", "\n".join(snap_parts))
    except Exception as exc:
        logger.warning("clinical_context patient_profile: %s", exc)

    # Appointments (all for this patient)
    try:
        cur = (
            db.appointments.find({"patientId": pid})
            .sort([("date", -1), ("time", -1)])
            .limit(200)
        )
        appts = await cur.to_list(length=200)
        for a in appts:
            aid = str(a.get("_id", ""))
            bits = [
                f"Appointment date {a.get('date', '')} time {a.get('time', '')} status {a.get('status', '')}",
                f"Reason: {a.get('reason', '')}",
            ]
            for fld in (
                "diagnosis",
                "treatmentPlan",
                "detailedNotes",
                "followUpInstructions",
                "prescribedTest",
            ):
                v = a.get(fld)
                if v:
                    bits.append(f"{fld}: {v}")
            ar = a.get("aiRecommendations")
            if ar:
                bits.append(f"Prior AI recommendations summary: {ar}")
            add("appointment", aid, "\n".join(str(x) for x in bits if x))
    except Exception as exc:
        logger.warning("clinical_context appointments: %s", exc)

    # Medical history documents
    try:
        col = db.get("patient_medical_history")
        if col is not None:
            hist = (
                await col.find({"patientId": pid})
                .sort("createdAt", -1)
                .limit(50)
                .to_list(length=50)
            )
            for h in hist:
                hid = str(h.get("_id", ""))
                parts = []
                for key in (
                    "medicalHistory",
                    "familyHistory",
                    "previousSurgeries",
                    "socialHistory",
                    "notes",
                ):
                    v = h.get(key)
                    if v:
                        parts.append(f"{key}: {v}")
                add("medical_history", hid, "\n".join(parts))
    except Exception as exc:
        logger.warning("clinical_context medical_history: %s", exc)

    # Lab reports
    try:
        if db.get("lab_reports") is not None:
            labs = (
                await db.lab_reports.find({"patientId": pid})
                .sort("reportedDate", -1)
                .limit(80)
                .to_list(length=80)
            )
            for r in labs:
                rid = str(r.get("_id", ""))
                title = r.get("title") or r.get("reportType") or "Lab"
                summary = r.get("summary") or r.get("interpretation") or ""
                crit = "[CRITICAL] " if r.get("isCritical") else ""
                parts: List[str] = [
                    f"{crit}{title} ({r.get('reportedDate', '')})",
                ]
                if r.get("labName"):
                    parts.append(f"Lab: {r.get('labName')}")
                parts.extend(_format_lab_tests_lines(r.get("tests")))
                if summary:
                    parts.append(f"Interpretation: {summary}")
                add("lab", rid, "\n".join(parts))
    except Exception as exc:
        logger.warning("clinical_context labs: %s", exc)

    # Clinical notes — field may be patient or patientId
    try:
        q = {"$or": [{"patient": pid}, {"patientId": pid}]}
        notes = await db.clinical_notes.find(q).sort("createdAt", -1).limit(100).to_list(100)
        for n in notes:
            nid = str(n.get("_id", ""))
            title = n.get("title") or ""
            content = n.get("content") or ""
            cat = n.get("category") or n.get("type") or ""
            add("clinical_note", nid, f"[{cat}] {title}\n{content}")
    except Exception as exc:
        logger.warning("clinical_context clinical_notes: %s", exc)

    # Vitals
    try:
        vit = (
            await db.patient_vitals.find({"patientId": pid})
            .sort("recordedAt", -1)
            .limit(40)
            .to_list(length=40)
        )
        for v in vit:
            vid = str(v.get("_id", ""))
            add(
                "vital",
                vid,
                f"Recorded {v.get('recordedAt', '')}: {v.get('readings') or v.get('vitals') or v}",
            )
    except Exception as exc:
        logger.warning("clinical_context vitals: %s", exc)

    # Recordings / transcripts
    try:
        recs = (
            await db.recordings.find({"patientId": pid})
            .sort("recordedAt", -1)
            .limit(30)
            .to_list(length=30)
        )
        for r in recs:
            rid = str(r.get("_id", ""))
            tr = r.get("transcription") or ""
            ai_notes = r.get("aiNotes") or ""
            if tr or ai_notes:
                add("recording", rid, f"Transcription:\n{tr}\nNotes:\n{ai_notes}")
    except Exception as exc:
        logger.warning("clinical_context recordings: %s", exc)

    # Prescriptions collection
    try:
        prs = (
            await db.prescriptions.find({"patientId": pid})
            .sort("createdAt", -1)
            .limit(50)
            .to_list(length=50)
        )
        for p in prs:
            prid = str(p.get("_id", ""))
            add("prescription", prid, str(p.get("details") or p.get("medications") or p))
    except Exception as exc:
        logger.warning("clinical_context prescriptions: %s", exc)

    # Queue entries (recent visits context)
    try:
        pq: Dict[str, Any] = {"patient": pid}
        if ObjectId.is_valid(pid):
            pq = {"$or": [{"patient": pid}, {"patient": ObjectId(pid)}]}
        qu = (
            await db.queue.find(pq)
            .sort("checked_in_at", -1)
            .limit(20)
            .to_list(length=20)
        )
        for qe in qu:
            qid = str(qe.get("_id", ""))
            add("queue", qid, str({k: qe.get(k) for k in ("status", "notes", "priority") if qe.get(k)}))
    except Exception as exc:
        logger.warning("clinical_context queue: %s", exc)

    # Insurance — plan type only, numbers stripped by strip_text_pii
    try:
        ins = await db.patient_insurances.find({"patientId": pid}).limit(20).to_list(20)
        for doc in ins:
            iid = str(doc.get("_id", ""))
            safe = {k: doc.get(k) for k in ("providerName", "planName", "coverageType", "status") if doc.get(k)}
            add("insurance_meta", iid, str(safe))
    except Exception as exc:
        logger.warning("clinical_context insurance: %s", exc)

    # S3 lab PDFs (AI-parsed + status)
    try:
        s3q: Dict[str, Any] = {}
        if ObjectId.is_valid(pid):
            s3q = {"patientMongoId": ObjectId(pid)}
        if s3q:
            reps = await db.s3_reports.find(s3q).sort("createdAt", -1).limit(30).to_list(30)
            for rep in reps:
                rid = str(rep.get("_id", ""))
                doc_name = rep.get("documentName") or "report.pdf"
                ps = rep.get("parseStatus")
                parsed = rep.get("parsedLabReport")
                if ps == "success" and isinstance(parsed, dict) and parsed:
                    rt = parsed.get("reportType") or "Laboratory report"
                    lines = [f"S3 lab report ({doc_name}): {rt}"]
                    if parsed.get("labName"):
                        lines.append(f"Facility: {parsed.get('labName')}")
                    dcomb = parsed.get("reportedDate") or parsed.get("collectedDate")
                    if dcomb:
                        lines.append(f"Report/collection date: {dcomb}")
                    lines.extend(_format_lab_tests_lines(parsed.get("tests")))
                    if parsed.get("interpretation"):
                        lines.append(f"Interpretation: {parsed.get('interpretation')}")
                    if parsed.get("notes"):
                        lines.append(f"Notes: {parsed.get('notes')}")
                    if parsed.get("summaryText"):
                        lines.append(str(parsed.get("summaryText")))
                    add("report", rid, "\n".join(lines))
                elif ps in ("pending", "processing"):
                    add(
                        "report",
                        rid,
                        f"Lab PDF on file ({doc_name}): AI parsing in progress.",
                    )
                elif ps == "failed":
                    add(
                        "report",
                        rid,
                        f"Lab PDF on file ({doc_name}): structured parse failed; PDF still available.",
                    )
                else:
                    add(
                        "report",
                        rid,
                        f"Lab PDF on file ({doc_name}); structured parse not available yet.",
                    )
    except Exception as exc:
        logger.warning("clinical_context s3_reports: %s", exc)

    return segments


def chunk_text(text: str, max_chars: int = 1100, overlap: int = 80) -> List[str]:
    """Split long text into overlapping chunks for embedding."""
    text = text.strip()
    if not text:
        return []
    if len(text) <= max_chars:
        return [text]
    chunks: List[str] = []
    start = 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        piece = text[start:end]
        chunks.append(piece.strip())
        if end >= len(text):
            break
        start = end - overlap
        if start < 0:
            start = 0
    return [c for c in chunks if c]
