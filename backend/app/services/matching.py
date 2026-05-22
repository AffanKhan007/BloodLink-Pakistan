from datetime import date, timedelta

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import BloodRequest, DonationMatch, DonorProfile, DonorVerificationStatus, MatchStatus, RequestStatus
from app.services.notifications import create_notification


MIN_DONATION_INTERVAL_DAYS = 90

BLOOD_COMPATIBILITY = {
    "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    "O+": ["O+", "A+", "B+", "AB+"],
    "A-": ["A-", "A+", "AB-", "AB+"],
    "A+": ["A+", "AB+"],
    "B-": ["B-", "B+", "AB-", "AB+"],
    "B+": ["B+", "AB+"],
    "AB-": ["AB-", "AB+"],
    "AB+": ["AB+"],
}


def compatible_donor_groups(recipient_group: str) -> set[str]:
    compatible: set[str] = set()
    for donor_group, receiver_groups in BLOOD_COMPATIBILITY.items():
        if recipient_group in receiver_groups:
            compatible.add(donor_group)
    return compatible


def get_matching_donors(db: Session, request: BloodRequest) -> list[DonorProfile]:
    cutoff_date = date.today() - timedelta(days=MIN_DONATION_INTERVAL_DAYS)
    compatible_groups = compatible_donor_groups(request.blood_group_needed)
    statement = (
        select(DonorProfile)
        .where(DonorProfile.blood_group.in_(compatible_groups))
        .where(DonorProfile.city == request.city)
        .where(DonorProfile.availability_status == "available")
        .where(DonorProfile.verification_status == DonorVerificationStatus.APPROVED)
        .where(or_(DonorProfile.last_donation_date.is_(None), DonorProfile.last_donation_date <= cutoff_date))
    )
    return list(db.scalars(statement).all())


def create_automatic_matches(db: Session, request: BloodRequest) -> list[DonationMatch]:
    donors = get_matching_donors(db, request)
    created_matches: list[DonationMatch] = []
    for donor in donors:
        existing = db.scalar(
            select(DonationMatch).where(DonationMatch.request_id == request.id, DonationMatch.donor_id == donor.id)
        )
        if existing:
            continue
        match = DonationMatch(request_id=request.id, donor_id=donor.id, status=MatchStatus.PENDING)
        db.add(match)
        db.flush()
        create_notification(
            db,
            user_id=donor.user_id,
            title="New blood request match",
            message=f"You have a new {request.blood_group_needed} request in {request.city} for patient {request.patient_name}.",
        )
        created_matches.append(match)

    request.status = RequestStatus.MATCHED if created_matches else RequestStatus.APPROVED
    return created_matches


def count_confirmed_matches(request: BloodRequest) -> int:
    return sum(1 for match in request.matches if match.status in {MatchStatus.ACCEPTED, MatchStatus.COMPLETED})
