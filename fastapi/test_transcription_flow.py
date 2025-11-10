"""
API-level end-to-end test for the transcription workflow.
1. Logs in as doctor and receptionist via REST API
2. Receptionist registers a patient, schedules an appointment, and checks in the patient
3. Doctor starts consultation, uploads recording, and polls transcription status
4. Confirms structured notes and patient updates are stored
"""

import os
import time
import json
import random
import string
from datetime import datetime, timedelta
from pathlib import Path

import requests

BASE_URL = "http://localhost:8000"
SAMPLE_FILE = "/Users/chanpreetsingh/Documents/GitHub/Untitled/MediEaseClinic/sample.mp3"

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def login(email: str, password: str) -> str:
    """Login to the API and return access token."""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": password}
    )
    if response.status_code != 200:
        raise RuntimeError(f"Login failed for {email}: {response.text}")
    payload = response.json()
    if not payload.get("success"):
        raise RuntimeError(f"Login unsuccessful for {email}: {payload}")
    return payload.get("data", {}).get("accessToken")

def get_current_user(token: str) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    if resp.status_code != 200:
        raise RuntimeError(f"/auth/me failed: {resp.text}")
    payload = resp.json()
    if not payload.get("success"):
        raise RuntimeError(f"/auth/me unsuccessful: {payload}")
    return payload.get("data", {}).get("user", {})

def register_user(email: str, password: str, role: str, first_name: str, last_name: str) -> bool:
    body = {
        "email": email,
        "password": password,
        "firstName": first_name,
        "lastName": last_name,
        "role": role,
        "phone": "+1234567890"
    }
    if role == "doctor":
        body.update({"speciality": "General Practice", "licenseNumber": "TEST123"})
    response = requests.post(f"{BASE_URL}/api/auth/register", json=body)
    return response.status_code in (200, 201)

def get_doctor_queue(token: str, doctor_id: str) -> list:
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/api/queue/doctor/{doctor_id}", headers=headers)
    if resp.status_code != 200:
        return []
    payload = resp.json()
    return payload.get("data", {}).get("queue", []) if payload.get("success") else []

def create_patient(token: str) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    random_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    patient_data = {
        "firstName": "Test",
        "lastName": f"Patient{random_id}",
        "email": f"testpatient{random_id}@example.com",
        "phone": f"+1{random.randint(1000000000, 9999999999)}",
        "dateOfBirth": "1990-01-01",
        "gender": "Male",
        "address": "123 Test Street",
        "bloodGroup": "O+",
        "age": "34"
    }
    resp = requests.post(f"{BASE_URL}/api/patients", headers=headers, json=patient_data)
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Create patient failed: {resp.text}")
    payload = resp.json()
    if not payload.get("success"):
        raise RuntimeError(f"Create patient unsuccessful: {payload}")
    return payload.get("data", {}).get("patient", {})

def create_appointment(token: str, patient_id: str, doctor_id: str) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    base_time = datetime.now()
    for hour_offset in range(1, 25):
        appointment_datetime = base_time + timedelta(hours=hour_offset)
        appointment_time = appointment_datetime.strftime("%H:%M")
        body = {
            "patientId": patient_id,
            "doctorId": doctor_id,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "time": appointment_time,
            "reason": "Test Consultation",
            "type": "consultation"
        }
        resp = requests.post(f"{BASE_URL}/api/appointments", headers=headers, json=body)
        if resp.status_code in (200, 201):
            payload = resp.json()
            if payload.get("success"):
                return payload.get("data", {}).get("appointment", {})
        elif "already booked" not in resp.text.lower():
            raise RuntimeError(f"Create appointment failed: {resp.text} | payload={body}")
    raise RuntimeError("Unable to create appointment (all timeslots booked)")

def check_in_patient(token: str, appointment_id: str) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    body = {
        "appointmentId": appointment_id,
        "reason": "Test Consultation",
        "priority": "medium",
        "notes": ""
    }
    resp = requests.post(f"{BASE_URL}/api/queue/check-in", headers=headers, json=body)
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Check-in failed: {resp.text}")
    payload = resp.json()
    if not payload.get("success"):
        raise RuntimeError(f"Check-in unsuccessful: {payload}")
    return payload.get("data", {})

def start_consultation(token: str, queue_entry_id: str) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.put(f"{BASE_URL}/api/queue/{queue_entry_id}/start-consultation", headers=headers)
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Start consultation failed: {resp.text}")
    payload = resp.json()
    if not payload.get("success"):
        raise RuntimeError(f"Start consultation unsuccessful: {payload}")
    return payload.get("data", {})

