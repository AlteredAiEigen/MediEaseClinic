import pytest
from fastapi.testclient import TestClient
"""
Test 09: Admin Dashboard and Management
"""



def test_admin_dashboard_stats(test_client: TestClient, admin_user_data):
    """Test getting admin dashboard statistics."""
    # Register and login as admin
    test_client.post("/api/auth/register", json=admin_user_data)
    login_response = test_client.post("/api/auth/login", json={
        "email": admin_user_data["email"],
        "password": admin_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    
    # Get dashboard stats
    response = test_client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert "totalPatients" in data["data"]
    assert "totalAppointments" in data["data"]
    assert "totalDoctors" in data["data"]
    assert "recentActivity" in data["data"]


def test_admin_system_stats(test_client: TestClient, admin_user_data):
    """Test getting system statistics."""
    # Register and login as admin
    test_client.post("/api/auth/register", json=admin_user_data)
    login_response = test_client.post("/api/auth/login", json={
        "email": admin_user_data["email"],
        "password": admin_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    
    # Get system stats
    response = test_client.get(
        "/api/admin/stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert "totalUsers" in data["data"]
    assert "activeUsers" in data["data"]


def test_admin_create_user(test_client: TestClient, admin_user_data):
    """Test admin creating a new user."""
    # Register and login as admin
    test_client.post("/api/auth/register", json=admin_user_data)
    login_response = test_client.post("/api/auth/login", json={
        "email": admin_user_data["email"],
        "password": admin_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    
    # Create new user
    new_user_data = {
        "firstName": "New",
        "lastName": "Doctor",
        "email": "newdoctor@test.com",
        "password": "NewDoctor123!",
        "role": "doctor",
        "phone": "+1234567899",
        "speciality": "Pediatrics",
        "licenseNumber": "DOC789"
    }
    
    response = test_client.post(
        "/api/admin/users",
        json=new_user_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["email"] == new_user_data["email"]


def test_admin_get_all_users(test_client: TestClient, admin_user_data, doctor_user_data):
    """Test admin getting all users."""
    # Register users
    test_client.post("/api/auth/register", json=admin_user_data)
    test_client.post("/api/auth/register", json=doctor_user_data)
    
    login_response = test_client.post("/api/auth/login", json={
        "email": admin_user_data["email"],
        "password": admin_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    
    # Get all users
    response = test_client.get(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert len(data["data"]["users"]) >= 2


def test_admin_update_user(test_client: TestClient, admin_user_data, doctor_user_data):
    """Test admin updating a user."""
    # Register users
    test_client.post("/api/auth/register", json=admin_user_data)
    test_client.post("/api/auth/register", json=doctor_user_data)
    
    admin_login = test_client.post("/api/auth/login", json={
        "email": admin_user_data["email"],
        "password": admin_user_data["password"]
    })
    admin_token = admin_login.json()["data"]["access_token"]
    
    doctor_login = test_client.post("/api/auth/login", json={
        "email": doctor_user_data["email"],
        "password": doctor_user_data["password"]
    })
    doctor_id = doctor_login.json()["data"]["user"]["_id"]
    
    # Update user
    update_data = {"phone": "+9999999999"}
    response = test_client.put(
        f"/api/admin/users/{doctor_id}",
        json=update_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["user"]["phone"] == "+9999999999"


def test_non_admin_cannot_access_admin_endpoints(test_client: TestClient, doctor_user_data):
    """Test that non-admin users cannot access admin endpoints."""
    # Register and login as doctor
    test_client.post("/api/auth/register", json=doctor_user_data)
    login_response = test_client.post("/api/auth/login", json={
        "email": doctor_user_data["email"],
        "password": doctor_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    
    # Try to access admin dashboard
    response = test_client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 403  # Forbidden

