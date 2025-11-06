import pytest
from fastapi.testclient import TestClient


@pytest.mark.usefixtures("clean_db")
def test_message_threads_and_messages(
    test_client: TestClient,
    doctor_user_data,
    patient_data,
):
    # Register doctor
    doctor_register = test_client.post("/api/auth/register", json=doctor_user_data)
    doctor_payload = doctor_register.json()["data"]
    doctor_token = doctor_payload["accessToken"]
    doctor_id = doctor_payload["user"]["_id"]

    # Create patient
    patient_payload = patient_data.copy()
    patient_payload.update({"gender": "Male", "address": "1 Healthcare Ave"})
    patient_response = test_client.post(
        "/api/patients",
        json=patient_payload,
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    patient_id = patient_response.json()["data"]["patient"]["_id"]

    # Create conversation
    conversation_response = test_client.post(
        "/api/messages/conversations",
        json={
            "patientId": patient_id,
            "participants": [doctor_id],
            "title": "Follow-up discussion",
        },
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert conversation_response.status_code == 201
    conversation = conversation_response.json()["data"]
    conversation_id = conversation["_id"]

    # List conversations
    list_response = test_client.get(
        "/api/messages/conversations",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert list_response.status_code == 200
    assert list_response.json()["data"][0]["conversationId"] == conversation["conversationId"]

    # Send a message
    send_response = test_client.post(
        f"/api/messages/conversations/{conversation_id}/messages",
        json={"body": "Hello, please remember to take your medication."},
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert send_response.status_code == 201
    message = send_response.json()["data"]
    assert message["body"].startswith("Hello")

    # Retrieve messages
    messages_response = test_client.get(
        f"/api/messages/conversations/{conversation_id}/messages",
        headers={"Authorization": f"Bearer {doctor_token}"},
    )
    assert messages_response.status_code == 200
    assert len(messages_response.json()["data"]) == 1

