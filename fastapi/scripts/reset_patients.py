"""
Utility script to remove all existing patients and seed fresh demo data.

Usage:
    cd fastapi
    python scripts/reset_patients.py
"""

import asyncio
from datetime import datetime
from typing import List, Dict

from dotenv import load_dotenv

from app.database import Database
from app.services.patient_service import PatientService
from app.models.patient import PatientCreate


def sample_patients() -> List[Dict]:
    now = datetime.utcnow().isoformat()
    return [
        {
            "firstName": "Aarav",
            "lastName": "Malhotra",
            "gender": "Male",
            "age": "35",
            "bloodGroup": "A+",
            "dateOfBirth": "1989-03-12",
            "email": "aarav.malhotra+demo@mediease.com",
            "phone": "+1-555-0101",
            "address": "121 King Street, San Francisco, CA",
            "medicalHistory": "Hypertension, Prediabetes",
            "allergies": "Penicillin",
            "currentMedication": "Lisinopril 10mg daily, Metformin 500mg nightly",
            "condition": "Hypertension management",
            "carePlanSummary": "Continue ACE inhibitors, monitor BP daily, reduce sodium intake.",
            "followUpPlan": "Follow-up in 6 weeks with BP log.",
            "insights": {
                "riskAssessment": "Hypertension trending downward",
                "riskLevel": "medium",
                "successRate": "92%",
                "keyFindings": [
                    "BP readings improving for last three visits",
                    "Patient reports improved diet compliance",
                ],
                "recommendations": [
                    "Maintain current medication dosage",
                    "Add 20-minute brisk walk, 5 days a week",
                ],
                "lastUpdatedAt": now,
            },
            "vitals": {
                "bloodPressure": "132/86",
                "heartRate": "74",
                "oxygenSaturation": "98%",
            },
        },
        {
            "firstName": "Diya",
            "lastName": "Khanna",
            "gender": "Female",
            "age": "42",
            "bloodGroup": "O+",
            "dateOfBirth": "1982-07-24",
            "email": "diya.khanna+demo@mediease.com",
            "phone": "+1-555-0102",
            "address": "88 Lake Shore Blvd, Chicago, IL",
            "medicalHistory": "Asthma, Seasonal Allergies",
            "allergies": "Sulfa drugs",
            "currentMedication": "Budesonide-formoterol inhaler BID",
            "condition": "Asthma with seasonal triggers",
            "carePlanSummary": "Continue controller inhaler, keep rescue inhaler accessible.",
            "followUpPlan": "Pulmonology follow-up before winter.",
            "insights": {
                "riskAssessment": "Asthma stable on regimen",
                "riskLevel": "low",
                "successRate": "95%",
                "keyFindings": [
                    "No ER visits in past 12 months",
                    "Peak flow readings within target range",
                ],
                "recommendations": [
                    "Refill rescue inhaler monthly",
                    "Humidity control at home",
                ],
                "lastUpdatedAt": now,
            },
            "vitals": {
                "oxygenSaturation": "99%",
                "heartRate": "72",
                "temperature": "98.2°F",
            },
        },
        {
            "firstName": "Mateo",
            "lastName": "Garcia",
            "gender": "Male",
            "age": "28",
            "bloodGroup": "B-",
            "dateOfBirth": "1996-05-09",
            "email": "mateo.garcia+demo@mediease.com",
            "phone": "+1-555-0103",
            "address": "401 Sunset Ave, Austin, TX",
            "medicalHistory": "Anterior cruciate ligament repair (2019)",
            "allergies": "",
            "currentMedication": "Ibuprofen 400mg PRN",
            "condition": "Sports medicine follow-up",
            "carePlanSummary": "Resume physical therapy for strengthening, avoid high-impact jumps temporarily.",
            "followUpPlan": "PT progress review in 4 weeks.",
            "insights": {
                "riskAssessment": "Post-ACL rehab progressing",
                "riskLevel": "low",
                "successRate": "97%",
                "keyFindings": [
                    "Full extension achieved, mild flexion tightness",
                    "No swelling after moderate activity",
                ],
                "recommendations": [
                    "Continue quad/hamstring strengthening",
                    "Introduce proprioception ladder drills",
                ],
                "lastUpdatedAt": now,
            },
            "vitals": {"heartRate": "68", "weight": "182 lbs"},
        },
        {
            "firstName": "Lina",
            "lastName": "Chen",
            "gender": "Female",
            "age": "31",
            "bloodGroup": "AB+",
            "dateOfBirth": "1993-02-16",
            "email": "lina.chen+demo@mediease.com",
            "phone": "+1-555-0104",
            "address": "19 Harbour View, Seattle, WA",
            "medicalHistory": "Migraine with aura",
            "allergies": "Latex",
            "currentMedication": "Topiramate 50mg nightly, Sumatriptan 50mg PRN",
            "condition": "Chronic migraine management",
            "carePlanSummary": "Continue prophylaxis, track triggers, maintain hydration.",
            "followUpPlan": "Neurology consult in 3 months.",
            "insights": {
                "riskAssessment": "Migraine frequency decreasing",
                "riskLevel": "medium",
                "successRate": "88%",
                "keyFindings": [
                    "Headaches down to 2 per month",
                    "Patient identifies bright light as trigger",
                ],
                "recommendations": [
                    "Carry polarized lenses outdoors",
                    "Maintain headache diary",
                ],
                "lastUpdatedAt": now,
            },
            "vitals": {"bloodPressure": "118/75", "heartRate": "70"},
        },
        {
            "firstName": "Noah",
            "lastName": "Reed",
            "gender": "Male",
            "age": "47",
            "bloodGroup": "O-",
            "dateOfBirth": "1977-10-30",
            "email": "noah.reed+demo@mediease.com",
            "phone": "+1-555-0105",
            "address": "640 Redwood Dr, Denver, CO",
            "medicalHistory": "Type 2 Diabetes Mellitus, Hyperlipidemia",
            "allergies": "",
            "currentMedication": "Metformin 1000mg BID, Atorvastatin 20mg nightly",
            "condition": "Metabolic syndrome management",
            "carePlanSummary": "Enhance dietary fiber, increase cardio exercise, repeat labs in 3 months.",
            "followUpPlan": "Endocrine follow-up with HbA1c results.",
            "insights": {
                "riskAssessment": "A1c improving but above goal",
                "riskLevel": "high",
                "successRate": "78%",
                "keyFindings": [
                    "A1c dropped from 9.1% to 8.2%",
                    "Weight down 6 lbs in 8 weeks",
                ],
                "recommendations": [
                    "Add GLP-1 if next labs plateau",
                    "Increase cardio sessions to 150 minutes per week",
                ],
                "lastUpdatedAt": now,
            },
            "vitals": {"bloodPressure": "138/88", "weight": "204 lbs"},
        },
    ]


async def reset_patients() -> None:
    load_dotenv()
    await Database.connect_db()
    db = Database.get_database()
    patient_service = PatientService(db)

    print("🧹 Clearing existing patients...")
    await db.patients.delete_many({})

    for payload in sample_patients():
        patient = PatientCreate(**payload)
        created = await patient_service.create_patient(patient)
        print(f"✅ Created patient {created['fullName']} (ID: {created['patientId']})")

    await Database.close_db()
    print("✨ Patient collection reset complete.")


if __name__ == "__main__":
    asyncio.run(reset_patients())

