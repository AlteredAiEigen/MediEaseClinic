import pytest
from fastapi.testclient import TestClient
"""
Test 03: Patient Management - CRUD operations
"""



def test_create_patient(test_client: TestClient, doctor_user_data, patient_data):
    """Test creating a new patient."""
    # Register and login as doctor
    test_client.post("/api/auth/register", json=doctor_user_data)
    login_response = test_client.post("/api/auth/login", json={
        "email": doctor_user_data["email"],
        "password": doctor_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    
    # Create patient
    response = test_client.post(
        "/api/patients",
        json=patient_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["firstName"] == patient_data["firstName"]
    assert data["data"]["email"] == patient_data["email"]
    assert "patientId" in data["data"]
    
    return data["data"]["_id"], token


def test_get_all_patients(test_client: TestClient, doctor_user_data, patient_data):
    """Test getting all patients with pagination."""
    # Setup: Create patient
    test_client.post("/api/auth/register", json=doctor_user_data)
    login_response = test_client.post("/api/auth/login", json={
        "email": doctor_user_data["email"],
        "password": doctor_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    
    test_client.post(
        "/api/patients",
        json=patient_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Get all patients
    response = test_client.get(
        "/api/patients?page=1&limit=10",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert len(data["data"]) > 0
    assert "metadata" in data


def test_get_patient_by_id(test_client: TestClient, doctor_user_data, patient_data):
    """Test getting a single patient by ID."""
    # Setup
    test_client.post("/api/auth/register", json=doctor_user_data)
    login_response = test_client.post("/api/auth/login", json={
        "email": doctor_user_data["email"],
        "password": doctor_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    
    create_response = test_client.post(
        "/api/patients",
        json=patient_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    patient_id = create_response.json()["data"]["_id"]
    
    # Get patient by ID
    response = test_client.get(
        f"/api/patients/{patient_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["_id"] == patient_id


def test_update_patient(test_client: TestClient, doctor_user_data, patient_data):
    """Test updating patient information."""
    # Setup
    test_client.post("/api/auth/register", json=doctor_user_data)
    login_response = test_client.post("/api/auth/login", json={
        "email": doctor_user_data["email"],
        "password": doctor_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    
    create_response = test_client.post(
        "/api/patients",
        json=patient_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    patient_id = create_response.json()["data"]["_id"]
    
    # Update patient
    update_data = {"age": 36, "phone": "+1234567999"}
    response = test_client.put(
        f"/api/patients/{patient_id}",
        json=update_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["age"] == 36


def test_delete_patient(test_client: TestClient, doctor_user_data, patient_data):
    """Test deleting a patient."""
    # Setup
    test_client.post("/api/auth/register", json=doctor_user_data)
    login_response = test_client.post("/api/auth/login", json={
        "email": doctor_user_data["email"],
        "password": doctor_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    
    create_response = test_client.post(
        "/api/patients",
        json=patient_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    patient_id = create_response.json()["data"]["_id"]
    
    # Delete patient
    response = test_client.delete(
        f"/api/patients/{patient_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True


def test_patient_access_control(test_client: TestClient, receptionist_user_data, patient_data):
    """Test that receptionists cannot create patients."""
    # Register and login as receptionist
    test_client.post("/api/auth/register", json=receptionist_user_data)
    login_response = test_client.post("/api/auth/login", json={
        "email": receptionist_user_data["email"],
        "password": receptionist_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    
    # Try to create patient (should fail)
    response = test_client.post(
        "/api/patients",
        json=patient_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 403  # Forbidden

