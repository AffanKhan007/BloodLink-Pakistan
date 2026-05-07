from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.main import app
from app.models import BloodRequest, DonorProfile, DonorVerificationStatus, UrgencyLevel, User, UserRole


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
        role=UserRole.DONOR,
    )
    receiver = User(
        full_name="Receiver User",
        email="receiver@test.com",
        phone="+923001111113",
        password_hash=get_password_hash("Receiver12345"),
        role=UserRole.RECEIVER,
    )
    db.add_all([admin, donor, receiver])
    db.flush()

    donor_profile = DonorProfile(
        user_id=donor.id,
        blood_group="B+",
        city="Lahore",
        area="Gulberg",
        age=29,
        gender="male",
        availability_status="available",
        verification_status=DonorVerificationStatus.APPROVED,
    )
    request = BloodRequest(
        created_by_user_id=receiver.id,
        patient_name="Patient One",
        blood_group_needed="B+",
        units_required=2,
        hospital_name="Services Hospital",
        city="Lahore",
        area="Jail Road",
        ward_room="Ward 4",
        urgency_level=UrgencyLevel.HIGH,
        attendant_name="Receiver User",
        attendant_phone=receiver.phone,
        required_by=datetime.now(timezone.utc) + timedelta(days=1),
    )
    db.add_all([donor_profile, request])
    db.commit()
    try:
        yield {"db": db, "admin": admin, "donor": donor, "receiver": receiver, "profile": donor_profile, "request": request}
    finally:
        db.close()

