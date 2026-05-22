from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models import Institution, InstitutionStatus, User, UserRole
from app.schemas.institution import InstitutionProfileCreate, InstitutionOut, InstitutionWithUserOut


router = APIRouter(prefix="/institutions", tags=["institutions"])


def _get_institution_for_user(db: Session, user_id: int) -> Institution:
    institution = db.scalar(select(Institution).where(Institution.user_id == user_id))
    if not institution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution profile not found")
    return institution


@router.post("/me", response_model=InstitutionOut)
def upsert_institution_profile(
    payload: InstitutionProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INSTITUTION_DONOR)),
) -> InstitutionOut:
    institution = _get_institution_for_user(db, current_user.id)
    if institution.status != InstitutionStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only approved institutions can update their public institution profile.",
        )
    for field, value in payload.model_dump().items():
        setattr(institution, field, value)
    db.commit()
    db.refresh(institution)
    return InstitutionOut.model_validate(institution)


@router.get("/me", response_model=InstitutionOut)
def get_institution_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INSTITUTION_DONOR)),
) -> InstitutionOut:
    institution = _get_institution_for_user(db, current_user.id)
    return InstitutionOut.model_validate(institution)


@router.post("/me/resubmit", response_model=InstitutionOut)
def resubmit_institution_profile(
    payload: InstitutionProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INSTITUTION_DONOR)),
) -> InstitutionOut:
    institution = _get_institution_for_user(db, current_user.id)
    if institution.status != InstitutionStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only rejected institutions can resubmit verification details.",
        )
    for field, value in payload.model_dump().items():
        setattr(institution, field, value)
    institution.status = InstitutionStatus.PENDING_APPROVAL
    institution.rejection_reason = None
    db.commit()
    db.refresh(institution)
    return InstitutionOut.model_validate(institution)


@router.get("", response_model=list[InstitutionWithUserOut])
def list_institutions(
    city: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[InstitutionWithUserOut]:
    if current_user.role not in {UserRole.RECEIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_DONOR}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    if current_user.role == UserRole.INSTITUTION_DONOR:
        institution = _get_institution_for_user(db, current_user.id)
        if institution.status != InstitutionStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Institution approval is required before using institution features.",
            )
    statement = select(Institution).options(joinedload(Institution.user)).order_by(Institution.institution_name.asc())
    if current_user.role not in {UserRole.ADMIN, UserRole.SUPER_ADMIN}:
        statement = statement.where(Institution.status == InstitutionStatus.APPROVED)
    if city:
        statement = statement.where(Institution.city == city)
    institutions = list(db.scalars(statement).all())
    return [InstitutionWithUserOut.model_validate(item) for item in institutions]
