import pytest
from fastapi.testclient import TestClient


@pytest.mark.usefixtures("clean_db")
def test_queue_reorder_endpoint(
    test_client: TestClient,
    doctor_user_data,
    receptionist_user_data,
    patient_data,
):
    # Register doctor
    doctor_register = test_client.post("/api/auth/register", json=doctor_user_data)
    doctor_payload = doctor_register.json()["data"]
    doctor_id = doctor_payload["user"]["_id"]
    doctor_token = doctor_payload["accessToken"]

    # Register receptionist
    receptionist_register = test_client.post(
        "/api/auth/register", json=receptionist_user_data
    )
    receptionist_payload = receptionist_register.json()["data"]
    receptionist_token = receptionist_payload["accessToken"]

    # Helper to create patient
    def create_patient(name_suffix: str):
        payload = patient_data.copy()
        payload.update(
            {
                "firstName": f"{patient_data['firstName']}{name_suffix}",
                "gender": "Male",
                "address": f"{name_suffix} Queue Street",
            }
        )
        response = test_client.post(
            "/api/patients",
            json=payload,
            headers={"Authorization": f"Bearer {doctor_token}"},
        )
        return response.json()["data"]["patient"]["_id"]

    patient_one = create_patient("A")
    patient_two = create_patient("B")

    # Check-in patients (receptionist role)
    check_in_payload = {
        "doctorId": doctor_id,
        "priority": "medium",
        "reason": "Consultation",
    }

    first_entry = test_client.post(
        "/api/queue/check-in",
        json={**check_in_payload, "patientId": patient_one},
        headers={"Authorization": f"Bearer {receptionist_token}"},
    ).json()["data"]

    second_entry = test_client.post(
        "/api/queue/check-in",
        json={**check_in_payload, "patientId": patient_two},
        headers={"Authorization": f"Bearer {receptionist_token}"},
    ).json()["data"]

    # Reorder queue (reverse order)
    reorder_response = test_client.put(
        "/api/queue/reorder",
        json={
            "doctorId": doctor_id,
            "queueOrder": [second_entry["_id"], first_entry["_id"]],
        },
        headers={"Authorization": f"Bearer {receptionist_token}"},
    )
    assert reorder_response.status_code == 200

    # Fetch queue and ensure order updated
    queue_response = test_client.get(
        "/api/queue",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    queue_data = queue_response.json()["data"]
    assert len(queue_data) == 2
    assert queue_data[0]["_id"] == second_entry["_id"]
    assert queue_data[0]["queue_number"] == 1
    assert queue_data[1]["_id"] == first_entry["_id"]

