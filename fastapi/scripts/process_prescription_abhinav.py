#!/usr/bin/env python3
"""
Process prescription for patient: Abhinav Kumar, ID: APT17048020.

Finds the patient by name or patientId, finds their most recent appointment
that has an uploaded prescription, and runs AI prescription analysis (GPT-4o vision).
"""

import asyncio
import sys

# Run from fastapi directory so app imports work
sys.path.insert(0, "/home/ec2-user/MediEaseClinic/fastapi")

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from app.config import settings


async def main():
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]

    patient_name = "Abhinav Kumar"
    patient_id_lookup = "APT17048020"

    print("=" * 60)
    print("Process prescription: Abhinav Kumar (ID: APT17048020)")
    print("=" * 60)

    # Find patient by fullName or patientId
    patient = await db.patients.find_one(
        {
            "$or": [
                {"fullName": {"$regex": "Abhinav.*Kumar|Kumar.*Abhinav", "$options": "i"}},
                {"patientId": patient_id_lookup},
                {"firstName": {"$regex": "Abhinav", "$options": "i"}, "lastName": {"$regex": "Kumar", "$options": "i"}},
            ]
        }
    )

    if not patient:
        print("No patient found for 'Abhinav Kumar' or ID 'APT17048020'.")
        print("Searched: fullName, patientId, firstName+lastName.")
        client.close()
        return

    pid = str(patient["_id"])
    pname = patient.get("fullName") or f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip()
    print(f"Patient: {pname} (MongoDB _id: {pid}, patientId: {patient.get('patientId', 'N/A')})")

    # Find appointments for this patient
    appointments = await db.appointments.find({"patientId": pid}).sort("createdAt", -1).to_list(length=50)
    if not appointments:
        print("No appointments found for this patient.")
        client.close()
        return

    print(f"Found {len(appointments)} appointment(s). Checking for uploaded prescriptions...")

    # Find the most recent appointment that has an s3_prescription
    appointment_id = None
    s3_prescription = None

    for apt in appointments:
        aid = str(apt["_id"])
        presc = await db.s3_prescriptions.find_one(
            {"appointmentId": aid},
            sort=[("createdAt", -1)]
        )
        if presc and presc.get("s3Key"):
            appointment_id = aid
            s3_prescription = presc
            print(f"Using appointment: {aid} (date: {apt.get('date')}, time: {apt.get('time')}, status: {apt.get('status')})")
            break

    if not appointment_id or not s3_prescription:
        print("No appointment with an uploaded prescription image found for this patient.")
        print("Please upload a prescription for an appointment first (e.g. at checkout or in consultation).")
        client.close()
        return

    # Run the same analysis as the API endpoint
    from app.routers.appointments import _analyze_s3_prescription

    try:
        print("Running prescription analysis (GPT-4o vision)...")
        structured_details = await _analyze_s3_prescription(db, s3_prescription, appointment_id)
        medicines = structured_details.get("medicines") or []
        tests = structured_details.get("tests") or []
        print("Prescription processed successfully.")
        print(f"  Medicines: {len(medicines)}")
        for m in medicines[:10]:
            print(f"    - {m.get('name')} ({m.get('dosage')}, {m.get('frequency')})")
        if len(medicines) > 10:
            print(f"    ... and {len(medicines) - 10} more")
        print(f"  Tests: {len(tests)}")
        for t in tests[:5]:
            print(f"    - {t.get('name')}")
        if len(tests) > 5:
            print(f"    ... and {len(tests) - 5} more")
    except Exception as e:
        print(f"Analysis failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
