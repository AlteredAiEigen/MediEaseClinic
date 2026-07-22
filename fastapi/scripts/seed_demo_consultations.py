#!/usr/bin/env python3
"""
Seed 3 demo patients, appointments, and consultation recordings from local M4A files.

Patients share family email channusingh1424@gmail.com.
Recordings are uploaded to S3; run mediease-server jobs for transcription + AI extraction.
"""

import asyncio
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timedelta
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from bson import ObjectId
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.datastructures import UploadFile

# fastapi app package
FASTAPI_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(FASTAPI_ROOT))

load_dotenv(FASTAPI_ROOT / ".env")

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

AUDIO_DIR = Path(os.getenv("DEMO_AUDIO_DIR", "/home/ec2-user/data"))

CHANPREET_EMAIL = "chanpreet.singh@gmail.com"
GUNJAN_EMAIL = "doctor@mediease.com"
PATIENT_EMAIL = "channusingh1424@gmail.com"

CASES = [
    {
        "patient_id": "P-DEMO-VIKRAM",
        "appointment_id": "APT-DEMO-VIKRAM",
        "firstName": "Vikram",
        "lastName": "Malhotra",
        "gender": "Male",
        "age": "28",
        "bloodGroup": "B+",
        "dateOfBirth": "1998-03-15",
        "phone": "+91-98765-41001",
        "address": "Sector 62, Noida, Uttar Pradesh",
        "reason": "General fatigue and low energy for two weeks",
        "audio": "AUDIO-2026-06-19-23-06-39.m4a",
        "doctor_email": CHANPREET_EMAIL,
        "days_ago": 3,
        "time": "10:30",
    },
    {
        "patient_id": "P-DEMO-PRIYA",
        "appointment_id": "APT-DEMO-PRIYA",
        "firstName": "Priya",
        "lastName": "Sharma",
        "gender": "Female",
        "age": "26",
        "bloodGroup": "O+",
        "dateOfBirth": "2000-07-08",
        "phone": "+91-98765-41002",
        "address": "Rajouri Garden, New Delhi",
        "reason": "Recurring headaches and occasional dizziness",
        "audio": "AUDIO-2026-06-19-22-55-35.m4a",
        "doctor_email": GUNJAN_EMAIL,
        "days_ago": 2,
        "time": "14:15",
    },
    {
        "patient_id": "P-DEMO-ANANYA",
        "appointment_id": "APT-DEMO-ANANYA",
        "firstName": "Ananya",
        "lastName": "Gupta",
        "gender": "Female",
        "age": "24",
        "bloodGroup": "A+",
        "dateOfBirth": "2002-01-22",
        "phone": "+91-98765-41003",
        "address": "Indirapuram, Ghaziabad, Uttar Pradesh",
        "reason": "Skin rash and itching on arms for one week",
        "audio": "AUDIO-2026-06-22-18-45-19.m4a",
        "doctor_email": CHANPREET_EMAIL,
        "days_ago": 1,
        "time": "11:00",
    },
]


def iso_day(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d")


def audio_duration_seconds(path: Path) -> int:
    """Exact duration from source M4A (seconds)."""
    try:
        from mutagen import File as MutagenFile

        audio = MutagenFile(str(path))
        # MP4/M4A may be "empty" for bool() but still has .info.length
        if audio is not None and getattr(audio, "info", None) is not None:
            length = getattr(audio.info, "length", None)
            if length:
                return max(1, int(round(length)))
    except Exception:
        pass
    try:
        import imageio_ffmpeg
        import re

        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        proc = subprocess.run(
            [ffmpeg, "-i", str(path)],
            capture_output=True,
            text=True,
        )
        match = re.search(
            r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)",
            proc.stderr or "",
        )
        if match:
            h, m, s = match.groups()
            return max(1, int(round(int(h) * 3600 + int(m) * 60 + float(s))))
    except Exception:
        pass
    return max(1, int(path.stat().st_size / 32000))


def convert_m4a_to_wav_bytes(path: Path) -> Tuple[bytes, int]:
    """
    Convert local M4A to WAV for S3/playback (server has no system ffmpeg).
    Returns (wav_bytes, duration_seconds from source file).
    """
    duration = audio_duration_seconds(path)
    try:
        import imageio_ffmpeg

        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            out_path = tmp.name
        subprocess.run(
            [ffmpeg, "-y", "-i", str(path), out_path],
            check=True,
            capture_output=True,
        )
        wav_bytes = Path(out_path).read_bytes()
        Path(out_path).unlink(missing_ok=True)
        return wav_bytes, duration
    except Exception as exc:
        print(f"  Warning: WAV conversion failed ({exc}); uploading raw M4A bytes")
        return path.read_bytes(), duration


async def upsert_pre_registration(db) -> None:
    now = datetime.utcnow()
    await db.pre_registration_email_verifications.update_one(
        {"email": PATIENT_EMAIL.lower()},
        {
            "$set": {
                "email": PATIENT_EMAIL.lower(),
                "verified": True,
                "verifiedAt": now,
                "updatedAt": now,
            },
            "$setOnInsert": {"createdAt": now},
        },
        upsert=True,
    )


async def get_doctor(db, email: str) -> dict:
    doc = await db.users.find_one({"email": email.lower(), "role": "doctor"})
    if not doc:
        raise RuntimeError(f"Doctor not found: {email}")
    return doc


