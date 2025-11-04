import pytest
from fastapi.testclient import TestClient
"""
Test 07: Queue Management
"""



def setup_receptionist_and_patient(test_client: TestClient, receptionist_user_data, 
                                        doctor_user_data, patient_data):
    """Helper to set up receptionist, doctor, and patient."""
    # Register receptionist
    test_client.post("/api/auth/register", json=receptionist_user_data)
    receptionist_login = test_client.post("/api/auth/login", json={
        "email": receptionist_user_data["email"],
        "password": receptionist_user_data["password"]
    })
    receptionist_token = receptionist_login.json()["data"]["access_token"]
    
    # Register doctor
    test_client.post("/api/auth/register", json=doctor_user_data)
    doctor_login = test_client.post("/api/auth/login", json={
        "email": doctor_user_data["email"],
        "password": doctor_user_data["password"]
    })
    doctor_token = doctor_login.json()["data"]["access_token"]
    doctor_id = doctor_login.json()["data"]["user"]["_id"]
    
    # Create patient
    patient_response = test_client.post(
        "/api/patients",
        json=patient_data,
        headers={"Authorization": f"Bearer {doctor_token}"}
    )
    patient_id = patient_response.json()["data"]["_id"]
    
    return receptionist_token, doctor_token, patient_id, doctor_id


def test_check_in_patient(test_client: TestClient, receptionist_user_data, 
                               doctor_user_data, patient_data):
    """Test checking in a patient to the queue."""
    receptionist_token, doctor_token, patient_id, doctor_id = setup_receptionist_and_patient(
        test_client, receptionist_user_data, doctor_user_data, patient_data
    )
    
    # Check in patient
    check_in_data = {
        "patientId": patient_id,
        "doctorId": doctor_id,
        "reason": "Annual checkup",
        "priority": "medium",
        "notes": "First visit"
    }
    
    response = test_client.post(
        "/api/queue/check-in",
        json=check_in_data,
        headers={"Authorization": f"Bearer {receptionist_token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["patient"] == patient_id
    assert "queueId" in data["data"]
    assert "queueNumber" in data["data"]


def test_get_active_queue(test_client: TestClient, receptionist_user_data, 
                               doctor_user_data, patient_data):
    """Test getting the active queue."""
    receptionist_token, doctor_token, patient_id, doctor_id = setup_receptionist_and_patient(
        test_client, receptionist_user_data, doctor_user_data, patient_data
    )
    
    # Check in patient
    check_in_data = {
        "patientId": patient_id,
        "doctorId": doctor_id,
        "reason": "Checkup",
        "priority": "medium"
    }
    
    test_client.post(
        "/api/queue/check-in",
        json=check_in_data,
        headers={"Authorization": f"Bearer {receptionist_token}"}
    )
    
    # Get queue
    response = test_client.get(
        "/api/queue",
        headers={"Authorization": f"Bearer {doctor_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert "queue" in data["data"]
    assert len(data["data"]["queue"]) > 0


def test_get_doctor_queue(test_client: TestClient, receptionist_user_data, 
                               doctor_user_data, patient_data):
    """Test getting a specific doctor's queue."""
    receptionist_token, doctor_token, patient_id, doctor_id = setup_receptionist_and_patient(
        test_client, receptionist_user_data, doctor_user_data, patient_data
    )
    
    # Check in patient
    check_in_data = {
        "patientId": patient_id,
        "doctorId": doctor_id,
        "reason": "Checkup",
        "priority": "medium"
    }
    
    test_client.post(
        "/api/queue/check-in",
        json=check_in_data,
        headers={"Authorization": f"Bearer {receptionist_token}"}
    )
    
    # Get doctor's queue
    response = test_client.get(
        f"/api/queue/doctor/{doctor_id}",
        headers={"Authorization": f"Bearer {doctor_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert len(data["data"]["queue"]) > 0


def test_start_consultation(test_client: TestClient, receptionist_user_data, 
                                 doctor_user_data, patient_data):
    """Test starting a consultation from queue."""
    receptionist_token, doctor_token, patient_id, doctor_id = setup_receptionist_and_patient(
        test_client, receptionist_user_data, doctor_user_data, patient_data
    )
    
    # Check in patient
    check_in_data = {
        "patientId": patient_id,
        "doctorId": doctor_id,
        "reason": "Checkup",
        "priority": "medium"
    }
    
    check_in_response = test_client.post(
        "/api/queue/check-in",
        json=check_in_data,
        headers={"Authorization": f"Bearer {receptionist_token}"}
    )
    queue_entry_id = check_in_response.json()["data"]["_id"]
    
    # Start consultation
    response = test_client.put(
        f"/api/queue/{queue_entry_id}/start-consultation",
        headers={"Authorization": f"Bearer {doctor_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["status"] == "in-consultation"


def test_check_out_patient(test_client: TestClient, receptionist_user_data, 
                                doctor_user_data, patient_data):
    """Test checking out a patient."""
    receptionist_token, doctor_token, patient_id, doctor_id = setup_receptionist_and_patient(
        test_client, receptionist_user_data, doctor_user_data, patient_data
    )
    
    # Check in patient
    check_in_data = {
        "patientId": patient_id,
        "doctorId": doctor_id,
        "reason": "Checkup",
        "priority": "medium"
    }
    
    check_in_response = test_client.post(
        "/api/queue/check-in",
        json=check_in_data,
        headers={"Authorization": f"Bearer {receptionist_token}"}
    )
    queue_entry_id = check_in_response.json()["data"]["_id"]
    
    # Check out
    response = test_client.post(
        f"/api/queue/{queue_entry_id}/check-out",
        headers={"Authorization": f"Bearer {receptionist_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["status"] == "checked-out"


def test_queue_statistics(test_client: TestClient, receptionist_user_data, 
                               doctor_user_data, patient_data):
    """Test getting queue statistics."""
    receptionist_token, doctor_token, patient_id, doctor_id = setup_receptionist_and_patient(
        test_client, receptionist_user_data, doctor_user_data, patient_data
    )
    
    # Check in patient
    check_in_data = {
        "patientId": patient_id,
        "doctorId": doctor_id,
        "reason": "Checkup",
        "priority": "medium"
    }
    
    test_client.post(
        "/api/queue/check-in",
        json=check_in_data,
        headers={"Authorization": f"Bearer {receptionist_token}"}
    )
    
    # Get stats
    response = test_client.get(
        "/api/queue/stats",
        headers={"Authorization": f"Bearer {doctor_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert "totalPatients" in data["data"]
    assert "waiting" in data["data"]

