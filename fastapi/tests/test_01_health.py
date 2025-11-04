import pytest
from fastapi.testclient import TestClient
"""
Test 01: Health check and basic API functionality
"""



def test_health_check(test_client):
    """Test health check endpoint."""
    response = test_client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == "healthy"
    assert data["service"] == "MediEase Clinic API"
    assert "version" in data
    assert "timestamp" in data


def test_root_endpoint(test_client):
    """Test root endpoint."""
    response = test_client.get("/")
    
    assert response.status_code == 200
    data = response.json()
    
    assert "message" in data
    assert "version" in data
    assert "docs" in data


def test_docs_available_in_dev(test_client):
    """Test that API documentation is accessible."""
    response = test_client.get("/docs")
    
    # In development mode, docs should be available
    assert response.status_code == 200