async def upsert_patient(db, case: dict, clinic_id: str, clinic_name: str) -> ObjectId:
    from app.services.patient_service import PatientService

    svc = PatientService(db)
    now = datetime.utcnow()
    existing = await db.patients.find_one({"patientId": case["patient_id"]})

    mediease_email = await svc.generate_mediease_clinic_email(
        case["firstName"], case["lastName"], case["dateOfBirth"]
    )

    doc: Dict[str, Any] = {
        "patientId": case["patient_id"],
        "firstName": case["firstName"],
        "lastName": case["lastName"],
        "gender": case["gender"],
        "age": case["age"],
        "bloodGroup": case["bloodGroup"],
        "dateOfBirth": case["dateOfBirth"],
        "email": PATIENT_EMAIL.lower(),
        "phone": case["phone"],
        "address": case["address"],
        "emailVerified": True,
        "agreed_to_data_storage": True,
        "consent_email": True,
        "presentInClinic": False,
        "createdByClinicId": clinic_id,
        "createdByClinicName": clinic_name,
        "medieaseClinicEmail": mediease_email,
        "isActive": True,
        "updatedAt": now,
    }

    if existing:
        await db.patients.update_one({"_id": existing["_id"]}, {"$set": doc})
        print(f"  Updated patient {case['firstName']} {case['lastName']} ({case['patient_id']})")
        return existing["_id"]

    doc["createdAt"] = now
    result = await db.patients.insert_one(doc)
    print(f"  Created patient {case['firstName']} {case['lastName']} ({case['patient_id']})")
    return result.inserted_id


async def upsert_appointment(
    db,
    case: dict,
    patient_oid: ObjectId,
    doctor: dict,
    scheduler: dict,
    clinic_id: str,
) -> ObjectId:
    now = datetime.utcnow()
    appt_date = now - timedelta(days=case["days_ago"])
    doctor_id = str(doctor["_id"])
    doctor_name = f"{doctor.get('firstName', '')} {doctor.get('lastName', '')}".strip()
    scheduler_id = str(scheduler["_id"])
    scheduler_name = f"{scheduler.get('firstName', '')} {scheduler.get('lastName', '')}".strip()
    patient_name = f"{case['firstName']} {case['lastName']}"

    doc: Dict[str, Any] = {
        "appointmentId": case["appointment_id"],
        "patientId": str(patient_oid),
        "doctorId": doctor_id,
        "patientName": patient_name,
        "doctorName": doctor_name,
        "scheduledBy": scheduler_id,
        "scheduledByName": scheduler_name,
        "clinicId": clinic_id,
        "date": iso_day(appt_date),
        "time": case["time"],
        "duration": 30,
        "status": "completed",
        "reason": case["reason"],
        "presentInClinic": False,
        "completedAt": appt_date.replace(hour=int(case["time"].split(":")[0]), minute=int(case["time"].split(":")[1])),
        "updatedAt": now,
    }

    existing = await db.appointments.find_one({"appointmentId": case["appointment_id"]})
    if existing:
        # Clear prior recording refs so re-upload replaces cleanly
        doc["s3Url"] = None
        doc["recordingId"] = None
        doc["transcription"] = None
        doc["structuredNotes"] = None
        doc["consultationSummary"] = None
        doc["consultationNotes"] = None
        doc["diagnosis"] = None
        doc["detailedNotes"] = None
        await db.appointments.update_one({"_id": existing["_id"]}, {"$set": doc})
        print(f"  Updated appointment {case['appointment_id']}")
        return existing["_id"]

    doc["createdAt"] = now
    result = await db.appointments.insert_one(doc)
    print(f"  Created appointment {case['appointment_id']}")
    return result.inserted_id


async def remove_old_recordings(db, appointment_oid: ObjectId) -> None:
    await db.recordings.delete_many({"appointmentId": str(appointment_oid)})


async def upload_recording(
    db,
    audio_path: Path,
    patient_oid: ObjectId,
    appointment_oid: ObjectId,
    doctor_id: str,
) -> Optional[str]:
    from app.services.recording_service import RecordingService

    if not audio_path.is_file():
        raise FileNotFoundError(f"Audio file missing: {audio_path}")

    wav_bytes, duration = convert_m4a_to_wav_bytes(audio_path)

    upload = UploadFile(
        file=BytesIO(wav_bytes),
        filename="consultation-recording.wav",
        headers={"content-type": "audio/wav"},
    )

    svc = RecordingService(db)
    result = await svc.upload_recording(
        file=upload,
        patient_id=str(patient_oid),
        appointment_id=str(appointment_oid),
        doctor_id=doctor_id,
        duration=duration,
        retention_policy="standard",
    )
    rec_id = result.get("recordingId") or result.get("id")
    print(f"  Uploaded recording ({duration}s) -> {rec_id}")
    return rec_id


async def main() -> None:
    print(f"Connecting to MongoDB ({DB_NAME})...")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    await client.admin.command("ping")

    chanpreet = await get_doctor(db, CHANPREET_EMAIL)
    clinic_id = chanpreet.get("clinicId") or "1BE22E34"
    clinic_name = chanpreet.get("clinicName") or "MediEase Clinic"

    print("Upserting pre-registration email verification...")
    await upsert_pre_registration(db)

    for case in CASES:
        print(f"\n--- {case['firstName']} {case['lastName']} ---")
        doctor = await get_doctor(db, case["doctor_email"])
        patient_oid = await upsert_patient(db, case, clinic_id, clinic_name)
        appt_oid = await upsert_appointment(db, case, patient_oid, doctor, chanpreet, clinic_id)
        await remove_old_recordings(db, appt_oid)
        audio_path = AUDIO_DIR / case["audio"]
        await upload_recording(
            db,
            audio_path,
            patient_oid,
            appt_oid,
            str(doctor["_id"]),
        )

    print("\n✅ Seed complete. Run mediease-server transcription + AI extraction:")
    print("  cd /home/ec2-user/mediease-server && source venv/bin/activate && ./scripts/run_all_jobs.sh")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
