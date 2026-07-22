"""
Smart lab report comparison for repeat panels — grouped by clinical panel,
ranked by clinical significance, with direction-aware trend interpretation.

Report selection strategy (see list_compare_candidates):
1. Only parsed reports with an effective sample date BEFORE the current report
2. Prefer same reportType / same dominant panel (apples-to-apples)
3. Rank by test-name overlap; tie-break by most recent prior sample
4. Expose all eligible candidates so the doctor can pick another date
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

# Generic parsed reportType values — must NOT count as "same panel"
GENERIC_REPORT_TYPES = frozenset({
    "laboratoryreport", "labreport", "lab", "report", "general", "other", "",
})

# Minimum shared tests / overlap to consider two reports comparable
MIN_SHARED_TESTS = 3
MIN_OVERLAP_RATIO = 0.35

# Panel keywords matched against normalized test names
PANEL_RULES: List[Tuple[str, List[str]]] = [
    ("Glucose & Diabetes", ["fbs", "fasting", "ppbs", "postprandial", "hba1c", "glycated", "eag", "estimated", "insulin", "cpeptide", "glucose"]),
    ("Lipid Profile", ["cholesterol", "ldl", "hdl", "triglyceride", "vldl", "lipid"]),
    ("Complete Blood Count", ["wbc", "rbc", "hemoglobin", "haemoglobin", "hematocrit", "haematocrit", "platelet", "mcv", "mch", "mchc", "rdw", "neutrophil", "lymphocyte", "monocyte", "eosinophil", "basophil", "cbc"]),
    ("Thyroid", ["tsh", "t3", "t4", "thyroid", "antitpo", "antithyroid", "thyroglobulin"]),
    ("Liver Function", ["alt", "ast", "sgpt", "sgot", "bilirubin", "albumin", "alp", "alkaline", "ggt", "globulin"]),
    ("Kidney Function", ["creatinine", "urea", "bun", "egfr", "uric", "microalbumin"]),
    ("Vitamins & Minerals", ["vitamin", "vitd", "25oh", "calcium", "iron", "ferritin", "b12", "folate", "magnesium", "phosphorus", "zinc"]),
    ("Inflammatory Markers", ["esr", "crp", "hscrp"]),
    ("Electrolytes", ["sodium", "potassium", "chloride", "bicarbonate"]),
]

# Canonical keys for fuzzy alias matching (normalized key -> canonical)
TEST_CANONICAL: Dict[str, str] = {
    "fastingbloodglucosefbs": "glucose_fasting",
    "fastingbloodglucose": "glucose_fasting",
    "fbs": "glucose_fasting",
    "fastingglucose": "glucose_fasting",
    "postprandialbloodglucoseppbs": "glucose_pp",
    "postprandialbloodglucose": "glucose_pp",
    "ppbs": "glucose_pp",
    "ppbloodglucose": "glucose_pp",
    "hba1cglycatedhaemoglobin": "hba1c",
    "hba1c": "hba1c",
    "glycatedhaemoglobin": "hba1c",
    "estimatedavgglucoseeag": "eag",
    "estimatedaverageglucose": "eag",
    "eag": "eag",
    "totalcholesterol": "total_cholesterol",
    "ldlcholesterol": "ldl",
    "hdlcholesterol": "hdl",
    "triglycerides": "triglycerides",
    "serumcreatinine": "creatinine",
    "haemoglobin": "hemoglobin",
    "25ohvitamindtotal": "vitamin_d",
    "vitamind": "vitamin_d",
}

# Tests where lower numeric values are clinically desirable
LOWER_IS_BETTER = {
    "glucose_fasting", "glucose_pp", "hba1c", "eag", "ldl", "triglycerides",
    "total_cholesterol", "creatinine", "urea", "bun", "esr", "crp", "hscrp",
    "alt", "ast", "sgpt", "sgot", "bilirubin", "tsh", "wbc",
}

# Tests where higher numeric values are clinically desirable
HIGHER_IS_BETTER = {
    "hdl", "hemoglobin", "haemoglobin", "hematocrit", "haematocrit",
    "platelet", "egfr", "vitamin_d", "albumin",
}


def normalize_test_name(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (name or "").lower())


def canonical_test_key(name: str) -> str:
    norm = normalize_test_name(name)
    if norm in TEST_CANONICAL:
        return TEST_CANONICAL[norm]
    for alias, canonical in TEST_CANONICAL.items():
        if alias in norm or norm in alias:
            return canonical
    return norm


def parse_numeric_result(value: Any) -> Optional[float]:
    if value is None:
        return None
    match = re.search(r"[-+]?\d*\.?\d+", str(value).replace(",", ""))
    if not match:
        return None
    try:
        return float(match.group())
    except ValueError:
        return None


def _parse_range_bounds(normal_range: str) -> Tuple[Optional[float], Optional[float]]:
    """Extract low/high from common reference range strings."""
    if not normal_range:
        return None, None
    text = normal_range.replace("–", "-").replace("—", "-").replace("−", "-")
    # Range like 70 - 100
    range_match = re.search(r"(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)", text)
    if range_match:
        return float(range_match.group(1)), float(range_match.group(2))
    # Upper bound like < 140
    upper = re.search(r"[<≤]\s*(\d+\.?\d*)", text)
    if upper:
        return None, float(upper.group(1))
    # Lower bound like > 40
    lower = re.search(r"[>≥]\s*(\d+\.?\d*)", text)
    if lower:
        return float(lower.group(1)), None
    return None, None


def _abnormality_from_test(test: dict) -> str:
    """Return abnormal | borderline | normal | unknown."""
    flag = (test.get("flag") or "").upper()
    status = (test.get("status") or "").lower()
    if flag in ("H", "HIGH", "HH", "L", "LOW", "LL") or status in ("high", "low", "abnormal"):
        return "abnormal"
    if status in ("borderline", "near normal", "near-normal"):
        return "borderline"
    if flag or status in ("normal", ""):
        # Infer from numeric range if no explicit flag
        val = parse_numeric_result(test.get("result"))
        lo, hi = _parse_range_bounds(test.get("normalRange") or "")
        if val is not None:
            if hi is not None and val > hi:
                return "abnormal"
            if lo is not None and val < lo:
                return "abnormal"
            if lo is not None or hi is not None:
                return "normal"
    return "unknown"


def classify_panel(name: str) -> str:
    norm = normalize_test_name(name)
    for panel, keywords in PANEL_RULES:
        if any(kw in norm for kw in keywords):
            return panel
    return "Other Tests"


def _clinical_direction(canonical: str, name: str) -> str:
    if canonical in LOWER_IS_BETTER:
        return "lower_better"
    if canonical in HIGHER_IS_BETTER:
        return "higher_better"
    norm = normalize_test_name(name)
    for kw in ["glucose", "hba1c", "ldl", "triglyceride", "creatinine", "esr", "crp"]:
        if kw in norm:
            return "lower_better"
    for kw in ["hdl", "hemoglobin", "haemoglobin", "egfr", "vitamin", "vitd"]:
        if kw in norm:
            return "higher_better"
    return "neutral"


def _compute_clinical_verdict(
    *,
    prior_num: Optional[float],
    current_num: Optional[float],
    prior_abnormal: str,
    current_abnormal: str,
    direction: str,
    percent_change: Optional[float],
) -> Tuple[str, int, str]:
    """
    Returns (verdict, priority_score, verdictLabel).
    Higher priority_score = show first.
    """
    # Status transition without numeric data
    if prior_abnormal == "abnormal" and current_abnormal == "normal":
        return "resolved", 90, "Now normal"
    if prior_abnormal in ("normal", "borderline", "unknown") and current_abnormal == "abnormal":
        return "new_abnormal", 95, "Newly abnormal"
    if prior_abnormal == "abnormal" and current_abnormal == "abnormal":
        if prior_num is not None and current_num is not None and direction != "neutral":
            if direction == "lower_better":
                if current_num < prior_num:
                    return "improving", 80, "Improving (still abnormal)"
                if current_num > prior_num:
                    return "worsening", 100, "Worsening"
            elif direction == "higher_better":
                if current_num > prior_num:
                    return "improving", 80, "Improving (still abnormal)"
                if current_num < prior_num:
                    return "worsening", 100, "Worsening"
        return "unchanged_abnormal", 70, "Still abnormal"

    if prior_num is None or current_num is None:
        if prior_abnormal == current_abnormal:
            return "stable", 10, "Unchanged"
        return "changed", 50, "Status changed"

    delta = current_num - prior_num
    pct = percent_change if percent_change is not None else 0.0
    abs_pct = abs(pct)

    if abs_pct <= 5:
        return "stable", 15, "Stable"

    if direction == "lower_better":
        if delta < 0:
            label = "Improving" if current_abnormal != "abnormal" else "Improving (still abnormal)"
            return "improving", 75 if current_abnormal == "abnormal" else 55, label
        if delta > 0:
            label = "Worsening" if current_abnormal == "abnormal" else "Trending up"
            return "worsening", 85 if current_abnormal == "abnormal" else 60, label

    if direction == "higher_better":
        if delta > 0:
            label = "Improving" if current_abnormal != "abnormal" else "Improving (still abnormal)"
            return "improving", 75 if current_abnormal == "abnormal" else 55, label
        if delta < 0:
            label = "Worsening" if current_abnormal == "abnormal" else "Trending down"
            return "worsening", 85 if current_abnormal == "abnormal" else 60, label

    # Neutral direction — magnitude-based
    if abs_pct >= 15:
        return "changed", 45, "Significant change"
    return "stable", 20, "Stable"


def _index_tests(tests: List[dict]) -> Dict[str, dict]:
    indexed: Dict[str, dict] = {}
    for test in tests:
        name = (test.get("name") or "").strip()
        key = canonical_test_key(name)
        if key and key not in indexed:
            indexed[key] = test
    return indexed


def _count_matches(current_tests: List[dict], prior_tests: List[dict]) -> int:
    prior_keys = set(_index_tests(prior_tests).keys())
    current_keys = set(_index_tests(current_tests).keys())
    return len(current_keys & prior_keys)


def _report_parsed(report: dict) -> dict:
    return report.get("parsedLabReport") or {}


def _report_tests(report: dict) -> List[dict]:
    return _report_parsed(report).get("tests") or []


def parse_sample_date(value: Any) -> Optional[datetime]:
    """Parse collected/reported date strings from lab PDFs."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    text = str(value).strip()
    if not text:
        return None
    formats = [
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M",
        "%d-%b-%Y, %H:%M hrs",
        "%d-%b-%Y %H:%M",
        "%d-%b-%Y",
        "%d %b %Y",
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
    ]
    cleaned = re.sub(r"\s+", " ", text.split(",")[0] if "," in text else text)
    for fmt in formats:
        try:
            return datetime.strptime(cleaned.strip(), fmt)
        except ValueError:
            continue
    # Embedded date like "14-Jan-2026, 08:12 hrs"
    m = re.search(r"(\d{1,2}[-/]\w{3}[-/]\d{4})", text)
    if m:
        for fmt in ("%d-%b-%Y", "%d/%b/%Y"):
            try:
                return datetime.strptime(m.group(1).replace("/", "-"), fmt)
            except ValueError:
                pass
    return None


