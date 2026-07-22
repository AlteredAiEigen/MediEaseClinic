"""
Professional MediEase digital prescription PDF builder (ReportLab).
"""

from __future__ import annotations

import logging
import re
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

logger = logging.getLogger(__name__)

TEAL = colors.HexColor("#0f766e")
INK = colors.HexColor("#0f172a")
MUTED = colors.HexColor("#64748b")
LINE = colors.HexColor("#e2e8f0")
SOFT = colors.HexColor("#f8fafc")
SOFT_TEAL = colors.HexColor("#f0fdfa")

_ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets"
_LOGO_PNG = _ASSETS_DIR / "mediease-logo.png"
_LOGO_SVG = _ASSETS_DIR / "mediease-logo.svg"
_FONTS_DIR = _ASSETS_DIR / "fonts"
_FONT_HI_REG = _FONTS_DIR / "NotoSansDevanagari-Regular.ttf"
_FONT_HI_BOLD = _FONTS_DIR / "NotoSansDevanagari-Bold.ttf"
_FONT_LATIN_REG = _FONTS_DIR / "NotoSans-Regular.ttf"
_FONT_LATIN_BOLD = _FONTS_DIR / "NotoSans-Bold.ttf"

# Resolved ReportLab font names (set by _ensure_fonts)
_FONT_LATIN = "Helvetica"
_FONT_LATIN_B = "Helvetica-Bold"
_FONT_INDIC = "Helvetica"
_FONT_INDIC_B = "Helvetica-Bold"
_FONTS_READY = False

_LABELS = {
    "en": {
        "title": "PRESCRIPTION / TREATMENT",
        "date": "Date",
        "patient_details": "PATIENT DETAILS",
        "diagnosis": "DIAGNOSIS",
        "medicines": "MEDICINES",
        "col_num": "#",
        "col_medicine": "Medicine",
        "col_dosage": "Dosage",
        "col_timing": "Timing",
        "col_frequency": "Frequency",
        "col_duration": "Duration",
        "col_qty": "Qty",
        "tests": "PRESCRIBED TESTS",
        "next_appointment": "NEXT APPOINTMENT",
        "booking": "BOOKING & ENQUIRIES",
        "call_whatsapp": "Call / WhatsApp",
        "digitally_signed": "DIGITALLY SIGNED",
        "reg_no": "Reg. No",
        "signed_on": "Signed on",
        "auth_note": "Electronically authenticated - wet ink signature not required.",
        "appointment_contact": "For appointment call / WhatsApp:",
        "digital_rx": "Digital Prescription",
        "phone": "Phone",
        "email": "Email",
        "date_label": "Date",
    },
    "hi": {
        "title": "पर्ची / उपचार",
        "date": "दिनांक",
        "patient_details": "रोगी विवरण",
        "diagnosis": "निदान",
        "medicines": "दवाइयाँ",
        "col_num": "#",
        "col_medicine": "दवा",
        "col_dosage": "खुराक",
        "col_timing": "समय",
        "col_frequency": "आवृत्ति",
        "col_duration": "अवधि",
        "col_qty": "मात्रा",
        "tests": "निर्धारित जाँच",
        "next_appointment": "अगली मुलाकात",
        "booking": "बुकिंग और पूछताछ",
        "call_whatsapp": "कॉल / व्हाट्सऐप",
        "digitally_signed": "डिजिटल हस्ताक्षरित",
        "reg_no": "पंजीकरण संख्या",
        "signed_on": "हस्ताक्षर तिथि",
        "auth_note": "इलेक्ट्रॉनिक रूप से प्रमाणित - स्याही हस्ताक्षर आवश्यक नहीं।",
        "appointment_contact": "अपॉइंटमेंट के लिए कॉल / व्हाट्सऐप:",
        "digital_rx": "डिजिटल पर्ची",
        "phone": "फ़ोन",
        "email": "ईमेल",
        "date_label": "दिनांक",
    },
}


def _ensure_fonts() -> None:
    """
    Register Latin (Noto Sans) + Devanagari fonts.
    Noto Sans Devanagari alone cannot draw Latin letters in ReportLab (blank names),
    so Hindi PDFs use Noto Sans as the base and Devanagari only for Hindi runs.
    """
    global _FONT_LATIN, _FONT_LATIN_B, _FONT_INDIC, _FONT_INDIC_B, _FONTS_READY
    if _FONTS_READY and _FONT_INDIC != "Helvetica":
        return
    try:
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont

        if _FONT_LATIN_REG.exists():
            pdfmetrics.registerFont(TTFont("NotoSans", str(_FONT_LATIN_REG)))
            _FONT_LATIN = "NotoSans"
        if _FONT_LATIN_BOLD.exists():
            pdfmetrics.registerFont(TTFont("NotoSans-Bold", str(_FONT_LATIN_BOLD)))
            _FONT_LATIN_B = "NotoSans-Bold"
        elif _FONT_LATIN != "Helvetica":
            _FONT_LATIN_B = _FONT_LATIN

        if _FONT_HI_REG.exists():
            pdfmetrics.registerFont(TTFont("NotoSansDevanagari", str(_FONT_HI_REG)))
            _FONT_INDIC = "NotoSansDevanagari"
        if _FONT_HI_BOLD.exists():
            pdfmetrics.registerFont(TTFont("NotoSansDevanagari-Bold", str(_FONT_HI_BOLD)))
            _FONT_INDIC_B = "NotoSansDevanagari-Bold"
        elif _FONT_INDIC != "Helvetica":
            _FONT_INDIC_B = _FONT_INDIC

        _FONTS_READY = True
        logger.info(
            "Prescription PDF fonts ready (latin=%s/%s, indic=%s/%s)",
            _FONT_LATIN,
            _FONT_LATIN_B,
            _FONT_INDIC,
            _FONT_INDIC_B,
        )
    except Exception as exc:
        logger.warning("Could not register prescription PDF fonts: %s", exc)
        _FONTS_READY = not (_FONT_HI_REG.exists() or _FONT_LATIN_REG.exists())


