from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models import BloodRequest, DonationMatch, DonorProfile, MatchStatus, RequestStatus, User, UserRole
from app.schemas.match import MatchCreate, MatchDetailOut, MatchOut
from app.services.audit import create_audit_log
from app.services.notifications import create_notification


router = APIRouter(prefix="/matches", tags=["matches"])


def _get_owned_match(db: Session, match_id: int, user: User) -> DonationMatch:
    match = db.scalar(
        select(DonationMatch)
        .options(joinedload(DonationMatch.donor).joinedload(DonorProfile.user))
        .where(DonationMatch.id == match_id)
    )
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    if user.role == UserRole.USER and match.donor.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return match


@router.post("", response_model=MatchOut, status_code=status.HTTP_201_CREATED)
def create_match(
    payload: MatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> MatchOut:
    request = db.get(BloodRequest, payload.request_id)
    donor = db.get(DonorProfile, payload.donor_id)
    if not request or not donor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request or donor not found")
    existing = db.scalar(
        select(DonationMatch).where(
            DonationMatch.request_id == payload.request_id,
            DonationMatch.donor_id == payload.donor_id,
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Match already exists")

    match = DonationMatch(request_id=payload.request_id, donor_id=payload.donor_id)
    request.status = RequestStatus.MATCHED
    db.add(match)
    db.flush()

    create_notification(
        db,
        user_id=donor.user_id,
        title="New blood request match",
        message=f"You have been matched with request #{request.id} for {request.blood_group_needed} blood in {request.city}.",
    )
    create_audit_log(
        db,
        admin_user_id=current_user.id,
        action="create_match",
        entity_type="donation_match",
        entity_id=match.id,
        details={"request_id": request.id, "donor_id": donor.id},
    )

    db.commit()
    db.refresh(match)
    return MatchOut.model_validate(match)


@router.get("/request/{request_id}", response_model=list[MatchDetailOut])
def list_request_matches(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MatchDetailOut]:
    request = db.get(BloodRequest, request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if current_user.role == UserRole.USER and request.created_by_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    matches = list(
        db.scalars(
            select(DonationMatch)
            .options(joinedload(DonationMatch.donor).joinedload(DonorProfile.user))
            .where(DonationMatch.request_id == request_id)
            .order_by(DonationMatch.created_at.desc())
        ).all()
    )
    return [MatchDetailOut.model_validate(match) for match in matches]


@router.get("/me", response_model=list[MatchDetailOut])
def my_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER)),
) -> list[MatchDetailOut]:
    donor = db.scalar(select(DonorProfile).where(DonorProfile.user_id == current_user.id))
    if not donor:
        return []
    matches = list(
        db.scalars(
            select(DonationMatch)
            .options(joinedload(DonationMatch.donor).joinedload(DonorProfile.user))
            .where(DonationMatch.donor_id == donor.id)
            .order_by(DonationMatch.created_at.desc())
        ).all()
    )
    return [MatchDetailOut.model_validate(match) for match in matches]


@router.patch("/{match_id}/accept", response_model=MatchOut)
def accept_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER)),
) -> MatchOut:
    match = _get_owned_match(db, match_id, current_user)
    match.status = MatchStatus.ACCEPTED
    match.accepted_at = datetime.now(timezone.utc)
    create_notification(
        db,
        user_id=match.request.created_by_user_id,
        title="A donor accepted your request",
        message=f"A donor accepted request #{match.request_id}. The coordination request is now active.",
    )
    db.commit()
    db.refresh(match)
    return MatchOut.model_validate(match)


@router.patch("/{match_id}/reject", response_model=MatchOut)
def reject_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.USER)),
) -> MatchOut:
    match = _get_owned_match(db, match_id, current_user)
    match.status = MatchStatus.REJECTED
    match.rejected_at = datetime.now(timezone.utc)
    create_notification(
        db,
        user_id=match.request.created_by_user_id,
        title="A donor rejected your request",
        message=f"A donor declined request #{match.request_id}. Other matches can still continue.",
    )
    db.commit()
    db.refresh(match)
    return MatchOut.model_validate(match)


@router.patch("/{match_id}/complete", response_model=MatchOut)
def complete_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MatchOut:
    match = _get_owned_match(db, match_id, current_user)
    if current_user.role not in {UserRole.ADMIN, UserRole.USER}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    match.status = MatchStatus.COMPLETED
    match.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(match)
    return MatchOut.model_validate(match)
