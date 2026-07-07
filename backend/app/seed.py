from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import (
    AuditLog,
    BloodBank,
    BloodRequest,
    BloodUnit,
    BloodUnitStatus,
    Chat,
    ChatMessage,
    City,
    DonationMatch,
    DonorProfile,
    DonorVerificationStatus,
    Hospital,
    Institution,
    InstitutionStatus,
    MatchStatus,
    Notification,
    Report,
    ReportStatus,
    RequestStatus,
    TestingStatus,
    UrgencyLevel,
    User,
    UserRole,
)


PAKISTAN_CITIES = [
    ("Lahore", "Punjab"),
    ("Karachi", "Sindh"),
    ("Islamabad", "Islamabad Capital Territory"),
    ("Rawalpindi", "Punjab"),
    ("Faisalabad", "Punjab"),
    ("Multan", "Punjab"),
    ("Peshawar", "Khyber Pakhtunkhwa"),
    ("Quetta", "Balochistan"),
]


def get_or_create_user(db, *, full_name: str, email: str, phone: str, password: str, role: UserRole) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user:
        return user
    user = User(
        full_name=full_name,
        email=email,
        phone=phone,
        password_hash=get_password_hash(password),
        role=role,
        is_active=True,
    )
    db.add(user)
    db.flush()
    return user


