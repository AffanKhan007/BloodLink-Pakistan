from datetime import date, datetime, timedelta, timezone

from sqlalchemy import delete, select

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import (
    AuditLog,
    BloodBank,
    BloodRequest,
    BloodUnit,
    Chat,
    ChatMessage,
    City,
    DonationMatch,
    DonorProfile,
    Hospital,
    Institution,
    InstitutionStatus,
    Notification,
    Report,
    RequestDocument,
    User,
    UserRole,
)

TABLES_IN_DELETE_ORDER = [
    ChatMessage,
    Chat,
    DonationMatch,
    Notification,
    Report,
    AuditLog,
    BloodUnit,
    RequestDocument,
    BloodRequest,
    DonorProfile,
    Institution,
    BloodBank,
    Hospital,
    City,
]


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


def main() -> None:
    db = SessionLocal()
    try:
        # ── Delete everything except admin users ──────────────────
        admin_ids = [
            row[0]
            for row in db.execute(select(User.id).where(User.role == UserRole.ADMIN)).all()
        ]
        for table in TABLES_IN_DELETE_ORDER:
            db.execute(delete(table))
        db.execute(delete(User).where(User.id.notin_(admin_ids)))
        db.flush()

        # ── Cities ──────────────────────────────────────────────
        for index, (name, province) in enumerate(PAKISTAN_CITIES, start=1):
            db.add(City(name=name, province=province, sort_order=index))
        db.flush()

        # ── Users (4) ───────────────────────────────────────────
        user_1 = User(
            full_name="Ali Raza",
            email="ali.donor@bloodlink.pk",
            phone="+923001234561",
            password_hash=get_password_hash("Donor12345"),
            role=UserRole.MEMBER,
            is_active=True,
        )
        user_2 = User(
            full_name="Fatima Noor",
            email="fatima.donor@bloodlink.pk",
            phone="+923001234562",
            password_hash=get_password_hash("Donor12345"),
            role=UserRole.MEMBER,
            is_active=True,
        )
        institution_user_1 = User(
            full_name="Punjab University Donor Desk",
            email="institution@bloodlink.pk",
            phone="+923001234568",
            password_hash=get_password_hash("Institution12345"),
            role=UserRole.INSTITUTION_DONOR,
            is_active=True,
        )
        institution_user_2 = User(
            full_name="Edhi Foundation Blood Bank",
            email="edhi.institution@bloodlink.pk",
            phone="+923001234580",
            password_hash=get_password_hash("Institution12345"),
            role=UserRole.INSTITUTION_DONOR,
            is_active=True,
        )
        db.add_all([user_1, user_2, institution_user_1, institution_user_2])
        db.flush()

        # ── Hospitals (2) ───────────────────────────────────────
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
        ]

        hospitals = []
        for h_data in hospitals_data:
            hospital = Hospital(**h_data, verification_status="verified")
            db.add(hospital)
            db.flush()
            hospitals.append(hospital)

        # ── Blood Banks (1) ─────────────────────────────────────
        blood_bank = BloodBank(
            name="Lahore Central Blood Bank",
            hospital_id=hospitals[0].id,
            city="Lahore",
            area="Jail Road",
            contact_number="+9242111555777",
            email="contact@lahorecentralbloodbank.pk",
            address="Near Services Hospital Lahore",
            license_number="LIC-LHR-001",
            verification_status="verified",
        )
        db.add(blood_bank)
        db.flush()

        # ── Donor Profiles (2) ──────────────────────────────────
        donor_profile_data = [
            {
                "user": user_1,
                "blood_group": "B+",
                "city": "Lahore",
                "area": "Model Town",
                "age": 28,
                "gender": "male",
                "public": True,
                "last_donation_days_ago": 60,
                "availability": "available",
            },
            {
                "user": user_2,
                "blood_group": "O+",
                "city": "Karachi",
                "area": "Gulshan",
                "age": 31,
                "gender": "female",
                "public": False,
                "last_donation_days_ago": 30,
                "availability": "available",
            },
        ]

        donor_profiles = []
        for entry in donor_profile_data:
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
                verification_status="approved",
                health_notes=f"Seeded test donor — {entry['blood_group']}, {entry['city']}",
            )
            db.add(donor)
            db.flush()
            donor_profiles.append(donor)

        # ── Institutions (2) ────────────────────────────────────
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
            db.add(Institution(**inst_data))

        db.commit()
        print("Seed data inserted.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
