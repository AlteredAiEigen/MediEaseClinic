#!/usr/bin/env python3
"""
Seed script to add mock data for doctor account.
Creates patients, appointments, and queue entries for testing.
"""

import asyncio
import sys
import uuid
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from app.utils.security import hash_password

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/mediease")
DB_NAME = os.getenv("MONGODB_DB_NAME", "mediease")

# Doctor email to seed data for
DOCTOR_EMAIL = "channusingh1424@gmail.com"
RECEPTIONIST_EMAIL = os.getenv("RECEPTIONIST_EMAIL", "receptionist@mediease.com")


async def seed_doctor_data():
    """Seed mock data for the doctor account."""
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    try:
        # Find or create the doctor by email
        doctor = await db.users.find_one({"email": DOCTOR_EMAIL, "role": "doctor"})
        if not doctor:
            print(f"⚠️  Doctor with email {DOCTOR_EMAIL} not found!")
            print("Creating doctor account...")
            
            # Create doctor account
            clinic_id = str(uuid.uuid4())[:8].upper()
            hashed_password = hash_password("Doctor123!")  # Default password
            
            doctor_data = {
                "firstName": "Chanpreet",
                "lastName": "Singh",
                "email": DOCTOR_EMAIL.lower(),
                "password": hashed_password,
                "role": "doctor",
                "phone": "+1-555-0000",
                "isActive": True,
                "clinicName": "MediEase Clinic",
                "clinicId": clinic_id,
                "speciality": "General Physician",
                "licenseNumber": "MD12345",
                "experience": 5,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            }
            
            result = await db.users.insert_one(doctor_data)
            doctor_id = str(result.inserted_id)
            doctor = doctor_data
            doctor["_id"] = result.inserted_id
            print(f"✅ Created doctor account (ID: {doctor_id})")
            print(f"   Default password: Doctor123!")
        else:
            doctor_id = str(doctor["_id"])
        
        doctor_id = str(doctor["_id"])
        clinic_id = doctor.get("clinicId")
        clinic_name = doctor.get("clinicName", "MediEase Clinic")
        
        if doctor.get("_id") == result.inserted_id if 'result' in locals() else False:
            print(f"✅ Created doctor: {doctor.get('firstName')} {doctor.get('lastName')} (ID: {doctor_id})")
        else:
            print(f"✅ Found doctor: {doctor.get('firstName')} {doctor.get('lastName')} (ID: {doctor_id})")
        
        # Ensure a receptionist exists for this clinic
        receptionist = await db.users.find_one({"email": RECEPTIONIST_EMAIL.lower(), "role": "receptionist"})
        if not receptionist:
            receptionist_data = {
                "firstName": "Reception",
                "lastName": "User",
                "email": RECEPTIONIST_EMAIL.lower(),
                "password": hash_password("Reception123!"),
                "role": "receptionist",
                "phone": "+1-555-0200",
                "isActive": True,
                "clinicName": clinic_name,
                "clinicId": clinic_id,
                "notificationPreferences": {
                    "newAppointments": True,
                    "patientCheckIns": True,
                    "appointmentReminders": True,
                    "emailNotifications": True,
                    "smsAlerts": False,
                },
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            }
            receptionist_result = await db.users.insert_one(receptionist_data)
            print(f"✅ Created receptionist account (ID: {receptionist_result.inserted_id})")
            print("   Email:", RECEPTIONIST_EMAIL)
            print("   Password: Reception123!")
        else:
            print(f"✅ Found receptionist: {receptionist.get('email')} (Clinic: {receptionist.get('clinicId')})")
            if receptionist.get("clinicId") != clinic_id:
                await db.users.update_one(
                    {"_id": receptionist["_id"]},
                    {
                        "$set": {
                            "clinicId": clinic_id,
                            "clinicName": clinic_name,
                            "updatedAt": datetime.utcnow(),
                        }
                    }
                )
                print(f"   🔄 Updated receptionist clinic to {clinic_id}")
        
        # Mock patients data
        mock_patients = [
            {
                "firstName": "John",
                "lastName": "Smith",
                "dateOfBirth": "1985-05-15",
                "gender": "Male",
                "phone": "+1-555-0101",
                "email": "john.smith@example.com",
                "address": "123 Main St, City, State 12345",
                "bloodGroup": "O+",
                "allergies": "None",
                "medicalHistory": "Hypertension",
                "clinicId": clinic_id,
                "clinicName": clinic_name,
                "presentInClinic": True,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            },
            {
                "firstName": "Sarah",
                "lastName": "Johnson",
                "dateOfBirth": "1990-08-22",
                "gender": "Female",
                "phone": "+1-555-0102",
                "email": "sarah.johnson@example.com",
                "address": "456 Oak Ave, City, State 12345",
                "bloodGroup": "A+",
                "allergies": "Penicillin",
                "medicalHistory": "Diabetes Type 2",
                "clinicId": clinic_id,
                "clinicName": clinic_name,
                "presentInClinic": True,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            },
            {
                "firstName": "Michael",
                "lastName": "Brown",
                "dateOfBirth": "1978-12-03",
                "gender": "Male",
                "phone": "+1-555-0103",
                "email": "michael.brown@example.com",
                "address": "789 Pine Rd, City, State 12345",
                "bloodGroup": "B+",
                "allergies": "None",
                "medicalHistory": "Asthma",
                "clinicId": clinic_id,
                "clinicName": clinic_name,
                "presentInClinic": False,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            },
            {
                "firstName": "Emily",
                "lastName": "Davis",
                "dateOfBirth": "1995-03-18",
                "gender": "Female",
                "phone": "+1-555-0104",
                "email": "emily.davis@example.com",
                "address": "321 Elm St, City, State 12345",
                "bloodGroup": "AB+",
                "allergies": "Shellfish",
                "medicalHistory": "Migraine",
                "clinicId": clinic_id,
                "clinicName": clinic_name,
                "presentInClinic": True,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            },
            {
                "firstName": "David",
                "lastName": "Wilson",
                "dateOfBirth": "1988-07-25",
                "gender": "Male",
                "phone": "+1-555-0105",
                "email": "david.wilson@example.com",
                "address": "654 Maple Dr, City, State 12345",
                "bloodGroup": "O-",
                "allergies": "None",
                "medicalHistory": "None",
                "clinicId": clinic_id,
                "clinicName": clinic_name,
                "presentInClinic": True,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            },
        ]
        
        # Generate patient IDs
        patient_ids = []
        for i, patient_data in enumerate(mock_patients, start=1):
            # Check if patient already exists
            existing = await db.patients.find_one({
                "email": patient_data["email"],
                "clinicId": clinic_id
            })
            
            if existing:
                print(f"⏭️  Patient {patient_data['firstName']} {patient_data['lastName']} already exists, skipping...")
                patient_ids.append(str(existing["_id"]))
                continue
            
            # Generate patient ID
            patient_id_str = f"P{str(i).zfill(3)}"
            patient_data["patientId"] = patient_id_str
            
            # Insert patient
            result = await db.patients.insert_one(patient_data)
            patient_id = str(result.inserted_id)
            patient_ids.append(patient_id)
            print(f"✅ Created patient: {patient_data['firstName']} {patient_data['lastName']} (ID: {patient_id_str})")
        
        # Create appointments
        today = datetime.utcnow()
        appointments_data = []
        
        # Today's appointments
        for i, patient_id in enumerate(patient_ids[:3], start=1):
            appointment_time = (today.replace(hour=9, minute=0, second=0, microsecond=0) + 
                              timedelta(hours=i))
            appointment_id = f"APT{int(today.timestamp() * 1000) + i}"
            
            appointment = {
                "appointmentId": appointment_id,
                "patientId": patient_id,
                "doctorId": doctor_id,
                "date": today.strftime("%Y-%m-%d"),
                "time": appointment_time.strftime("%H:%M"),
                "type": "consultation",
                "status": "scheduled" if i <= 2 else "checked-in",
                "reason": "General Consultation",
                "duration": 30,
                "clinicId": clinic_id,
                "clinicName": clinic_name,
                "scheduledBy": doctor_id,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow(),
            }
            
            # Check if appointment already exists
            existing = await db.appointments.find_one({
                "appointmentId": appointment_id,
                "clinicId": clinic_id
            })
            
            if not existing:
                await db.appointments.insert_one(appointment)
                appointments_data.append(appointment)
                print(f"✅ Created appointment: {appointment_id} for {appointment_time.strftime('%H:%M')}")
        
        # Future appointments (this week)
        for day_offset in range(1, 5):
            appointment_date = today + timedelta(days=day_offset)
            for i, patient_id in enumerate(patient_ids[:2], start=1):
                appointment_time = appointment_date.replace(hour=10 + i, minute=0, second=0, microsecond=0)
                appointment_id = f"APT{int(appointment_date.timestamp() * 1000) + i}"
                
                appointment = {
                    "appointmentId": appointment_id,
                    "patientId": patient_id,
                    "doctorId": doctor_id,
                    "date": appointment_date.strftime("%Y-%m-%d"),
                    "time": appointment_time.strftime("%H:%M"),
                    "type": "follow-up" if day_offset > 2 else "consultation",
                    "status": "scheduled",
                    "reason": "Follow-up" if day_offset > 2 else "General Consultation",
                    "duration": 30,
                    "clinicId": clinic_id,
                    "clinicName": clinic_name,
                    "scheduledBy": doctor_id,
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow(),
                }
                
                existing = await db.appointments.find_one({
                    "appointmentId": appointment_id,
                    "clinicId": clinic_id
                })
                
                if not existing:
                    await db.appointments.insert_one(appointment)
                    appointments_data.append(appointment)
                    print(f"✅ Created future appointment: {appointment_id} for {appointment_date.strftime('%Y-%m-%d')}")
        
        # Create queue entries for today
        queue_service = None
        try:
            from app.services.queue_service import QueueService
            from app.schemas.queue import QueueCheckIn
            
            queue_service = QueueService(db)
            
            # Add first 3 patients to queue
            for i, patient_id in enumerate(patient_ids[:3], start=1):
                # Check if already in queue
                existing_queue = await db.queue.find_one({
                    "patient": patient_id,
                    "doctor": doctor_id,
                    "is_active": True,
                    "status": {"$in": ["waiting", "in-consultation"]}
                })
                
                if existing_queue:
                    print(f"⏭️  Patient {patient_id} already in queue, skipping...")
                    continue
                
                check_in_data = QueueCheckIn(
                    patient_id=patient_id,
                    doctor_id=doctor_id,
                    reason="General Consultation",
                    priority="normal",
                    notes="",
                    appointment_id=None
                )
                
                try:
                    queue_entry = await queue_service.check_in_patient(check_in_data, doctor_id)
                    print(f"✅ Added patient to queue: Queue #{queue_entry.queue_number}")
                except Exception as e:
                    print(f"⚠️  Could not add patient {patient_id} to queue: {str(e)}")
        
        except Exception as e:
            print(f"⚠️  Queue service error: {str(e)}")
            # Manually create queue entries
            print("Creating queue entries manually...")
            for i, patient_id in enumerate(patient_ids[:3], start=1):
                existing_queue = await db.queue.find_one({
                    "patient": patient_id,
                    "doctor": doctor_id,
                    "is_active": True
                })
                
                if existing_queue:
                    continue
                
                queue_id = f"Q{int(datetime.utcnow().timestamp() * 1000) % 100000000}"
                queue_entry = {
                    "queue_id": queue_id,
                    "patient": patient_id,
                    "doctor": doctor_id,
                    "appointment": None,
                    "checked_in_by": doctor_id,
                    "checked_in_at": datetime.utcnow() - timedelta(minutes=30 * i),
                    "status": "waiting" if i > 1 else "in-consultation",
                    "queue_number": i,
                    "priority": "normal",
                    "reason": "General Consultation",
                    "notes": "",
                    "wait_time": i * 5,
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                }
                
                await db.queue.insert_one(queue_entry)
                print(f"✅ Created queue entry #{i} for patient {patient_id}")
        
        print("\n✅ Seeding completed successfully!")
        print(f"   - Created/Found {len(patient_ids)} patients")
        print(f"   - Created {len(appointments_data)} appointments")
        print(f"   - Added patients to queue")
        
    except Exception as e:
        print(f"❌ Error seeding data: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(seed_doctor_data())

