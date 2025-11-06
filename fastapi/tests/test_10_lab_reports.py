import pytest
from fastapi.testclient import TestClient


@pytest.mark.usefixtures("clean_db")
def test_lab_report_crud_flow(
    test_client: TestClient,
    doctor_user_data,
    patient_data,
):
    # Register doctor (returns tokens)
    doctor_register = test_client.post("/api/auth/register", json=doctor_user_data)
    assert doctor_register.status_code == 201
    doctor_payload = doctor_register.json()["data"]
    doctor_token = doctor_payload["accessToken"]
    doctor_id = doctor_payload["user"]["_id"]

    # Create patient
    patient_payload = patient_data.copy()
    patient_payload.update(
        {
            "gender": "Male",
            "address": "123 Wellness Lane, New York, NY",
        }
    )
    patient_response = test_client.post(
        "/api/patients",
        json=patient_payload,
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert patient_response.status_code == 201
    patient_id = patient_response.json()["data"]["patient"]["_id"]

    # Create lab report
    lab_report_payload = {
        "patientId": patient_id,
        "doctorId": doctor_id,
        "reportType": "Complete Blood Count",
        "category": "Hematology",
        "orderedBy": "Dr. John Smith",
        "labName": "MediEase Diagnostics",
        "collectedDate": "2024-01-10",
        "reportedDate": "2024-01-11",
        "notes": "Routine evaluation",
        "tests": [
            {
                "name": "Hemoglobin",
                "result": "13.5",
                "unit": "g/dL",
                "normalRange": "13.0-17.0",
                "status": "normal",
            }
        ],
    }
    create_response = test_client.post(
        "/api/lab-reports",
        json=lab_report_payload,
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert create_response.status_code == 201
    created_data = create_response.json()["data"]
    report_id = created_data["_id"]

    # List reports
    list_response = test_client.get(
        "/api/lab-reports",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert list_response.status_code == 200
    list_data = list_response.json()
    assert list_data["data"]
    assert list_data["data"][0]["reportType"] == "Complete Blood Count"

    # Retrieve single report
    get_response = test_client.get(
        f"/api/lab-reports/{report_id}",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert get_response.status_code == 200
    assert get_response.json()["data"]["reportId"]

    # Update report
    update_response = test_client.put(
        f"/api/lab-reports/{report_id}",
        json={"isReviewed": True, "reviewedBy": doctor_id},
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["data"]["isReviewed"] is True

    # Delete report
    delete_response = test_client.delete(
        f"/api/lab-reports/{report_id}",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["data"]["reportId"] == report_id

