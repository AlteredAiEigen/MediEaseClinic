"""
Remove direct identifiers from text before sending to external LLM APIs.
Does not replace clinical judgment; intended to reduce unnecessary PII in prompts.
"""

from __future__ import annotations

import re
from typing import Any, Dict, Optional


_EMAIL_RE = re.compile(
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
)
# Indian mobile + generic international-style numbers
_PHONE_RE = re.compile(
    r"(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}[\s.-]?\d{0,6}\b"
)
# ABHA / health id style long numeric ids (14 digits per ABHA spec)
_ABHA_LIKE_RE = re.compile(r"\b\d{14}\b")
# Labeled policy / member lines
_POLICY_LABELED_RE = re.compile(
    r"\b(?:policy|member|subscriber|insurance|card)\s*(?:number|#|id|no\.?)\s*[:#]?\s*[A-Za-z0-9/-]{6,}\b",
    re.IGNORECASE,
)


def strip_text_pii(text: Optional[str]) -> str:
    """Redact common identifiers from free-form clinical text."""
    if not text or not isinstance(text, str):
        return ""
    s = text
    s = _EMAIL_RE.sub("[redacted-email]", s)
    s = _PHONE_RE.sub("[redacted-phone]", s)
    s = _ABHA_LIKE_RE.sub("[redacted-id]", s)
    s = _POLICY_LABELED_RE.sub("[redacted-policy]", s)
    # Collapse repeated redaction noise
    s = re.sub(r"(\[redacted-[^\]]+\]\s*){2,}", "[redacted] ", s)
    return s.strip()


def patient_dict_for_llm(patient: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build a de-identified copy of patient demographics/clinical fields for LLM prompts.
    Omits name, email, phone, address, ABHA, insurance numbers; keeps age band and clinical data.
    """
    if not patient:
        return {}

    def _age_band(dob: Optional[str], age: Optional[str]) -> Optional[str]:
        if age:
            try:
                a = int(str(age).strip())
                if 0 <= a <= 120:
                    decade = (a // 10) * 10
                    return f"{decade}-{decade + 9}y"
            except ValueError:
                pass
        return age

    out: Dict[str, Any] = {
        "ageBand": _age_band(patient.get("dateOfBirth"), patient.get("age")),
        "gender": patient.get("gender"),
        "bloodGroup": patient.get("bloodGroup"),
        "allergies": patient.get("allergies"),
        "chiefComplaint": strip_text_pii(patient.get("chiefComplaint")),
        "currentSymptoms": strip_text_pii(patient.get("currentSymptoms")),
        "condition": strip_text_pii(patient.get("condition")),
        "carePlanSummary": strip_text_pii(patient.get("carePlanSummary")),
        "followUpPlan": strip_text_pii(patient.get("followUpPlan")),
        "lastVisit": patient.get("lastVisit"),
        "currentMedications": patient.get("currentMedications"),
        "medicalHistory": patient.get("medicalHistory"),
        "historySummary": strip_text_pii(patient.get("historySummary")),
    }
    # Drop empty values to shorten prompts
    return {k: v for k, v in out.items() if v not in (None, "", [], {})}