def effective_sample_date(report: dict) -> Optional[datetime]:
    """
    When were these readings taken?
    Priority: collectedDate > reportedDate > metadata.receivedAt > createdAt
    """
    parsed = _report_parsed(report)
    for field in ("collectedDate", "reportedDate"):
        dt = parse_sample_date(parsed.get(field))
        if dt:
            return dt
    meta = report.get("metadata") or {}
    dt = parse_sample_date(meta.get("receivedAt"))
    if dt:
        return dt
    created = report.get("createdAt")
    if isinstance(created, datetime):
        return created
    return None


def format_sample_date(report: dict) -> str:
    dt = effective_sample_date(report)
    if dt:
        return dt.strftime("%d %b %Y")
    return ""


def derive_dominant_panels(tests: List[dict]) -> List[str]:
    """Panels represented by >= 2 tests, or the single most common panel."""
    counts: Dict[str, int] = {}
    for test in tests:
        panel = classify_panel((test.get("name") or ""))
        counts[panel] = counts.get(panel, 0) + 1
    if not counts:
        return []
    dominant = [p for p, c in counts.items() if c >= 2 and p != "Other Tests"]
    if dominant:
        return sorted(dominant, key=lambda p: -counts[p])
    best = max(counts, key=counts.get)
    return [best] if best != "Other Tests" else []


