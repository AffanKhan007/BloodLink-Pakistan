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
            "phone": "+923001111114",
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
            "phone": "+923001111115",
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
            "health_notes": "No known issues",
        },
    )
    assert response.status_code == 200
    assert response.json()["blood_group"] == "O+"


def test_blood_request_creation(client):
    client.post(
        "/auth/register",
        json={
            "full_name": "Receiver Create",
            "email": "receiver.create@test.com",
            "phone": "+923001111116",
            "password": "Receiver12345",
            "role": "receiver",
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
            "attendant_phone": "+923001111116",
            "required_by": (datetime.now(timezone.utc) + timedelta(hours=6)).isoformat(),
        },
    )
    assert response.status_code == 201
    assert response.json()["status"] == "pending_review"


def test_matching_service_returns_eligible_donors(seeded_db):
    donors = get_matching_donors(seeded_db["db"], seeded_db["request"])
    assert len(donors) == 1
    assert donors[0].blood_group == "B+"


def test_admin_approval_route(client, seeded_db):
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
    assert response.json()["total_units"] == 1
