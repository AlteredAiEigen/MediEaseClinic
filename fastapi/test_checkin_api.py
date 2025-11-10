#!/usr/bin/env python3
"""
Test check-in API endpoint
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def log(message, status="INFO"):
    print(f"[{status}] {message}")

def test_checkin_api():
    """Test the check-in API"""
    
    # Step 1: Login as receptionist
    log("Step 1: Logging in as receptionist...")
    login_data = {
        "email": "reception@test.com",
        "password": "Reception123!"
    }
    
    # Try to login, if fails, register first
    login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    
    if login_response.status_code != 200:
        log("Receptionist not found, registering...", "WARN")
        register_data = {
            "firstName": "Reception",
            "lastName": "Test",
            "email": "reception@test.com",
            "password": "Reception123!",
            "role": "receptionist",
            "phone": "+1234567890"
        }
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        if register_response.status_code not in [200, 201]:
            log(f"Registration failed: {register_response.text}", "ERROR")
            return False
        
        # Login after registration
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    
    if login_response.status_code != 200:
        log(f"Login failed: {login_response.text}", "ERROR")
        return False
    
    login_result = login_response.json()
    if not login_result.get("success"):
        log(f"Login failed: {login_result}", "ERROR")
        return False
    
    # Handle different response structures
    data = login_result.get("data", {})
    if isinstance(data, dict) and "data" in data:
        token = data["data"].get("accessToken") or data["data"].get("access_token")
    else:
        token = data.get("accessToken") or data.get("access_token")
    
    if not token:
        log(f"Token not found in response: {login_result}", "ERROR")
        return False
    
    log(f"Login successful! Token: {token[:30]}...", "SUCCESS")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 2: Get doctors
    log("Step 2: Fetching doctors...")
    doctors_response = requests.get(f"{BASE_URL}/api/doctors?limit=10", headers=headers)
    if doctors_response.status_code != 200:
        log(f"Failed to fetch doctors: {doctors_response.text}", "ERROR")
        return False
    
    doctors_data = doctors_response.json()
    doctors = []
    
    # Handle different response structures
    if isinstance(doctors_data, list):
        doctors = doctors_data
    elif isinstance(doctors_data, dict):
        if doctors_data.get("success"):
            data = doctors_data.get("data", {})
            if isinstance(data, list):
                doctors = data
            elif isinstance(data, dict):
                doctors = data.get("doctors", [])
        else:
            doctors = doctors_data.get("data", [])
    
    if not doctors:
        log("No doctors found. Need to create a doctor first.", "WARN")
        return False
    
    doctor_id = doctors[0]["_id"]
    log(f"Found doctor: {doctors[0].get('firstName')} {doctors[0].get('lastName')} (ID: {doctor_id})", "SUCCESS")
    
    # Step 3: Create a new patient for testing (to avoid queue conflicts)
    log("Step 3: Creating a new patient for testing...")
    patient_data = {
        "firstName": "Test",
        "lastName": f"Patient{int(datetime.now().timestamp())}",
        "email": f"testpatient{int(datetime.now().timestamp())}@test.com",
        "phone": f"+1{int(datetime.now().timestamp()) % 10000000000}",
        "gender": "Male",
        "dateOfBirth": "1990-01-01",
        "age": "35",
        "bloodGroup": "O+",
        "address": "123 Test St, Test City, TS 12345, USA"
    }
    create_patient_response = requests.post(f"{BASE_URL}/api/patients", json=patient_data, headers=headers)
    if create_patient_response.status_code not in [200, 201]:
        log(f"Failed to create patient: {create_patient_response.text}", "ERROR")
        return False
    patient_result = create_patient_response.json()
    # Handle different response structures
    patient_id = None
    if isinstance(patient_result, dict):
        if patient_result.get("success"):
            data = patient_result.get("data", {})
            if isinstance(data, dict):
                # Check if it's nested under 'patient' key
                if "patient" in data:
                    patient_id = data["patient"].get("_id")
                else:
                    patient_id = data.get("_id")
            elif isinstance(data, list) and len(data) > 0:
                patient_id = data[0].get("_id")
        else:
            patient_id = patient_result.get("_id")
    else:
        patient_id = patient_result.get("_id") if isinstance(patient_result, dict) else None
    
    if not patient_id:
        log(f"Could not extract patient ID from response: {patient_result}", "ERROR")
        return False
    log(f"Created patient (ID: {patient_id})", "SUCCESS")
    
    # Step 4: Create a scheduled appointment
    log("Step 4: Creating a scheduled appointment...")
    # Use today's date to avoid conflicts
    today = datetime.now().strftime("%Y-%m-%d")
    # Use a unique time slot based on current timestamp (seconds)
    timestamp = int(datetime.now().timestamp())
    hour = (timestamp % 8) + 9  # Between 9 AM and 5 PM
    minute = ((timestamp // 10) % 4) * 15  # 0, 15, 30, or 45
    time_slot = f"{hour:02d}:{minute:02d}"
    
    appointment_data = {
        "patientId": patient_id,
        "doctorId": doctor_id,
        "date": today,
        "time": time_slot,
        "reason": "Test Check-in",
        "status": "scheduled"
    }
    log(f"Creating appointment for {today} at {time_slot}...", "INFO")
    
    create_appointment_response = requests.post(f"{BASE_URL}/api/appointments", json=appointment_data, headers=headers)
    if create_appointment_response.status_code not in [200, 201]:
        log(f"Failed to create appointment: {create_appointment_response.text}", "ERROR")
        return False
    
    appointment_result = create_appointment_response.json()
    # Handle different response structures
    appointment_id = None
    if isinstance(appointment_result, dict):
        if appointment_result.get("success"):
            data = appointment_result.get("data", {})
            if isinstance(data, dict):
                # Check if it's nested under 'appointment' key
                if "appointment" in data:
                    appointment_id = data["appointment"].get("_id")
                else:
                    appointment_id = data.get("_id")
            elif isinstance(data, list) and len(data) > 0:
                appointment_id = data[0].get("_id")
        else:
            appointment_id = appointment_result.get("_id")
    else:
        appointment_id = appointment_result.get("_id") if isinstance(appointment_result, dict) else None
    
    if not appointment_id:
        log(f"Could not extract appointment ID from response: {appointment_result}", "ERROR")
        return False
    log(f"Created appointment (ID: {appointment_id})", "SUCCESS")
    
    # Step 5: Test check-in API
    log("Step 5: Testing check-in API...")
    checkin_data = {
        "appointmentId": appointment_id,
        "reason": "API Test Check-in",
        "priority": "medium"
    }
    
    checkin_response = requests.post(f"{BASE_URL}/api/queue/check-in", json=checkin_data, headers=headers)
    log(f"Check-in response status: {checkin_response.status_code}", "INFO")
    log(f"Check-in response: {checkin_response.text}", "INFO")
    
    if checkin_response.status_code in [200, 201]:
        checkin_result = checkin_response.json()
        if checkin_result.get("success"):
            log("✅ Check-in API test PASSED!", "SUCCESS")
            log(f"Queue entry created: {json.dumps(checkin_result.get('data', {}), indent=2)}", "INFO")
            
            # Step 6: Verify queue entry
            log("Step 6: Verifying queue entry...")
            queue_response = requests.get(f"{BASE_URL}/api/queue", headers=headers)
            if queue_response.status_code == 200:
                queue_result = queue_response.json()
                if queue_result.get("success"):
                    queue_entries = queue_result.get("data", {}).get("queue", [])
                    log(f"Found {len(queue_entries)} queue entries", "SUCCESS")
                    if queue_entries:
                        log(f"Latest entry: {json.dumps(queue_entries[0], indent=2)}", "INFO")
            return True
        else:
            log(f"❌ Check-in failed: {checkin_result.get('message', 'Unknown error')}", "ERROR")
            return False
    else:
        log(f"❌ Check-in API test FAILED with status {checkin_response.status_code}", "ERROR")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Testing Check-in API")
    print("=" * 60)
    success = test_checkin_api()
    print("=" * 60)
    if success:
        print("✅ All API tests passed!")
    else:
        print("❌ Some tests failed. Check the logs above.")
    print("=" * 60)

