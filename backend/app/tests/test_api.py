from datetime import date, datetime, timedelta, timezone

from app.services.matching import get_matching_donors


def login(client, email: str, password: str) -> str:
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


def institution_registration_data(**overrides):
    data = {
        "institution_name": "City College Blood Circle",
        "institution_type": "Educational Institution",
        "city": "Lahore",
        "area": "Model Town",
        "address": "Model Town Lahore",
        "contact_person": "Nida Khan",
        "contact_person_designation": "Volunteer Coordinator",
        "email": "college@test.com",
        "phone": "+923001111121",
        "password": "College12345",
        "confirm_authorized": "true",
        "website_social_link": "https://college.test",
    }
    data.update(overrides)
    return data


def proof_file(filename: str = "proof.pdf"):
    return {"proof_document": (filename, b"%PDF-1.4 test proof", "application/pdf")}


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
        },
    )
    assert register_response.status_code == 201
    token = register_response.json()["access_token"]

    me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "new.user@test.com"


def test_institution_register_starts_pending(client):
    register_response = client.post(
        "/auth/register/institution",
        data=institution_registration_data(),
        files=proof_file(),
    )
    assert register_response.status_code == 201
    token = register_response.json()["access_token"]
    profile_response = client.get("/institutions/me", headers={"Authorization": f"Bearer {token}"})
    assert profile_response.status_code == 200
    assert profile_response.json()["status"] == "pending"


def test_pending_institution_cannot_use_profile_update_or_chats(client):
    register_response = client.post(
        "/auth/register/institution",
        data=institution_registration_data(
            institution_name="Pending Institution",
            institution_type="NGO/Welfare Organization",
            area="Johar Town",
            address="Johar Town Lahore",
            contact_person="Areeba",
            contact_person_designation="Coordinator",
            email="pending.institution@test.com",
            phone="+923001111123",
            password="Pending12345",
            website_social_link="",
        ),
        files=proof_file("pending-proof.pdf"),
    )
    assert register_response.status_code == 201
    token = register_response.json()["access_token"]

    profile_update_response = client.post(
        "/institutions/me",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "institution_name": "Pending Institution",
            "institution_type": "NGO/Welfare Organization",
            "city": "Lahore",
            "area": "Johar Town",
            "contact_person": "Areeba",
            "contact_person_designation": "Coordinator",
            "email": "pending.institution@test.com",
            "phone": "+923001111123",
            "address": "Johar Town Lahore",
            "website_social_link": "",
            "operating_hours": "",
            "available_blood_groups": "",
            "notes": "",
        },
    )
    assert profile_update_response.status_code == 403

    chats_response = client.get("/chats", headers={"Authorization": f"Bearer {token}"})
    assert chats_response.status_code == 403


