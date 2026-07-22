"""
WhatsApp template lookup keys.

These values must match `template_name` in the `whatsapp_templates` MongoDB collection.
Document `_id` follows: `{template_name}_001` (string, never ObjectId).

Template metadata (content_sid, body, variables) is always loaded from that collection —
never from config or hardcoded SID/body in service code.

To update a template in production, edit the row in `whatsapp_templates` only.
"""


def template_document_id(template_name: str) -> str:
    """Canonical whatsapp_templates document _id for a template_name."""
    return f"{template_name}_001"


# Prescription PDF download link sent after consultation / Send Prescription
PRESCRIPTION_TEMPLATE_NAME = "prescription_utility_format"
PRESCRIPTION_TEMPLATE_ID = template_document_id(PRESCRIPTION_TEMPLATE_NAME)

# Scheduled / automated reminders (active scheduler uses payloads variant)
APPOINTMENT_REMINDER_TEMPLATE_NAME = "appointment_reminder_payloads"
APPOINTMENT_REMINDER_TEMPLATE_ID = template_document_id(APPOINTMENT_REMINDER_TEMPLATE_NAME)

APPOINTMENT_REMINDER_LEGACY_TEMPLATE_NAME = "appointment_reminder"
APPOINTMENT_REMINDER_LEGACY_TEMPLATE_ID = template_document_id(APPOINTMENT_REMINDER_LEGACY_TEMPLATE_NAME)

POST_VISIT_LAB_TEMPLATE_NAME = "post_visit_lab_request"
POST_VISIT_LAB_TEMPLATE_ID = template_document_id(POST_VISIT_LAB_TEMPLATE_NAME)

FOLLOWUP_REMINDER_TEMPLATE_NAME = "followup_appointment_reminder"
FOLLOWUP_REMINDER_TEMPLATE_ID = template_document_id(FOLLOWUP_REMINDER_TEMPLATE_NAME)
