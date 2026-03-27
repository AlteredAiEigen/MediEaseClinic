#!/usr/bin/env python3
"""
Verify AI prescription extraction for patient Sunpreet.
Finds the patient, their most recent prescription, and displays extracted details.
"""

import asyncio
import sys
import json

sys.path.insert(0, "/home/ec2-user/MediEaseClinic/fastapi")

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from app.config import settings


def safe_str(obj):
    if obj is None:
        return "N/A"
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, dict):
        return json.dumps(obj, default=str)[:200]
    return str(obj)


async def main():
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]

    print("=" * 70)
    print("Verify prescription extraction for Sunpreet")
    print("=" * 70)

    # Find patient by name (Sunpreet, Sunpreet Kour, Sunpreet Kaur, etc.)
    patient = await db.patients.find_one(
        {
            "$or": [
                {"fullName": {"$regex": "Sunpreet", "$options": "i"}},
                {"firstName": {"$regex": "Sunpreet", "$options": "i"}},
                {"patientId": {"$regex": "Sunpreet", "$options": "i"}},
            ]
        }
    )

    if not patient:
        print("No patient found matching 'Sunpreet'.")
        client.close()
        return

    pid = str(patient["_id"])
    pname = patient.get("fullName") or f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
    print(f"\nPatient: {pname}")
    print(f"  MongoDB _id: {pid}")
    print(f"  patientId: {patient.get('patientId', 'N/A')}")

    # Find most recent appointment with s3_prescription
    appointments = await db.appointments.find({"patientId": pid}).sort("createdAt", -1).to_list(length=20)
    if not appointments:
        print("\nNo appointments found for this patient.")
        client.close()
        return

    appointment_id = None
    s3_prescription = None
    appointment = None

    for apt in appointments:
        aid = str(apt["_id"])
        presc = await db.s3_prescriptions.find_one(
            {"appointmentId": aid},
            sort=[("createdAt", -1)]
        )
        if presc and presc.get("s3Key"):
            appointment_id = aid
            s3_prescription = presc
            appointment = apt
            break

    if not appointment_id or not s3_prescription:
        print("\nNo appointment with an uploaded prescription found for Sunpreet.")
        print("Please upload a prescription from the doctor consultation page first.")
        client.close()
        return

    print(f"\nAppointment: {appointment_id}")
    print(f"  Date: {appointment.get('date')} {appointment.get('time')}")
    print(f"  Status: {appointment.get('status')}")
    print(f"  Reason: {appointment.get('reason', 'N/A')}")

    # Check structuredDetails (AI extraction)
    structured = s3_prescription.get("structuredDetails")
    if not structured:
        print("\n⚠️  Prescription uploaded but NOT YET analyzed.")
        print("  (Analysis runs in background after upload. If it was just uploaded, wait a few seconds and run again.)")
        print(f"  s3Key: {s3_prescription.get('s3Key', 'N/A')}")
        print(f"  uploadedAt: {s3_prescription.get('uploadedAt', 'N/A')}")
        client.close()
        return

    print("\n" + "=" * 70)
    print("AI EXTRACTED DETAILS")
    print("=" * 70)

    # Patient info from prescription
    print("\nPatient info (from prescription):")
    print(f"  Name: {structured.get('patientName', 'N/A')}")
    print(f"  Age: {structured.get('patientAge', 'N/A')}")
    print(f"  Gender: {structured.get('patientGender', 'N/A')}")

    # Doctor info
    print("\nDoctor info:")
    print(f"  Name: {structured.get('doctorName', 'N/A')}")
    print(f"  License: {structured.get('doctorLicenseNumber', 'N/A')}")

    # Prescription date
    print(f"\nPrescription date: {structured.get('prescriptionDate', 'N/A')}")

    # Medications
    medicines = structured.get("medicines") or []
    print(f"\nMedications ({len(medicines)}):")
    for i, m in enumerate(medicines, 1):
        print(f"  {i}. {m.get('name', 'N/A')}")
        print(f"     Dosage: {m.get('dosage', '')} | Frequency: {m.get('frequency', '')} | Duration: {m.get('duration', '')}")
        if m.get("instructions"):
            print(f"     Instructions: {m.get('instructions')[:80]}...")

    # Tests
    tests = structured.get("tests") or []
    print(f"\nTests ({len(tests)}):")
    for i, t in enumerate(tests, 1):
        print(f"  {i}. {t.get('name', 'N/A')}")
        if t.get("instructions"):
            print(f"     Instructions: {t.get('instructions')}")

    # Follow-up
    print(f"\nFollow-up: {structured.get('followUpRequired', False)}")
    if structured.get("followUpDuration"):
        print(f"  Duration: {structured.get('followUpDuration')}")
    if structured.get("followUpDays"):
        print(f"  In days: {structured.get('followUpDays')}")

    if structured.get("additionalNotes"):
        print(f"\nAdditional notes: {structured.get('additionalNotes')[:200]}...")

    # Verify appointment and patient were updated
    print("\n" + "=" * 70)
    print("VERIFICATION: Appointments & Patient Updated")
    print("=" * 70)

    apt_updated = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    prescribed_meds = apt_updated.get("prescribedMedications") or []
    prescribed_test = apt_updated.get("prescribedTest") or ""

    print(f"\nAppointment prescribedMedications: {len(prescribed_meds)}")
    for m in prescribed_meds[:5]:
        print(f"  - {m.get('name')} ({m.get('dosage')})")
    if len(prescribed_meds) > 5:
        print(f"  ... and {len(prescribed_meds) - 5} more")

    print(f"\nAppointment prescribedTest: {prescribed_test or 'None'}")

    patient_updated = await db.patients.find_one({"_id": ObjectId(pid)})
    current_meds = patient_updated.get("currentMedications") or []
    print(f"\nPatient currentMedications: {len(current_meds)} total")
    # Show only recent ones
    for m in current_meds[-5:]:
        print(f"  - {m.get('name')} ({m.get('dosage')})")
    if len(current_meds) > 5:
        print(f"  ... and {len(current_meds) - 5} more (from previous prescriptions)")

    print("\n" + "=" * 70)
    print("✅ Verification complete")
    print("=" * 70)

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
