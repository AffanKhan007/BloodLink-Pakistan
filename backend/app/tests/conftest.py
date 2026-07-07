from datetime import date, datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.main import app
from app.models import (
    BloodBank,
    BloodRequest,
    BloodUnit,
    BloodUnitStatus,
    City,
    DonorProfile,
    DonorVerificationStatus,
    Hospital,
    Institution,
    InstitutionStatus,
    TestingStatus,
    UrgencyLevel,
    User,
    UserRole,
)


SQLALCHEMY_DATABASE_URL = "sqlite:///./test_bloodlink.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def seeded_db():
    db = TestingSessionLocal()
    db.add_all(
        [
            City(name="Lahore", province="Punjab", sort_order=1),
            City(name="Karachi", province="Sindh", sort_order=2),
        ]
    )
    admin = User(
        full_name="Admin",
        email="admin@test.com",
        phone="+923001111111",
        password_hash=get_password_hash("Admin12345"),
        role=UserRole.ADMIN,
    )
    donor = User(
        full_name="Donor User",
        email="donor@test.com",
        phone="+923001111112",
        password_hash=get_password_hash("Donor12345"),
        role=UserRole.USER,
    )
    receiver = User(
        full_name="Receiver User",
        email="receiver@test.com",
        phone="+923001111113",
        password_hash=get_password_hash("Receiver12345"),
        role=UserRole.USER,
    )
    institution_user = User(
        full_name="Institution User",
        email="institution@test.com",
        phone="+923001111116",
        password_hash=get_password_hash("Institution12345"),
        role=UserRole.INSTITUTION_DONOR,
    )
    hospital = Hospital(
        name="Test Hospital",
        city="Lahore",
        area="Gulberg",
        verification_status="verified",
    )
    db.add(hospital)
    db.flush()
    blood_bank_staff = User(
        full_name="Blood Bank Staff",
        email="bank@test.com",
        phone="+923001111114",
        password_hash=get_password_hash("BloodBank12345"),
        role=UserRole.BLOOD_BANK_ADMIN,
    )
    hospital_staff = User(
        full_name="Hospital Staff",
        email="hospital@test.com",
        phone="+923001111115",
        password_hash=get_password_hash("Hospital12345"),
        role=UserRole.HOSPITAL_ADMIN,
        hospital_id=hospital.id,
    )
    db.add_all([admin, donor, receiver, institution_user, blood_bank_staff, hospital_staff])
    db.flush()
    blood_bank = BloodBank(
        name="Test Blood Bank",
        hospital_id=hospital.id,
        city="Lahore",
        area="Gulberg",
        contact_number="+924212223334",
        email="test@bloodbank.pk",
        verification_status="verified",
    )
    db.add(blood_bank)
    db.flush()
    blood_bank_staff.blood_bank_id = blood_bank.id

    institution = Institution(
        user_id=institution_user.id,
        institution_name="Test University Donor Club",
        institution_type="University",
        city="Lahore",
        area="Gulberg",
        contact_person="Coordinator",
        contact_person_designation="Volunteer Lead",
        email="club@test.edu.pk",
        phone="+924200000000",
        address="Test address Lahore",
        website_social_link="https://club.test.edu.pk",
        available_blood_groups="B+, O+",
        status=InstitutionStatus.APPROVED,
    )
    donor_profile = DonorProfile(
        user_id=donor.id,
        blood_group="B+",
        city="Lahore",
        area="Gulberg",
        age=29,
        gender="male",
        availability_status="available",
        is_publicly_available=True,
        verification_status=DonorVerificationStatus.APPROVED,
        last_donation_date=date.today() - timedelta(days=120),
    )
    request = BloodRequest(
        created_by_user_id=receiver.id,
        patient_name="Patient One",
        blood_group_needed="AB+",
        units_required=2,
        hospital_name="Services Hospital",
        city="Lahore",
        area="Jail Road",
        ward_room="Ward 4",
        urgency_level=UrgencyLevel.HIGH,
        attendant_name="Receiver User",
        attendant_phone=receiver.phone,
        required_by=datetime.now(timezone.utc) + timedelta(days=1),
        status="approved",
        hospital_id=hospital.id,
    )
    blood_unit = BloodUnit(
        unit_code="BL-2026-000010",
        qr_code_value="bloodlink://unit/1/BL-2026-000010",
        donor_profile_id=None,
        blood_bank_id=blood_bank.id,
        blood_group="B+",
        units_available=3,
        component_type="whole_blood",
        collected_at=datetime.now(timezone.utc) - timedelta(days=1),
        expires_at=datetime.now(timezone.utc) + timedelta(days=20),
        testing_status=TestingStatus.CLEARED,
        status=BloodUnitStatus.AVAILABLE,
        storage_location="Fridge A",
    )
    db.add_all([institution, donor_profile, request, blood_unit])
    db.commit()
    try:
        yield {
            "db": db,
            "admin": admin,
            "donor": donor,
            "receiver": receiver,
            "institution_user": institution_user,
            "hospital_staff": hospital_staff,
            "blood_bank_staff": blood_bank_staff,
            "hospital": hospital,
            "blood_bank": blood_bank,
            "blood_unit": blood_unit,
            "institution": institution,
            "profile": donor_profile,
            "request": request,
        }
    finally:
        db.close()
