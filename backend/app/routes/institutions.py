from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models import Institution, User, UserRole
from app.schemas.institution import InstitutionProfileCreate, InstitutionOut, InstitutionWithUserOut


router = APIRouter(prefix="/institutions", tags=["institutions"])


@router.post("/me", response_model=InstitutionOut)
def upsert_institution_profile(
    payload: InstitutionProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INSTITUTION_DONOR)),
) -> InstitutionOut:
    institution = db.scalar(select(Institution).where(Institution.user_id == current_user.id))
    if institution is None:
        institution = Institution(user_id=current_user.id)
        db.add(institution)
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
    institution = db.scalar(select(Institution).where(Institution.user_id == current_user.id))
    if not institution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution profile not found")
    return InstitutionOut.model_validate(institution)


@router.get("", response_model=list[InstitutionWithUserOut])
def list_institutions(
    city: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[InstitutionWithUserOut]:
    if current_user.role not in {UserRole.RECEIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_DONOR}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    statement = select(Institution).options(joinedload(Institution.user)).order_by(Institution.institution_name.asc())
    if city:
        statement = statement.where(Institution.city == city)
    institutions = list(db.scalars(statement).all())
    return [InstitutionWithUserOut.model_validate(item) for item in institutions]
