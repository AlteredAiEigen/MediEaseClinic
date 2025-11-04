"""
Pytest configuration and fixtures for testing.
"""

import pytest
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from httpx import AsyncClient
from app.main import app
from app.config import settings

# Test database configuration
TEST_DATABASE_NAME = "mediease_test"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def db_client():
    """Create a test database client."""
    client = AsyncIOMotorClient(settings.mongodb_url)
    yield client
    # Cleanup: drop test database after all tests
    await client.drop_database(TEST_DATABASE_NAME)
    client.close()


@pytest.fixture(scope="session")
def test_client(db_client):
    """Create a test HTTP client with initialized database."""
    from fastapi.testclient import TestClient

    # Properly initialize the database for the test session
    from app.database import Database, init_db
    Database.client = db_client
    Database.database = db_client[TEST_DATABASE_NAME]
    init_db()

    return TestClient(app)


@pytest.fixture(scope="function")
async def clean_db(db_client):
    """Clean database before each test."""
    db = db_client[TEST_DATABASE_NAME]
    
    # Drop all collections
    collections = await db.list_collection_names()
    for collection_name in collections:
        await db[collection_name].drop()
    
    yield db


@pytest.fixture
def admin_user_data():
    """Admin user data for testing."""
    return {
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@test.com",
        "password": "Admin123!",
        "role": "admin",
        "phone": "+1234567890"
    }


@pytest.fixture
def doctor_user_data():
    """Doctor user data for testing."""
    return {
        "firstName": "Dr. John",
        "lastName": "Smith",
        "email": "doctor@test.com",
        "password": "Doctor123!",
        "role": "doctor",
        "phone": "+1234567891",
        "speciality": "Cardiology",
        "licenseNumber": "DOC123456"
    }


@pytest.fixture
def receptionist_user_data():
    """Receptionist user data for testing."""
    return {
        "firstName": "Jane",
        "lastName": "Receptionist",
        "email": "receptionist@test.com",
        "password": "Receptionist123!",
        "role": "receptionist",
        "phone": "+1234567892"
    }


@pytest.fixture
def patient_data():
    """Patient data for testing."""
    return {
        "firstName": "John",
        "lastName": "Patient",
        "gender": "male",
        "age": 35,
        "dateOfBirth": "1989-01-15",
        "email": "patient@test.com",
        "phone": "+1234567893",
        "bloodGroup": "A+",
        "address": {
            "street": "123 Main St",
            "city": "New York",
            "state": "NY",
            "zipCode": "10001",
            "country": "USA"
        },
        "allergies": ["Penicillin"],
        "currentMedication": "None"
    }


@pytest.fixture
def appointment_data():
    """Appointment data for testing."""
    return {
        "date": "2024-12-15",
        "time": "14:30",
        "duration": 30,
        "reason": "Annual checkup",
        "priority": "medium",
        "notes": "First visit"
    }


@pytest.fixture
def prescription_data():
    """Prescription data for testing."""
    return {
        "medications": [
            {
                "name": "Amoxicillin",
                "dosage": "500mg",
                "frequency": "3 times daily",
                "duration": "7 days",
                "instructions": "Take with food"
            }
        ],
        "diagnosis": "Bacterial infection",
        "notes": "Complete full course"
    }


@pytest.fixture
def clinical_note_data():
    """Clinical note data for testing."""
    return {
        "type": "consultation",
        "title": "Initial Consultation",
        "content": "Patient presented with fever and cough. Diagnosed with upper respiratory infection.",
        "category": "consultation",
        "priority": "medium",
        "timestamp": "14:30",
        "tags": ["fever", "cough"],
        "actionable": True
    }

