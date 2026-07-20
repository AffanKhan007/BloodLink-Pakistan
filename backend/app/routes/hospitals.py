from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models import Hospital, User, UserRole
from app.schemas.hospital import HospitalCreate, HospitalOut


router = APIRouter(prefix="/hospitals", tags=["hospitals"])

ADMIN_ONLY = (UserRole.ADMIN, UserRole.SUPER_ADMIN)


@router.get("", response_model=list[HospitalOut])
def list_hospitals(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ONLY)),
) -> list[HospitalOut]:
    hospitals = list(db.scalars(select(Hospital).order_by(Hospital.name.asc())).all())
    return [HospitalOut.model_validate(item) for item in hospitals]


@router.get("/{hospital_id}", response_model=HospitalOut)
def get_hospital(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ONLY)),
) -> HospitalOut:
    hospital = db.get(Hospital, hospital_id)
    if not hospital:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found")
    return HospitalOut.model_validate(hospital)


@router.post("", response_model=HospitalOut, status_code=status.HTTP_201_CREATED)
def create_hospital(
    payload: HospitalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ONLY)),
) -> HospitalOut:
    hospital = Hospital(**payload.model_dump())
    db.add(hospital)
    db.commit()
    db.refresh(hospital)
    return HospitalOut.model_validate(hospital)