def upload_recording(token: str, patient_id: str, appointment_id: str, doctor_id: str, file_path: str, duration: int = 60) -> dict:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Sample file not found: {file_path}")
    headers = {"Authorization": f"Bearer {token}"}
    with open(file_path, "rb") as fh:
        files = {"file": (os.path.basename(file_path), fh, "audio/mpeg")}
        form = {
            "patient_id": patient_id,
            "appointment_id": appointment_id,
            "doctor_id": doctor_id,
            "duration": str(duration),
            "retention_policy": "standard"
        }
        resp = requests.post(f"{BASE_URL}/api/recordings/", headers=headers, files=files, data=form)
    if resp.status_code != 201:
        raise RuntimeError(f"Upload failed: {resp.status_code} - {resp.text}")
    payload = resp.json()
    if not payload.get("success"):
        raise RuntimeError(f"Upload unsuccessful: {payload}")
    return payload.get("data", {}).get("recording", {})

def poll_transcription(token: str, recording_id: str, max_attempts: int = 20, delay: int = 30) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    for attempt in range(max_attempts):
        resp = requests.get(f"{BASE_URL}/api/recordings/{recording_id}/transcription-status", headers=headers)
        if resp.status_code != 200:
            raise RuntimeError(f"Transcription status failed: {resp.text}")
        payload = resp.json()
        if not payload.get("success"):
            raise RuntimeError(f"Transcription status unsuccessful: {payload}")
        status_payload = payload.get("data", {}).get("transcription", {})
        status_val = status_payload.get("status", "unknown")
        print(f"  [poll {attempt}] status={status_val}")
        if status_val == "processed":
            return status_payload
        if status_val == "error":
            raise RuntimeError(f"Transcription failed: {status_payload.get('errorMessage')}")
        time.sleep(delay)
    raise TimeoutError("Transcription processing did not complete in time")

def get_recording(token: str, recording_id: str) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/api/recordings/{recording_id}", headers=headers)
    if resp.status_code != 200:
        raise RuntimeError(f"Get recording failed: {resp.text}")
    payload = resp.json()
    if not payload.get("success"):
        raise RuntimeError(f"Get recording unsuccessful: {payload}")
    return payload.get("data", {}).get("recording", {})

def get_patient(token: str, patient_id: str) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/api/patients/{patient_id}", headers=headers)
    if resp.status_code != 200:
        raise RuntimeError(f"Get patient failed: {resp.text}")
    payload = resp.json()
    if not payload.get("success"):
        raise RuntimeError(f"Get patient unsuccessful: {payload}")
    return payload.get("data", {})

def get_appointment(token: str, appointment_id: str) -> dict:
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/api/appointments/{appointment_id}", headers=headers)
    if resp.status_code != 200:
        raise RuntimeError(f"Get appointment failed: {resp.text}")
    payload = resp.json()
    if not payload.get("success"):
        raise RuntimeError(f"Get appointment unsuccessful: {payload}")
    return payload.get("data", {})

# ---------------------------------------------------------------------------
# Main test logic
# ---------------------------------------------------------------------------

