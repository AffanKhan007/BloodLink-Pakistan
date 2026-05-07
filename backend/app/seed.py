from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import (
    BloodRequest,
    DonationMatch,
    DonorProfile,
    DonorVerificationStatus,
    MatchStatus,
    Notification,
    RequestStatus,
    UrgencyLevel,
    User,
    UserRole,
)


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
        admin = get_or_create_user(
            db,
            full_name="BloodLink Admin",
            email="admin@bloodlink.pk",
            phone="+923001112233",
            password="Admin12345",
            role=UserRole.ADMIN,
        )
        donor_users = [
            get_or_create_user(
                db,
                full_name="Ali Raza",
                email="ali.donor@bloodlink.pk",
                phone="+923001234561",
                password="Donor12345",
                role=UserRole.DONOR,
            ),
            get_or_create_user(
                db,
                full_name="Fatima Noor",
                email="fatima.donor@bloodlink.pk",
                phone="+923001234562",
                password="Donor12345",
                role=UserRole.DONOR,
            ),
            get_or_create_user(
                db,
                full_name="Hamza Khan",
                email="hamza.donor@bloodlink.pk",
                phone="+923001234563",
                password="Donor12345",
                role=UserRole.DONOR,
            ),
        ]
        receiver_users = [
            get_or_create_user(
                db,
                full_name="Sara Attendant",
                email="sara.receiver@bloodlink.pk",
                phone="+923001234564",
                password="Receiver12345",
                role=UserRole.RECEIVER,
            ),
            get_or_create_user(
                db,
                full_name="Bilal Attendant",
                email="bilal.receiver@bloodlink.pk",
                phone="+923001234565",
                password="Receiver12345",
                role=UserRole.RECEIVER,
            ),
        ]

        profiles = [
            {
                "user": donor_users[0],
                "blood_group": "B+",
                "city": "Lahore",
                "area": "Model Town",
                "age": 28,
                "gender": "male",
            },
            {
                "user": donor_users[1],
                "blood_group": "O+",
                "city": "Karachi",
                "area": "Gulshan",
                "age": 31,
                "gender": "female",
            },
            {
                "user": donor_users[2],
                "blood_group": "A-",
                "city": "Lahore",
                "area": "Johar Town",
                "age": 35,
                "gender": "male",
            },
        ]

        donor_profiles: list[DonorProfile] = []
        for entry in profiles:
            donor = db.scalar(select(DonorProfile).where(DonorProfile.user_id == entry["user"].id))
            if donor is None:
                donor = DonorProfile(
                    user_id=entry["user"].id,
                    blood_group=entry["blood_group"],
                    city=entry["city"],
                    area=entry["area"],
                    age=entry["age"],
                    gender=entry["gender"],
                    last_donation_date=date.today() - timedelta(days=120),
                    availability_status="available",
                    verification_status=DonorVerificationStatus.APPROVED,
                    health_notes="Seeded sample donor",
                )
                db.add(donor)
                db.flush()
            donor_profiles.append(donor)

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
                "status": RequestStatus.APPROVED,
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
                "status": RequestStatus.MATCHED,
            },
            {
                "created_by_user_id": receiver_users[0].id,
                "patient_name": "Zain Ali",
                "blood_group_needed": "A-",
                "units_required": 1,
                "hospital_name": "Shaukat Khanum Memorial Hospital",
                "city": "Lahore",
                "area": "Johar Town",
                "ward_room": "ICU 2",
                "urgency_level": UrgencyLevel.MEDIUM,
                "attendant_name": "Sara Attendant",
                "attendant_phone": receiver_users[0].phone,
                "required_by": datetime.now(timezone.utc) + timedelta(days=2),
                "status": RequestStatus.PENDING_REVIEW,
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

        if not db.scalar(select(DonationMatch).limit(1)):
            db.add_all(
                [
                    DonationMatch(request_id=requests[0].id, donor_id=donor_profiles[0].id, status=MatchStatus.PENDING),
                    DonationMatch(
                        request_id=requests[1].id,
                        donor_id=donor_profiles[1].id,
                        status=MatchStatus.ACCEPTED,
                        accepted_at=datetime.now(timezone.utc) - timedelta(hours=2),
                    ),
                ]
            )

        if not db.scalar(select(Notification).limit(1)):
            db.add_all(
                [
                    Notification(
                        user_id=receiver_users[0].id,
                        title="Request approved",
                        message="Your Lahore request has been approved and is ready for matching.",
                    ),
                    Notification(
                        user_id=donor_users[0].id,
                        title="New potential request",
                        message="There is a B+ request in Lahore that matches your profile.",
                    ),
                ]
            )

        db.commit()
        print("Seed data inserted or already present.")
    finally:
        db.close()


if __name__ == "__main__":
    main()

