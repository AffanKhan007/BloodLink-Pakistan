from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models import ReceiverProfile, User, UserRole
from app.schemas.receiver import ReceiverProfileCreate, ReceiverProfileOut


router = APIRouter(prefix="/receiver-profiles", tags=["receiver_profiles"])


@router.post("/me", response_model=ReceiverProfileOut)
def upsert_receiver_profile(
    payload: ReceiverProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECEIVER)),
) -> ReceiverProfileOut:
    profile = db.scalar(select(ReceiverProfile).where(ReceiverProfile.user_id == current_user.id))
    if profile is None:
        profile = ReceiverProfile(user_id=current_user.id)
        db.add(profile)
    for field, value in payload.model_dump().items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return ReceiverProfileOut.model_validate(profile)


@router.get("/me", response_model=ReceiverProfileOut)
def get_receiver_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECEIVER)),
) -> ReceiverProfileOut:
    profile = db.scalar(select(ReceiverProfile).where(ReceiverProfile.user_id == current_user.id))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receiver profile not found")
    return ReceiverProfileOut.model_validate(profile)