def _is_indic_char(ch: str) -> bool:
    o = ord(ch)
    return (0x0900 <= o <= 0x097F) or (0xA8E0 <= o <= 0xA8FF)


def _font_rich(text: str, *, bold: bool = False) -> str:
    """
    Escape text and wrap Latin vs Devanagari runs in the correct font tags
    so English medicine/patient names and Hindi timing both render.
    """
    _ensure_fonts()
    if text is None:
        return ""
    raw = str(text)
    if not raw:
        return ""

    latin = _FONT_LATIN_B if bold else _FONT_LATIN
    indic = _FONT_INDIC_B if bold else _FONT_INDIC

    # Fast path: no Devanagari
    if not any(_is_indic_char(ch) for ch in raw):
        return f'<font name="{latin}">{_esc(raw)}</font>'

    # Fast path: only Devanagari + whitespace/digits/punct that Indic font has
    if all(_is_indic_char(ch) or not ch.isalpha() or ord(ch) < 128 for ch in raw) and any(
        _is_indic_char(ch) for ch in raw
    ):
        # Still may include Latin letters — use run splitter always when mixed possible
        pass

    out: list = []
    buf: list = []
    mode: Optional[str] = None

    def flush() -> None:
        nonlocal buf, mode
        if not buf or mode is None:
            buf = []
            return
        chunk = _esc("".join(buf))
        font = indic if mode == "indic" else latin
        out.append(f'<font name="{font}">{chunk}</font>')
        buf = []

    for ch in raw:
        if ch in " \t\n":
            buf.append(ch)
            continue
        next_mode = "indic" if _is_indic_char(ch) else "latin"
        if mode is None:
            mode = next_mode
        elif next_mode != mode:
            flush()
            mode = next_mode
        buf.append(ch)
    flush()
    return "".join(out)


def _normalize_language(language: Optional[str]) -> str:
    lang = (language or "en").strip().lower()
    if lang in ("hi", "hi-in", "hindi"):
        return "hi"
    return "en"


def _labels(language: str) -> Dict[str, str]:
    return _LABELS["hi" if language == "hi" else "en"]


def _contains_devanagari(value: Any) -> bool:
    text = "" if value is None else str(value)
    return any(0x0900 <= ord(ch) <= 0x097F for ch in text)


def _medications_have_devanagari(medications: Optional[List[Dict[str, Any]]]) -> bool:
    for med in medications or []:
        for key in (
            "name",
            "dosage",
            "frequency",
            "duration",
            "instructions",
            "timing",
            "timingFreqDuration",
            "composition",
        ):
            if _contains_devanagari(med.get(key)):
                return True
    return False


def _resolve_pdf_language(
    language: Optional[str],
    *,
    medications: Optional[List[Dict[str, Any]]] = None,
    diagnosis: str = "",
) -> str:
    """
    Use explicit language when set. If medicines/diagnosis contain Devanagari
    but language was saved as en, auto-switch to hi so glyphs are not stripped.
    """
    lang = _normalize_language(language)
    if lang == "hi":
        return "hi"
    if _medications_have_devanagari(medications) or _contains_devanagari(diagnosis):
        return "hi"
    return "en"

_CONTENT_WIDTH = 174 * mm


def _esc(text: Any) -> str:
    """Escape HTML special characters for ReportLab Paragraphs."""
    if text is None:
        return ""
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def parse_prescribed_tests(notes: str) -> str:
    if not notes:
        return ""
    for line in notes.split("\n"):
        trimmed = line.strip()
        if trimmed.lower().startswith("tests:"):
            return trimmed[6:].strip()
    return ""


def parse_next_appointment(notes: str) -> str:
    if not notes:
        return ""
    prefix = "next appointment:"
    for line in notes.split("\n"):
        trimmed = line.strip()
        if trimmed.lower().startswith(prefix):
            return trimmed[len(prefix) :].strip()
    return ""


def format_address(provider: Optional[Dict[str, Any]]) -> str:
    if not provider:
        return ""
    parts = [
        provider.get("address"),
        provider.get("city"),
        provider.get("state"),
        provider.get("pincode"),
    ]
    return ", ".join(part for part in parts if part)


