import pytest
from fastapi.testclient import TestClient
"""
Test 05: Prescription Management
"""



def setup_full_context(test_client: TestClient, doctor_user_data, patient_data, appointment_data):
    """Helper to set up doctor, patient, and appointment."""
    # Register doctor
    test_client.post("/api/auth/register", json=doctor_user_data)
    login_response = test_client.post("/api/auth/login", json={
        "email": doctor_user_data["email"],
        "password": doctor_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    doctor_id = login_response.json()["data"]["user"]["_id"]
    
    # Create patient
    patient_response = test_client.post(
        "/api/patients",
        json=patient_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    patient_id = patient_response.json()["data"]["_id"]
    
    # Create appointment
    appointment_data["patient"] = patient_id
    appointment_data["doctor"] = doctor_id
    appointment_data["scheduledBy"] = doctor_id
    
    appointment_response = test_client.post(
        "/api/appointments",
        json=appointment_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    appointment_id = appointment_response.json()["data"]["_id"]
    
    return token, patient_id, doctor_id, appointment_id


def test_create_prescription(test_client: TestClient, doctor_user_data, patient_data, 
                                   appointment_data, prescription_data):
    """Test creating a prescription."""
    token, patient_id, doctor_id, appointment_id = setup_full_context(
        test_client, doctor_user_data, patient_data, appointment_data
    )
    
    # Create prescription
    prescription_data["patient"] = patient_id
    prescription_data["doctor"] = doctor_id
    prescription_data["appointment"] = appointment_id
    
    response = test_client.post(
        "/api/prescriptions",
        json=prescription_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["patient"] == patient_id
    assert "prescriptionId" in data["data"]
    assert len(data["data"]["medications"]) > 0


def test_get_prescriptions(test_client: TestClient, doctor_user_data, patient_data, 
                                appointment_data, prescription_data):
    """Test getting all prescriptions."""
    token, patient_id, doctor_id, appointment_id = setup_full_context(
        test_client, doctor_user_data, patient_data, appointment_data
    )
    
    # Create prescription
    prescription_data["patient"] = patient_id
    prescription_data["doctor"] = doctor_id
    prescription_data["appointment"] = appointment_id
    
    test_client.post(
        "/api/prescriptions",
        json=prescription_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Get prescriptions
    response = test_client.get(
        "/api/prescriptions",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert len(data["data"]) > 0


def test_get_prescription_by_id(test_client: TestClient, doctor_user_data, patient_data, 
                                     appointment_data, prescription_data):
    """Test getting a single prescription by ID."""
    token, patient_id, doctor_id, appointment_id = setup_full_context(
        test_client, doctor_user_data, patient_data, appointment_data
    )
    
    # Create prescription
    prescription_data["patient"] = patient_id
    prescription_data["doctor"] = doctor_id
    prescription_data["appointment"] = appointment_id
    
    create_response = test_client.post(
        "/api/prescriptions",
        json=prescription_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    prescription_id = create_response.json()["data"]["_id"]
    
    # Get prescription
    response = test_client.get(
        f"/api/prescriptions/{prescription_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["_id"] == prescription_id


def test_update_prescription(test_client: TestClient, doctor_user_data, patient_data, 
                                  appointment_data, prescription_data):
    """Test updating a prescription."""
    token, patient_id, doctor_id, appointment_id = setup_full_context(
        test_client, doctor_user_data, patient_data, appointment_data
    )
    
    # Create prescription
    prescription_data["patient"] = patient_id
    prescription_data["doctor"] = doctor_id
    prescription_data["appointment"] = appointment_id
    
    create_response = test_client.post(
        "/api/prescriptions",
        json=prescription_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    prescription_id = create_response.json()["data"]["_id"]
    
    # Update prescription
    update_data = {"notes": "Updated dosage instructions"}
    response = test_client.put(
        f"/api/prescriptions/{prescription_id}",
        json=update_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["notes"] == "Updated dosage instructions"


def test_delete_prescription(test_client: TestClient, doctor_user_data, patient_data, 
                                  appointment_data, prescription_data):
    """Test deleting a prescription."""
    token, patient_id, doctor_id, appointment_id = setup_full_context(
        test_client, doctor_user_data, patient_data, appointment_data
    )
    
    # Create prescription
    prescription_data["patient"] = patient_id
    prescription_data["doctor"] = doctor_id
    prescription_data["appointment"] = appointment_id
    
    create_response = test_client.post(
        "/api/prescriptions",
        json=prescription_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    prescription_id = create_response.json()["data"]["_id"]
    
    # Delete prescription
    response = test_client.delete(
        f"/api/prescriptions/{prescription_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

