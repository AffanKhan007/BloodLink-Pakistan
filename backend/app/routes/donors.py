from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models import BloodRequest, DonationMatch, DonorProfile, MatchStatus, RequestStatus, User, UserRole
from app.schemas.blood_request import BloodRequestListOut
from app.schemas.donor import DonorAvailabilityUpdate, DonorProfileCreate, DonorProfileOut
from app.schemas.match import MatchDetailOut
from app.services.matching import count_confirmed_matches, get_matching_donors


router = APIRouter(prefix="/donors", tags=["donors"])


@router.post("/profile", response_model=DonorProfileOut)
def upsert_profile(
    payload: DonorProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.MEMBER)),
) -> DonorProfileOut:
    profile = db.scalar(select(DonorProfile).where(DonorProfile.user_id == current_user.id))
    if profile is None:
        profile = DonorProfile(user_id=current_user.id)
        db.add(profile)

    for field, value in payload.model_dump().items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return DonorProfileOut.model_validate(profile)


@router.get("/profile/me", response_model=DonorProfileOut)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.MEMBER)),
) -> DonorProfileOut:
    profile = db.scalar(select(DonorProfile).where(DonorProfile.user_id == current_user.id))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor profile not found")
    return DonorProfileOut.model_validate(profile)


@router.patch("/availability", response_model=DonorProfileOut)
def update_availability(
    payload: DonorAvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.MEMBER)),
) -> DonorProfileOut:
    profile = db.scalar(select(DonorProfile).where(DonorProfile.user_id == current_user.id))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor profile not found")
    profile.availability_status = payload.availability_status
    if payload.is_publicly_available is not None:
        profile.is_publicly_available = payload.is_publicly_available
    db.commit()
    db.refresh(profile)
    return DonorProfileOut.model_validate(profile)


@router.get("/matching-requests", response_model=list[BloodRequestListOut])
def matching_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.MEMBER)),
) -> list[BloodRequestListOut]:
    profile = db.scalar(select(DonorProfile).where(DonorProfile.user_id == current_user.id))
    if not profile:
        return []

    requests = list(
        db.scalars(
            select(BloodRequest)
            .where(BloodRequest.status.in_([RequestStatus.APPROVED, RequestStatus.MATCHED]))
            .order_by(BloodRequest.required_by.asc())
        ).all()
    )

    matching_ids = {req.id for req in requests if any(d.id == profile.id for d in get_matching_donors(db, req))}

    existing = {m.request_id for m in db.scalars(select(DonationMatch).where(DonationMatch.donor_id == profile.id)).all()}
    matching_ids -= existing

    items: list[BloodRequestListOut] = []
    for request in requests:
        if request.id in matching_ids:
            result = BloodRequestListOut.model_validate(request, from_attributes=True)
            result.confirmed_donor_count = count_confirmed_matches(request)
            items.append(result)
    return items


@router.get("/history", response_model=list[MatchDetailOut])
def donor_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.MEMBER)),
) -> list[MatchDetailOut]:
    profile = db.scalar(select(DonorProfile).where(DonorProfile.user_id == current_user.id))
    if not profile:
        return []
    matches = list(
        db.scalars(
            select(DonationMatch)
            .options(joinedload(DonationMatch.donor).joinedload(DonorProfile.user))
            .where(DonationMatch.donor_id == profile.id)
            .order_by(DonationMatch.created_at.desc())
        ).all()
    )
    return [MatchDetailOut.model_validate(match) for match in matches]