def format_doctor_name(doctor: Optional[Dict[str, Any]], fallback: str = "Doctor") -> str:
    if not doctor:
        return fallback
    first = (doctor.get("firstName") or "").strip()
    last = (doctor.get("lastName") or "").strip()
    full = f"{first} {last}".strip()
    if not full:
        return fallback
    if full.lower().startswith("dr."):
        return full
    return f"Dr. {full}"


def _load_mediease_logo(width_mm: float = 14.0):
    """
    Load MediEase product logo for ReportLab (footer only).
    Prefer PNG (same asset as home page); fall back to SVG via svglib.
    """
    return _load_image_from_path(_LOGO_PNG, width_mm) or _load_image_from_svg(
        _LOGO_SVG, width_mm
    )


def _load_image_from_path(path: Path, width_mm: float):
    if not path.exists():
        return None
    try:
        img = Image(str(path))
        if not img.imageWidth:
            raise ValueError("image has zero width")
        width = width_mm * mm
        scale = width / float(img.imageWidth)
        img.drawWidth = width
        img.drawHeight = float(img.imageHeight) * scale
        return img
    except Exception as exc:
        logger.warning("Could not load image %s: %s", path, exc)
        return None


def _load_image_from_svg(path: Path, width_mm: float):
    if not path.exists():
        return None
    try:
        from svglib.svglib import svg2rlg

        drawing = svg2rlg(str(path))
        if not drawing or not drawing.width:
            return None
        width = width_mm * mm
        scale = width / drawing.width
        drawing.width = width
        drawing.height = drawing.height * scale
        drawing.scale(scale, scale)
        return drawing
    except Exception as exc:
        logger.warning("Could not load SVG logo %s: %s", path, exc)
        return None


def _load_image_from_bytes(data: Optional[bytes], width_mm: float = 18.0):
    """Load clinic/hospital logo bytes into a ReportLab Image."""
    if not data:
        return None
    try:
        img = Image(BytesIO(data))
        if not img.imageWidth:
            raise ValueError("logo has zero width")
        width = width_mm * mm
        scale = width / float(img.imageWidth)
        img.drawWidth = width
        img.drawHeight = float(img.imageHeight) * scale
        return img
    except Exception as exc:
        logger.warning("Could not load clinic logo bytes: %s", exc)
        return None


def _clinic_initials(clinic_name: str) -> str:
    parts = [p for p in re.split(r"\s+", (clinic_name or "").strip()) if p]
    if not parts:
        return "CL"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def _clinic_monogram(clinic_name: str, size_mm: float = 16.0):
    """
    Fallback visual when the clinic has no uploaded logo:
    a simple initials badge (not MediEase branding).
    """
    initials = _esc(_clinic_initials(clinic_name))
    size = size_mm * mm
    style = ParagraphStyle(
        "RxMonogram",
        fontName="Helvetica-Bold",
        fontSize=11,
        textColor=colors.white,
        alignment=TA_CENTER,
        leading=13,
    )
    cell = Table(
        [[Paragraph(initials, style)]],
        colWidths=[size],
        rowHeights=[size],
    )
    cell.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), TEAL),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("BOX", (0, 0), (-1, -1), 0, TEAL),
            ]
        )
    )
    return cell


def build_prescription_filename(
    *,
    appointment_display_id: str,
    appointment_mongo_id: str,
    prescribed_at: datetime,
) -> str:
    """
    DPDP-safe filename: appointment id + timestamp only.
    No patient name or clinic name (PII leak via URLs/logs).
    Format: Prescription_{safeAptId}_{YYYYMMDD_HHMM}.pdf
    Starts with Prescription_ — S3 upload must use preserve_filename=True
    so a second timestamp is not prepended.
    """
    raw_id = (appointment_display_id or appointment_mongo_id or "appointment").strip()
    safe_id = re.sub(r"[^A-Za-z0-9._-]+", "_", raw_id).strip("._-") or "appointment"
    stamp = prescribed_at.strftime("%Y%m%d_%H%M")
    return f"Prescription_{safe_id}_{stamp}.pdf"


def _pdf_cell(value: Any, *, allow_unicode: bool = False) -> str:
    """
    Normalize a field for PDF output.
    Missing/placeholder values (incl. Unicode em dashes) become blank.
    Devanagari is always preserved (Hindi may be stored even when language=en).
    """
    if value is None:
        return ""
    text = str(value).strip()
    if not text:
        return ""

    # Characters Helvetica often cannot draw → black rectangles in PDF
    replacements = {
        "\u2014": "-",  # em dash —
        "\u2013": "-",  # en dash –
        "\u2212": "-",  # minus −
        "\u2022": "*",
        "\u00b7": "*",
        "\u2026": "...",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u00a0": " ",
        "\ufeff": "",
    }
    for src, dst in replacements.items():
        text = text.replace(src, dst)

    cleaned: list = []
    for ch in text:
        o = ord(ch)
        if ch in "\n\t":
            cleaned.append(ch)
            continue
        if o < 32:
            continue
        if 0xD800 <= o <= 0xDFFF:
            continue
        # Always keep Devanagari (Hindi medicine timing/frequency/duration)
        if 0x0900 <= o <= 0x097F or 0xA8E0 <= o <= 0xA8FF:
            cleaned.append(ch)
            continue
        if allow_unicode or o < 256:
            cleaned.append(ch)
            continue
        # drop other non-latin1 when Helvetica mode
    text = "".join(cleaned)
    text = re.sub(r"[ \t]+", " ", text).strip(" \t-_/.,;")

    placeholders = {
        "",
        "-",
        "--",
        "---",
        "n/a",
        "na",
        "none",
        "null",
        "undefined",
        "not specified",
        "not available",
    }
    # Only apply ASCII placeholder check when text is ASCII-ish
    if text.lower() in placeholders:
        return ""
    return text