def main() -> None:
    db = SessionLocal()
    try:
        # ── Cities ──────────────────────────────────────────────
        for index, (name, province) in enumerate(PAKISTAN_CITIES, start=1):
            city = db.scalar(select(City).where(City.name == name))
            if city is None:
                db.add(City(name=name, province=province, sort_order=index))

        # ── Admin ───────────────────────────────────────────────
        admin = get_or_create_user(
            db,
            full_name="BloodLink Admin",
            email="admin@bloodlink.pk",
            phone="+923001112233",
            password="Admin12345",
            role=UserRole.ADMIN,
        )

        # ── Donors (8 users, different cities/blood groups) ─────
        donor_users = [
            get_or_create_user(
                db,
                full_name="Ali Raza",
                email="ali.donor@bloodlink.pk",
                phone="+923001234561",
                password="Donor12345",
                role=UserRole.USER,
            ),
            get_or_create_user(
                db,
                full_name="Fatima Noor",
                email="fatima.donor@bloodlink.pk",
                phone="+923001234562",
                password="Donor12345",
                role=UserRole.USER,
            ),
            get_or_create_user(
                db,
                full_name="Hamza Khan",
                email="hamza.donor@bloodlink.pk",
                phone="+923001234563",
                password="Donor12345",
                role=UserRole.USER,
            ),
            get_or_create_user(
                db,
                full_name="Ayesha Siddiqui",
                email="ayesha.donor@bloodlink.pk",
                phone="+923001234570",
                password="Donor12345",
                role=UserRole.USER,
            ),
            get_or_create_user(
                db,
                full_name="Bilal Ahmed",
                email="bilal.donor@bloodlink.pk",
                phone="+923001234571",
                password="Donor12345",
                role=UserRole.USER,
            ),
            get_or_create_user(
                db,
                full_name="Hira Malik",
                email="hira.donor@bloodlink.pk",
                phone="+923001234572",
                password="Donor12345",
                role=UserRole.USER,
            ),
            get_or_create_user(
                db,
                full_name="Usman Tariq",
                email="usman.donor@bloodlink.pk",
                phone="+923001234573",
                password="Donor12345",
                role=UserRole.USER,
            ),
            get_or_create_user(
                db,
                full_name="Zainab Fatima",
                email="zainab.donor@bloodlink.pk",
                phone="+923001234574",
                password="Donor12345",
                role=UserRole.USER,
            ),
        ]

        # ── Receivers (5 users, different cities) ───────────────
        receiver_users = [
            get_or_create_user(
                db,
                full_name="Sara Attendant",
                email="sara.receiver@bloodlink.pk",
                phone="+923001234564",
                password="Receiver12345",
                role=UserRole.USER,
            ),
            get_or_create_user(
                db,
                full_name="Bilal Attendant",
                email="bilal.receiver@bloodlink.pk",
                phone="+923001234565",
                password="Receiver12345",
                role=UserRole.USER,
            ),
            get_or_create_user(
                db,
                full_name="Nadia Bibi",
                email="nadia.receiver@bloodlink.pk",
                phone="+923001234575",
                password="Receiver12345",
                role=UserRole.USER,
            ),
            get_or_create_user(
                db,
                full_name="Omar Farooq",
                email="omar.receiver@bloodlink.pk",
                phone="+923001234576",
                password="Receiver12345",
                role=UserRole.USER,
            ),
            get_or_create_user(
                db,
                full_name="Fatima Khan",
                email="fatima.r.receiver@bloodlink.pk",
                phone="+923001234577",
                password="Receiver12345",
                role=UserRole.USER,
            ),
        ]

        # ── Institution users (2) ───────────────────────────────
        institution_user_1 = get_or_create_user(
            db,
            full_name="Punjab University Donor Desk",
            email="institution@bloodlink.pk",
            phone="+923001234568",
            password="Institution12345",
            role=UserRole.INSTITUTION_DONOR,
        )
        institution_user_2 = get_or_create_user(
            db,
            full_name="Edhi Blood Bank Center",
            email="edhi.institution@bloodlink.pk",
            phone="+923001234580",
            password="Institution12345",
            role=UserRole.INSTITUTION_DONOR,
        )

        # ── Hospitals (5, across different cities) ──────────────
        hospitals_data = [
            {
                "name": "Services Hospital Lahore",
                "city": "Lahore",
                "area": "Jail Road",
                "address": "Jail Road, Lahore",
                "phone": "+9242111222333",
            },
            {
                "name": "Jinnah Postgraduate Medical Centre",
                "city": "Karachi",
                "area": "Saddar",
                "address": "Rafiqui Hameedullah Shaheed Road, Karachi",
                "phone": "+9221111222333",
            },
            {
                "name": "Pakistan Institute of Medical Sciences",
                "city": "Islamabad",
                "area": "G-8",
                "address": "Ramna G-8, Islamabad",
                "phone": "+9251111222333",
            },
            {
                "name": "Nishtar Hospital Multan",
                "city": "Multan",
                "area": "Nishtar Road",
                "address": "Nishtar Road, Multan",
                "phone": "+9261111222333",
            },
            {
                "name": "Lady Reading Hospital",
                "city": "Peshawar",
                "area": "University Road",
                "address": "University Road, Peshawar",
                "phone": "+9291111222333",
            },
        ]

        hospitals: list[Hospital] = []
        for h_data in hospitals_data:
            hospital = db.scalar(select(Hospital).where(Hospital.name == h_data["name"]))
            if hospital is None:
                hospital = Hospital(
                    **h_data,
                    verification_status="verified",
                )
                db.add(hospital)
                db.flush()
            hospitals.append(hospital)

        # ── Blood Banks (3) ─────────────────────────────────────
        blood_banks_data = [
            {
                "name": "Lahore Central Blood Bank",
                "hospital_id": hospitals[0].id,
                "city": "Lahore",
                "area": "Jail Road",
                "contact_number": "+9242111555777",
                "email": "contact@lahorecentralbloodbank.pk",
                "address": "Near Services Hospital Lahore",
                "license_number": "LIC-LHR-001",
            },
            {
                "name": "Jinnah Blood Bank",
                "hospital_id": hospitals[1].id,
                "city": "Karachi",
                "area": "Saddar",
                "contact_number": "+9221111555777",
                "email": "bloodbank@jinnahhospital.pk",
                "address": "JPMC Campus, Karachi",
                "license_number": "LIC-KHI-002",
            },
            {
                "name": "PIMS Blood Bank",
                "hospital_id": hospitals[2].id,
                "city": "Islamabad",
                "area": "G-8",
                "contact_number": "+9251111555777",
                "email": "bloodbank@pims.gov.pk",
                "address": "PIMS Hospital, Islamabad",
                "license_number": "LIC-ISB-003",
            },
        ]

        blood_banks: list[BloodBank] = []
        for bb_data in blood_banks_data:
            blood_bank = db.scalar(select(BloodBank).where(BloodBank.name == bb_data["name"]))
            if blood_bank is None:
                blood_bank = BloodBank(
                    **bb_data,
                    verification_status="verified",
                )
                db.add(blood_bank)
                db.flush()
            blood_banks.append(blood_bank)

        # ── Hospital admin + Blood bank admin ────────────────────
        hospital_admin_user = get_or_create_user(
            db,
            full_name="Services Hospital Admin",
            email="hospital.admin@bloodlink.pk",
            phone="+923001234566",
            password="Hospital12345",
            role=UserRole.HOSPITAL_ADMIN,
        )
        hospital_admin_user.hospital_id = hospitals[0].id

        bloodbank_admin_user = get_or_create_user(
            db,
            full_name="Blood Bank Supervisor",
            email="bloodbank.admin@bloodlink.pk",
            phone="+923001234567",
            password="BloodBank12345",
            role=UserRole.BLOOD_BANK_ADMIN,
        )
        bloodbank_admin_user.blood_bank_id = blood_banks[0].id

        # ── Institutions ────────────────────────────────────────
        institution_data = [
            {
                "user_id": institution_user_1.id,
                "institution_name": "Punjab University Donor Society",
                "institution_type": "University",
                "city": "Lahore",
                "area": "New Campus",
                "contact_person": "Ayesha Malik",
                "email": "bloodsociety@pu.edu.pk",
                "phone": "+924299211100",
                "address": "Punjab University New Campus, Lahore",
                "contact_person_designation": "Program Lead",
                "website_social_link": "https://pu.edu.pk",
                "available_blood_groups": "A+, B+, O+, O-",
                "notes": "Student donor drive group available during campus hours.",
                "status": InstitutionStatus.APPROVED,
            },
            {
                "user_id": institution_user_2.id,
                "institution_name": "Edhi Foundation Blood Bank",
                "institution_type": "Blood Bank",
                "city": "Karachi",
                "area": "Mithadar",
                "contact_person": "Abdul Sattar",
                "email": "blood@edhi.org",
                "phone": "+9221111333444",
                "address": "Mithadar, Karachi",
                "contact_person_designation": "Coordinator",
                "website_social_link": "https://edhi.org",
                "available_blood_groups": "A+, A-, B+, B-, O+, O-, AB+, AB-",
                "notes": "24/7 blood bank open for all blood groups.",
                "status": InstitutionStatus.APPROVED,
            },
        ]
        for inst_data in institution_data:
            institution = db.scalar(select(Institution).where(Institution.user_id == inst_data["user_id"]))
            if institution is None:
                db.add(Institution(**inst_data))

        # ── Donor Profiles (8 donors, varied data) ──────────────
        donor_profile_data = [
            {
                "user": donor_users[0],
                "blood_group": "B+",
                "city": "Lahore",
                "area": "Model Town",
                "age": 28,
                "gender": "male",
                "public": True,
                "verification": DonorVerificationStatus.APPROVED,
                "last_donation_days_ago": 60,
                "availability": "available",
            },
            {
                "user": donor_users[1],
                "blood_group": "O+",
                "city": "Karachi",
                "area": "Gulshan",
                "age": 31,
                "gender": "female",
                "public": False,
                "verification": DonorVerificationStatus.APPROVED,
                "last_donation_days_ago": 30,
                "availability": "available",
            },
            {
                "user": donor_users[2],
                "blood_group": "A-",
                "city": "Lahore",
                "area": "Johar Town",
                "age": 35,
                "gender": "male",
                "public": True,
                "verification": DonorVerificationStatus.APPROVED,
                "last_donation_days_ago": 90,
                "availability": "available",
            },
            {
                "user": donor_users[3],
                "blood_group": "AB+",
                "city": "Islamabad",
                "area": "F-10",
                "age": 26,
                "gender": "female",
                "public": True,
                "verification": DonorVerificationStatus.APPROVED,
                "last_donation_days_ago": 45,
                "availability": "available",
            },
            {
                "user": donor_users[4],
                "blood_group": "O-",
                "city": "Rawalpindi",
                "area": "Satellite Town",
                "age": 40,
                "gender": "male",
                "public": True,
                "verification": DonorVerificationStatus.APPROVED,
                "last_donation_days_ago": 15,
                "availability": "available",
            },
            {
                "user": donor_users[5],
                "blood_group": "B-",
                "city": "Faisalabad",
                "area": "D Ground",
                "age": 29,
                "gender": "female",
                "public": False,
                "verification": DonorVerificationStatus.PENDING,
                "last_donation_days_ago": 200,
                "availability": "unavailable",
            },
            {
                "user": donor_users[6],
                "blood_group": "A+",
                "city": "Multan",
                "area": "Walled City",
                "age": 33,
                "gender": "male",
                "public": True,
                "verification": DonorVerificationStatus.REJECTED,
                "last_donation_days_ago": 365,
                "availability": "available",
            },
            {
                "user": donor_users[7],
                "blood_group": "O+",
                "city": "Peshawar",
                "area": "University Town",
                "age": 24,
                "gender": "female",
                "public": True,
                "verification": DonorVerificationStatus.APPROVED,
                "last_donation_days_ago": 100,
                "availability": "available",
            },
        ]

        donor_profiles: list[DonorProfile] = []
        for entry in donor_profile_data:
            donor = db.scalar(select(DonorProfile).where(DonorProfile.user_id == entry["user"].id))
            if donor is None:
                donor = DonorProfile(
                    user_id=entry["user"].id,
                    blood_group=entry["blood_group"],
                    city=entry["city"],
                    area=entry["area"],
                    age=entry["age"],
                    gender=entry["gender"],
                    last_donation_date=date.today() - timedelta(days=entry["last_donation_days_ago"]),
                    availability_status=entry["availability"],
                    is_publicly_available=entry["public"],
                    verification_status=entry["verification"],
                    health_notes=f"Seeded test donor — {entry['blood_group']}, {entry['city']}",
                )
                db.add(donor)
                db.flush()
            donor_profiles.append(donor)

        # ── Blood Requests (7, various statuses and urgency) ────
        sample_requests = [
            {
                "created_by_user_id": receiver_users[0].id,
                "patient_name": "Ahmed Hassan",
                "blood_group_needed": "B+",
                "units_required": 2,
                "hospital_name": "Services Hospital Lahore",
                "city": "Lahore",
                "area": "Jail Road",
                "ward_room": "Ward 3 / Room 12",
                "urgency_level": UrgencyLevel.HIGH,
                "attendant_name": "Sara Attendant",
                "attendant_phone": receiver_users[0].phone,
                "required_by": datetime.now(timezone.utc) + timedelta(days=1),
                "additional_notes": "Need replacement donor urgently.",
                "status": RequestStatus.MATCHED,
                "hospital_id": hospitals[0].id,
            },
            {
                "created_by_user_id": receiver_users[1].id,
                "patient_name": "Mariam Bibi",
                "blood_group_needed": "O+",
                "units_required": 1,
                "hospital_name": "Jinnah Postgraduate Medical Centre",
                "city": "Karachi",
                "area": "Saddar",
                "ward_room": "Ward 5 / Bed 4",
                "urgency_level": UrgencyLevel.CRITICAL,
                "attendant_name": "Bilal Attendant",
                "attendant_phone": receiver_users[1].phone,
                "required_by": datetime.now(timezone.utc) + timedelta(hours=12),
                "additional_notes": "Crossmatch already in process.",
                "status": RequestStatus.MATCHED,
                "hospital_id": hospitals[1].id,
            },
            {
                "created_by_user_id": receiver_users[2].id,
                "patient_name": "Zain Ali",
                "blood_group_needed": "A-",
                "units_required": 1,
                "hospital_name": "Services Hospital Lahore",
                "city": "Lahore",
                "area": "Jail Road",
                "ward_room": "ICU 2",
                "urgency_level": UrgencyLevel.MEDIUM,
                "attendant_name": "Nadia Bibi",
                "attendant_phone": receiver_users[2].phone,
                "required_by": datetime.now(timezone.utc) + timedelta(days=2),
                "additional_notes": "Please message before arrival.",
                "status": RequestStatus.APPROVED,
                "hospital_id": hospitals[0].id,
            },
            {
                "created_by_user_id": receiver_users[3].id,
                "patient_name": "Tariq Mehmood",
                "blood_group_needed": "AB+",
                "units_required": 3,
                "hospital_name": "Pakistan Institute of Medical Sciences",
                "city": "Islamabad",
                "area": "G-8",
                "ward_room": "Operation Theater 1",
                "urgency_level": UrgencyLevel.CRITICAL,
                "attendant_name": "Omar Farooq",
                "attendant_phone": receiver_users[3].phone,
                "required_by": datetime.now(timezone.utc) + timedelta(hours=6),
                "additional_notes": "Surgery scheduled for tomorrow morning. All 3 units needed before procedure.",
                "status": RequestStatus.PENDING_REVIEW,
                "hospital_id": hospitals[2].id,
            },
            {
                "created_by_user_id": receiver_users[4].id,
                "patient_name": "Rashid Khan",
                "blood_group_needed": "O-",
                "units_required": 1,
                "hospital_name": "Lady Reading Hospital",
                "city": "Peshawar",
                "area": "University Road",
                "ward_room": "Ward 7",
                "urgency_level": UrgencyLevel.LOW,
                "attendant_name": "Fatima Khan",
                "attendant_phone": receiver_users[4].phone,
                "required_by": datetime.now(timezone.utc) + timedelta(days=5),
                "additional_notes": "Elective surgery next week. Donor can schedule at convenience.",
                "status": RequestStatus.APPROVED,
                "hospital_id": hospitals[4].id,
            },
            {
                "created_by_user_id": receiver_users[0].id,
                "patient_name": "Hassan Raza",
                "blood_group_needed": "B+",
                "units_required": 1,
                "hospital_name": "Nishtar Hospital Multan",
                "city": "Multan",
                "area": "Nishtar Road",
                "ward_room": "Ward 2",
                "urgency_level": UrgencyLevel.HIGH,
                "attendant_name": "Sara Attendant",
                "attendant_phone": receiver_users[0].phone,
                "required_by": datetime.now(timezone.utc) + timedelta(hours=18),
                "additional_notes": "Patient is anaemic and needs transfusion today.",
                "status": RequestStatus.REJECTED,
                "hospital_id": hospitals[3].id,
            },
            {
                "created_by_user_id": receiver_users[1].id,
                "patient_name": "Kamran Akhtar",
                "blood_group_needed": "A+",
                "units_required": 2,
                "hospital_name": "Services Hospital Lahore",
                "city": "Lahore",
                "area": "Jail Road",
                "ward_room": "Ward 10 / Bed 3",
                "urgency_level": UrgencyLevel.MEDIUM,
                "attendant_name": "Bilal Attendant",
                "attendant_phone": receiver_users[1].phone,
                "required_by": datetime.now(timezone.utc) + timedelta(days=3),
                "additional_notes": "Post-accident treatment. Blood needed within 3 days.",
                "status": RequestStatus.CANCELLED,
                "hospital_id": hospitals[0].id,
            },
        ]

        requests: list[BloodRequest] = []
        for request_data in sample_requests:
            request = db.scalar(select(BloodRequest).where(BloodRequest.patient_name == request_data["patient_name"]))
            if request is None:
                request = BloodRequest(**request_data)
                db.add(request)
                db.flush()
            requests.append(request)

        # ── Donation Matches (4, various statuses) ──────────────
        if not db.scalar(select(DonationMatch).limit(1)):
            db.add_all(
                [
                    # MATCHED request → ACCEPTED match
                    DonationMatch(
                        request_id=requests[0].id,
                        donor_id=donor_profiles[0].id,
                        status=MatchStatus.ACCEPTED,
                        accepted_at=datetime.now(timezone.utc) - timedelta(hours=1),
                    ),
                    # MATCHED request → ACCEPTED match (with older acceptance)
                    DonationMatch(
                        request_id=requests[1].id,
                        donor_id=donor_profiles[1].id,
                        status=MatchStatus.ACCEPTED,
                        accepted_at=datetime.now(timezone.utc) - timedelta(hours=5),
                    ),
                    # APPROVED request → PENDING match (donor hasn't responded yet)
                    DonationMatch(
                        request_id=requests[2].id,
                        donor_id=donor_profiles[2].id,
                        status=MatchStatus.PENDING,
                    ),
                    # CRITICAL request → REJECTED match (donor unavailable)
                    DonationMatch(
                        request_id=requests[3].id,
                        donor_id=donor_profiles[3].id,
                        status=MatchStatus.REJECTED,
                        rejected_at=datetime.now(timezone.utc) - timedelta(hours=2),
                    ),
                ]
            )

        # ── Notifications (7, across different users) ───────────
        if not db.scalar(select(Notification).limit(1)):
            db.add_all(
                [
                    Notification(
                        user_id=receiver_users[0].id,
                        title="Donor accepted your request",
                        message="Ali Raza accepted to donate B+ blood for Ahmed Hassan at Services Hospital Lahore.",
                    ),
                    Notification(
                        user_id=receiver_users[0].id,
                        title="New match for Hassan Raza",
                        message="A B+ donor match was found for your Multan request but was later rejected.",
                    ),
                    Notification(
                        user_id=donor_users[0].id,
                        title="New blood request in your city",
                        message="Ahmed Hassan needs B+ blood at Services Hospital Lahore. 2 units required.",
                    ),
                    Notification(
                        user_id=donor_users[0].id,
                        title="Donation confirmed",
                        message="Your donation for Ahmed Hassan has been confirmed. Please arrive at Ward 3 / Room 12.",
                    ),
                    Notification(
                        user_id=donor_users[1].id,
                        title="Urgent request: O+ blood needed",
                        message="Mariam Bibi needs O+ blood at JPMC Karachi. Urgency: CRITICAL.",
                    ),
                    Notification(
                        user_id=donor_users[3].id,
                        title="Match rejected",
                        message="You declined the match for Tariq Mehmood. The system will find another AB+ donor.",
                    ),
                    Notification(
                        user_id=admin.id,
                        title="New institution registration",
                        message="Edhi Foundation Blood Bank has registered and is awaiting approval.",
                    ),
                ]
            )

        # ── Blood Units (5, various statuses) ───────────────────
        if not db.scalar(select(BloodUnit).limit(1)):
            db.add_all(
                [
                    BloodUnit(
                        unit_code="BL-2026-000001",
                        qr_code_value="bloodlink://unit/1/BL-2026-000001",
                        donor_profile_id=donor_profiles[0].id,
                        blood_bank_id=blood_banks[0].id,
                        blood_group="B+",
                        units_available=2,
                        component_type="whole_blood",
                        collected_at=datetime.now(timezone.utc) - timedelta(days=2),
                        expires_at=datetime.now(timezone.utc) + timedelta(days=28),
                        testing_status=TestingStatus.CLEARED,
                        status=BloodUnitStatus.AVAILABLE,
                        storage_location="Fridge 2, Shelf A",
                    ),
                    BloodUnit(
                        unit_code="BL-2026-000002",
                        qr_code_value="bloodlink://unit/2/BL-2026-000002",
                        donor_profile_id=donor_profiles[2].id,
                        blood_bank_id=blood_banks[0].id,
                        blood_group="A-",
                        units_available=1,
                        component_type="packed_rbc",
                        collected_at=datetime.now(timezone.utc) - timedelta(days=1),
                        expires_at=datetime.now(timezone.utc) + timedelta(days=34),
                        testing_status=TestingStatus.PENDING,
                        status=BloodUnitStatus.TESTING_PENDING,
                        storage_location="Testing Bay",
                    ),
                    BloodUnit(
                        unit_code="BL-2026-000003",
                        qr_code_value="bloodlink://unit/3/BL-2026-000003",
                        donor_profile_id=donor_profiles[1].id,
                        blood_bank_id=blood_banks[1].id,
                        blood_group="O+",
                        units_available=1,
                        component_type="whole_blood",
                        collected_at=datetime.now(timezone.utc) - timedelta(days=5),
                        expires_at=datetime.now(timezone.utc) + timedelta(days=25),
                        testing_status=TestingStatus.CLEARED,
                        status=BloodUnitStatus.RESERVED,
                        storage_location="Fridge 1, Shelf B",
                    ),
                    BloodUnit(
                        unit_code="BL-2026-000004",
                        qr_code_value="bloodlink://unit/4/BL-2026-000004",
                        donor_profile_id=donor_profiles[4].id,
                        blood_bank_id=blood_banks[2].id,
                        blood_group="O-",
                        units_available=1,
                        component_type="platelets",
                        collected_at=datetime.now(timezone.utc) - timedelta(days=3),
                        expires_at=datetime.now(timezone.utc) + timedelta(days=2),
                        testing_status=TestingStatus.CLEARED,
                        status=BloodUnitStatus.AVAILABLE,
                        storage_location="Fridge 3, Platelet Section",
                    ),
                    BloodUnit(
                        unit_code="BL-2026-000005",
                        qr_code_value="bloodlink://unit/5/BL-2026-000005",
                        donor_profile_id=donor_profiles[7].id,
                        blood_bank_id=blood_banks[1].id,
                        blood_group="O+",
                        units_available=1,
                        component_type="plasma",
                        collected_at=datetime.now(timezone.utc) - timedelta(days=40),
                        expires_at=datetime.now(timezone.utc) - timedelta(days=5),
                        testing_status=TestingStatus.CLEARED,
                        status=BloodUnitStatus.EXPIRED,
                        storage_location="Expired Storage Bin",
                    ),
                ]
            )

        # ── Chats + Messages (2 conversations) ──────────────────
        if not db.scalar(select(Chat).limit(1)):
            # Chat 1: Sara ↔ Ali about Ahmed Hassan
            chat_1 = Chat(
                participant_one_id=receiver_users[0].id,
                participant_two_id=donor_users[0].id,
                request_id=requests[0].id,
                subject="Ahmed Hassan",
            )
            db.add(chat_1)
            db.flush()

            db.add_all(
                [
                    ChatMessage(
                        chat_id=chat_1.id,
                        sender_id=receiver_users[0].id,
                        message="Can you help with a B+ requirement at Services Hospital Lahore?",
                    ),
                    ChatMessage(
                        chat_id=chat_1.id,
                        sender_id=donor_users[0].id,
                        message="Yes, I can come. What time do you need me?",
                    ),
                    ChatMessage(
                        chat_id=chat_1.id,
                        sender_id=receiver_users[0].id,
                        message="Please come by 2 PM if possible. Ward 3, Room 12.",
                    ),
                ]
            )

            # Chat 2: Bilal ↔ Fatima about Mariam Bibi
            chat_2 = Chat(
                participant_one_id=receiver_users[1].id,
                participant_two_id=donor_users[1].id,
                request_id=requests[1].id,
                subject="Mariam Bibi",
            )
            db.add(chat_2)
            db.flush()

            db.add_all(
                [
                    ChatMessage(
                        chat_id=chat_2.id,
                        sender_id=receiver_users[1].id,
                        message="Urgent O+ needed at JPMC. Can you come tonight?",
                    ),
                    ChatMessage(
                        chat_id=chat_2.id,
                        sender_id=donor_users[1].id,
                        message="I am available. Which ward?",
                    ),
                    ChatMessage(
                        chat_id=chat_2.id,
                        sender_id=receiver_users[1].id,
                        message="Ward 5, Bed 4. Thank you so much.",
                    ),
                ]
            )

        # ── Reports (2) ─────────────────────────────────────────
        if not db.scalar(select(Report).limit(1)):
            db.add_all(
                [
                    Report(
                        reporter_user_id=receiver_users[0].id,
                        reported_user_id=donor_users[6].id,
                        request_id=requests[5].id,
                        reason="Donor did not show up after confirming. Request was for Multan hospital.",
                        status=ReportStatus.PENDING,
                    ),
                    Report(
                        reporter_user_id=donor_users[0].id,
                        reported_user_id=receiver_users[1].id,
                        request_id=requests[1].id,
                        reason="Receiver provided incorrect hospital ward number. Wasted time traveling.",
                        status=ReportStatus.REVIEWED,
                    ),
                ]
            )

        # ── Audit Logs (3) ──────────────────────────────────────
        if not db.scalar(select(AuditLog).limit(1)):
            db.add_all(
                [
                    AuditLog(
                        admin_user_id=admin.id,
                        action="approve_donor",
                        entity_type="donor_profile",
                        entity_id=donor_profiles[0].id,
                        details={"reason": "Verified health documents"},
                    ),
                    AuditLog(
                        admin_user_id=admin.id,
                        action="reject_donor",
                        entity_type="donor_profile",
                        entity_id=donor_profiles[6].id,
                        details={"reason": "Invalid health certificate submitted"},
                    ),
                    AuditLog(
                        admin_user_id=admin.id,
                        action="approve_request",
                        entity_type="blood_request",
                        entity_id=requests[2].id,
                        details={"notes": "Hospital verified request"},
                    ),
                ]
            )

        db.commit()
        print("Seed data inserted or already present.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
