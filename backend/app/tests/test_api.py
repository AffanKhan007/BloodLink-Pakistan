from datetime import date, datetime, timedelta, timezone

from app.services.matching import get_matching_donors


def login(client, email: str, password: str) -> str:
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


def test_health_route(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_auth_register_and_me(client):
    register_response = client.post(
        "/auth/register",
        json={
            "full_name": "New User",
            "email": "new.user@test.com",
            "phone": "+923001111117",
            "password": "User12345",
            "role": "receiver",
        },
    )
    assert register_response.status_code == 201
    token = register_response.json()["access_token"]

    me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "new.user@test.com"


def test_donor_profile_create(client):
    client.post(
        "/auth/register",
        json={
            "full_name": "Donor Create",
            "email": "donor.create@test.com",
            "phone": "+923001111118",
            "password": "Donor12345",
            "role": "donor",
        },
    )
    token = login(client, "donor.create@test.com", "Donor12345")
    response = client.post(
        "/donors/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "blood_group": "O+",
            "city": "Lahore",
            "area": "Model Town",
            "age": 30,
            "gender": "female",
            "last_donation_date": str(date.today() - timedelta(days=120)),
            "availability_status": "available",
            "is_publicly_available": True,
            "health_notes": "No known issues",
        },
    )
    assert response.status_code == 200
    assert response.json()["blood_group"] == "O+"
    assert response.json()["verification_status"] == "approved"


def test_blood_request_creation_creates_auto_matches(client):
    client.post(
        "/auth/register",
        json={
            "full_name": "Receiver Create",
            "email": "receiver.create@test.com",
            "phone": "+923001111119",
            "password": "Receiver12345",
            "role": "receiver",
        },
    )
    donor_register = client.post(
        "/auth/register",
        json={
            "full_name": "Compatible Donor",
            "email": "compatible@test.com",
            "phone": "+923001111120",
            "password": "Donor12345",
            "role": "donor",
        },
    )
    donor_token = donor_register.json()["access_token"]
    client.post(
        "/donors/profile",
        headers={"Authorization": f"Bearer {donor_token}"},
        json={
            "blood_group": "O-",
            "city": "Lahore",
            "area": "Model Town",
            "age": 27,
            "gender": "male",
            "last_donation_date": str(date.today() - timedelta(days=120)),
            "availability_status": "available",
            "is_publicly_available": True,
            "health_notes": "Ready",
        },
    )
    token = login(client, "receiver.create@test.com", "Receiver12345")
    response = client.post(
        "/requests",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "patient_name": "Patient New",
            "blood_group_needed": "A+",
            "units_required": 1,
            "hospital_name": "Mayo Hospital",
            "city": "Lahore",
            "area": "Anarkali",
            "ward_room": "Emergency",
            "urgency_level": "critical",
            "attendant_name": "Receiver Create",
            "attendant_phone": "+923001111119",
            "required_by": (datetime.now(timezone.utc) + timedelta(hours=6)).isoformat(),
            "additional_notes": "Auto matching expected",
        },
    )
    assert response.status_code == 201
    assert response.json()["status"] == "matched"


def test_matching_service_returns_eligible_donors(seeded_db):
    donors = get_matching_donors(seeded_db["db"], seeded_db["request"])
    assert len(donors) == 1
    assert donors[0].blood_group == "B+"


def test_public_donor_discovery_for_request(client, seeded_db):
    token = login(client, "receiver@test.com", "Receiver12345")
    response = client.get(
        f"/requests/{seeded_db['request'].id}/public-donors",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()[0]["user"]["full_name"] == "Donor User"


def test_chat_creation_with_public_donor(client, seeded_db):
    token = login(client, "receiver@test.com", "Receiver12345")
    response = client.post(
        "/chats",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "target_user_id": seeded_db["donor"].id,
            "request_id": seeded_db["request"].id,
            "subject": "Need help",
            "initial_message": "Can you help with this case?",
        },
    )
    assert response.status_code == 201
    assert response.json()["counterpart"]["id"] == seeded_db["donor"].id
    assert response.json()["messages"][0]["message"] == "Can you help with this case?"


def test_chat_websocket_receives_realtime_message(client, seeded_db):
    receiver_token = login(client, "receiver@test.com", "Receiver12345")
    donor_token = login(client, "donor@test.com", "Donor12345")
    chat_response = client.post(
        "/chats",
        headers={"Authorization": f"Bearer {receiver_token}"},
        json={
            "target_user_id": seeded_db["donor"].id,
            "request_id": seeded_db["request"].id,
            "subject": "Live support",
            "initial_message": "Opening a live thread.",
        },
    )
    assert chat_response.status_code == 201
    chat_id = chat_response.json()["id"]

    with client.websocket_connect(f"/chats/ws/{chat_id}?token={donor_token}") as websocket:
        connected = websocket.receive_json()
        assert connected["type"] == "chat.connected"

        send_response = client.post(
            f"/chats/{chat_id}/messages",
            headers={"Authorization": f"Bearer {receiver_token}"},
            json={"message": "This should arrive in real time."},
        )
        assert send_response.status_code == 201

        payload = websocket.receive_json()
        assert payload["type"] == "chat.message"
        assert payload["chat_id"] == chat_id
        assert payload["message"]["message"] == "This should arrive in real time."


def test_admin_approval_route_still_available(client, seeded_db):
    token = login(client, "admin@test.com", "Admin12345")
    response = client.patch(
        f"/admin/requests/{seeded_db['request'].id}/approve",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "approved"


def test_hospital_dashboard_route(client, seeded_db):
    token = login(client, "hospital@test.com", "Hospital12345")
    response = client.get(
        f"/api/v1/hospitals/{seeded_db['hospital'].id}/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["hospital"]["name"] == "Test Hospital"


def test_blood_bank_inventory_summary_route(client, seeded_db):
    token = login(client, "bank@test.com", "BloodBank12345")
    response = client.get(
        f"/api/v1/blood-banks/{seeded_db['blood_bank'].id}/inventory-summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["total_units"] == 3