def _dash(value: Any) -> str:
    text = _pdf_cell(value)
    return text if text else "-"


def _build_styles(language: str = "en") -> Dict[str, ParagraphStyle]:
    _ensure_fonts()
    # Base font is always Latin-capable. Hindi runs are injected via _font_rich().
    is_hi = language == "hi"
    body_font = _FONT_LATIN if is_hi else "Helvetica"
    body_bold = _FONT_LATIN_B if is_hi else "Helvetica-Bold"
    base = getSampleStyleSheet()
    return {
        "clinic_name": ParagraphStyle(
            "RxClinicName",
            parent=base["Normal"],
            fontName=body_bold,
            fontSize=12,
            textColor=INK,
            leading=15,
            spaceAfter=1,
        ),
        "muted": ParagraphStyle(
            "RxMuted",
            parent=base["Normal"],
            fontName=body_font,
            fontSize=8,
            textColor=MUTED,
            leading=11,
        ),
        "doctor_name": ParagraphStyle(
            "RxDoctorName",
            parent=base["Normal"],
            fontName=body_bold,
            fontSize=11,
            textColor=INK,
            leading=14,
            alignment=TA_RIGHT,
        ),
        "doctor_meta": ParagraphStyle(
            "RxDoctorMeta",
            parent=base["Normal"],
            fontName=body_font,
            fontSize=8,
            textColor=MUTED,
            leading=11,
            alignment=TA_RIGHT,
        ),
        "title": ParagraphStyle(
            "RxTitle",
            parent=base["Normal"],
            fontName=body_bold,
            fontSize=15,
            textColor=TEAL,
            leading=19,
            alignment=TA_CENTER,
        ),
        "title_date": ParagraphStyle(
            "RxTitleDate",
            parent=base["Normal"],
            fontName=body_font,
            fontSize=9,
            textColor=MUTED,
            leading=12,
            alignment=TA_CENTER,
            spaceBefore=2,
            spaceAfter=4,
        ),
        "section": ParagraphStyle(
            "RxSection",
            parent=base["Normal"],
            fontName=body_bold,
            fontSize=9,
            textColor=TEAL,
            leading=12,
            spaceBefore=2,
            spaceAfter=4,
        ),
        "label": ParagraphStyle(
            "RxLabel",
            parent=base["Normal"],
            fontName=body_font,
            fontSize=7,
            textColor=MUTED,
            leading=9,
            spaceAfter=1,
        ),
        "value": ParagraphStyle(
            "RxValue",
            parent=base["Normal"],
            fontName=body_bold,
            fontSize=9,
            textColor=INK,
            leading=12,
        ),
        "body": ParagraphStyle(
            "RxBody",
            parent=base["Normal"],
            fontName=body_font,
            fontSize=9,
            textColor=INK,
            leading=12,
        ),
        "body_small": ParagraphStyle(
            "RxBodySmall",
            parent=base["Normal"],
            fontName=body_font,
            fontSize=8,
            textColor=INK,
            leading=11,
        ),
        "diagnosis": ParagraphStyle(
            "RxDiagnosis",
            parent=base["Normal"],
            fontName=body_font,
            fontSize=10,
            textColor=INK,
            leading=14,
        ),
        "card_title": ParagraphStyle(
            "RxCardTitle",
            parent=base["Normal"],
            fontName=body_bold,
            fontSize=8,
            textColor=TEAL,
            leading=11,
            spaceAfter=3,
        ),
        "sign_stamp": ParagraphStyle(
            "RxSignStamp",
            parent=base["Normal"],
            fontName=body_bold,
            fontSize=7.5,
            textColor=TEAL,
            leading=9,
            alignment=TA_CENTER,
        ),
        "sign_label": ParagraphStyle(
            "RxSignLabel",
            parent=base["Normal"],
            fontName=body_font,
            fontSize=7.5,
            textColor=MUTED,
            leading=10,
            alignment=TA_CENTER,
        ),
        "sign_name": ParagraphStyle(
            "RxSignName",
            parent=base["Normal"],
            fontName=body_bold,
            fontSize=10,
            textColor=INK,
            leading=13,
            alignment=TA_CENTER,
        ),
        "sign_note": ParagraphStyle(
            "RxSignNote",
            parent=base["Normal"],
            fontName=body_font,
            fontSize=6.5,
            textColor=MUTED,
            leading=8,
            alignment=TA_CENTER,
        ),
        "footer": ParagraphStyle(
            "RxFooter",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            textColor=MUTED,
            leading=10,
            alignment=TA_LEFT,
        ),
        "footer_brand": ParagraphStyle(
            "RxFooterBrand",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            textColor=TEAL,
            leading=11,
            alignment=TA_LEFT,
            spaceAfter=0,
        ),
        "footer_tagline": ParagraphStyle(
            "RxFooterTagline",
            parent=base["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=8,
            textColor=INK,
            leading=10,
            alignment=TA_LEFT,
            spaceAfter=1,
        ),
        "th": ParagraphStyle(
            "RxTh",
            parent=base["Normal"],
            fontName=body_bold,
            fontSize=8,
            textColor=colors.white,
            leading=10,
        ),
        "td": ParagraphStyle(
            "RxTd",
            parent=base["Normal"],
            fontName=body_font,
            fontSize=8,
            textColor=INK,
            leading=10,
        ),
        "td_center": ParagraphStyle(
            "RxTdCenter",
            parent=base["Normal"],
            fontName=body_font,
            fontSize=8,
            textColor=INK,
            leading=10,
            alignment=TA_CENTER,
        ),
    }


def _field_cell(label: str, value: str, styles: Dict[str, ParagraphStyle]) -> Table:
    cell = Table(
        [
            [Paragraph(_esc(label).upper(), styles["label"])],
            [Paragraph(_esc(_dash(value)), styles["value"])],
        ],
        colWidths=["*"],
    )
    cell.setStyle(
        TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return cell


def _section_header(title: str, styles: Dict[str, ParagraphStyle]) -> Paragraph:
    return Paragraph(_font_rich(title, bold=True), styles["section"])


def _build_header(
    *,
    styles: Dict[str, ParagraphStyle],
    clinic_name: str,
    clinic_address: str,
    clinic_phone: str,
    clinic_email: str = "",
    clinic_registration: str = "",
    clinic_website: str = "",
    clinic_logo_bytes: Optional[bytes] = None,
    doctor_name: str,
    doctor_speciality: str,
    doctor_license: str,
    language: str = "en",
) -> list:
    """
    Letterhead for the appointment hospital/clinic only.
    MediEase product branding belongs in the footer — never here.
    """
    elements: list = []
    labels = _labels(language)
    clinic_logo = _load_image_from_bytes(clinic_logo_bytes, 18.0)
    mark = clinic_logo or _clinic_monogram(clinic_name, 16.0)

    clinic_bits = [Paragraph(f"<b>{_font_rich(clinic_name or 'Clinic', bold=True)}</b>", styles["clinic_name"])]
    if clinic_address:
        clinic_bits.append(Paragraph(_font_rich(clinic_address), styles["muted"]))
    contact_parts = []
    if clinic_phone:
        contact_parts.append(f"{labels['phone']}: {clinic_phone}")
    if clinic_email:
        contact_parts.append(f"{labels['email']}: {clinic_email}")
    if contact_parts:
        clinic_bits.append(Paragraph(_font_rich(" · ".join(contact_parts)), styles["muted"]))
    if clinic_website:
        clinic_bits.append(Paragraph(_font_rich(clinic_website), styles["muted"]))
    if clinic_registration:
        clinic_bits.append(
            Paragraph(_font_rich(f"{labels['reg_no']}: {clinic_registration}"), styles["muted"])
        )

    left_inner = Table(
        [[mark, clinic_bits]],
        colWidths=[20 * mm, 72 * mm],
    )
    left_inner.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    doctor_bits = [Paragraph(_font_rich(doctor_name or "Doctor", bold=True), styles["doctor_name"])]
    if doctor_speciality:
        doctor_bits.append(Paragraph(_font_rich(doctor_speciality), styles["doctor_meta"]))
    if doctor_license:
        doctor_bits.append(
            Paragraph(_font_rich(f"{labels['reg_no']}: {doctor_license}"), styles["doctor_meta"])
        )
    doctor_bits.append(Paragraph(_font_rich(labels["digital_rx"]), styles["doctor_meta"]))

    header = Table([[left_inner, doctor_bits]], colWidths=[95 * mm, 79 * mm])
    header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(header)
    elements.append(
        HRFlowable(
            width="100%",
            thickness=2,
            color=TEAL,
            spaceBefore=2,
            spaceAfter=8,
        )
    )
    return elements


def _build_patient_grid(
    *,
    styles: Dict[str, ParagraphStyle],
    patient_name: str,
    patient_age: str,
    patient_gender: str,
    patient_phone: str,
    patient_display_id: str,
    patient_mongo_id: str,
    appointment_display_id: str,
    appointment_mongo_id: str,
    prescription_id: str,
) -> Table:
    """Multi-column patient details matching Prescription tab layout."""
    cell_style = TableStyle(
        [
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
        ]
    )

    row1 = Table(
        [
            [
                _field_cell("Patient Name", patient_name, styles),
                _field_cell("Age", patient_age, styles),
                _field_cell("Gender", patient_gender, styles),
                _field_cell("Phone", patient_phone, styles),
            ]
        ],
        colWidths=[72 * mm, 34 * mm, 34 * mm, 34 * mm],
    )
    row1.setStyle(cell_style)

    row2 = Table(
        [
            [
                _field_cell(
                    "Patient ID",
                    patient_display_id or patient_mongo_id,
                    styles,
                ),
                _field_cell(
                    "Appointment ID",
                    appointment_display_id or appointment_mongo_id,
                    styles,
                ),
                _field_cell("Prescription ID", prescription_id, styles),
            ]
        ],
        colWidths=[58 * mm, 58 * mm, 58 * mm],
    )
    row2.setStyle(cell_style)

    grid = Table([[row1], [row2]], colWidths=[_CONTENT_WIDTH])
    grid.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SOFT),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LINEBELOW", (0, 0), (-1, 0), 0.4, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return grid


def _build_diagnosis_band(
    diagnosis: str,
    styles: Dict[str, ParagraphStyle],
    language: str = "en",
) -> Table:
    labels = _labels(language)
    safe = _pdf_cell(diagnosis, allow_unicode=True)
    inner = [
        Paragraph(_font_rich(labels["diagnosis"], bold=True), styles["card_title"]),
        Paragraph(_font_rich(safe).replace("\n", "<br/>"), styles["diagnosis"]),
    ]
    band = Table([[inner]], colWidths=[_CONTENT_WIDTH])
    band.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SOFT_TEAL),
                ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#99f6e4")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return band


