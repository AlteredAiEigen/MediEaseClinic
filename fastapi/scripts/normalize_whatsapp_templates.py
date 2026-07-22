#!/usr/bin/env python3
"""
Normalize all whatsapp_templates documents to a consistent string _id:
  {template_name}_001

Fixes legacy rows that used ObjectId, Mongo hex strings, or Twilio content SID as _id.

Usage (from MediEaseClinic/fastapi):
  venv/bin/python scripts/normalize_whatsapp_templates.py
  venv/bin/python scripts/normalize_whatsapp_templates.py --dry-run
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path

from bson import ObjectId
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

FASTAPI_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(FASTAPI_ROOT))

from app.constants.whatsapp_templates import template_document_id

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


async def normalize_all_templates(*, dry_run: bool) -> None:
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    print(f"Database: {DB_NAME}")
    templates = await db.whatsapp_templates.find({}).sort("template_name", 1).to_list(length=50)
    print(f"Found {len(templates)} template(s)\n")

    migrated = 0
    skipped = 0

    for doc in templates:
        template_name = doc.get("template_name")
        if not template_name:
            print(f"SKIP: document _id={doc.get('_id')!r} has no template_name")
            skipped += 1
            continue

        canonical_id = template_document_id(template_name)
        current_id = doc.get("_id")

        if current_id == canonical_id and isinstance(current_id, str):
            print(f"OK:   {template_name} (_id={canonical_id!r})")
            skipped += 1
            continue

        print(f"MIGRATE: {template_name}")
        print(f"  from _id={current_id!r} ({type(current_id).__name__})")
        print(f"  to   _id={canonical_id!r}")

        if dry_run:
            migrated += 1
            continue

        new_doc = {key: value for key, value in doc.items() if key != "_id"}
        new_doc["_id"] = canonical_id

        existing_canonical = await db.whatsapp_templates.find_one({"_id": canonical_id})
        if existing_canonical and existing_canonical.get("_id") != current_id:
            await db.whatsapp_templates.delete_one({"_id": canonical_id})
            print(f"  replaced existing canonical row")

        await db.whatsapp_templates.replace_one({"_id": canonical_id}, new_doc, upsert=True)

        if current_id != canonical_id:
            await db.whatsapp_templates.delete_one({"_id": current_id})
            # Also remove ObjectId duplicates for same template_name
            await db.whatsapp_templates.delete_many(
                {
                    "template_name": template_name,
                    "_id": {"$ne": canonical_id},
                }
            )

        migrated += 1

    # Remove any stray ObjectId documents without template_name match cleanup
    object_id_docs = await db.whatsapp_templates.find({"_id": {"$type": "objectId"}}).to_list(20)
    for doc in object_id_docs:
        print(f"REMOVE stray ObjectId document: _id={doc.get('_id')}")
        if not dry_run:
            await db.whatsapp_templates.delete_one({"_id": doc["_id"]})
        migrated += 1

    print(f"\nSummary: migrated={migrated}, already_ok={skipped}")

    if not dry_run:
        print("\nFinal _id values:")
        for doc in await db.whatsapp_templates.find({}).sort("template_name", 1).to_list(50):
            print(
                f"  {doc.get('template_name'):35} _id={doc.get('_id')!r} "
                f"type={type(doc.get('_id')).__name__}"
            )

    client.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize whatsapp_templates _id values")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing")
    args = parser.parse_args()
    asyncio.run(normalize_all_templates(dry_run=args.dry_run))


if __name__ == "__main__":
    main()
