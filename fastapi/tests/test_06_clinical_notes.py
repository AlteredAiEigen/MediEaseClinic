import pytest
from fastapi.testclient import TestClient
"""
Test 06: Clinical Notes (including AI features)
"""



def setup_full_context(test_client: TestClient, doctor_user_data, patient_data, appointment_data):
    """Helper to set up doctor, patient, and appointment."""
    test_client.post("/api/auth/register", json=doctor_user_data)
    login_response = test_client.post("/api/auth/login", json={
        "email": doctor_user_data["email"],
        "password": doctor_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    doctor_id = login_response.json()["data"]["user"]["_id"]
    
    patient_response = test_client.post(
        "/api/patients",
        json=patient_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    patient_id = patient_response.json()["data"]["_id"]
    
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


def test_create_clinical_note(test_client: TestClient, doctor_user_data, patient_data, 
                                    appointment_data, clinical_note_data):
    """Test creating a clinical note."""
    token, patient_id, doctor_id, appointment_id = setup_full_context(
        test_client, doctor_user_data, patient_data, appointment_data
    )
    
    # Create clinical note
    clinical_note_data["patient"] = patient_id
    clinical_note_data["doctor"] = doctor_id
    clinical_note_data["appointment"] = appointment_id
    
    response = test_client.post(
        "/api/clinical-notes",
        json=clinical_note_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["patient"] == patient_id
    assert "noteId" in data["data"]


def test_get_clinical_notes(test_client: TestClient, doctor_user_data, patient_data, 
                                 appointment_data, clinical_note_data):
    """Test getting all clinical notes."""
    token, patient_id, doctor_id, appointment_id = setup_full_context(
        test_client, doctor_user_data, patient_data, appointment_data
    )
    
    # Create clinical note
    clinical_note_data["patient"] = patient_id
    clinical_note_data["doctor"] = doctor_id
    clinical_note_data["appointment"] = appointment_id
    
    test_client.post(
        "/api/clinical-notes",
        json=clinical_note_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Get notes
    response = test_client.get(
        "/api/clinical-notes",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert len(data["data"]) > 0


def test_get_actionable_notes(test_client: TestClient, doctor_user_data, patient_data, 
                                   appointment_data, clinical_note_data):
    """Test getting actionable clinical notes."""
    token, patient_id, doctor_id, appointment_id = setup_full_context(
        test_client, doctor_user_data, patient_data, appointment_data
    )
    
    # Create actionable note
    clinical_note_data["patient"] = patient_id
    clinical_note_data["doctor"] = doctor_id
    clinical_note_data["appointment"] = appointment_id
    clinical_note_data["actionable"] = True
    
    test_client.post(
        "/api/clinical-notes",
        json=clinical_note_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Get actionable notes
    response = test_client.get(
        "/api/clinical-notes/actionable",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True


def test_mark_note_complete(test_client: TestClient, doctor_user_data, patient_data, 
                                 appointment_data, clinical_note_data):
    """Test marking a clinical note as complete."""
    token, patient_id, doctor_id, appointment_id = setup_full_context(
        test_client, doctor_user_data, patient_data, appointment_data
    )
    
    # Create note
    clinical_note_data["patient"] = patient_id
    clinical_note_data["doctor"] = doctor_id
    clinical_note_data["appointment"] = appointment_id
    
    create_response = test_client.post(
        "/api/clinical-notes",
        json=clinical_note_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    note_id = create_response.json()["data"]["_id"]
    
    # Mark complete
    response = test_client.put(
        f"/api/clinical-notes/{note_id}/complete",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["success"] is True
    assert data["data"]["completed"] is True


@pytest.mark.skipif(not False, reason="Requires OpenAI API key - skip in automated tests")
def test_ai_generate_from_transcript(test_client: TestClient, doctor_user_data, patient_data):
    """Test AI-powered note generation from transcript."""
    # Setup
    test_client.post("/api/auth/register", json=doctor_user_data)
    login_response = test_client.post("/api/auth/login", json={
        "email": doctor_user_data["email"],
        "password": doctor_user_data["password"]
    })
    token = login_response.json()["data"]["access_token"]
    
    patient_response = test_client.post(
        "/api/patients",
        json=patient_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    patient_id = patient_response.json()["data"]["_id"]
    
    # Generate notes from transcript
    transcript_data = {
        "transcript": "Patient reports chest pain and shortness of breath for 3 days.",
        "patient_id": patient_id
    }
    
    response = test_client.post(
        "/api/clinical-notes/ai/generate-from-transcript",
        json=transcript_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # May fail if AI service not configured - that's okay for this test
    assert response.status_code in [200, 201, 503]

