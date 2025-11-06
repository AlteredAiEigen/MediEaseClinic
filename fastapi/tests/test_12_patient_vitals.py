import pytest
from fastapi.testclient import TestClient


@pytest.mark.usefixtures("clean_db")
def test_patient_vitals_endpoints(
    test_client: TestClient,
    doctor_user_data,
    patient_data,
):
    # Register doctor
    doctor_register = test_client.post("/api/auth/register", json=doctor_user_data)
    doctor_payload = doctor_register.json()["data"]
    doctor_token = doctor_payload["accessToken"]

    # Create patient
    patient_payload = patient_data.copy()
    patient_payload.update({"gender": "Male", "address": "23 Care Street"})
    patient_response = test_client.post(
        "/api/patients",
        json=patient_payload,
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    patient_id = patient_response.json()["data"]["patient"]["_id"]

    # Record vitals
    vitals_payload = {
        "bloodPressure": "120/80",
        "heartRate": "72",
        "temperature": "98.6 F",
        "oxygenSaturation": "99%",
        "notes": "Patient stable.",
    }
    record_response = test_client.post(
        f"/api/patient-vitals/{patient_id}",
        json=vitals_payload,
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert record_response.status_code == 201
    recorded = record_response.json()["data"]
    assert recorded["bloodPressure"] == "120/80"

    # List vitals
    list_response = test_client.get(
        f"/api/patient-vitals/{patient_id}",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert list_response.status_code == 200
    assert len(list_response.json()["data"]) == 1

    # Latest vitals
    latest_response = test_client.get(
        f"/api/patient-vitals/{patient_id}/latest",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert latest_response.status_code == 200
    assert latest_response.json()["data"]["heartRate"] == "72"