def _medicine_name_cell(
    med: Dict[str, Any],
    styles: Dict[str, ParagraphStyle],
    *,
    allow_unicode: bool = False,
) -> Paragraph:
    med_type = med.get("medicineType") or med.get("type") or ""
    raw_name = _pdf_cell(med.get("name") or "", allow_unicode=True) or "-"
    name = _font_rich(raw_name)
    if med_type:
        type_txt = _pdf_cell(med_type, allow_unicode=True)
        name = f'{name} <font color="#64748b">({_font_rich(type_txt)})</font>'
    composition = _pdf_cell(med.get("composition") or "", allow_unicode=True)
    if composition:
        name = (
            f"{name}<br/><font size='7' color='#64748b'>{_font_rich(composition)}</font>"
        )
    return Paragraph(name, styles["td"])


def _build_medicines_table(
    medications: List[Dict[str, Any]],
    styles: Dict[str, ParagraphStyle],
    language: str = "en",
) -> Table:
    labels = _labels(language)
    # Always preserve Unicode for medicine rows (Hindi may exist even if UI language=en)
    allow_unicode = True
    header = [
        Paragraph(_font_rich(labels["col_num"], bold=True), styles["th"]),
        Paragraph(_font_rich(labels["col_medicine"], bold=True), styles["th"]),
        Paragraph(_font_rich(labels["col_dosage"], bold=True), styles["th"]),
        Paragraph(_font_rich(labels["col_timing"], bold=True), styles["th"]),
        Paragraph(_font_rich(labels["col_frequency"], bold=True), styles["th"]),
        Paragraph(_font_rich(labels["col_duration"], bold=True), styles["th"]),
        Paragraph(_font_rich(labels["col_qty"], bold=True), styles["th"]),
    ]
    rows: list = [header]

    for index, med in enumerate(medications, start=1):
        timing = _pdf_cell(
            med.get("timing")
            or med.get("instructions")
            or med.get("timingFreqDuration")
            or "",
            allow_unicode=True,
        )
        dosage = _pdf_cell(med.get("dosage"), allow_unicode=True)
        frequency = _pdf_cell(med.get("frequency"), allow_unicode=True)
        duration = _pdf_cell(med.get("duration"), allow_unicode=True)
        quantity = med.get("quantity")
        if quantity in (None, "", 0, "0"):
            qty_display = ""
        else:
            qty_display = _pdf_cell(quantity, allow_unicode=True)

        rows.append(
            [
                Paragraph(str(index), styles["td_center"]),
                _medicine_name_cell(med, styles, allow_unicode=True),
                Paragraph(_font_rich(dosage), styles["td_center"]),
                Paragraph(_font_rich(timing), styles["td"]),
                Paragraph(_font_rich(frequency), styles["td"]),
                Paragraph(_font_rich(duration), styles["td"]),
                Paragraph(_font_rich(qty_display), styles["td_center"]),
            ]
        )

    table = Table(
        rows,
        colWidths=[8 * mm, 50 * mm, 18 * mm, 28 * mm, 26 * mm, 26 * mm, 18 * mm],
        repeatRows=1,
    )
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (2, 0), (2, -1), "CENTER"),
        ("ALIGN", (6, 0), (6, -1), "CENTER"),
    ]
    for i in range(1, len(rows)):
        if i % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), SOFT))
        else:
            style_cmds.append(("BACKGROUND", (0, i), (-1, i), colors.white))

    table.setStyle(TableStyle(style_cmds))
    return table


