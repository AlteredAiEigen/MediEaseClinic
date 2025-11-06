import pytest
from fastapi.testclient import TestClient
"""
Test 08: Doctor Management
"""



def test_get_all_doctors(test_client: TestClient, doctor_user_data):
    """Test getting all doctors."""
    # Register a doctor
    test_client.post("/api/auth/register", json=doctor_user_data)
    
    # Login as doctor to get token
    login_response = test_client.post("/api/auth/login", json={
        "email": doctor_user_data["email"],
        "password": doctor_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    
    # Get all doctors
    response = test_client.get(
        "/api/doctors",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert "doctors" in data["data"]
    assert len(data["data"]["doctors"]) > 0


def test_get_doctor_by_id(test_client: TestClient, doctor_user_data):
    """Test getting a specific doctor by ID."""
    # Register doctor
    test_client.post("/api/auth/register", json=doctor_user_data)
    
    login_response = test_client.post("/api/auth/login", json={
        "email": doctor_user_data["email"],
        "password": doctor_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    doctor_id = login_response.json()["data"]["user"]["_id"]
    
    # Get doctor by ID
    response = test_client.get(
        f"/api/doctors/{doctor_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["doctor"]["_id"] == doctor_id
    assert data["data"]["doctor"]["speciality"] == "Cardiology"


def test_get_doctor_statistics(test_client: TestClient, doctor_user_data):
    """Test getting doctor statistics."""
    # Register doctor
    test_client.post("/api/auth/register", json=doctor_user_data)
    
    login_response = test_client.post("/api/auth/login", json={
        "email": doctor_user_data["email"],
        "password": doctor_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    
    # Get doctor stats
    response = test_client.get(
        "/api/doctors/stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert "totalDoctors" in data["data"]
    assert "activeDoctors" in data["data"]
    assert "doctorsBySpeciality" in data["data"]


def test_update_doctor_as_admin(test_client: TestClient, admin_user_data, doctor_user_data):
    """Test updating doctor information as admin."""
    # Register admin and doctor
    test_client.post("/api/auth/register", json=admin_user_data)
    test_client.post("/api/auth/register", json=doctor_user_data)
    
    # Login as admin
    admin_login = test_client.post("/api/auth/login", json={
        "email": admin_user_data["email"],
        "password": admin_user_data["password"]
    })
    admin_token = admin_login.json()["data"]["access_token"]
    
    # Get doctor ID
    doctor_login = test_client.post("/api/auth/login", json={
        "email": doctor_user_data["email"],
        "password": doctor_user_data["password"]
    })
    doctor_id = doctor_login.json()["data"]["user"]["_id"]
    
    # Update doctor
    update_data = {"speciality": "Neurology"}
    response = test_client.put(
        f"/api/doctors/{doctor_id}",
        json=update_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["doctor"]["speciality"] == "Neurology"


def test_filter_doctors_by_speciality(test_client: TestClient, doctor_user_data):
    """Test filtering doctors by speciality."""
    # Register doctor
    test_client.post("/api/auth/register", json=doctor_user_data)
    
    login_response = test_client.post("/api/auth/login", json={
        "email": doctor_user_data["email"],
        "password": doctor_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    
    # Filter by speciality
    response = test_client.get(
        "/api/doctors?speciality=Cardiology",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert all(doctor["speciality"] == "Cardiology" for doctor in data["data"]["doctors"])

