#!/usr/bin/env python3
"""
One-time seed: import the legacy hardcoded prescription catalog into MongoDB.

Safe to re-run — upserts by (nameLower, type) and does not overwrite useCount on
existing entries unless --refresh-metadata is passed.

Usage (from MediEaseClinic/fastapi):
  venv/bin/python scripts/seed_prescription_catalog.py
  venv/bin/python scripts/seed_prescription_catalog.py --dry-run
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

FASTAPI_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(FASTAPI_ROOT))

load_dotenv(FASTAPI_ROOT / ".env")

from app.models.prescription_catalog import PrescriptionCatalogCreate
from app.services.prescription_catalog_service import PrescriptionCatalogService

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

# Legacy catalog from digital-prescription-hub-main (initial bootstrap only).
SEED_ITEMS: list[dict] = [
    {"name": "Paracetamol 500mg", "type": "TAB", "composition": "Paracetamol 500mg", "dosage": "500mg", "frequency": "Twice daily", "duration": "5 days"},
    {"name": "Amoxicillin 500mg", "type": "CAP", "composition": "Amoxicillin 500mg", "dosage": "500mg", "frequency": "Three times daily", "duration": "5 days"},
    {"name": "Azithromycin 500mg", "type": "TAB", "composition": "Azithromycin 500mg", "dosage": "500mg", "frequency": "Once daily", "duration": "3 days"},
    {"name": "Pantoprazole 40mg", "type": "TAB", "composition": "Pantoprazole 40mg", "dosage": "40mg", "frequency": "Once daily before food", "duration": "14 days"},
    {"name": "Metformin 500mg", "type": "TAB", "composition": "Metformin 500mg", "dosage": "500mg", "frequency": "Twice daily after food", "duration": "30 days"},
    {"name": "Amlodipine 5mg", "type": "TAB", "composition": "Amlodipine 5mg", "dosage": "5mg", "frequency": "Once daily", "duration": "30 days"},
    {"name": "Atorvastatin 10mg", "type": "TAB", "composition": "Atorvastatin 10mg", "dosage": "10mg", "frequency": "Once daily at bedtime", "duration": "30 days"},
    {"name": "Levocetirizine 5mg", "type": "TAB", "composition": "Levocetirizine 5mg", "dosage": "5mg", "frequency": "Once daily at night", "duration": "7 days"},
    {"name": "Montelukast 10mg", "type": "TAB", "composition": "Montelukast 10mg", "dosage": "10mg", "frequency": "Once daily at night", "duration": "14 days"},
    {"name": "Ibuprofen 400mg", "type": "TAB", "composition": "Ibuprofen 400mg", "dosage": "400mg", "frequency": "Twice daily after food", "duration": "3 days"},
    {"name": "Omeprazole 20mg", "type": "CAP", "composition": "Omeprazole 20mg", "dosage": "20mg", "frequency": "Once daily before breakfast", "duration": "14 days"},
    {"name": "Cetirizine Syrup", "type": "SYR", "composition": "Cetirizine 5mg/5ml", "dosage": "5ml", "frequency": "Once daily at night", "duration": "5 days"},
    {"name": "Vitamin D3 60,000 IU", "type": "TAB", "composition": "Cholecalciferol 60,000 IU", "dosage": "1 tablet", "frequency": "Once weekly", "duration": "8 weeks"},
    {"name": "Dextromethorphan Syrup", "type": "SYR", "composition": "Dextromethorphan", "dosage": "10ml", "frequency": "Three times daily", "duration": "5 days"},
    {"name": "Inj. Ceftriaxone 1g", "type": "INJ", "composition": "Ceftriaxone 1g", "dosage": "1g IM/IV", "frequency": "Once daily", "duration": "5 days"},
    {"name": "Inj. Pantoprazole 40mg", "type": "INJ", "composition": "Pantoprazole 40mg", "dosage": "40mg IV", "frequency": "Once daily", "duration": "3 days"},
    {"name": "Inj. Dexamethasone 4mg", "type": "INJ", "composition": "Dexamethasone 4mg", "dosage": "4mg IM", "frequency": "Once daily", "duration": "3 days"},
    {"name": "Inj. Vitamin B12", "type": "INJ", "composition": "Methylcobalamin 1500mcg", "dosage": "1 ampoule IM", "frequency": "Once weekly", "duration": "4 weeks"},
    {"name": "CBC", "type": "TEST"},
    {"name": "HbA1c", "type": "TEST"},
    {"name": "Lipid Profile", "type": "TEST"},
    {"name": "Chest X-Ray PA", "type": "TEST"},
    {"name": "ECG", "type": "TEST"},
    {"name": "Urine R/M", "type": "TEST"},
    {"name": "Betamethasone Cream", "type": "OINT", "composition": "Betamethasone 0.1%", "dosage": "Apply thin layer", "frequency": "Twice daily", "duration": "7 days"},
    {"name": "Mupirocin Ointment", "type": "OINT", "composition": "Mupirocin 2%", "dosage": "Apply locally", "frequency": "Three times daily", "duration": "5 days"},
    {"name": "Ciprofloxacin Eye Drops", "type": "DROP", "composition": "Ciprofloxacin 0.3%", "dosage": "1 drop", "frequency": "Four times daily", "duration": "5 days"},
    {"name": "Artificial Tears", "type": "DROP", "composition": "Carboxymethylcellulose", "dosage": "1-2 drops", "frequency": "As needed", "duration": "14 days"},
    {"name": "ORS Powder", "type": "OTHER", "composition": "Oral rehydration salts", "dosage": "1 sachet", "frequency": "After each loose stool", "duration": "3 days"},
    {"name": "Multivitamin", "type": "OTHER", "composition": "Multivitamin", "dosage": "1 tablet", "frequency": "Once daily", "duration": "30 days"},
]


async def seed(dry_run: bool = False) -> None:
    print(f"Connecting to MongoDB: {MONGO_URI}")
    print(f"Database: {DB_NAME}")

    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    service = PrescriptionCatalogService(db)

    inserted = 0
    updated = 0
    skipped = 0

    for raw in SEED_ITEMS:
        item = PrescriptionCatalogCreate(
            name=raw["name"],
            type=raw["type"],
            composition=raw.get("composition"),
            dosage=raw.get("dosage"),
            frequency=raw.get("frequency"),
            duration=raw.get("duration"),
        )
        name_lower = service._normalize(item.name)
        existing = await db.prescription_catalog.find_one(
            {"nameLower": name_lower, "type": item.type.upper()}
        )

        if dry_run:
            action = "update" if existing else "insert"
            print(f"  [{action}] {item.type} — {item.name}")
            if existing:
                updated += 1
            else:
                inserted += 1
            continue

        before = existing is not None
        await service.upsert(item, created_by="seed_prescription_catalog")
        if before:
            updated += 1
            print(f"  updated: {item.type} — {item.name}")
        else:
            inserted += 1
            print(f"  inserted: {item.type} — {item.name}")

    if dry_run:
        print(f"\nDry run — would insert {inserted}, update {updated}")
    else:
        total = await db.prescription_catalog.count_documents({})
        print(f"\nDone — inserted {inserted}, updated {updated}, skipped {skipped}")
        print(f"Total catalog items in DB: {total}")

    client.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed prescription catalog into MongoDB")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print actions without writing to the database",
    )
    args = parser.parse_args()
    asyncio.run(seed(dry_run=args.dry_run))


if __name__ == "__main__":
    main()
