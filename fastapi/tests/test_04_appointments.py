import pytest
from fastapi.testclient import TestClient
"""
Test 04: Appointment Management
"""



def setup_users_and_patient(test_client: TestClient, doctor_user_data, patient_data):
    """Helper to set up doctor and patient."""
    # Register doctor
    test_client.post("/api/auth/register", json=doctor_user_data)
    login_response = test_client.post("/api/auth/login", json={
        "email": doctor_user_data["email"],
        "password": doctor_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    
    # Create patient
    patient_response = test_client.post(
        "/api/patients",
        json=patient_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    patient_id = patient_response.json()["data"]["_id"]
    doctor_id = login_response.json()["data"]["user"]["_id"]
    
    return token, patient_id, doctor_id


def test_create_appointment(test_client: TestClient, doctor_user_data, patient_data, appointment_data):
    """Test creating an appointment."""
    token, patient_id, doctor_id = setup_users_and_patient(test_client, doctor_user_data, patient_data)
    
    # Create appointment
    appointment_data["patient"] = patient_id
    appointment_data["doctor"] = doctor_id
    appointment_data["scheduledBy"] = doctor_id
    
    response = test_client.post(
        "/api/appointments",
        json=appointment_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["patient"] == patient_id
    assert "appointmentId" in data["data"]


def test_get_appointments(test_client: TestClient, doctor_user_data, patient_data, appointment_data):
    """Test getting all appointments."""
    token, patient_id, doctor_id = setup_users_and_patient(test_client, doctor_user_data, patient_data)
    
    # Create appointment
    appointment_data["patient"] = patient_id
    appointment_data["doctor"] = doctor_id
    appointment_data["scheduledBy"] = doctor_id
    
    test_client.post(
        "/api/appointments",
        json=appointment_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Get appointments
    response = test_client.get(
        "/api/appointments",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert len(data["data"]) > 0


def test_get_appointment_by_id(test_client: TestClient, doctor_user_data, patient_data, appointment_data):
    """Test getting a single appointment by ID."""
    token, patient_id, doctor_id = setup_users_and_patient(test_client, doctor_user_data, patient_data)
    
    # Create appointment
    appointment_data["patient"] = patient_id
    appointment_data["doctor"] = doctor_id
    appointment_data["scheduledBy"] = doctor_id
    
    create_response = test_client.post(
        "/api/appointments",
        json=appointment_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    appointment_id = create_response.json()["data"]["_id"]
    
    # Get appointment
    response = test_client.get(
        f"/api/appointments/{appointment_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["_id"] == appointment_id


def test_update_appointment(test_client: TestClient, doctor_user_data, patient_data, appointment_data):
    """Test updating an appointment."""
    token, patient_id, doctor_id = setup_users_and_patient(test_client, doctor_user_data, patient_data)
    
    # Create appointment
    appointment_data["patient"] = patient_id
    appointment_data["doctor"] = doctor_id
    appointment_data["scheduledBy"] = doctor_id
    
    create_response = test_client.post(
        "/api/appointments",
        json=appointment_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    appointment_id = create_response.json()["data"]["_id"]
    
    # Update appointment
    update_data = {"status": "confirmed", "notes": "Patient confirmed"}
    response = test_client.put(
        f"/api/appointments/{appointment_id}",
        json=update_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["status"] == "confirmed"


def test_delete_appointment(test_client: TestClient, doctor_user_data, patient_data, appointment_data):
    """Test deleting/cancelling an appointment."""
    token, patient_id, doctor_id = setup_users_and_patient(test_client, doctor_user_data, patient_data)
    
    # Create appointment
    appointment_data["patient"] = patient_id
    appointment_data["doctor"] = doctor_id
    appointment_data["scheduledBy"] = doctor_id
    
    create_response = test_client.post(
        "/api/appointments",
        json=appointment_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    appointment_id = create_response.json()["data"]["_id"]
    
    # Delete appointment
    response = test_client.delete(
        f"/api/appointments/{appointment_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

