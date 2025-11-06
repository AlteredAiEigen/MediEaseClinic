import pytest
from fastapi.testclient import TestClient


@pytest.mark.usefixtures("clean_db")
def test_admin_metrics_endpoints(
    test_client: TestClient,
    admin_user_data,
    doctor_user_data,
    patient_data,
):
    # Register admin
    admin_register = test_client.post("/api/auth/register", json=admin_user_data)
    admin_payload = admin_register.json()["data"]
    admin_token = admin_payload["accessToken"]

    # Register doctor
    doctor_register = test_client.post("/api/auth/register", json=doctor_user_data)
    doctor_payload = doctor_register.json()["data"]
    doctor_id = doctor_payload["user"]["_id"]

    # Create patient (as admin)
    patient_payload = patient_data.copy()
    patient_payload.update({"gender": "Male", "address": "45 Analytics Road"})
    patient_response = test_client.post(
        "/api/patients",
        json=patient_payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert patient_response.status_code == 201
    patient_id = patient_response.json()["data"]["patient"]["_id"]

    # Create appointments
    appointment_payload = {
        "patientId": patient_id,
        "doctorId": doctor_id,
        "date": "2024-02-01",
        "time": "10:00",
        "duration": 30,
        "priority": "medium",
        "reason": "Routine follow-up",
        "notes": "Initial visit"
    }
    appointment_response = test_client.post(
        "/api/appointments",
        json=appointment_payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert appointment_response.status_code == 201
    appointment_id = appointment_response.json()["data"]["appointment"]["_id"]

    # Mark appointment as completed
    status_response = test_client.patch(
        f"/api/appointments/{appointment_id}/status",
        json={"status": "completed"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert status_response.status_code == 200

    # Add a scheduled appointment for diversity
    appointment_payload["date"] = "2024-03-10"
    test_client.post(
        "/api/appointments",
        json=appointment_payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # Revenue metrics
    revenue_response = test_client.get(
        "/api/admin/metrics/revenue",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert revenue_response.status_code == 200
    series = revenue_response.json()["data"]["series"]
    assert any(item["completed"] >= 1 for item in series)

    # Summary metrics
    summary_response = test_client.get(
        "/api/admin/metrics/summary",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert summary_response.status_code == 200
    summary = summary_response.json()["data"]
    assert summary["patients"]["total"] >= 1
    assert summary["appointments"]["total"] >= 2