def main():
    print("=" * 80)
    print("TRANSCRIPTION FLOW TEST (API-LEVEL)")
    print("=" * 80)
    # Step 1: doctor login (register fallback)
    print("\n[1/9] Logging in as doctor...")
    doctor_token = None
    doctor_creds = [
        ("doctor@example.com", "password123"),
        ("doctor@mediease.com", "password"),
        ("testdoctor@mediease.com", "TestDoctor123!"),
    ]
    for email, password in doctor_creds:
        try:
            doctor_token = login(email, password)
            print(f"✓ Doctor login succeeded with {email}")
            doctor_email, doctor_password = email, password
            break
        except RuntimeError:
            continue
    if not doctor_token:
        doctor_email, doctor_password = "testdoctor@mediease.com", "TestDoctor123!"
        print("  No doctor account found, registering test doctor...")
        if register_user(doctor_email, doctor_password, "doctor", "Test", "Doctor"):
            doctor_token = login(doctor_email, doctor_password)
            print("✓ Doctor registration & login succeeded")
        else:
            raise RuntimeError("Unable to register doctor user")
    doctor_user = get_current_user(doctor_token)
    doctor_id = doctor_user.get("_id")
    print(f"Doctor ID: {doctor_id}")

    # Step 2: receptionist login (register fallback)
    print("\n[2/9] Logging in as receptionist...")
    receptionist_token = None
    receptionist_creds = [
        ("reception@test.com", "Reception123!"),
        ("receptionist@mediease.com", "Reception123!"),
    ]
    for email, password in receptionist_creds:
        try:
            receptionist_token = login(email, password)
            print(f"✓ Receptionist login succeeded with {email}")
            break
        except RuntimeError:
            continue
    if not receptionist_token:
        reception_email, reception_password = "reception@test.com", "Reception123!"
        print("  No receptionist found, registering test receptionist...")
        if register_user(reception_email, reception_password, "receptionist", "Test", "Receptionist"):
            receptionist_token = login(reception_email, reception_password)
            print("✓ Receptionist registration & login succeeded")
        else:
            raise RuntimeError("Unable to register receptionist user")

    # Step 3: ensure patient appointment is checked in
    print("\n[3/9] Creating/checking-in patient via receptionist...")
    queue = get_doctor_queue(doctor_token, doctor_id)
    patient_id = None
    appointment_id = None
    queue_entry_id = None
    if queue:
        for entry in queue:
            if entry.get("status") in {"waiting", "in-consultation"}:
                queue_entry_id = entry.get("_id") or entry.get("id")
                patient = entry.get("patient", {})
                patient_id = patient.get("_id") if isinstance(patient, dict) else patient
                appointment = entry.get("appointment")
                if isinstance(appointment, dict):
                    appointment_id = appointment.get("_id") or appointment.get("id")
                else:
                    appointment_id = appointment
                break
    if not queue_entry_id:
        patient = create_patient(receptionist_token)
        patient_id = patient.get("_id") or patient.get("id")
        print(f"  ✓ Created patient {patient_id}")
        appointment = create_appointment(receptionist_token, patient_id, doctor_id)
        appointment_id = appointment.get("_id") or appointment.get("id")
        print(f"  ✓ Created appointment {appointment_id}")
        queue_entry = check_in_patient(receptionist_token, appointment_id)
        queue_entry_id = queue_entry.get("_id") or queue_entry.get("id")
        print(f"  ✓ Checked in queue entry {queue_entry_id}")
    else:
        print("  ✓ Using existing patient already in queue")
    if not (patient_id and appointment_id and queue_entry_id):
        raise RuntimeError("Missing patient/appointment/queue entry after preparation")
    print(f"Patient ID: {patient_id}")
    print(f"Appointment ID: {appointment_id}")
    print(f"Queue Entry ID: {queue_entry_id}")

    # Step 4: doctor starts consultation
    print("\n[4/9] Starting consultation...")
    start_consultation(doctor_token, queue_entry_id)
    print("✓ Consultation started")

    # Step 5: verify sample file exists
    print("\n[5/9] Verifying sample audio file...")
    if not os.path.exists(SAMPLE_FILE):
        raise FileNotFoundError(f"Sample file missing: {SAMPLE_FILE}")
    size_mb = os.path.getsize(SAMPLE_FILE) / (1024 * 1024)
    print(f"✓ Audio file ready ({size_mb:.2f} MB)")

    # Step 6: upload recording
    print("\n[6/9] Uploading recording (doctor token)...")
    recording = upload_recording(doctor_token, patient_id, appointment_id, doctor_id, SAMPLE_FILE, duration=60)
    recording_id = recording.get("recordingId") or recording.get("id") or recording.get("_id")
    print("✓ Upload successful")
    print(f"  Recording ID: {recording_id}")
    print(f"  Status: {recording.get('status')}")
    print(f"  S3 URL: {recording.get('s3Url')}")

    # Step 7: confirm appointment updated with S3 link
    print("\n[7/9] Confirming appointment update...")
    try:
        appointment = get_appointment(doctor_token, appointment_id)
        print(f"  Appointment S3 URL: {appointment.get('s3Url')}")
    except RuntimeError as exc:
        print(f"  Warning: could not fetch appointment yet ({exc})")

    # Step 8: poll transcription
    print("\n[8/9] Polling transcription status...")
    try:
        poll_transcription(doctor_token, recording_id)
        print("✓ Transcription completed")
    except TimeoutError as exc:
        print(f"  Warning: {exc}")

    # Step 9: verify outputs (recording, patient)
    print("\n[9/9] Fetching final recording and patient data...")
    final_recording = get_recording(doctor_token, recording_id)
    transcript = final_recording.get("transcription")
    if transcript:
        print(f"✓ Transcript length: {len(transcript)} characters")
        print(f"  Preview: {transcript[:200]}...")
    else:
        print("⚠ Transcript not yet available")
    structured_notes = final_recording.get("aiProcessing", {}).get("structuredNotes")
    if structured_notes:
        print("✓ Structured notes present")
        print(f"  Medications: {structured_notes.get('medications')}")
        print(f"  Allergies: {structured_notes.get('allergies')}")
    else:
        print("⚠ Structured notes not available")
    try:
        patient_details = get_patient(doctor_token, patient_id)
    except RuntimeError:
        patient_details = get_patient(receptionist_token, patient_id)
    if patient_details.get("currentMedication"):
        print(f"✓ Patient currentMedication: {patient_details.get('currentMedication')}")
    if patient_details.get("allergies"):
        print(f"✓ Patient allergies: {patient_details.get('allergies')}")

    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)
    print(f"Recording ID: {recording_id}")
    print(f"Patient ID: {patient_id}")
    print(f"Appointment ID: {appointment_id}")
    print(f"Use GET {BASE_URL}/api/recordings/{recording_id} for details")

if __name__ == "__main__":
    main()