def _info_card(
    title: str,
    body: str,
    styles: Dict[str, ParagraphStyle],
    width: float,
) -> Table:
    content = [
        Paragraph(_font_rich(title, bold=True), styles["card_title"]),
        Paragraph(_font_rich(body).replace("\n", "<br/>"), styles["body"]),
    ]
    card = Table([[content]], colWidths=[width])
    card.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SOFT),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return card


def _build_schedule_row(
    *,
    next_appointment: str,
    clinic_phone: str,
    styles: Dict[str, ParagraphStyle],
    language: str = "en",
) -> Table:
    """
    Dual-column row matching clinic letter style:
    NEXT APPOINTMENT (date) | BOOKING & ENQUIRIES (call / WhatsApp + phone).
    No time field.
    """
    labels = _labels(language)
    half = (_CONTENT_WIDTH - 4 * mm) / 2

    date_text = _pdf_cell(next_appointment, allow_unicode=True) or (next_appointment or "").strip()
    left_bits = [
        Paragraph(_font_rich(labels["next_appointment"], bold=True), styles["card_title"]),
        Paragraph(
            f"{_font_rich(labels['date_label'] + ':', bold=True)} {_font_rich(date_text)}",
            styles["body"],
        ),
    ]
    left = Table([[left_bits]], colWidths=[half])
    left.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SOFT),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )

    phone = _pdf_cell(clinic_phone) or (clinic_phone or "").strip()
    right_bits = [
        Paragraph(_font_rich(labels["booking"], bold=True), styles["card_title"]),
        Paragraph(_font_rich(labels["call_whatsapp"]), styles["body"]),
    ]
    if phone:
        right_bits.append(Paragraph(_font_rich(phone, bold=True), styles["body"]))
    right = Table([[right_bits]], colWidths=[half])
    right.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SOFT),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )

    row = Table([[left, right]], colWidths=[half + 2 * mm, half + 2 * mm])
    row.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (0, 0), 2),
                ("LEFTPADDING", (1, 0), (1, 0), 2),
                ("RIGHTPADDING", (1, 0), (1, 0), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    return row


def _build_tests_and_followup(
    *,
    prescribed_tests: str,
    next_appointment: str,
    clinic_phone: str,
    styles: Dict[str, ParagraphStyle],
    language: str = "en",
) -> list:
    """
    Full-width tests, then dual-column next appointment + booking/enquiries.
    """
    elements: list = []
    labels = _labels(language)
    has_tests = bool((prescribed_tests or "").strip())
    has_next = bool((next_appointment or "").strip())
    has_phone = bool((clinic_phone or "").strip())

    if has_tests:
        elements.append(
            _info_card(
                labels["tests"],
                _pdf_cell(prescribed_tests, allow_unicode=True) or prescribed_tests,
                styles,
                _CONTENT_WIDTH,
            )
        )
        elements.append(Spacer(1, 6))

    if has_next or has_phone:
        if has_next:
            elements.append(
                _build_schedule_row(
                    next_appointment=next_appointment or "",
                    clinic_phone=clinic_phone or "",
                    styles=styles,
                    language=language,
                )
            )
        elif has_phone:
            # Phone-only: still show booking column full width
            elements.append(
                _info_card(
                    labels["booking"],
                    f"{labels['call_whatsapp']}\n{clinic_phone}",
                    styles,
                    _CONTENT_WIDTH,
                )
            )

    return elements


def _build_signoff(
    *,
    doctor_name: str,
    doctor_speciality: str,
    doctor_license: str,
    styles: Dict[str, ParagraphStyle],
    signed_at: Optional[datetime] = None,
    language: str = "en",
) -> list:
    """
    Auto-sign block without a border box — name + credentials only.
    """
    elements: list = []
    elements.append(Spacer(1, 16))
    labels = _labels(language)

    when = signed_at or datetime.utcnow()
    signed_str = when.strftime("%d/%m/%Y %H:%M UTC")
    name = _pdf_cell(doctor_name) or "Doctor"

    stamp_bits = [
        Paragraph(_font_rich(labels["digitally_signed"], bold=True), styles["sign_stamp"]),
        Spacer(1, 3),
        Paragraph(_font_rich(name, bold=True), styles["sign_name"]),
    ]
    if doctor_speciality:
        stamp_bits.append(Paragraph(_font_rich(doctor_speciality), styles["sign_label"]))
    if doctor_license:
        stamp_bits.append(
            Paragraph(
                _font_rich(f"{labels['reg_no']}: {doctor_license}"),
                styles["sign_label"],
            )
        )
    stamp_bits.append(
        Paragraph(
            _font_rich(f"{labels['signed_on']}: {signed_str}"),
            styles["sign_label"],
        )
    )
    stamp_bits.append(Paragraph(_font_rich(labels["auth_note"]), styles["sign_note"]))

    # Right-aligned, no BOX / no background fill
    stamp = Table([[stamp_bits]], colWidths=[72 * mm])
    stamp.setStyle(
        TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ]
        )
    )

    block = Table([["", stamp]], colWidths=[102 * mm, 72 * mm])
    block.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    elements.append(block)
    return elements


