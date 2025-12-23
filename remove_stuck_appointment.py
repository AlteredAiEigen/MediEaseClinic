#!/usr/bin/env python3
"""
Script to remove stuck appointment for "Amandeep OPEN"
This script will:
1. Find the appointment for "Amandeep OPEN" scheduled for today
2. Cancel any active queue entries for this patient
3. Cancel the appointment
"""

import asyncio
import sys
import os
from datetime import datetime, timezone
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), 'fastapi', '.env'))

from motor.motor_asyncio import AsyncIOMotorClient

# Get MongoDB connection from environment
MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "mediease")

if not MONGODB_URL:
    print("❌ Error: MONGODB_URL environment variable not set")
    print("   Please set it in fastapi/.env file or export it")
    sys.exit(1)

async def remove_stuck_appointment():
    """Remove stuck appointment for Amandeep OPEN"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        print("🔍 Searching for stuck appointment for 'Amandeep OPEN'...")
        
        # Find patient by name
        patient = await db.patients.find_one({
            "$or": [
                {"fullName": {"$regex": "Amandeep", "$options": "i"}},
                {"firstName": {"$regex": "Amandeep", "$options": "i"}},
                {"lastName": {"$regex": "OPEN", "$options": "i"}}
            ]
        })
        
        if not patient:
            print("❌ Patient 'Amandeep OPEN' not found")
            return
        
        patient_id = str(patient["_id"])
        patient_name = patient.get("fullName") or f"{patient.get('firstName', '')} {patient.get('lastName', '')}"
        print(f"✅ Found patient: {patient_name} (ID: {patient_id})")
        
        # Get today's date
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today.replace(day=today.day + 1) if today.day < 28 else today.replace(month=today.month + 1, day=1)
        
        # Find appointments for this patient today
        appointments = await db.appointments.find({
            "patientId": patient_id,
            "date": {"$gte": today.strftime("%Y-%m-%d"), "$lt": tomorrow.strftime("%Y-%m-%d")},
            "status": {"$ne": "cancelled"}
        }).to_list(length=None)
        
        print(f"📅 Found {len(appointments)} appointment(s) for today")
        
        # Cancel all appointments
        for apt in appointments:
            apt_id = str(apt["_id"])
            apt_time = apt.get("time", "N/A")
            apt_date = apt.get("date", "N/A")
            apt_status = apt.get("status", "N/A")
            
            print(f"  - Appointment {apt_id}: {apt_date} {apt_time} (Status: {apt_status})")
            
            # Update appointment status to cancelled
            result = await db.appointments.update_one(
                {"_id": ObjectId(apt_id)},
                {
                    "$set": {
                        "status": "cancelled",
                        "updatedAt": datetime.now(timezone.utc)
                    }
                }
            )
            
            if result.modified_count > 0:
                print(f"    ✅ Cancelled appointment {apt_id}")
            else:
                print(f"    ⚠️  Appointment {apt_id} was already cancelled or not found")
        
        # Find and cancel any active queue entries for this patient
        print("\n🔍 Searching for active queue entries...")
        
        queue_entries = await db.queue.find({
            "patient": ObjectId(patient_id),
            "is_active": True,
            "status": {"$in": ["waiting", "in-consultation", "checkout-pending"]}
        }).to_list(length=None)
        
        print(f"📋 Found {len(queue_entries)} active queue entry/entries")
        
        for entry in queue_entries:
            entry_id = str(entry["_id"])
            entry_status = entry.get("status", "N/A")
            entry_queue_id = entry.get("queue_id", "N/A")
            
            print(f"  - Queue Entry {entry_id} (Queue ID: {entry_queue_id}, Status: {entry_status})")
            
            # Cancel the queue entry
            result = await db.queue.update_one(
                {"_id": ObjectId(entry_id)},
                {
                    "$set": {
                        "status": "cancelled",
                        "is_active": False,
                        "updatedAt": datetime.now(timezone.utc)
                    }
                }
            )
            
            if result.modified_count > 0:
                print(f"    ✅ Cancelled queue entry {entry_id}")
            else:
                print(f"    ⚠️  Queue entry {entry_id} was already cancelled or not found")
        
        print("\n✅ Cleanup complete!")
        print(f"   - Cancelled {len(appointments)} appointment(s)")
        print(f"   - Cancelled {len(queue_entries)} queue entry/entries")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()
        print("\n🔌 Database connection closed")

if __name__ == "__main__":
    print("=" * 60)
    print("🗑️  Remove Stuck Appointment Script")
    print("=" * 60)
    print()
    asyncio.run(remove_stuck_appointment())