def normalize_report_type(report_type: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", (report_type or "").lower())


def is_generic_report_type(report_type: str) -> bool:
    return normalize_report_type(report_type) in GENERIC_REPORT_TYPES


def infer_panel_from_report_type(report_type: str) -> Optional[str]:
    """Map parsed reportType text to a clinical panel when explicit."""
    t = normalize_report_type(report_type)
    if not t or t in GENERIC_REPORT_TYPES:
        return None
    rules = [
        ("Glucose & Diabetes", ["diabetic", "diabetes", "glucose", "hba1c"]),
        ("Complete Blood Count", ["cbc", "bloodcount", "haemogram", "hemogram"]),
        ("Lipid Profile", ["lipid", "cholesterol"]),
        ("Thyroid", ["thyroid", "tsh"]),
        ("Liver Function", ["liver", "lft", "hepatic"]),
        ("Kidney Function", ["renal", "kidney", "kft"]),
        ("Vitamins & Minerals", ["vitamin", "vitd"]),
    ]
    for panel, keywords in rules:
        if any(kw in t for kw in keywords):
            return panel
    return None


def infer_primary_panel_from_tests(tests: List[dict]) -> Optional[str]:
    """Detect primary clinical panel from test composition when reportType is generic."""
    keys = set(_index_tests(tests).keys())
    norms = {normalize_test_name((t.get("name") or "")) for t in tests}

    diabetic_hits = sum(
        1 for k in keys
        if k in ("glucose_fasting", "glucose_pp", "hba1c", "eag")
        or "glucose" in k or "hba1c" in k
    )
    if diabetic_hits >= 2:
        return "Glucose & Diabetes"

    cbc_hits = sum(1 for n in norms if any(x in n for x in ("wbc", "rbc", "hemoglobin", "haemoglobin", "platelet")))
    if cbc_hits >= 4:
        return "Complete Blood Count"

    thyroid_hits = sum(1 for n in norms if any(x in n for x in ("tsh", "t3", "t4", "thyroid")))
    if thyroid_hits >= 2:
        return "Thyroid"

    lipid_hits = sum(1 for n in norms if any(x in n for x in ("cholesterol", "ldl", "hdl", "triglyceride")))
    if lipid_hits >= 2:
        return "Lipid Profile"

    return None


def derive_compare_profile(report: dict) -> dict:
    """
    Clinical identity of this report for matching relevant priors only.
    Used when opening any report — compare only against same-kind reports.
    """
    parsed = _report_parsed(report)
    tests = _report_tests(report)
    report_type = parsed.get("reportType") or "Laboratory report"
    panels = derive_dominant_panels(tests)
    inferred = infer_panel_from_report_type(report_type)
    from_tests = infer_primary_panel_from_tests(tests)
    primary_panel = inferred or from_tests or (panels[0] if panels else None)

    if inferred and report_type and not is_generic_report_type(report_type):
        profile_label = f"{report_type} · {inferred}"
    elif primary_panel:
        profile_label = primary_panel
    elif not is_generic_report_type(report_type):
        profile_label = report_type
    else:
        profile_label = "General laboratory panel"

    test_keys = list(_index_tests(tests).keys())
    return {
        "reportType": report_type,
        "primaryPanel": primary_panel,
        "dominantPanels": panels,
        "profileLabel": profile_label,
        "testSignatureSize": len(test_keys),
        "isGenericType": is_generic_report_type(report_type),
    }


def report_type_similarity(current_type: str, candidate_type: str) -> float:
    a = normalize_report_type(current_type)
    b = normalize_report_type(candidate_type)
    if not a or not b:
        return 0.0
    # Both generic (e.g. "Laboratory report") — not evidence of same panel
    if a in GENERIC_REPORT_TYPES and b in GENERIC_REPORT_TYPES:
        return 0.0
    if a in GENERIC_REPORT_TYPES or b in GENERIC_REPORT_TYPES:
        return 0.0
    if a == b:
        return 1.0
    if a in b or b in a:
        return 0.85
    keywords = ["diabetic", "diabetes", "glucose", "cbc", "thyroid", "lipid", "renal", "liver", "metabolic", "panel"]
    a_kw = {k for k in keywords if k in a}
    b_kw = {k for k in keywords if k in b}
    if a_kw & b_kw:
        return 0.7
    return 0.0


def is_relevant_compare_pair(
    current: dict,
    candidate: dict,
    breakdown: dict,
) -> Tuple[bool, str]:
    """
    Strict gate: only prior reports of the same clinical kind as the opened report.
    """
    overlap = breakdown.get("overlap", 0)
    overlap_ratio = breakdown.get("overlapRatio", 0.0)
    type_sim = breakdown.get("reportTypeMatch", 0.0)
    panel_match = breakdown.get("panelMatch", False)

    if overlap == 0:
        return False, "no_shared_tests"

    has_enough_overlap = overlap >= MIN_SHARED_TESTS or overlap_ratio >= MIN_OVERLAP_RATIO
    if not has_enough_overlap:
        return False, "insufficient_overlap"

    cur_profile = derive_compare_profile(current)
    cand_profile = derive_compare_profile(candidate)
    cur_primary = cur_profile.get("primaryPanel")
    cand_panels = set(cand_profile.get("dominantPanels") or [])
    primary_panel_match = bool(cur_primary and cur_primary in cand_panels)

    same_clinical_kind = (
        type_sim >= 0.7
        or panel_match
        or primary_panel_match
        or overlap_ratio >= 0.55
    )
    if not same_clinical_kind:
        return False, "different_panel_type"

    return True, "relevant"


def report_meta(report: dict) -> dict:
    parsed = _report_parsed(report)
    tests = _report_tests(report)
    sample_dt = effective_sample_date(report)
    panels = derive_dominant_panels(tests)
    profile = derive_compare_profile(report)
    return {
        "reportId": str(report.get("_id")),
        "documentName": report.get("documentName"),
        "reportType": parsed.get("reportType") or "Laboratory report",
        "compareProfile": profile.get("profileLabel"),
        "primaryPanel": profile.get("primaryPanel"),
        "labName": parsed.get("labName"),
        "collectedDate": parsed.get("collectedDate"),
        "reportedDate": parsed.get("reportedDate"),
        "sampleDate": sample_dt.strftime("%d %b %Y") if sample_dt else None,
        "sampleDateIso": sample_dt.isoformat() if sample_dt else None,
        "dominantPanels": panels,
        "testCount": len(tests),
        "uploadedAt": (
            report.get("createdAt").strftime("%d %b %Y")
            if isinstance(report.get("createdAt"), datetime)
            else None
        ),
    }


def score_compare_candidate(current: dict, candidate: dict) -> Tuple[int, dict]:
    """
    Score how suitable a prior report is for comparison.
    Returns (score, breakdown) for transparency in UI.
    """
    current_tests = _report_tests(current)
    candidate_tests = _report_tests(candidate)
    if not current_tests or not candidate_tests:
        return 0, {}

    current_keys = set(_index_tests(current_tests).keys())
    candidate_keys = set(_index_tests(candidate_tests).keys())
    overlap = len(current_keys & candidate_keys)
    if overlap == 0:
        return 0, {"overlap": 0}

    overlap_ratio = overlap / max(len(current_keys), 1)
    overlap_pts = int(min(40, overlap_ratio * 40))

    cur_parsed = _report_parsed(current)
    cand_parsed = _report_parsed(candidate)
    type_sim = report_type_similarity(
        cur_parsed.get("reportType") or "",
        cand_parsed.get("reportType") or "",
    )
    type_pts = int(type_sim * 35)

    cur_panels = set(derive_dominant_panels(current_tests))
    cand_panels = set(derive_dominant_panels(candidate_tests))
    panel_overlap = len(cur_panels & cand_panels) if cur_panels else 0
    panel_pts = 25 if panel_overlap > 0 else (10 if not cur_panels and not cand_panels else 0)

    score = overlap_pts + type_pts + panel_pts

    breakdown = {
        "overlap": overlap,
        "overlapRatio": round(overlap_ratio, 2),
        "overlapPoints": overlap_pts,
        "reportTypeMatch": round(type_sim, 2),
        "reportTypePoints": type_pts,
        "panelMatch": panel_overlap > 0,
        "panelPoints": panel_pts,
        "totalScore": score,
    }
    return score, breakdown


def list_compare_candidates(
    current: dict,
    prior_reports: List[dict],
) -> List[dict]:
    """
    Prior reports **relevant** to the opened report only — ranked best-first.

    A prior report is shown only when ALL of:
    - Sample date strictly before the opened report's sample date
    - Same clinical kind (panel type / shared test groups / enough overlap)
    - At least 3 shared tests OR ≥35% test overlap

    Unrelated reports (e.g. CBC vs diabetic profile) are never listed.
    """
    current_sample = effective_sample_date(current)
    current_tests = _report_tests(current)
    if not current_tests:
        return []

    current_profile = derive_compare_profile(current)

    candidates: List[dict] = []
    for report in prior_reports:
        if str(report.get("_id")) == str(current.get("_id")):
            continue
        tests = _report_tests(report)
        if not tests:
            continue

        cand_sample = effective_sample_date(report)
        if current_sample and cand_sample:
            if cand_sample >= current_sample:
                continue
        elif current_sample and not cand_sample:
            created = report.get("createdAt")
            if isinstance(created, datetime) and created >= current_sample:
                continue

        score, breakdown = score_compare_candidate(current, report)
        if score <= 0:
            continue

        relevant, reject_reason = is_relevant_compare_pair(current, report, breakdown)
        if not relevant:
            continue

        meta = report_meta(report)
        days_before = None
        if current_sample and cand_sample:
            days_before = (current_sample - cand_sample).days

        reason_parts = []
        if breakdown.get("reportTypeMatch", 0) >= 0.7:
            reason_parts.append("same report type")
        elif meta.get("primaryPanel") and meta.get("primaryPanel") == current_profile.get("primaryPanel"):
            reason_parts.append("same panel")
        elif breakdown.get("panelMatch"):
            reason_parts.append("matching test groups")
        reason_parts.append(f"{breakdown.get('overlap', 0)} shared tests")

        candidates.append({
            **meta,
            "score": score,
            "scoreBreakdown": breakdown,
            "daysBeforeCurrent": days_before,
            "selectionReason": ", ".join(reason_parts),
            "isRecommended": False,
        })

    # Sort: highest score, then most recent sample date
    def sort_key(c: dict) -> Tuple[int, float]:
        sample_iso = c.get("sampleDateIso") or ""
        try:
            ts = datetime.fromisoformat(sample_iso).timestamp() if sample_iso else 0
        except ValueError:
            ts = 0
        return (-c["score"], -ts)

    candidates.sort(key=sort_key)
    if candidates:
        candidates[0]["isRecommended"] = True

    return candidates


def pick_best_prior_report(
    current: dict,
    prior_reports: List[dict],
) -> Optional[dict]:
    """Choose the top-ranked compare candidate."""
    ranked = list_compare_candidates(current, prior_reports)
    if not ranked:
        return None
    best_id = ranked[0]["reportId"]
    for report in prior_reports:
        if str(report.get("_id")) == best_id:
            return report
    return None


def find_prior_report_by_id(prior_reports: List[dict], prior_id: str) -> Optional[dict]:
    for report in prior_reports:
        if str(report.get("_id")) == prior_id:
            return report
    return None


def build_longitudinal_comparison(
    current_report: dict,
    prior_reports: List[dict],
) -> dict:
    """
    Build a single clinical timeline anchored to the opened report.

    Every prior report has already passed the relevance/date gates. Tests are
    matched by canonical name so a doctor sees one trend per attribute rather
    than having to switch among one-to-one report comparisons.
    """
    current_tests = _report_tests(current_report)
    current_sample = effective_sample_date(current_report)
    all_reports = [*prior_reports, current_report]
    all_reports.sort(
        key=lambda report: effective_sample_date(report) or datetime.min
    )

    current_map = _index_tests(current_tests)
    series_by_key: Dict[str, dict] = {}
    for key, current_test in current_map.items():
        series_by_key[key] = {
            "key": key,
            "name": (current_test.get("name") or key).strip(),
            "panel": classify_panel(current_test.get("name") or ""),
            "unit": current_test.get("unit") or "",
            "normalRange": current_test.get("normalRange") or "",
            "clinicalDirection": _clinical_direction(key, current_test.get("name") or ""),
            "points": [],
        }

    reports_meta = []
    for report in all_reports:
        sample = effective_sample_date(report)
        tests = _index_tests(_report_tests(report))
        is_current = str(report.get("_id")) == str(current_report.get("_id"))
        reports_meta.append({
            **report_meta(report),
            "isCurrent": is_current,
        })

        for key, series in series_by_key.items():
            test = tests.get(key)
            if not test:
                continue
            series["points"].append({
                "reportId": str(report.get("_id")),
                "sampleDate": sample.strftime("%d %b %Y") if sample else None,
                "sampleDateIso": sample.isoformat() if sample else None,
                "value": test.get("result"),
                "numericValue": parse_numeric_result(test.get("result")),
                "flag": test.get("flag") or test.get("status"),
                "abnormality": _abnormality_from_test(test),
                "isCurrent": is_current,
            })

    trends = []
    for series in series_by_key.values():
        points = series["points"]
        # Require at least one historical value and the opened report value.
        if len(points) < 2 or not any(point["isCurrent"] for point in points):
            continue
        historical = [point for point in points if not point["isCurrent"]]
        current_point = next(point for point in points if point["isCurrent"])
        baseline = historical[0]
        immediate_prior = historical[-1]
        current_num = current_point["numericValue"]
        baseline_num = baseline["numericValue"]
        prior_num = immediate_prior["numericValue"]

        percent_change = None
        if current_num is not None and baseline_num not in (None, 0):
            percent_change = round(((current_num - baseline_num) / abs(baseline_num)) * 100, 1)

        verdict, priority, verdict_label = _compute_clinical_verdict(
            prior_num=prior_num,
            current_num=current_num,
            prior_abnormal=immediate_prior["abnormality"],
            current_abnormal=current_point["abnormality"],
            direction=series["clinicalDirection"],
            percent_change=(
                round(((current_num - prior_num) / abs(prior_num)) * 100, 1)
                if current_num is not None and prior_num not in (None, 0)
                else None
            ),
        )
        persistent_abnormal = sum(
            1 for point in points if point["abnormality"] == "abnormal"
        )
        if persistent_abnormal >= 2 and current_point["abnormality"] == "abnormal":
            priority = max(priority, 75)
            if verdict == "stable":
                verdict = "unchanged_abnormal"
                verdict_label = "Persistently abnormal"

        trends.append({
            **series,
            "baselineValue": baseline["value"],
            "baselineDate": baseline["sampleDate"],
            "currentValue": current_point["value"],
            "currentDate": current_point["sampleDate"],
            "percentChangeFromBaseline": percent_change,
            "verdict": verdict,
            "verdictLabel": verdict_label,
            "priority": priority,
            "persistentAbnormalCount": persistent_abnormal,
        })

    trends.sort(key=lambda item: (-item["priority"], item["panel"], item["name"]))
    panels: Dict[str, List[dict]] = {}
    for trend in trends:
        panels.setdefault(trend["panel"], []).append(trend)

    earliest = effective_sample_date(prior_reports[-1]) if prior_reports else None
    if prior_reports:
        dated_priors = [
            effective_sample_date(report) for report in prior_reports
            if effective_sample_date(report)
        ]
        earliest = min(dated_priors) if dated_priors else None

    headline_parts = []
    worsening = sum(1 for item in trends if item["verdict"] == "worsening")
    new_abnormal = sum(1 for item in trends if item["verdict"] == "new_abnormal")
    improving = sum(1 for item in trends if item["verdict"] in ("improving", "resolved"))
    persistent = sum(1 for item in trends if item["persistentAbnormalCount"] >= 2 and item["currentValue"] is not None)
    if worsening:
        headline_parts.append(f"{worsening} worsening")
    if new_abnormal:
        headline_parts.append(f"{new_abnormal} newly abnormal")
    if persistent:
        headline_parts.append(f"{persistent} persistent")
    if improving:
        headline_parts.append(f"{improving} improving")
    if not headline_parts:
        headline_parts.append("No material longitudinal changes")

    return {
        "reports": reports_meta,
        "reportCount": len(reports_meta),
        "priorReportCount": len(prior_reports),
        "dateRange": {
            "from": earliest.strftime("%d %b %Y") if earliest else None,
            "to": current_sample.strftime("%d %b %Y") if current_sample else None,
        },
        "headline": " · ".join(headline_parts),
        "trends": trends,
        "groupedTrends": [{"panel": panel, "tests": rows} for panel, rows in panels.items()],
        "priorityTrends": [trend for trend in trends if trend["priority"] >= 70],
    }


def build_comparison(
    current_report: dict,
    prior_report: dict,
) -> dict:
    current_tests = (current_report.get("parsedLabReport") or {}).get("tests") or []
    prior_tests = (prior_report.get("parsedLabReport") or {}).get("tests") or []
    prior_map = _index_tests(prior_tests)

    comparisons: List[dict] = []
    for test in current_tests:
        name = (test.get("name") or "").strip()
        key = canonical_test_key(name)
        if not key or key not in prior_map:
            continue

        prior = prior_map[key]
        current_val = test.get("result")
        prior_val = prior.get("result")
        current_num = parse_numeric_result(current_val)
        prior_num = parse_numeric_result(prior_val)

        percent_change = None
        absolute_change = None
        if current_num is not None and prior_num is not None:
            absolute_change = round(current_num - prior_num, 2)
            if prior_num != 0:
                percent_change = round(((current_num - prior_num) / abs(prior_num)) * 100, 1)

        prior_abnormal = _abnormality_from_test(prior)
        current_abnormal = _abnormality_from_test(test)
        direction = _clinical_direction(key, name)
        verdict, priority, verdict_label = _compute_clinical_verdict(
            prior_num=prior_num,
            current_num=current_num,
            prior_abnormal=prior_abnormal,
            current_abnormal=current_abnormal,
            direction=direction,
            percent_change=percent_change,
        )

        trend = "stable"
        if percent_change is not None:
            if percent_change > 5:
                trend = "up"
            elif percent_change < -5:
                trend = "down"

        comparisons.append({
            "name": name,
            "panel": classify_panel(name),
            "currentValue": current_val,
            "previousValue": prior_val,
            "unit": test.get("unit") or prior.get("unit"),
            "normalRange": test.get("normalRange") or prior.get("normalRange"),
            "currentFlag": test.get("flag") or test.get("status"),
            "previousFlag": prior.get("flag") or prior.get("status"),
            "percentChange": percent_change,
            "absoluteChange": absolute_change,
            "trend": trend,
            "verdict": verdict,
            "verdictLabel": verdict_label,
            "priority": priority,
            "priorAbnormal": prior_abnormal,
            "currentAbnormal": current_abnormal,
            "clinicalDirection": direction,
        })

    comparisons.sort(key=lambda x: (-x["priority"], x["panel"], x["name"]))

    # Group by panel preserving sort order within panel
    panels: Dict[str, List[dict]] = {}
    panel_order: List[str] = []
    for row in comparisons:
        panel = row["panel"]
        if panel not in panels:
            panels[panel] = []
            panel_order.append(panel)
        panels[panel].append(row)

    grouped = [{"panel": p, "tests": panels[p]} for p in panel_order]

    summary = {
        "total": len(comparisons),
        "worsening": sum(1 for c in comparisons if c["verdict"] == "worsening"),
        "improving": sum(1 for c in comparisons if c["verdict"] in ("improving", "resolved")),
        "newAbnormal": sum(1 for c in comparisons if c["verdict"] == "new_abnormal"),
        "stable": sum(1 for c in comparisons if c["verdict"] == "stable"),
        "stillAbnormal": sum(1 for c in comparisons if c["verdict"] in ("unchanged_abnormal", "improving") and c["currentAbnormal"] == "abnormal"),
        "resolved": sum(1 for c in comparisons if c["verdict"] == "resolved"),
    }

    current_created = current_report.get("createdAt")
    prior_created = prior_report.get("createdAt")
    current_sample = effective_sample_date(current_report)
    prior_sample = effective_sample_date(prior_report)
    days_between = None
    if current_sample and prior_sample:
        days_between = (current_sample - prior_sample).days
    elif isinstance(current_created, datetime) and isinstance(prior_created, datetime):
        days_between = (current_created - prior_created).days

    current_label = (
        current_sample.strftime("%d %b %Y") if current_sample
        else current_created.strftime("%d %b %Y") if hasattr(current_created, "strftime")
        else str(current_created or "")
    )
    prior_label = (
        prior_sample.strftime("%d %b %Y") if prior_sample
        else prior_created.strftime("%d %b %Y") if hasattr(prior_created, "strftime")
        else str(prior_created or "")
    )

    # One-line clinical headline for quick scan
    headlines: List[str] = []
    if summary["worsening"]:
        headlines.append(f"{summary['worsening']} parameter{'s' if summary['worsening'] != 1 else ''} worsening")
    if summary["newAbnormal"]:
        headlines.append(f"{summary['newAbnormal']} newly abnormal")
    if summary["improving"]:
        headlines.append(f"{summary['improving']} improving")
    if summary["resolved"]:
        headlines.append(f"{summary['resolved']} returned to normal")
    if not headlines:
        headlines.append("Most parameters stable vs prior report")

    return {
        "previousReportId": str(prior_report.get("_id")),
        "previousReportDate": prior_label,
        "previousReportName": prior_report.get("documentName"),
        "previousSampleDate": prior_label,
        "previousCollectedDate": _report_parsed(prior_report).get("collectedDate"),
        "currentReportDate": current_label,
        "currentSampleDate": current_label,
        "currentCollectedDate": _report_parsed(current_report).get("collectedDate"),
        "currentReportMeta": report_meta(current_report),
        "previousReportMeta": report_meta(prior_report),
        "daysBetween": days_between,
        "summary": summary,
        "headline": " · ".join(headlines),
        "comparisons": comparisons,
        "groupedByPanel": grouped,
        "actionable": [c for c in comparisons if c["priority"] >= 70],
    }
