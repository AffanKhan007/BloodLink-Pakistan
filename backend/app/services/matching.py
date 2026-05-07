from datetime import date, timedelta

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import BloodRequest, DonorProfile, DonorVerificationStatus, MatchStatus


MIN_DONATION_INTERVAL_DAYS = 90


def get_matching_donors(db: Session, request: BloodRequest) -> list[DonorProfile]:
    cutoff_date = date.today() - timedelta(days=MIN_DONATION_INTERVAL_DAYS)
    statement = (
        select(DonorProfile)
        .where(DonorProfile.blood_group == request.blood_group_needed)
        .where(DonorProfile.city == request.city)
        .where(DonorProfile.availability_status == "available")
        .where(DonorProfile.verification_status == DonorVerificationStatus.APPROVED)
        .where(or_(DonorProfile.last_donation_date.is_(None), DonorProfile.last_donation_date <= cutoff_date))
    )
    return list(db.scalars(statement).all())


def count_confirmed_matches(request: BloodRequest) -> int:
    return sum(1 for match in request.matches if match.status in {MatchStatus.ACCEPTED, MatchStatus.COMPLETED})