def test_donor_profile_create(client):
    client.post(
        "/auth/register",
        json={
            "full_name": "Donor Create",
            "email": "donor.create@test.com",
            "phone": "+923001111118",
            "password": "Donor12345",
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


def test_blood_request_creation_auto_matches_compatible_donor(client):
    client.post(
        "/auth/register",
        json={
            "full_name": "Receiver Create",
            "email": "receiver.create@test.com",
            "phone": "+923001111119",
            "password": "Receiver12345",
        },
    )
    compatible_register = client.post(
        "/auth/register",
        json={
            "full_name": "Compatible Donor",
            "email": "compatible@test.com",
            "phone": "+923001111120",
            "password": "Donor12345",
        },
    )
    compatible_donor_token = compatible_register.json()["access_token"]
    client.post(
        "/donors/profile",
        headers={"Authorization": f"Bearer {compatible_donor_token}"},
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
    request_creator_token = login(client, "receiver.create@test.com", "Receiver12345")
    response = client.post(
        "/requests",
        headers={"Authorization": f"Bearer {request_creator_token}"},
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
    request_id = response.json()["id"]
    assert response.json()["status"] == "matched"

    matches_response = client.get(
        "/matches/me",
        headers={"Authorization": f"Bearer {compatible_donor_token}"},
    )
    assert matches_response.status_code == 200
    assert any(match["request_id"] == request_id for match in matches_response.json())


def test_matching_service_returns_eligible_donors(seeded_db):
    donors = get_matching_donors(seeded_db["db"], seeded_db["request"])
    assert len(donors) == 1
    assert donors[0].blood_group == "B+"


def test_single_member_can_have_donor_profile_and_create_request_with_self_exclusion(client):
    """A single Member account can simultaneously have a donor profile AND
    create a blood request. Their own donor profile must NOT be matched to
    their own request (per-request exclusion), but they remain matchable to
    others' requests."""
    # 1. Register one member
    register_resp = client.post(
        "/auth/register",
        json={
            "full_name": "Unified Member",
            "email": "unified@test.com",
            "phone": "+923009999991",
            "password": "Unified123",
        },
    )
    assert register_resp.status_code == 201
    member_token = register_resp.json()["access_token"]

    # 2. Create a donor profile for that same member
    profile_resp = client.post(
        "/donors/profile",
        headers={"Authorization": f"Bearer {member_token}"},
        json={
            "blood_group": "A+",
            "city": "Lahore",
            "area": "Gulberg",
            "age": 28,
            "gender": "male",
            "last_donation_date": str(date.today() - timedelta(days=120)),
            "availability_status": "available",
            "is_publicly_available": True,
            "health_notes": "Fit",
        },
    )
    assert profile_resp.status_code == 200
    assert profile_resp.json()["blood_group"] == "A+"

    # 3. Create a blood request from that same member
    request_resp = client.post(
        "/requests",
        headers={"Authorization": f"Bearer {member_token}"},
        json={
            "patient_name": "Unified Patient",
            "blood_group_needed": "A+",
            "units_required": 1,
            "hospital_name": "General Hospital",
            "city": "Lahore",
            "area": "Gulberg",
            "ward_room": "Ward 1",
            "urgency_level": "medium",
            "attendant_name": "Unified Member",
            "attendant_phone": "+923009999991",
            "required_by": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
            "additional_notes": "Single-account test",
        },
    )
    assert request_resp.status_code == 201
    request_id = request_resp.json()["id"]

    # 4. Verify donor profile still exists (no exclusivity)
    get_profile_resp = client.get(
        "/donors/profile/me",
        headers={"Authorization": f"Bearer {member_token}"},
    )
    assert get_profile_resp.status_code == 200
    assert get_profile_resp.json()["blood_group"] == "A+"

    # 5. Verify the member's own request exists
    requests_resp = client.get(
        "/requests",
        headers={"Authorization": f"Bearer {member_token}"},
    )
    assert requests_resp.status_code == 200
    assert any(r["id"] == request_id for r in requests_resp.json())

    # 6. Verify the member's own donor profile is NOT matched to their own request
    #    (the matching-donors endpoint excludes request creator)
    matching_donors_resp = client.get(
        f"/requests/{request_id}/matching-donors",
        headers={"Authorization": f"Bearer {member_token}"},
    )
    assert matching_donors_resp.status_code == 200
    assert len(matching_donors_resp.json()) == 0, (
        "Member's own donor profile should be excluded from matching to their own request"
    )

    # 7. Register a second member with a compatible profile and confirm
    #    they ARE matchable to this request
    client.post(
        "/auth/register",
        json={
            "full_name": "Other Donor",
            "email": "other@test.com",
            "phone": "+923009999992",
            "password": "Other12345",
        },
    )
    other_token = login(client, "other@test.com", "Other12345")
    client.post(
        "/donors/profile",
        headers={"Authorization": f"Bearer {other_token}"},
        json={
            "blood_group": "A+",
            "city": "Lahore",
            "area": "Model Town",
            "age": 30,
            "gender": "female",
            "last_donation_date": str(date.today() - timedelta(days=120)),
            "availability_status": "available",
            "is_publicly_available": True,
            "health_notes": "Healthy",
        },
    )
    matching_donors_resp2 = client.get(
        f"/requests/{request_id}/matching-donors",
        headers={"Authorization": f"Bearer {member_token}"},
    )
    assert matching_donors_resp2.status_code == 200
    assert len(matching_donors_resp2.json()) == 1, (
        "Other compatible donor should appear in matchable donors"
    )


def test_public_donor_discovery_for_request(client, seeded_db):
    token = login(client, "receiver@test.com", "Receiver12345")
    response = client.get(
        f"/requests/{seeded_db['request'].id}/public-donors",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()[0]["user"]["full_name"] == "Member With Donor Profile"


def test_chat_creation_with_public_donor(client, seeded_db):
    token = login(client, "receiver@test.com", "Receiver12345")
    response = client.post(
        "/chats",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "target_user_id": seeded_db["user_with_donor_profile"].id,
            "request_id": seeded_db["request"].id,
            "subject": "Need help",
            "initial_message": "Can you help with this case?",
        },
    )
    assert response.status_code == 201
    assert response.json()["counterpart"]["id"] == seeded_db["user_with_donor_profile"].id
    assert response.json()["messages"][0]["message"] == "Can you help with this case?"


def test_institution_directory_excludes_unapproved_institutions(client, seeded_db):
    token = login(client, "receiver@test.com", "Receiver12345")
    register_response = client.post(
        "/auth/register/institution",
        data=institution_registration_data(
            institution_name="Pending NGO",
            institution_type="NGO/Welfare Organization",
            area="Johar Town",
            address="Johar Town Lahore",
            contact_person="Areeba",
            contact_person_designation="Coordinator",
            email="pending-ngo@test.com",
            phone="+923001111122",
            password="Ngo123456",
            website_social_link="",
        ),
        files=proof_file("ngo-proof.pdf"),
    )
    assert register_response.status_code == 201

    response = client.get(
        f"/requests/{seeded_db['request'].id}/institutions",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    names = [item["institution_name"] for item in response.json()]
    assert "Test University Donor Club" in names
    assert "Pending NGO" not in names


def test_admin_can_approve_institution(client, seeded_db):
    token = login(client, "admin@test.com", "Admin12345")
    response = client.patch(
        f"/admin/institutions/{seeded_db['institution'].id}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": "suspended"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "suspended"


def test_rejected_institution_can_resubmit_for_review(client, seeded_db):
    admin_token = login(client, "admin@test.com", "Admin12345")
    institution_token = login(client, "institution@test.com", "Institution12345")

    reject_response = client.patch(
        f"/admin/institutions/{seeded_db['institution'].id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "rejected", "rejection_reason": "Provide updated verification details."},
    )
    assert reject_response.status_code == 200
    assert reject_response.json()["status"] == "rejected"

    resubmit_response = client.post(
        "/institutions/me/resubmit",
        headers={"Authorization": f"Bearer {institution_token}"},
        data={
            "institution_name": "Test University Donor Club",
            "institution_type": "Educational Institution",
            "city": "Lahore",
            "area": "Gulberg",
            "contact_person": "Coordinator",
            "contact_person_designation": "Volunteer Lead",
            "email": "club@test.edu.pk",
            "phone": "+924200000000",
            "address": "Updated address Lahore",
            "website_social_link": "https://club.test.edu.pk",
            "operating_hours": "24/7",
            "available_blood_groups": "B+, O+",
            "notes": "Updated",
        },
    )
    assert resubmit_response.status_code == 200
    assert resubmit_response.json()["status"] == "pending"
    assert resubmit_response.json()["rejection_reason"] is None


def test_chat_websocket_receives_realtime_message(client, seeded_db):
    request_creator_token = login(client, "receiver@test.com", "Receiver12345")
    user_with_profile_token = login(client, "donor@test.com", "Donor12345")
    chat_response = client.post(
        "/chats",
        headers={"Authorization": f"Bearer {request_creator_token}"},
        json={
            "target_user_id": seeded_db["user_with_donor_profile"].id,
            "request_id": seeded_db["request"].id,
            "subject": "Live support",
            "initial_message": "Opening a live thread.",
        },
    )
    assert chat_response.status_code == 201
    chat_id = chat_response.json()["id"]

    with client.websocket_connect(f"/chats/ws/{chat_id}?token={user_with_profile_token}") as websocket:
        connected = websocket.receive_json()
        assert connected["type"] == "chat.connected"

        send_response = client.post(
            f"/chats/{chat_id}/messages",
            headers={"Authorization": f"Bearer {request_creator_token}"},
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
    assert response.json()["status"] == "matched"


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
