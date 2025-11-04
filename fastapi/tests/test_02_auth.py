import pytest
from fastapi.testclient import TestClient
"""
Test 02: Authentication - Register, Login, Token Management
"""



def test_register_admin_user(test_client: TestClient, admin_user_data):
    """Test admin user registration."""
    response = test_client.post("/api/auth/register", json=admin_user_data)
    
    assert response.status_code == 201
    data = response.json()
    
    assert data["success"] is True
    assert "data" in data
    assert data["data"]["email"] == admin_user_data["email"]
    assert data["data"]["role"] == "admin"
    assert "password" not in data["data"]  # Password should not be returned


def test_register_doctor_user(test_client: TestClient, doctor_user_data):
    """Test doctor user registration."""
    response = test_client.post("/api/auth/register", json=doctor_user_data)
    
    assert response.status_code == 201
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["role"] == "doctor"
    assert data["data"]["speciality"] == "Cardiology"


def test_register_receptionist_user(test_client: TestClient, receptionist_user_data):
    """Test receptionist user registration."""
    response = test_client.post("/api/auth/register", json=receptionist_user_data)
    
    assert response.status_code == 201
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["role"] == "receptionist"


def test_register_duplicate_email(test_client: TestClient, admin_user_data):
    """Test registration with duplicate email."""
    # First registration
    test_client.post("/api/auth/register", json=admin_user_data)
    
    # Second registration with same email
    response = test_client.post("/api/auth/register", json=admin_user_data)
    
    assert response.status_code == 400
    data = response.json()
    assert data["success"] is False


def test_login_success(test_client: TestClient, admin_user_data):
    """Test successful login."""
    # Register user first
    test_client.post("/api/auth/register", json=admin_user_data)
    
    # Login
    login_data = {
        "email": admin_user_data["email"],
        "password": admin_user_data["password"]
    }
    response = test_client.post("/api/auth/login", json=login_data)
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["token_type"] == "bearer"


def test_login_invalid_credentials(test_client: TestClient):
    """Test login with invalid credentials."""
    login_data = {
        "email": "nonexistent@test.com",
        "password": "wrongpassword"
    }
    response = test_client.post("/api/auth/login", json=login_data)
    
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False


def test_get_current_user(test_client: TestClient, admin_user_data):
    """Test getting current user information."""
    # Register and login
    test_client.post("/api/auth/register", json=admin_user_data)
    login_response = test_client.post("/api/auth/login", json={
        "email": admin_user_data["email"],
        "password": admin_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    
    # Get current user
    response = test_client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["email"] == admin_user_data["email"]
    assert data["data"]["role"] == "admin"


def test_unauthorized_access(test_client: TestClient):
    """Test accessing protected endpoint without token."""
    response = test_client.get("/api/auth/me")
    
    assert response.status_code == 401

