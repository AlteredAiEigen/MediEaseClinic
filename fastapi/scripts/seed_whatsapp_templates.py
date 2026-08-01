#!/usr/bin/env python3
"""
Upsert WhatsApp templates into whatsapp_templates (same collection used by reminders/follow-ups).

Matches the schema used by existing templates:
  - string _id (e.g. prescription_utility_format_001)
  - created_at / approved_at (snake_case)
  - variables with integer position + example
  - header, footer, buttons, message_preview, category, language, status

Removes legacy prescription rows whose _id was auto-generated as ObjectId.
Normalizes all template _id values to {template_name}_001 via normalize script.

Usage (from MediEaseClinic/fastapi):
  venv/bin/python scripts/seed_whatsapp_templates.py
  venv/bin/python scripts/normalize_whatsapp_templates.py
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path

from bson import ObjectId
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

FASTAPI_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(FASTAPI_ROOT))

from app.constants.whatsapp_templates import (
    PRESCRIPTION_TEMPLATE_ID,
    PRESCRIPTION_TEMPLATE_NAME,
)

load_dotenv(FASTAPI_ROOT / ".env")

MONGO_URI_RAW = os.getenv("MONGODB_URL") or os.getenv("MONGODB_URI") or "mongodb://localhost:27017"
DB_NAME = os.getenv("DATABASE_NAME") or os.getenv("MONGODB_DB_NAME") or "mediease"

uri_without_query = MONGO_URI_RAW.split("?")[0]
if uri_without_query.count("/") >= 3:
    parts = uri_without_query.rsplit("/", 1)
    if len(parts) == 2 and parts[1] and parts[1] not in ("", "test", "admin", "local"):
        MONGO_URI = parts[0]
        if DB_NAME == "mediease":
            DB_NAME = parts[1]
    else:
        MONGO_URI = MONGO_URI_RAW
else:
    MONGO_URI = MONGO_URI_RAW


def build_prescription_template(*, created_at: str, approved_at: str | None) -> dict:
    """Build prescription template document matching other whatsapp_templates rows."""
    return {
        "_id": PRESCRIPTION_TEMPLATE_ID,
        "template_name": PRESCRIPTION_TEMPLATE_NAME,
        "content_sid": "HX502baba15a5c79c8a281aba438c2640d",
        "category": "UTILITY",
        "language": "en_UK",
        "status": "Approved",
        "header": {
            "type": "text",
            "text": "",
        },
        "body": (
            "Greetings,\n"
            "Wishing you a speedy recovery, {{1}},\n"
            "You can download your prescription here: {{2}}. "
            "If you have any questions or need further assistance, please contact us: {{3}}\n\n"
            "{{4}}"
        ),
        "footer": "MediEase",
        "variables": [
            {
                "position": 1,
                "name": "patient_name",
                "example": "Raj Sharma",
            },
            {
                "position": 2,
                "name": "prescription_download_url",
                "example": "https://example.com/prescription.pdf",
            },
            {
                "position": 3,
                "name": "clinic_phone",
                "example": "+911234567890",
            },
            {
                "position": 4,
                "name": "clinic_name",
                "example": "MediEase Clinic",
            },
        ],
        "buttons": [],
        "message_preview": (
            "Greetings,\n"
            "Wishing you a speedy recovery, Raj Sharma,\n"
            "You can download your prescription here: https://example.com/prescription.pdf. "
            "If you have any questions or need further assistance, please contact us: +911234567890\n\n"
            "MediEase Clinic\n"
            "MediEase"
        ),
        "created_at": created_at,
        "approved_at": approved_at,
    }


async def remove_legacy_prescription_templates(db, *, dry_run: bool) -> int:
    """Delete prescription template rows with non-string _id (legacy ObjectId inserts)."""
    cursor = db.whatsapp_templates.find({"template_name": PRESCRIPTION_TEMPLATE_NAME})
    removed = 0
    async for doc in cursor:
        doc_id = doc.get("_id")
        if isinstance(doc_id, ObjectId) or doc_id != PRESCRIPTION_TEMPLATE_ID:
            print(f"  REMOVE legacy row _id={doc_id!r} (type={type(doc_id).__name__})")
            removed += 1
            if not dry_run:
                await db.whatsapp_templates.delete_one({"_id": doc_id})
    return removed


async def seed_templates(*, dry_run: bool) -> None:
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    print(f"Database: {DB_NAME}")
    print(f"Template: {PRESCRIPTION_TEMPLATE_NAME} (_id={PRESCRIPTION_TEMPLATE_ID})")

    existing = await db.whatsapp_templates.find_one({"_id": PRESCRIPTION_TEMPLATE_ID})
    legacy_created_at = "2026-07-20 03:57:00"
    legacy_approved_at = "2026-07-20 20:30:00"

    if not existing:
        legacy = await db.whatsapp_templates.find_one({"template_name": PRESCRIPTION_TEMPLATE_NAME})
        if legacy:
            legacy_created_at = legacy.get("created_at") or legacy.get("createdAt") or legacy_created_at
            if isinstance(legacy_created_at, datetime):
                legacy_created_at = legacy_created_at.strftime("%Y-%m-%d %H:%M:%S")
            legacy_approved_at = legacy.get("approved_at") or legacy_approved_at
            if isinstance(legacy_approved_at, datetime):
                legacy_approved_at = legacy_approved_at.strftime("%Y-%m-%d %H:%M:%S")

    doc = build_prescription_template(
        created_at=str(legacy_created_at),
        approved_at=str(legacy_approved_at) if legacy_approved_at else None,
    )

    print("\nRemoving legacy prescription template rows with mismatched _id...")
    removed = await remove_legacy_prescription_templates(db, dry_run=dry_run)
    print(f"  Legacy rows to remove: {removed}")

    action = "update" if existing else "insert"
    print(f"\n{action.upper()}: {PRESCRIPTION_TEMPLATE_NAME}")
    print(f"  _id:         {PRESCRIPTION_TEMPLATE_ID}")
    print(f"  content_sid: {doc['content_sid']}")
    print(f"  variables:   {len(doc['variables'])}")

    if dry_run:
        print("\nDry run complete — no database changes made.")
        client.close()
        return

    await db.whatsapp_templates.replace_one({"_id": PRESCRIPTION_TEMPLATE_ID}, doc, upsert=True)

    saved = await db.whatsapp_templates.find_one({"_id": PRESCRIPTION_TEMPLATE_ID})
    count = await db.whatsapp_templates.count_documents({})
    print(f"\nDone. whatsapp_templates now has {count} document(s).")
    if saved:
        print(f"Verified _id type: {type(saved['_id']).__name__} = {saved['_id']!r}")

    client.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed WhatsApp templates into MongoDB")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing")
    args = parser.parse_args()
    asyncio.run(seed_templates(dry_run=args.dry_run))


if __name__ == "__main__":
    main()
