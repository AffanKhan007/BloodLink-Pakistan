from datetime import date, datetime, timedelta, timezone

from sqlalchemy import delete, select

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import (
    AuditLog,
    BloodBank,
    BloodBankDonationDrive,
    BloodRequest,
    BloodUnit,
    Chat,
    ChatMessage,
    City,
    DonationMatch,
    DonorProfile,
    DriveStatus,
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
    BloodBankDonationDrive,
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


LAHORE_DONORS = [
    {"name": "Ahmed Khan", "email": "ahmed.donor@bloodlink.pk", "phone": "+923001234501", "blood_group": "A+", "area": "Gulberg III", "lat": 31.5144, "lng": 74.3482, "age": 27, "gender": "male", "days_ago": 100},
    {"name": "Sara Malik", "email": "sara.donor@bloodlink.pk", "phone": "+923001234502", "blood_group": "B+", "area": "DHA Phase 5", "lat": 31.4713, "lng": 74.3683, "age": 24, "gender": "female", "days_ago": 110},
    {"name": "Usman Ali", "email": "usman.donor@bloodlink.pk", "phone": "+923001234503", "blood_group": "O+", "area": "Johar Town", "lat": 31.4637, "lng": 74.2910, "age": 31, "gender": "male", "days_ago": 120},
    {"name": "Hira Riaz", "email": "hira.donor@bloodlink.pk", "phone": "+923001234504", "blood_group": "AB+", "area": "Model Town", "lat": 31.4845, "lng": 74.3210, "age": 29, "gender": "female", "days_ago": 95},
    {"name": "Bilal Shah", "email": "bilal.donor@bloodlink.pk", "phone": "+923001234505", "blood_group": "A-", "area": "Cantonment", "lat": 31.5020, "lng": 74.3587, "age": 35, "gender": "male", "days_ago": 130},
    {"name": "Ayesha Noor", "email": "ayesha.donor@bloodlink.pk", "phone": "+923001234506", "blood_group": "B-", "area": "Lahore Canal Road", "lat": 31.5200, "lng": 74.3100, "age": 22, "gender": "female", "days_ago": 105},
    {"name": "Faisal Mehmood", "email": "faisal.donor@bloodlink.pk", "phone": "+923001234507", "blood_group": "O-", "area": "Anarkali", "lat": 31.5160, "lng": 74.3250, "age": 40, "gender": "male", "days_ago": 150},
    {"name": "Zainab Fatima", "email": "zainab.donor@bloodlink.pk", "phone": "+923001234508", "blood_group": "A+", "area": "Mall Road", "lat": 31.5190, "lng": 74.3430, "age": 26, "gender": "female", "days_ago": 88},
    {"name": "Hassan Javed", "email": "hassan.donor@bloodlink.pk", "phone": "+923001234509", "blood_group": "B+", "area": "Fortress Stadium", "lat": 31.5060, "lng": 74.3590, "age": 33, "gender": "male", "days_ago": 140},
    {"name": "Nadia Akram", "email": "nadia.donor@bloodlink.pk", "phone": "+923001234510", "blood_group": "O+", "area": "Gulshan-e-Ravi", "lat": 31.5250, "lng": 74.3150, "age": 28, "gender": "female", "days_ago": 115},
    {"name": "Kamran Sheikh", "email": "kamran.donor@bloodlink.pk", "phone": "+923001234511", "blood_group": "AB-", "area": "Iqbal Town", "lat": 31.4900, "lng": 74.2800, "age": 30, "gender": "male", "days_ago": 160},
    {"name": "Maryam Bibi", "email": "maryam.donor@bloodlink.pk", "phone": "+923001234512", "blood_group": "A+", "area": "Wapda Town", "lat": 31.4750, "lng": 74.2700, "age": 37, "gender": "female", "days_ago": 100},
    {"name": "Omar Farooq", "email": "omar.donor@bloodlink.pk", "phone": "+923001234513", "blood_group": "B-", "area": "Township", "lat": 31.4550, "lng": 74.2950, "age": 25, "gender": "male", "days_ago": 125},
    {"name": "Rabia Saleem", "email": "rabia.donor@bloodlink.pk", "phone": "+923001234514", "blood_group": "O+", "area": "Samanabad", "lat": 31.4980, "lng": 74.3050, "age": 32, "gender": "female", "days_ago": 135},
    {"name": "Imran Tariq", "email": "imran.donor@bloodlink.pk", "phone": "+923001234515", "blood_group": "A-", "area": "Mughalpura", "lat": 31.5300, "lng": 74.3400, "age": 29, "gender": "male", "days_ago": 92},
    {"name": "Sana Aslam", "email": "sana.donor@bloodlink.pk", "phone": "+923001234516", "blood_group": "B+", "area": "Green Town", "lat": 31.4680, "lng": 74.2600, "age": 23, "gender": "female", "days_ago": 145},
    {"name": "Tariq Mehmood", "email": "tariq.donor@bloodlink.pk", "phone": "+923001234517", "blood_group": "O-", "area": "Canal View", "lat": 31.5120, "lng": 74.3000, "age": 38, "gender": "male", "days_ago": 155},
    {"name": "Amina Malik", "email": "amina.donor@bloodlink.pk", "phone": "+923001234518", "blood_group": "AB+", "area": "Liberty Market Area", "lat": 31.5130, "lng": 74.3400, "age": 27, "gender": "female", "days_ago": 108},
    {"name": "Shahid Hussain", "email": "shahid.donor@bloodlink.pk", "phone": "+923001234519", "blood_group": "A+", "area": "Bhatta Chowk", "lat": 31.5350, "lng": 74.3600, "age": 42, "gender": "male", "days_ago": 170},
    {"name": "Farah Naz", "email": "farah.donor@bloodlink.pk", "phone": "+923001234520", "blood_group": "B+", "area": "DHA Phase 1", "lat": 31.4780, "lng": 74.3750, "age": 26, "gender": "female", "days_ago": 99},
]


LAHORE_BLOOD_BANKS = [
    {"name": "Lahore Central Blood Bank", "area": "Jail Road", "lat": 31.5130, "lng": 74.3450, "address": "Near Services Hospital, Jail Road, Lahore", "phone": "+9242111555777", "email": "contact@lahorecentral.pk", "license": "LIC-LHR-001", "hours": "24/7"},
    {"name": "Mayo Hospital Blood Bank", "area": "Katchery Road", "lat": 31.5510, "lng": 74.3280, "address": "Mayo Hospital, Katchery Road, Lahore", "phone": "+9242111555888", "email": "blood@mayohospital.pk", "license": "LIC-LHR-002", "hours": "8:00 AM - 10:00 PM"},
    {"name": "Shaikh Zaid Blood Bank", "area": "Abdul Haque Road", "lat": 31.4680, "lng": 74.3620, "address": "Shaikh Zaid Hospital, Abdul Haque Road, Lahore", "phone": "+9242111555999", "email": "info@shaikhzaid.pk", "license": "LIC-LHR-003", "hours": "9:00 AM - 6:00 PM"},
    {"name": "Fatima Jinnah Medical Blood Bank", "area": "Queen Mary Road", "lat": 31.5090, "lng": 74.3330, "address": "Fatima Jinnah Medical University, Queen Mary Road, Lahore", "phone": "+9242111555666", "email": "bloodbank@fjmu.edu.pk", "license": "LIC-LHR-004", "hours": "8:00 AM - 4:00 PM"},
]


def main() -> None:
    db = SessionLocal()
    try:
        for table in TABLES_IN_DELETE_ORDER:
            db.execute(delete(table))
        db.execute(delete(User))
        db.flush()

        for index, (name, province) in enumerate(PAKISTAN_CITIES, start=1):
            db.add(City(name=name, province=province, sort_order=index))
        db.flush()

        # ── Admin / Blood Bank Admin ─────────────────────────────────
        admin_user = User(
            full_name="BloodLink Admin",
            email="admin@bloodlink.pk",
            phone="+923001000001",
            password_hash=get_password_hash("Admin12345"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin_user)
        db.flush()

        # ── Donor Users ──────────────────────────────────────────────
        donor_users = []
        for d in LAHORE_DONORS:
            u = User(
                full_name=d["name"],
                email=d["email"],
                phone=d["phone"],
                password_hash=get_password_hash("Donor12345"),
                role=UserRole.MEMBER,
                is_active=True,
            )
            db.add(u)
            db.flush()
            donor_users.append(u)

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
        db.add_all([institution_user_1, institution_user_2])
        db.flush()

        # ── Hospitals ────────────────────────────────────────────────
        h = Hospital(
            name="Services Hospital Lahore",
            city="Lahore",
            area="Jail Road",
            address="Jail Road, Lahore",
            phone="+9242111222333",
            verification_status="verified",
        )
        db.add(h)
        db.flush()

        # ── Blood Banks (Lahore) ─────────────────────────────────────
        blood_banks = []
        for bb in LAHORE_BLOOD_BANKS:
            bank = BloodBank(
                name=bb["name"],
                hospital_id=h.id,
                city="Lahore",
                area=bb["area"],
                contact_number=bb["phone"],
                email=bb["email"],
                address=bb["address"],
                latitude=bb["lat"],
                longitude=bb["lng"],
                license_number=bb["license"],
                operating_hours=bb["hours"],
                verification_status="verified",
                public_stock_visible=True,
                accepts_walkins=True,
                govt_verified=bb["name"] in ("Lahore Central Blood Bank", "Mayo Hospital Blood Bank"),
            )
            db.add(bank)
            db.flush()
            blood_banks.append(bank)

        # ── Blood Units across banks ─────────────────────────────────
        blood_groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
        import random
        import uuid as _uuid

        random.seed(42)
        unit_counter = 0
        for bank in blood_banks:
            for bg in blood_groups:
                count = random.randint(2, 15)
                for _ in range(count):
                    unit_counter += 1
                    unit_code = f"BU-{bank.id}-{unit_counter:04d}"
                    db.add(BloodUnit(
                        unit_code=unit_code,
                        qr_code_value=str(_uuid.uuid4()),
                        blood_bank_id=bank.id,
                        blood_group=bg,
                        units_available=1,
                        component_type="whole_blood",
                        collected_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 10)),
                        expires_at=datetime.now(timezone.utc) + timedelta(days=random.randint(10, 40)),
                        testing_status="cleared",
                        status="available",
                    ))
            db.flush()

        # ── Donor Profiles ───────────────────────────────────────────
        for i, (user_obj, d) in enumerate(zip(donor_users, LAHORE_DONORS)):
            dp = DonorProfile(
                user_id=user_obj.id,
                blood_group=d["blood_group"],
                city="Lahore",
                area=d["area"],
                age=d["age"],
                gender=d["gender"],
                last_donation_date=date.today() - timedelta(days=d["days_ago"]),
                availability_status="available",
                is_publicly_available=True,
                verification_status="approved",
                latitude=d["lat"],
                longitude=d["lng"],
                location_opt_in=True,
                health_notes=f"Seeded Lahore donor — {d['blood_group']}, {d['area']}",
            )
            db.add(dp)
        db.flush()

        # ── Donation Drives ──────────────────────────────────────────
        today = date.today()
        drives_data = [
            {"bank_idx": 0, "title": "Lahore Blood Drive - Gulberg", "date": today + timedelta(days=3), "groups": "A+, B+, O+, AB+", "capacity": 50},
            {"bank_idx": 1, "title": "Mayo Hospital Drive", "date": today + timedelta(days=7), "groups": "O+, O-, A+, A-", "capacity": 30},
            {"bank_idx": 2, "title": "DHA Community Blood Drive", "date": today + timedelta(days=14), "groups": "*", "capacity": 80},
        ]
        for dd in drives_data:
            drive = BloodBankDonationDrive(
                blood_bank_id=blood_banks[dd["bank_idx"]].id,
                title=dd["title"],
                description=f"Community blood donation drive organized by {blood_banks[dd['bank_idx']].name}",
                event_date=dd["date"],
                start_time=datetime.strptime("09:00", "%H:%M").time(),
                end_time=datetime.strptime("17:00", "%H:%M").time(),
                location_address=blood_banks[dd["bank_idx"]].address,
                city="Lahore",
                target_blood_groups=dd["groups"],
                expected_capacity=dd["capacity"],
                status=DriveStatus.UPCOMING,
            )
            db.add(drive)
        db.flush()

        # ── Institutions ─────────────────────────────────────────────
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
        print(f"Seed data inserted: 1 admin, {len(donor_users)} donors, 2 institutions, {len(blood_banks)} blood banks, 3 drives.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
