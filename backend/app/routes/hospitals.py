from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models import BloodRequest, DonationMatch, Hospital, MatchStatus, RequestStatus, User, UserRole
from app.schemas.blood_request import BloodRequestOut
from app.schemas.hospital import DonorArrivalConfirm, HospitalBloodRequestCreate, HospitalCreate, HospitalDashboardOut, HospitalOut
from app.schemas.match import MatchOut


router = APIRouter(prefix="/hospitals", tags=["hospitals"])


def _ensure_hospital_scope(current_user: User, hospital_id: int) -> None:
    if current_user.role in {UserRole.HOSPITAL_ADMIN, UserRole.HOSPITAL_STAFF} and current_user.hospital_id != hospital_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


@router.get("", response_model=list[HospitalOut])
def list_hospitals(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.HOSPITAL_STAFF)
    ),
) -> list[HospitalOut]:
    hospitals = list(db.scalars(select(Hospital).order_by(Hospital.name.asc())).all())
    return [HospitalOut.model_validate(item) for item in hospitals]


@router.post("", response_model=HospitalOut, status_code=status.HTTP_201_CREATED)
def create_hospital(
    payload: HospitalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
) -> HospitalOut:
    hospital = Hospital(**payload.model_dump())
    db.add(hospital)
    db.commit()
    db.refresh(hospital)
    return HospitalOut.model_validate(hospital)


@router.get("/{hospital_id}/dashboard", response_model=HospitalDashboardOut)
def hospital_dashboard(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.HOSPITAL_STAFF)
    ),
) -> HospitalDashboardOut:
    _ensure_hospital_scope(current_user, hospital_id)
    hospital = db.get(Hospital, hospital_id)
    if not hospital:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found")

    requests = list(
        db.scalars(
            select(BloodRequest)
            .where(BloodRequest.hospital_id == hospital_id)
            .order_by(BloodRequest.created_at.desc())
        ).all()
    )
    return HospitalDashboardOut(
        hospital=HospitalOut.model_validate(hospital),
        total_requests=len(requests),
        active_requests=sum(1 for item in requests if item.status in {RequestStatus.APPROVED, RequestStatus.MATCHED}),
        fulfilled_requests=sum(1 for item in requests if item.status == RequestStatus.FULFILLED),
        requests=[BloodRequestOut.model_validate(item) for item in requests[:10]],
    )


@router.post("/{hospital_id}/requests", response_model=BloodRequestOut, status_code=status.HTTP_201_CREATED)
def create_hospital_request(
    hospital_id: int,
    payload: HospitalBloodRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.HOSPITAL_STAFF)
    ),
) -> BloodRequestOut:
    _ensure_hospital_scope(current_user, hospital_id)
    hospital = db.get(Hospital, hospital_id)
    if not hospital:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found")

    request = BloodRequest(
        created_by_user_id=current_user.id,
        hospital_id=hospital.id,
        hospital_name=hospital.name,
        city=hospital.city,
        area=hospital.area or "General",
        status=RequestStatus.APPROVED,
        **payload.model_dump(),
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return BloodRequestOut.model_validate(request)


@router.post("/{hospital_id}/confirm-donor-arrival", response_model=MatchOut)
def confirm_donor_arrival(
    hospital_id: int,
    payload: DonorArrivalConfirm,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.HOSPITAL_STAFF)
    ),
) -> MatchOut:
    _ensure_hospital_scope(current_user, hospital_id)
    match = db.get(DonationMatch, payload.match_id)
    if not match or not match.request or match.request.hospital_id != hospital_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found for this hospital")
    match.status = MatchStatus.COMPLETED
    db.commit()
    db.refresh(match)
    return MatchOut.model_validate(match)
