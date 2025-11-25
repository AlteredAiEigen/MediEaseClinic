#!/usr/bin/env python3
"""
Seed the MongoDB database with rich data for the patient overview demo.

Creates/updates:
- Patient profile (Prakash Sahu)
- Vitals timeline
- Lab reports with detailed tests
- Clinical notes
- Appointment history (upcoming + past)
"""

import asyncio
import os
from datetime import datetime

from bson import ObjectId
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/mediease")
DB_NAME = os.getenv("MONGODB_DB_NAME", "mediease")
DOCTOR_EMAIL = os.getenv("SEED_PATIENT_DOCTOR_EMAIL", "channusingh1424@gmail.com").lower()

PATIENT_OBJECT_ID = ObjectId("691c79945b394c2a77282894")
PATIENT_ID = "PRA123"
EMPTY_PATIENT_OBJECT_ID = ObjectId("691c79945b394c2a77282895")
EMPTY_PATIENT_ID = "PRA000"


def format_timestamp(date_str: str, hour: int = 9, minute: int = 0) -> datetime:
    """Helper to create datetime objects from YYYY-MM-DD strings."""
    dt = datetime.fromisoformat(date_str)
    return dt.replace(hour=hour, minute=minute, second=0, microsecond=0)


async def seed_patient_overview():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    try:
        doctor = await db.users.find_one({"email": DOCTOR_EMAIL, "role": "doctor"})
        if not doctor:
            print("❌ Doctor not found. Please run seed_doctor_data.py first.")
            return

        doctor_id = str(doctor["_id"])
        clinic_id = doctor.get("clinicId")
        clinic_name = doctor.get("clinicName", "MediEase Clinic")
        now = datetime.utcnow()

        # --------------------------
        # Patient Profile
        # --------------------------
        patient_profile = {
            "patientId": PATIENT_ID,
            "firstName": "Prakash",
            "lastName": "Sahu",
            "gender": "Male",
            "age": "47",
            "bloodGroup": "B+",
            "dateOfBirth": "1977-06-15",
            "email": "prakash.sahu@example.com",
            "phone": "+91-98765-22334",
            "address": "Sector 21, Dwarka, New Delhi",
            "presentInClinic": False,
            "clinicId": clinic_id,
            "createdByClinicName": clinic_name,
            "medicalHistory": [
                {
                    "title": "Hypertension",
                    "diagnosis": "Essential hypertension, controlled",
                    "treatedBy": "Dr. Gunjan",
                    "recordedOn": "2024-01-15",
                    "notes": "Lifestyle modification plan with medication adherence review.",
                },
                {
                    "title": "Type 2 Diabetes",
                    "diagnosis": "Type 2 Diabetes Mellitus, managed",
                    "treatedBy": "Dr. Gunjan",
                    "recordedOn": "2023-11-20",
                    "notes": "Metformin initiated, nutrition counseling provided.",
                },
            ],
            "allergies": ["Penicillin"],
            "condition": "Hypertension with comorbid Type 2 Diabetes",
            "chiefComplaint": "Follow-up for BP management and diabetes monitoring",
            "carePlanSummary": "Maintain medication adherence, monitor vitals weekly, review labs quarterly.",
            "followUpPlan": "Next review in 30 days with fasting lab panel.",
            "currentMedications": [
                {
                    "name": "Metformin",
                    "dosage": "500 mg",
                    "frequency": "Twice daily",
                    "startDate": "2023-11-20",
                    "instructions": "Take with meals",
                },
                {
                    "name": "Lisinopril",
                    "dosage": "10 mg",
                    "frequency": "Once daily",
                    "startDate": "2024-01-15",
                },
                {
                    "name": "Aspirin",
                    "dosage": "81 mg",
                    "frequency": "Once daily",
                    "startDate": "2024-01-15",
                },
            ],
            "vitals": {
                "bloodPressure": "132/84",
                "heartRate": "78",
                "temperature": "98.4",
                "oxygenSaturation": "97",
                "weight": "78",
                "bloodGlucose": "105",
                "respiratoryRate": "16",
                "height": "172",
                "bmi": "26.4",
            },
            "insights": {
                "riskAssessment": "Cardio-metabolic risk in next 12 months: 18%",
                "riskLevel": "medium",
                "successRate": "88%",
                "keyFindings": [
                    "BP trending down with current regimen",
                    "HbA1c stable around 7%",
                    "Lifestyle adherence improving",
                ],
                "recommendations": [
                    "Continue ACE inhibitors",
                    "Quarterly fasting labs",
                    "Daily home BP monitoring",
                ],
                "lastUpdatedAt": now.isoformat(),
            },
            "insuranceProvider": "Ayushman Bharat",
            "insurancePlanName": "Pradhan Mantri Jan Arogya Yojana",
            "insuranceNumber": "8765 4321 0987 6543",
            "insuranceCoverageLimit": "₹5,00,000",
            "insuranceCoverageUsed": "₹45,000",
            "insuranceNotes": "Coverage includes hospitalization, surgical procedures, and medications.",
            "insuranceClaims": [
                {
                    "claimId": "CLM-2023-12-001",
                    "amount": "₹15,000",
                    "status": "Approved",
                    "description": "Hospitalization for diabetes management",
                    "date": "2023-12-09",
                }
            ],
            "updatedAt": now,
        }

        await db.patients.update_one(
            {"_id": PATIENT_OBJECT_ID},
            {
                "$set": patient_profile,
                "$setOnInsert": {"_id": PATIENT_OBJECT_ID, "createdAt": now},
            },
            upsert=True,
        )
        print("✅ Patient profile upserted.")

        # --------------------------
        # Insurance records
        # --------------------------
        await db.patient_insurances.delete_many({"patientId": str(PATIENT_OBJECT_ID)})
        insurance_records = [
            {
                "patientId": str(PATIENT_OBJECT_ID),
                "provider": "Ayushman Bharat",
                "planName": "Pradhan Mantri Jan Arogya Yojana",
                "policyNumber": "PMJAY-2023-MH-123456",
                "cardNumber": "8765 4321 0987 6543",
                "memberName": "Prakash Sahu",
                "status": "Active",
                "coverageLimit": "₹5,00,000",
                "coverageUsed": "₹45,000",
                "coverageRemaining": "₹4,55,000",
                "validFrom": "2023-04-01",
                "validUntil": "2024-03-31",
                "familyMembersCovered": 5,
                "notes": "Coverage includes hospitalization, surgical procedures, and medications.",
                "isPrimary": True,
                "createdAt": now,
                "updatedAt": now,
            }
        ]
        if insurance_records:
            await db.patient_insurances.insert_many(insurance_records)
            print("✅ Seeded patient insurance records.")

        # --------------------------
        # Vitals timeline
        # --------------------------
        await db.patient_vitals.delete_many({"patientId": str(PATIENT_OBJECT_ID)})
        vitals_entries = [
            {
                "patientId": str(PATIENT_OBJECT_ID),
                "recordedBy": doctor_id,
                "bloodPressure": "138/86",
                "heartRate": "82",
                "temperature": "98.7",
                "oxygenSaturation": "96",
                "weight": "79",
                "bloodGlucose": "118",
                "respiratoryRate": "18",
                "height": "172",
                "notes": "Mildly elevated BP. Reinforced diet plan.",
                "recordedAt": format_timestamp("2023-11-20"),
                "createdAt": now,
                "updatedAt": now,
            },
            {
                "patientId": str(PATIENT_OBJECT_ID),
                "recordedBy": doctor_id,
                "bloodPressure": "132/84",
                "heartRate": "78",
                "temperature": "98.4",
                "oxygenSaturation": "97",
                "weight": "78",
                "bloodGlucose": "104",
                "respiratoryRate": "16",
                "height": "172",
                "notes": "BP improving. Continue current meds.",
                "recordedAt": format_timestamp("2024-01-15"),
                "createdAt": now,
                "updatedAt": now,
            },
        ]
        if vitals_entries:
            await db.patient_vitals.insert_many(vitals_entries)
            print(f"✅ Inserted {len(vitals_entries)} vitals entries.")

        # --------------------------
        # Lab Reports
        # --------------------------
        await db.lab_reports.delete_many({"patientId": str(PATIENT_OBJECT_ID)})
        lab_reports = [
            {
                "patientId": str(PATIENT_OBJECT_ID),
                "doctorId": doctor_id,
                "reportType": "Quarterly Comprehensive Panel",
                "category": "Metabolic",
                "orderedBy": "Dr. Gunjan",
                "labName": "MediEase Diagnostics",
                "collectedDate": "2024-01-10",
                "reportedDate": "2024-01-11",
                "tests": [
                    {
                        "name": "Complete Blood Count",
                        "result": "13.2",
                        "unit": "g/dL",
                        "normalRange": "13.0 - 17.0",
                        "status": "normal",
                    },
                    {
                        "name": "Lipid Panel (Total Cholesterol)",
                        "result": "245",
                        "unit": "mg/dL",
                        "normalRange": "< 200",
                        "status": "high",
                        "flag": "Needs dietary intervention",
                    },
                    {
                        "name": "HbA1c",
                        "result": "7.1",
                        "unit": "%",
                        "normalRange": "< 5.7",
                        "status": "high",
                    },
                    {
                        "name": "Serum Creatinine",
                        "result": "1.2",
                        "unit": "mg/dL",
                        "normalRange": "0.6 - 1.3",
                        "status": "normal",
                    },
                ],
                "notes": "HbA1c slightly elevated. Reinforce diabetes counseling.",
                "interpretation": "Overall stable. Continue current medication with lifestyle tweaks.",
                "isCritical": False,
                "isReviewed": True,
                "reviewedBy": doctor_id,
                "createdAt": now,
                "updatedAt": now,
                "isActive": True,
                "createdBy": doctor_id,
                "reportId": "LAB240111",
            },
            {
                "patientId": str(PATIENT_OBJECT_ID),
                "doctorId": doctor_id,
                "reportType": "Renal & Hematology Panel",
                "category": "Follow-up",
                "orderedBy": "Dr. Gunjan",
                "labName": "MediEase Diagnostics",
                "collectedDate": "2023-11-15",
                "reportedDate": "2023-11-16",
                "tests": [
                    {
                        "name": "Complete Blood Count",
                        "result": "13.5",
                        "unit": "g/dL",
                        "normalRange": "13.0 - 17.0",
                        "status": "normal",
                    },
                    {
                        "name": "Kidney Function (eGFR)",
                        "result": "92",
                        "unit": "mL/min/1.73m²",
                        "normalRange": "> 90",
                        "status": "normal",
                    },
                ],
                "notes": "Baseline labs prior to medication adjustment.",
                "interpretation": "Kidney function stable.",
                "isCritical": False,
                "isReviewed": True,
                "reviewedBy": doctor_id,
                "createdAt": now,
                "updatedAt": now,
                "isActive": True,
                "createdBy": doctor_id,
                "reportId": "LAB231116",
            },
        ]
        if lab_reports:
            await db.lab_reports.insert_many(lab_reports)
            print(f"✅ Inserted {len(lab_reports)} lab reports.")

        # --------------------------
        # Clinical Notes
        # --------------------------
        await db.clinical_notes.delete_many({"patient": str(PATIENT_OBJECT_ID)})
        clinical_notes = [
            {
                "noteId": "CN-20240115-01",
                "patient": str(PATIENT_OBJECT_ID),
                "doctor": doctor_id,
                "type": "diagnosis",
                "title": "Hypertension & Diabetes Review",
                "content": "Patient reports good medication adherence. BP slightly elevated. Discussed lifestyle modifications including diet and exercise.",
                "category": "consultation",
                "priority": "medium",
                "status": "reviewed",
                "timestamp": "10:00",
                "actionable": False,
                "completed": True,
                "patient_name": "Prakash Sahu",
                "doctor_name": doctor.get("firstName", "Doctor"),
                "created_at": format_timestamp("2024-01-15", 10, 0),
                "updated_at": format_timestamp("2024-01-15", 10, 0),
            },
            {
                "noteId": "CN-20231120-01",
                "patient": str(PATIENT_OBJECT_ID),
                "doctor": doctor_id,
                "type": "followup",
                "title": "Lifestyle Counseling Session",
                "content": "Reviewed nutrition goals, home BP monitoring, and physical activity targets.",
                "category": "follow-up",
                "priority": "low",
                "status": "reviewed",
                "timestamp": "09:30",
                "actionable": False,
                "completed": True,
                "patient_name": "Prakash Sahu",
                "doctor_name": doctor.get("firstName", "Doctor"),
                "created_at": format_timestamp("2023-11-20", 9, 30),
                "updated_at": format_timestamp("2023-11-20", 9, 30),
            },
        ]
        if clinical_notes:
            await db.clinical_notes.insert_many(clinical_notes)
            print(f"✅ Inserted {len(clinical_notes)} clinical notes.")

        # --------------------------
        # Appointments
        # --------------------------
        await db.appointments.delete_many({"patientId": str(PATIENT_OBJECT_ID)})
        appointments = [
            {
                "appointmentId": "APT-2024-02-15",
                "patientId": str(PATIENT_OBJECT_ID),
                "doctorId": doctor_id,
                "doctorName": f"{doctor.get('firstName', 'Dr.')} {doctor.get('lastName', '')}".strip(),
                "date": "2024-02-15",
                "time": "10:00",
                "type": "Follow-up",
                "status": "scheduled",
                "reason": "Quarterly follow-up",
                "duration": 30,
                "clinicId": clinic_id,
                "clinicName": clinic_name,
                "createdAt": now,
                "updatedAt": now,
            },
            {
                "appointmentId": "APT-2024-01-15",
                "patientId": str(PATIENT_OBJECT_ID),
                "doctorId": doctor_id,
                "doctorName": f"{doctor.get('firstName', 'Dr.')} {doctor.get('lastName', '')}".strip(),
                "date": "2024-01-15",
                "time": "09:30",
                "type": "Consultation",
                "status": "completed",
                "reason": "BP & diabetes review",
                "duration": 30,
                "clinicId": clinic_id,
                "clinicName": clinic_name,
                "createdAt": now,
                "updatedAt": now,
            },
        ]
        if appointments:
            await db.appointments.insert_many(appointments)
            print(f"✅ Inserted {len(appointments)} appointments.")

        # --------------------------
        # Blank demo patient
        # --------------------------
        empty_patient_profile = {
            "patientId": EMPTY_PATIENT_ID,
            "firstName": "Asha",
            "lastName": "Noor",
            "gender": "",
            "age": "",
            "bloodGroup": "",
            "dateOfBirth": "",
            "email": "",
            "phone": "",
            "address": "",
            "presentInClinic": False,
            "clinicId": clinic_id,
            "createdByClinicName": clinic_name,
            "medicalHistory": [],
            "allergies": [],
            "condition": "",
            "chiefComplaint": "",
            "carePlanSummary": "",
            "followUpPlan": "",
            "currentMedications": [],
            "vitals": {},
            "insights": {},
            "insuranceProvider": "",
            "insurancePlanName": "",
            "insuranceNumber": "",
            "insuranceCoverageLimit": "",
            "insuranceCoverageUsed": "",
            "insuranceNotes": "",
            "insuranceClaims": [],
            "updatedAt": now,
        }

        await db.patients.update_one(
            {"_id": EMPTY_PATIENT_OBJECT_ID},
            {
                "$set": empty_patient_profile,
                "$setOnInsert": {"_id": EMPTY_PATIENT_OBJECT_ID, "createdAt": now},
            },
            upsert=True,
        )
        await db.patient_vitals.delete_many({"patientId": str(EMPTY_PATIENT_OBJECT_ID)})
        await db.lab_reports.delete_many({"patientId": str(EMPTY_PATIENT_OBJECT_ID)})
        await db.clinical_notes.delete_many({"patient": str(EMPTY_PATIENT_OBJECT_ID)})
        await db.appointments.delete_many({"patientId": str(EMPTY_PATIENT_OBJECT_ID)})
        print("✅ Blank patient profile upserted (no associated records).")

        print("\n🎉 Patient overview data seeded successfully!")

    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(seed_patient_overview())

