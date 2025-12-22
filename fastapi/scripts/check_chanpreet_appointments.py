#!/usr/bin/env python3
"""
Script to check appointments for CHANPREET SINGH
"""

import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os

# Import database configuration
import sys
sys.path.append('/home/ec2-user/MediEaseClinic/fastapi')
from app.config import settings

async def check_chanpreet_appointments():
    """Check appointments for CHANPREET SINGH"""

    # Connect to database
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]

    print("🔍 Checking appointments for CHANPREET SINGH...")
    print("=" * 60)

    # Find the patient first - search more broadly
    patient_query = {
        "$or": [
            {"firstName": {"$regex": "CHANPREET", "$options": "i"}},
            {"lastName": {"$regex": "SINGH", "$options": "i"}},
            {"fullName": {"$regex": "CHANPREET|SINGH", "$options": "i"}},
            {"patientId": {"$regex": "CHANPREET|SINGH", "$options": "i"}}
        ]
    }

    patients = await db.patients.find(patient_query).to_list(length=None)

    if not patients:
        print("❌ No patients found with name containing 'CHANPREET SINGH'")
        return

    print(f"📋 Found {len(patients)} patient(s):")
    for patient in patients:
        full_name = patient.get('fullName', f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip())
        print(f"  - ID: {patient.get('_id')} | Name: {full_name} | Patient ID: {patient.get('patientId', 'N/A')}")

    print("\n" + "=" * 60)

    # Check appointments for each patient
    today = datetime.now().strftime("%Y-%m-%d")
    print(f"📅 Today's date: {today}")
    print(f"🔍 Checking appointments with date='{today}' or any date...")

    for patient in patients:
        patient_id = str(patient["_id"])
        patient_name = patient.get('fullName', f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip())

        print(f"\n👤 Patient: {patient_name} (ID: {patient_id})")
        print("-" * 40)

        # Find all appointments for this patient
        appointments = await db.appointments.find({"patientId": patient_id}).to_list(length=None)

        if not appointments:
            print("  ❌ No appointments found for this patient")
            continue

        print(f"  📝 Found {len(appointments)} appointment(s):")

        for apt in appointments:
            apt_id = apt.get("_id")
            apt_date = apt.get("date", "N/A")
            apt_time = apt.get("time", "N/A")
            apt_status = apt.get("status", "N/A")
            apt_reason = apt.get("reason", "N/A")
            apt_doctor = apt.get("doctorName", apt.get("doctor", {}).get("fullName", "N/A"))
            apt_appointment_id = apt.get("appointmentId", "N/A")

            # Check if this appointment should appear in today's appointments
            is_today = apt_date == today
            is_scheduled = apt_status.lower() == "scheduled"
            should_show = is_today and is_scheduled

            status_icon = "✅" if should_show else "❌"

            print(f"    {status_icon} Appointment ID: {apt_appointment_id}")
            print(f"        Date: {apt_date} | Time: {apt_time} | Status: {apt_status}")
            print(f"        Reason: {apt_reason} | Doctor: {apt_doctor}")
            print(f"        Should show in today's appointments: {should_show} (is_today: {is_today}, is_scheduled: {is_scheduled})")
            print()

    # Also check if there are any appointments today that might be for CHANPREET SINGH
    print("\n" + "=" * 60)
    print("🔍 Checking all appointments scheduled for today...")

    today_appointments = await db.appointments.find({
        "date": today,
        "status": "scheduled"
    }).to_list(length=None)

    print(f"📅 Found {len(today_appointments)} scheduled appointments for today:")

    chanpreet_today_appointments = []
    for apt in today_appointments:
        patient_id = apt.get("patientId")
        if patient_id:
            # Get patient name
            patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
            if patient:
                patient_name = patient.get('fullName', f"{patient.get('firstName', '')} {patient.get('lastName', '')}".strip())
                if "CHANPREET" in patient_name.upper() and "SINGH" in patient_name.upper():
                    chanpreet_today_appointments.append((apt, patient_name))

    if chanpreet_today_appointments:
        print(f"✅ Found {len(chanpreet_today_appointments)} CHANPREET SINGH appointments for today:")
        for apt, patient_name in chanpreet_today_appointments:
            print(f"  - {patient_name}: {apt.get('time', 'N/A')} - {apt.get('reason', 'N/A')}")
    else:
        print("❌ No CHANPREET SINGH appointments found in today's scheduled appointments")

    print("\n" + "=" * 60)
    print("🔍 Checking appointments created today...")

    # Check appointments created today
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999999)

    recent_appointments = await db.appointments.find({
        "createdAt": {
            "$gte": today_start,
            "$lte": today_end
        }
    }).to_list(length=None)

    # Also check all scheduled appointments for today (regardless of creation date)
    today_scheduled = await db.appointments.find({
        "date": today,
        "status": "scheduled"
    }).to_list(length=None)

    if recent_appointments:
        print(f"📝 Found {len(recent_appointments)} appointments created today:")
        for apt in recent_appointments:
            patient_name = apt.get("patientName", "N/A")
            doctor_name = apt.get("doctorName", "N/A")
            apt_date = apt.get("date", "N/A")
            apt_status = apt.get("status", "N/A")
            apt_time = apt.get("time", "N/A")
            apt_reason = apt.get("reason", "N/A")
            print(f"  - Patient: {patient_name} | Doctor: {doctor_name}")
            print(f"    Date: {apt_date} | Time: {apt_time} | Status: {apt_status}")
            print(f"    Reason: {apt_reason}")
            print()
    else:
        print("❌ No appointments created today")

    print("\n" + "-" * 40)
    print("🔍 Checking all scheduled appointments for today (regardless of creation date)...")

    if today_scheduled:
        print(f"📅 Found {len(today_scheduled)} scheduled appointments for today:")
        chanpreet_doctor_appointments = []
        for apt in today_scheduled:
            patient_name = apt.get("patientName", "N/A")
            doctor_name = apt.get("doctorName", "N/A")
            apt_time = apt.get("time", "N/A")
            apt_reason = apt.get("reason", "N/A")
            if "CHANPREET" in doctor_name.upper() and "SINGH" in doctor_name.upper():
                chanpreet_doctor_appointments.append(apt)
            print(f"  - Patient: {patient_name} | Doctor: {doctor_name} | Time: {apt_time} | Reason: {apt_reason}")

        if chanpreet_doctor_appointments:
            print(f"\n✅ Found {len(chanpreet_doctor_appointments)} appointments for doctor Chanpreet Singh scheduled for today:")
            for apt in chanpreet_doctor_appointments:
                print(f"  - {apt.get('patientName', 'N/A')} at {apt.get('time', 'N/A')}")
        else:
            print("\n❌ No appointments for doctor Chanpreet Singh scheduled for today")
    else:
        print("❌ No scheduled appointments for today")

    print("\n" + "=" * 60)
    print("🔍 Checking all appointments containing 'CHANPREET SINGH' in any field...")

    # Search in all appointment fields
    all_appointments = await db.appointments.find({
        "$or": [
            {"patientName": {"$regex": "CHANPREET.*SINGH|SINGH.*CHANPREET", "$options": "i"}},
            {"doctorName": {"$regex": "CHANPREET.*SINGH|SINGH.*CHANPREET", "$options": "i"}},
        ]
    }).to_list(length=None)

    if all_appointments:
        print(f"📝 Found {len(all_appointments)} appointments mentioning CHANPREET SINGH:")
        for apt in all_appointments:
            patient_name = apt.get("patientName", "N/A")
            doctor_name = apt.get("doctorName", "N/A")
            apt_date = apt.get("date", "N/A")
            apt_status = apt.get("status", "N/A")
            print(f"  - Patient: {patient_name} | Doctor: {doctor_name} | Date: {apt_date} | Status: {apt_status}")
    else:
        print("❌ No appointments found mentioning CHANPREET SINGH")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_chanpreet_appointments())
