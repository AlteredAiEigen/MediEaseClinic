#!/usr/bin/env python3
"""
Link a prescription (or the Rx attached to a given appointment id) to a patient's
June visit so it appears in visit history / patient profile appointment tab.

Default targets (override via CLI flags):
  patient:      6a3963b370bda73cabf86a6f  (Priya Sharma / P-DEMO-PRIYA)
  source id:    6a6f9f2992a792bdec0c3133  (appointment that currently holds the Rx)
  target date:  2026-06-20

Usage:
  cd /home/ec2-user/MediEaseClinic/fastapi
  venv/bin/python scripts/link_prescription_to_june_appointment.py --dry-run
  venv/bin/python scripts/link_prescription_to_june_appointment.py
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from datetime import datetime
from typing import Any, Dict, Optional

sys.path.insert(0, "/home/ec2-user/MediEaseClinic/fastapi")

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings

DEFAULT_PATIENT_ID = "6a3963b370bda73cabf86a6f"
DEFAULT_SOURCE_ID = "6a6f9f2992a792bdec0c3133"
DEFAULT_TARGET_DATE = "2026-06-20"

# Clinical details provided for the June visit
JUNE_REASON = "Fever and cold with cough for 3 days"
JUNE_TREATMENT = (
    "Increase water intake, especially warm water. "
    "Prescribe medications for viral infection."
)
JUNE_FOLLOW_UP = "If fever persists, inform and return for follow-up."
JUNE_TIME = "02:00"


def _ser(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def _brief(doc: Optional[dict], keys: list[str]) -> dict:
    if not doc:
        return {}
    return {k: _ser(doc.get(k)) for k in keys}


async def _resolve_prescription(db, source_id: str) -> Dict[str, Any]:
    """
    Accept either a prescriptions._id or an appointments._id that has a linked Rx.
    """
    oid = ObjectId(source_id)

    rx = await db.prescriptions.find_one({"_id": oid})
    if rx:
        return {"prescription": rx, "source_appointment": None, "resolved_via": "prescription._id"}

    apt = await db.appointments.find_one({"_id": oid})
    if not apt:
        raise SystemExit(f"No prescription or appointment found for id={source_id}")

    rx = await db.prescriptions.find_one({"appointmentId": source_id})
    if not rx and apt.get("prescriptionId"):
        try:
            rx = await db.prescriptions.find_one({"_id": ObjectId(str(apt["prescriptionId"]))})
        except Exception:
            rx = None
    if not rx and apt.get("lastPrescriptionId"):
        rx = await db.prescriptions.find_one({"prescriptionId": apt["lastPrescriptionId"]})

    if not rx:
        raise SystemExit(
            f"Appointment {source_id} has no linked prescriptions row "
            f"(prescriptionId={apt.get('prescriptionId')}, lastPrescriptionId={apt.get('lastPrescriptionId')})"
        )

    return {"prescription": rx, "source_appointment": apt, "resolved_via": "appointment._id"}


async def _find_june_appointment(db, patient_id: str, target_date: str) -> dict:
    apt = await db.appointments.find_one(
        {
            "patientId": patient_id,
            "date": target_date,
            "doctorName": {"$regex": "Gunjan.*Rawat", "$options": "i"},
        }
    )
    if not apt:
        apt = await db.appointments.find_one({"patientId": patient_id, "date": target_date})
    if not apt:
        raise SystemExit(
            f"No appointment found for patient={patient_id} date={target_date}"
        )
    return apt


async def run(*, patient_id: str, source_id: str, target_date: str, dry_run: bool) -> None:
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    now = datetime.utcnow()

    print("=" * 72)
    print("Link prescription → June appointment")
    print("=" * 72)
    print(f"db={settings.database_name} dry_run={dry_run}")
    print(f"patient_id={patient_id}")
    print(f"source_id={source_id}")
    print(f"target_date={target_date}")

    patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise SystemExit(f"Patient not found: {patient_id}")
    patient_name = (
        patient.get("fullName")
        or f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
        or "Patient"
    )
    print(f"\nPatient: {patient_name} ({patient.get('patientId')})")

    resolved = await _resolve_prescription(db, source_id)
    rx = resolved["prescription"]
    source_apt = resolved["source_appointment"]
    rx_id = str(rx["_id"])
    print(f"Resolved via: {resolved['resolved_via']}")
    print(
        "Prescription:",
        json.dumps(
            _brief(
                rx,
                [
                    "_id",
                    "prescriptionId",
                    "patientId",
                    "appointmentId",
                    "doctorName",
                    "diagnosis",
                    "pdfS3Key",
                    "isActive",
                ],
            ),
            indent=2,
        ),
    )

    june = await _find_june_appointment(db, patient_id, target_date)
    june_id = str(june["_id"])
    print(
        "\nTarget appointment:",
        json.dumps(
            _brief(
                june,
                [
                    "_id",
                    "appointmentId",
                    "date",
                    "time",
                    "doctorName",
                    "status",
                    "reason",
                    "prescriptionFileKey",
                    "prescriptionId",
                ],
            ),
            indent=2,
        ),
    )

    s3_key = rx.get("pdfS3Key") or (source_apt or {}).get("prescriptionFileKey")
    s3_url = rx.get("pdfUrl") or (source_apt or {}).get("prescriptionFileUrl")
    file_name = (source_apt or {}).get("prescriptionFileName") or (
        s3_key.split("/")[-1] if s3_key else "prescription.pdf"
    )
    file_type = (source_apt or {}).get("prescriptionFileType") or "application/pdf"
    if not s3_key:
        raise SystemExit("Prescription has no pdfS3Key / source appointment has no prescriptionFileKey")

    s3_doc = await db.s3_prescriptions.find_one(
        {
            "$or": [
                {"appointmentId": str(source_apt["_id"]) if source_apt else "__none__"},
                {"metadata.prescriptionId": rx.get("prescriptionId")},
                {"s3Key": s3_key},
            ]
        }
    )

    prescribed_meds = []
    for med in rx.get("medications") or []:
        if isinstance(med, dict):
            prescribed_meds.append(
                {
                    "name": med.get("name"),
                    "dosage": med.get("dosage"),
                    "frequency": med.get("frequency"),
                    "duration": med.get("duration"),
                    "instructions": med.get("instructions"),
                    "medicineType": med.get("medicineType"),
                    "composition": med.get("composition"),
                    "quantity": med.get("quantity"),
                }
            )

    diagnosis = rx.get("diagnosis") or "Viral upper respiratory infection (fever, cold, cough)"
    structured_notes = dict(june.get("structuredNotes") or {})
    structured_notes["chiefComplaint"] = JUNE_REASON

    rx_update = {
        "patientId": patient_id,
        "patientName": patient_name,
        "appointmentId": june_id,
        "doctorId": june.get("doctorId") or rx.get("doctorId"),
        "doctorName": june.get("doctorName") or rx.get("doctorName") or "Gunjan Rawat",
        "isActive": True,
        "updatedAt": now,
    }

    apt_update = {
        "time": JUNE_TIME,
        "status": "completed",
        "reason": JUNE_REASON,
        "diagnosis": diagnosis,
        "treatmentPlan": JUNE_TREATMENT,
        "followUpInstructions": JUNE_FOLLOW_UP,
        "followUpRequired": True,
        "structuredNotes": structured_notes,
        "consultationSummary": (
            f"Chief Complaint: {JUNE_REASON}\n"
            f"Treatment: {JUNE_TREATMENT}\n"
            f"Follow-up: {JUNE_FOLLOW_UP}"
        ),
        "prescriptionFileKey": s3_key,
        "prescriptionFileUrl": s3_url,
        "prescriptionFileName": file_name,
        "prescriptionFileType": file_type,
        "prescriptionUploadedAt": (source_apt or {}).get("prescriptionUploadedAt") or now,
        "prescriptionUploadedBy": (source_apt or {}).get("prescriptionUploadedBy")
        or rx.get("doctorId")
        or june.get("doctorId"),
        "prescriptionUploadedByName": (source_apt or {}).get("prescriptionUploadedByName")
        or rx.get("doctorName")
        or june.get("doctorName"),
        "prescriptionId": rx_id,
        "lastPrescriptionId": rx.get("prescriptionId"),
        "prescribedMedications": prescribed_meds or june.get("prescribedMedications"),
        "prescriptionWhatsappSent": False,
        "prescriptionFinalized": True,
        "prescriptionFinalizedAt": now,
        "prescriptionFinalizedVia": "script_link",
        "updatedAt": now,
    }

    s3_update = {
        "patientId": patient_id,
        "patientMongoId": patient_id,
        "appointmentId": june_id,
        "s3Key": s3_key,
        "s3Url": s3_url,
        "documentName": file_name,
        "fileType": file_type,
        "clinicId": (s3_doc or {}).get("clinicId") or june.get("clinicId") or "1BE22E34",
        "updatedAt": now,
        "metadata": {
            **((s3_doc or {}).get("metadata") or {}),
            "source": ((s3_doc or {}).get("metadata") or {}).get("source") or "digital",
            "documentType": "prescription",
            "prescriptionId": rx.get("prescriptionId"),
            "patientDisplayId": patient.get("patientId"),
            "appointmentDisplayId": june.get("appointmentId"),
            "linkedByScript": "link_prescription_to_june_appointment.py",
        },
    }

    # Clear file pointers on the old appointment so the Rx is not duplicated there.
    clear_source_apt = None
    if source_apt and str(source_apt["_id"]) != june_id:
        clear_source_apt = {
            "prescriptionFileKey": None,
            "prescriptionFileUrl": None,
            "prescriptionFileName": None,
            "prescriptionFileType": None,
            "prescriptionId": None,
            "lastPrescriptionId": None,
            "prescriptionFinalized": False,
            "updatedAt": now,
        }

    print("\nPlanned prescription $set:", json.dumps(rx_update, default=str, indent=2))
    print("\nPlanned June appointment $set keys:", sorted(apt_update.keys()))
    print("\nPlanned s3_prescriptions $set:", json.dumps(s3_update, default=str, indent=2)[:1200])
    if clear_source_apt:
        print(f"\nWill clear prescription fields on source appointment {source_apt['_id']}")

    if dry_run:
        print("\nDRY RUN - no changes written.")
        client.close()
        return

    await db.prescriptions.update_one({"_id": rx["_id"]}, {"$set": rx_update})
    await db.appointments.update_one({"_id": june["_id"]}, {"$set": apt_update})

    if s3_doc:
        await db.s3_prescriptions.update_one({"_id": s3_doc["_id"]}, {"$set": s3_update})
    else:
        insert_doc = {
            **s3_update,
            "createdAt": now,
            "uploadedBy": rx.get("doctorId") or june.get("doctorId"),
        }
        result = await db.s3_prescriptions.insert_one(insert_doc)
        print(f"Inserted s3_prescriptions _id={result.inserted_id}")

    if clear_source_apt:
        await db.appointments.update_one(
            {"_id": source_apt["_id"]},
            {"$set": clear_source_apt},
        )

    # Verify
    june_after = await db.appointments.find_one({"_id": june["_id"]})
    rx_after = await db.prescriptions.find_one({"_id": rx["_id"]})
    s3_after = await db.s3_prescriptions.find_one({"appointmentId": june_id})
    print("\nVERIFY appointment:")
    print(
        json.dumps(
            _brief(
                june_after,
                [
                    "_id",
                    "appointmentId",
                    "date",
                    "time",
                    "status",
                    "reason",
                    "diagnosis",
                    "prescriptionFileKey",
                    "prescriptionId",
                    "lastPrescriptionId",
                ],
            ),
            indent=2,
        )
    )
    print("\nVERIFY prescription:")
    print(
        json.dumps(
            _brief(
                rx_after,
                ["_id", "prescriptionId", "patientId", "appointmentId", "patientName", "pdfS3Key"],
            ),
            indent=2,
        )
    )
    print("\nVERIFY s3_prescriptions:")
    print(
        json.dumps(
            _brief(
                s3_after,
                ["_id", "appointmentId", "patientId", "s3Key", "documentName"],
            ),
            indent=2,
        )
    )
    print("\nDone. Visit history / appointment tab should show the prescription file.")
    client.close()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Link prescription to patient's June appointment for visit history"
    )
    parser.add_argument("--patient-id", default=DEFAULT_PATIENT_ID)
    parser.add_argument(
        "--source-id",
        default=DEFAULT_SOURCE_ID,
        help="prescriptions._id OR appointments._id that currently holds the Rx",
    )
    parser.add_argument("--date", default=DEFAULT_TARGET_DATE, help="Target appointment date YYYY-MM-DD")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    asyncio.run(
        run(
            patient_id=args.patient_id,
            source_id=args.source_id,
            target_date=args.date,
            dry_run=args.dry_run,
        )
    )


if __name__ == "__main__":
    main()
