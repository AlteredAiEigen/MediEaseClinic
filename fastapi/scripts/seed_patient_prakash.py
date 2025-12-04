#!/usr/bin/env python3
"""
Seed script to create a richly populated patient profile for demo purposes.

Creates/updates:
  - Patient "Prakash Sahu" with vitals, histories, medications, insights
  - A completed appointment with detailed consultation notes
  - An upcoming follow-up appointment
  - Lab report with multiple test values
  - Clinical note referencing the completed appointment
"""

import asyncio
import os
from datetime import datetime, timedelta
from typing import Dict, Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv


load_dotenv()

# Parse MongoDB URI - handle case where DB name is in URI
# Try both naming conventions (app uses mongodb_url, some scripts use MONGODB_URI)
MONGO_URI_RAW = os.getenv("MONGODB_URI") or os.getenv("mongodb_url") or "mongodb://localhost:27017"
DB_NAME = os.getenv("MONGODB_DB_NAME") or os.getenv("database_name") or "mediease"

# If URI contains database name after the port/host, extract it
# Format: mongodb://host:port/dbname or mongodb://host:port/dbname?options
uri_without_query = MONGO_URI_RAW.split("?")[0]
if uri_without_query.count("/") >= 3:  # Has protocol, host, port, and possibly dbname
    parts = uri_without_query.rsplit("/", 1)
    if len(parts) == 2 and parts[1] and parts[1] not in ["", "test", "admin", "local"]:
        # Database name is in URI
        MONGO_URI = parts[0]
        if not DB_NAME or DB_NAME == "mediease":
            DB_NAME = parts[1]
    else:
        # No database name in URI
        MONGO_URI = MONGO_URI_RAW
else:
    # Standard format without db name
    MONGO_URI = MONGO_URI_RAW

DOCTOR_EMAIL = os.getenv("PRAKASH_DOCTOR_EMAIL", "channusingh1424@gmail.com")

print(f"🔌 Connecting to MongoDB: {MONGO_URI}")
print(f"📊 Database: {DB_NAME}")