def _build_footer(styles: Dict[str, ParagraphStyle]) -> list:
    """MediEase product branding + tagline (footer only)."""
    elements: list = []
    elements.append(Spacer(1, 14))
    elements.append(
        HRFlowable(
            width="100%",
            thickness=0.5,
            color=LINE,
            spaceBefore=2,
            spaceAfter=6,
        )
    )

    brand_lines = [
        Paragraph(
            "<b><font color='#0f766e'>MediEase</font></b>",
            styles["footer_brand"],
        ),
        Paragraph("Every Patient. Their Story. Anywhere.", styles["footer_tagline"]),
        Paragraph(
            "This prescription was generated digitally through MediEase.",
            styles["footer"],
        ),
    ]
    logo = _load_mediease_logo(12.0)
    if logo:
        row = Table([[logo, brand_lines]], colWidths=[14 * mm, 160 * mm])
        row.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        elements.append(row)
    else:
        elements.extend(brand_lines)
    return elements


def build_prescription_pdf(
    *,
    clinic_id: str,
    clinic_name: str,
    clinic_address: str,
    clinic_phone: str,
    doctor_id: str,
    doctor_name: str,
    doctor_speciality: str,
    doctor_license: str,
    patient_name: str,
    patient_display_id: str,
    patient_mongo_id: str,
    patient_age: str,
    patient_gender: str,
    patient_phone: str,
    appointment_display_id: str,
    appointment_mongo_id: str,
    prescription_id: str,
    prescribed_at: datetime,
    diagnosis: str,
    medications: List[Dict[str, Any]],
    prescribed_tests: str,
    next_appointment: str,
    free_text_prescription: str,
    clinic_email: str = "",
    clinic_registration: str = "",
    clinic_website: str = "",
    clinic_logo_bytes: Optional[bytes] = None,
    language: str = "en",
) -> bytes:
    """Build a professional prescription PDF (clinic letterhead + MediEase footer)."""
    # clinic_id / doctor_id retained for API parity with callers (not printed as IDs)
    _ = clinic_id, doctor_id
    language = _resolve_pdf_language(
        language,
        medications=medications,
        diagnosis=diagnosis or "",
    )
    labels = _labels(language)

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=14 * mm,
        bottomMargin=14 * mm,
    )
    styles = _build_styles(language)
    elements: list = []

    elements.extend(
        _build_header(
            styles=styles,
            clinic_name=clinic_name,
            clinic_address=clinic_address,
            clinic_phone=clinic_phone,
            clinic_email=clinic_email,
            clinic_registration=clinic_registration,
            clinic_website=clinic_website,
            clinic_logo_bytes=clinic_logo_bytes,
            doctor_name=doctor_name,
            doctor_speciality=doctor_speciality,
            doctor_license=doctor_license,
            language=language,
        )
    )

    date_str = prescribed_at.strftime("%d/%m/%Y %H:%M")
    elements.append(Paragraph(_font_rich(labels["title"], bold=True), styles["title"]))
    elements.append(
        Paragraph(
            _font_rich(f"{labels['date']}: {date_str}"),
            styles["title_date"],
        )
    )
    elements.append(
        HRFlowable(
            width="100%",
            thickness=0.6,
            color=LINE,
            spaceBefore=0,
            spaceAfter=8,
        )
    )

    elements.append(_section_header(labels["patient_details"], styles))
    elements.append(
        _build_patient_grid(
            styles=styles,
            patient_name=patient_name,
            patient_age=patient_age,
            patient_gender=patient_gender,
            patient_phone=patient_phone,
            patient_display_id=patient_display_id,
            patient_mongo_id=patient_mongo_id,
            appointment_display_id=appointment_display_id,
            appointment_mongo_id=appointment_mongo_id,
            prescription_id=prescription_id,
        )
    )
    elements.append(Spacer(1, 8))

    if (diagnosis or "").strip():
        elements.append(_build_diagnosis_band(diagnosis, styles, language=language))
        elements.append(Spacer(1, 8))

    if medications:
        elements.append(_section_header(labels["medicines"], styles))
        elements.append(
            _build_medicines_table(medications, styles, language=language)
        )
        elements.append(Spacer(1, 8))
    elif (free_text_prescription or "").strip():
        elements.append(_section_header(labels["medicines"], styles))
        elements.append(
            Paragraph(
                _font_rich(
                    _pdf_cell(free_text_prescription, allow_unicode=True)
                ).replace("\n", "<br/>"),
                styles["body"],
            )
        )
        elements.append(Spacer(1, 8))

    cards = _build_tests_and_followup(
        prescribed_tests=prescribed_tests or "",
        next_appointment=next_appointment or "",
        clinic_phone=clinic_phone or "",
        styles=styles,
        language=language,
    )
    if cards:
        elements.extend(cards)

    elements.extend(
        _build_signoff(
            doctor_name=doctor_name,
            doctor_speciality=doctor_speciality,
            doctor_license=doctor_license,
            styles=styles,
            signed_at=prescribed_at if isinstance(prescribed_at, datetime) else None,
            language=language,
        )
    )
    elements.extend(_build_footer(styles))

    doc.build(elements)
    return buffer.getvalue()