def iso_day(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d")


async def upsert_one(collection, filter_query: Dict[str, Any], set_data: Dict[str, Any], set_on_insert: Dict[str, Any]):
    """Utility to upsert a document with separate created/updated timestamps."""
    # Remove any fields from set_data that are also in set_on_insert to avoid conflicts
    set_data_clean = {k: v for k, v in set_data.items() if k not in set_on_insert}
    
    update_op = {}
    if set_data_clean:
        update_op["$set"] = set_data_clean
    if set_on_insert:
        update_op["$setOnInsert"] = set_on_insert
    
    await collection.update_one(
        filter_query,
        update_op,
        upsert=True,
    )


async def seed_prakash():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    try:
        doctor = await db.users.find_one({"email": DOCTOR_EMAIL.lower(), "role": "doctor"})
        if not doctor:
            doctor = await db.users.find_one({"role": "doctor"})

        if not doctor:
            raise RuntimeError("No doctor account found. Please create a doctor first.")

        doctor_id = str(doctor["_id"])
        doctor_name = f"{doctor.get('firstName', 'Doctor')} {doctor.get('lastName', '')}".strip()
        clinic_id = doctor.get("clinicId") or os.getenv("DEFAULT_CLINIC_ID", "DEMOCLINIC")
        clinic_name = doctor.get("clinicName", "MediEase Clinic")

        patient_email = "prakash.sahu@example.com"
        patients = db.patients

        existing_patient = await patients.find_one({"email": patient_email})
        if existing_patient:
            patient_id_value = existing_patient.get("patientId", "PRA123")
            patient_oid = existing_patient["_id"]
            print(f"📋 Found existing patient: {existing_patient.get('firstName')} {existing_patient.get('lastName')}")
        else:
            patient_id_value = "PRA123"
            patient_oid = ObjectId()
            print(f"➕ Creating new patient record")
        patient_id_str = str(patient_oid)

        now = datetime.utcnow()
        patient_doc = {
            "firstName": "Prakash",
            "lastName": "Sahu",
            "gender": "Male",
            "age": "47",
            "bloodGroup": "B+",
            "dateOfBirth": "1978-04-22",
            "email": patient_email,
            "phone": "+91-98765-22334",
            "address": "Row House 14, Shanti Residency, Bhopal, India",
            "allergies": ["Penicillin (rash)"],
            "familyHistory": "Father with CAD at 54, mother with T2DM",
            "currentSymptoms": "Recently reported mild fatigue towards evenings",
            "chiefComplaint": "3-month chronic disease review",
            "carePlanSummary": "Maintain BP <130/80, HbA1c <7%, encourage 30 min brisk walk 5x/week",
            "followUpPlan": "Tele-follow-up in 4 weeks to review home BP/glucose log",
            "presentInClinic": False,
            "clinicId": clinic_id,
            "clinicName": clinic_name,
            "insights": {
                "riskAssessment": "Moderate cardiovascular risk; ASCVD ~9%",
                "riskLevel": "medium",
                "successRate": "90%",
                "keyFindings": [
                    "BP mildly above target (128/82) despite adherence",
                    "Fasting glucose trending down but still above goal (118 mg/dL)",
                ],
                "recommendations": [
                    "Continue lifestyle plan, add evening walk",
                    "Schedule retinal exam within 3 months",
                ],
                "lastUpdatedAt": now.isoformat(),
            },
            "patientId": patient_id_value,
            "createdAt": (existing_patient.get("createdAt") if existing_patient else now),
            "updatedAt": now,
        }

        if existing_patient:
            await patients.update_one({"_id": patient_oid}, {"$set": patient_doc})
            print(f"🔄 Updated existing patient record for {patient_doc['firstName']} {patient_doc['lastName']}")
        else:
            patient_doc["_id"] = patient_oid
            await patients.insert_one(patient_doc)
            print(f"✅ Created patient record for {patient_doc['firstName']} {patient_doc['lastName']} ({patient_id_value})")

        # Appointments
        appointments = db.appointments
        patient_name = f"{patient_doc['firstName']} {patient_doc['lastName']}"
        past_appt_id = "APT-PRAKASH-CHECKIN"
        future_appt_id = "APT-PRAKASH-FOLLOWUP"

        past_date = now - timedelta(days=12)
        structured_notes = {
            "chiefComplaint": "3-month chronic disease review visit",
            "historyOfPresentIllness": (
                "Maintaining medication adherence with occasional evening fatigue. "
                "Home BP readings average 126-130/80-84. Fasting sugars 110-125 mg/dL."
            ),
            "reviewOfSystems": "No chest pain, dyspnea, or neuropathy. Reports mild stress at work.",
            "physicalExamination": "Clear lungs, regular heart sounds, no edema. Feet exam normal.",
            "assessment": "T2DM with improving control, hypertension controlled, dyslipidemia stable.",
            "plan": (
                "Continue Amlodipine 5 mg OD, Metformin XR 500 mg BD, Atorvastatin 20 mg HS. "
                "Add Vitamin D3 60k IU weekly x8 weeks. Encourage evening walks and stress management."
            ),
            "medications": [
                "Amlodipine 5 mg once daily",
                "Metformin XR 500 mg twice daily",
                "Atorvastatin 20 mg at bedtime",
                "Vitamin D3 60k IU weekly (8 weeks)",
            ],
            "allergies": ["Penicillin"],
            "followUpInstructions": "Maintain home BP/glucose log and share via portal in 4 weeks.",
            "differentialDiagnosis": ["Medication-related fatigue", "Lifestyle factors"],
            "clinicalImpression": "Chronic disease control improving with current regimen.",
        }

        past_appt_doc = {
            "appointmentId": past_appt_id,
            "patientId": patient_id_str,
            "doctorId": doctor_id,
            "patientName": patient_name,
            "doctorName": doctor_name,
            "scheduledBy": doctor_id,
            "scheduledByName": doctor_name,
            "clinicId": clinic_id,
            "date": iso_day(past_date),
            "time": "09:30",
            "duration": 30,
            "status": "completed",
            "reason": "Chronic disease management review",
            "notes": structured_notes["historyOfPresentIllness"],
            "presentInClinic": False,
            "consultationNotes": structured_notes["plan"],
            "consultationSummary": {
                "problems": [
                    "Type 2 diabetes mellitus",
                    "Hypertension",
                    "Dyslipidemia",
                ],
                "nextSteps": [
                    "Upload home monitoring log in 4 weeks",
                    "Repeat fasting labs in 3 months",
                    "Schedule ophthalmology exam",
                ],
            },
            "structuredNotes": structured_notes,
            "followUpNotes": structured_notes["followUpInstructions"],
            "transcription": (
                "Patient reports adherence to medications with mild evening fatigue. "
                "BP readings 126-130/80-84, fasting sugars improved to 118 mg/dL. "
                "Plan: continue meds, add vitamin D, reinforce exercise."
            ),
            "completedAt": past_date.replace(hour=10, minute=5),
            "createdAt": past_date - timedelta(days=1),
            "updatedAt": now,
        }

        await upsert_one(
            appointments,
            {"appointmentId": past_appt_id},
            past_appt_doc,
            {"createdAt": past_appt_doc["createdAt"]},
        )
        past_record = await appointments.find_one({"appointmentId": past_appt_id})
        past_appt_oid = str(past_record["_id"])
        print(f"✅ Upserted completed appointment {past_appt_id}")

        future_date = now + timedelta(days=6)
        future_appt_doc = {
            "appointmentId": future_appt_id,
            "patientId": patient_id_str,
            "doctorId": doctor_id,
            "patientName": patient_name,
            "doctorName": doctor_name,
            "scheduledBy": doctor_id,
            "scheduledByName": doctor_name,
            "clinicId": clinic_id,
            "date": iso_day(future_date),
            "time": "11:15",
            "duration": 30,
            "status": "scheduled",
            "reason": "Follow-up to review lab results and home log",
            "notes": "Plan to review uploaded BP/glucose readings and adjust meds if needed.",
            "presentInClinic": False,
            "createdAt": now,
            "updatedAt": now,
        }

        await upsert_one(
            appointments,
            {"appointmentId": future_appt_id},
            future_appt_doc,
            {"createdAt": now},
        )
        print(f"✅ Upserted upcoming appointment {future_appt_id}")

        # Lab report
        lab_reports = db.lab_reports
        lab_report_id = "LAB-PRAKASH-CMP"
        lab_doc = {
            "reportId": lab_report_id,
            "patientId": patient_id_str,
            "doctorId": doctor_id,
            "reportType": "Comprehensive Metabolic Panel",
            "category": "Metabolic",
            "orderedBy": doctor_name,
            "labName": "Sunrise Diagnostics",
            "collectedDate": iso_day(past_date - timedelta(days=2)),
            "reportedDate": iso_day(past_date - timedelta(days=1)),
            "notes": "Fasting sample. Mildly elevated glucose, lipids near target, kidney/liver normal.",
            "interpretation": "Continue current plan; reinforce nutrition and exercise.",
            "tests": [
                {
                    "name": "Fasting Glucose",
                    "result": "118",
                    "unit": "mg/dL",
                    "normalRange": "70-99",
                    "status": "high",
                    "flag": "Above target range",
                },
                {
                    "name": "HbA1c (point-of-care)",
                    "result": "6.9",
                    "unit": "%",
                    "normalRange": "< 6.5",
                    "status": "high",
                    "flag": "Close to goal",
                },
                {
                    "name": "LDL Cholesterol",
                    "result": "96",
                    "unit": "mg/dL",
                    "normalRange": "< 100",
                    "status": "normal",
                },
                {
                    "name": "Creatinine",
                    "result": "0.9",
                    "unit": "mg/dL",
                    "normalRange": "0.7-1.3",
                    "status": "normal",
                },
                {
                    "name": "ALT",
                    "result": "28",
                    "unit": "U/L",
                    "normalRange": "0-40",
                    "status": "normal",
                },
            ],
            "isCritical": False,
            "isReviewed": True,
            "createdBy": doctor_id,
            "reviewedBy": doctor_id,
            "createdAt": now,
            "updatedAt": now,
        }

        await upsert_one(
            lab_reports,
            {"reportId": lab_report_id},
            lab_doc,
            {"createdAt": now},
        )
        print(f"✅ Upserted lab report {lab_report_id}")

        # Clinical note
        clinical_notes = db.clinical_notes
        note_id = "NOTE-PRAKASH-CHECKIN"
        note_doc = {
            "note_id": note_id,
            "patient": patient_id_str,
            "doctor": doctor_id,
            "appointment": past_appt_oid,
            "type": "consultation",
            "title": "Chronic disease management review",
            "content": (
                "Discussed medication adherence, reinforced lifestyle goals, "
                "documented vitamin D supplementation plan, and scheduled follow-up."
            ),
            "category": "consultation",
            "priority": "medium",
            "status": "approved",
            "timestamp": "09:45",
            "actionable": True,
            "action_items": [
                {"item": "Upload home BP/glucose log in 4 weeks", "completed": False},
                {"item": "Book retinal exam", "completed": False},
            ],
            "tags": ["chronic-care", "diabetes", "hypertension"],
            "followUp": {"required": True, "date": iso_day(future_date), "notes": "Virtual OK", "priority": "medium"},
            "prescription": {
                "medication_name": "Vitamin D3",
                "dosage": "60,000 IU",
                "frequency": "weekly",
                "duration": "8 weeks",
                "instructions": "Take after breakfast",
            },
            "aiGenerated": False,
            "confidence": 0.9,
            "patient_name": patient_name,
            "doctor_name": doctor_name,
            "createdAt": past_date,
            "updatedAt": now,
        }

        await upsert_one(
            clinical_notes,
            {"note_id": note_id},
            note_doc,
            {"created_at": past_date},
        )
        print(f"✅ Upserted clinical note {note_id}")

        # Verify patient was created/updated
        verify_patient = await patients.find_one({"email": patient_email})
        if verify_patient:
            print(f"\n✅ VERIFICATION: Patient '{verify_patient.get('firstName')} {verify_patient.get('lastName')}' found in database")
            print(f"   Patient ID: {verify_patient.get('patientId')}")
            print(f"   Email: {verify_patient.get('email')}")
            print(f"   ObjectId: {verify_patient['_id']}")
        else:
            print(f"\n❌ ERROR: Patient was not found in database after seeding!")
            raise RuntimeError("Patient creation failed - patient not found after insert")

        print("\n🎉 Patient seeding complete! Review the MediEase UI to see Prakash Sahu across patients, appointments, labs, and notes.")

    except Exception as e:
        print(f"\n❌ ERROR during seeding: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(seed_prakash())

