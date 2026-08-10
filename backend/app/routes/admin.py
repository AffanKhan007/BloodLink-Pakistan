from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import require_roles
from app.models import (
    AuditLog,
    BloodRequest,
    DonationMatch,
    DonorProfile,
    DonorVerificationStatus,
    Institution,
    InstitutionStatus,
    MatchStatus,
    Report,
    ReportStatus,
    RequestStatus,
    User,
    UserRole,
)
from app.schemas.admin import DashboardStats
from app.schemas.blood_request import BloodRequestDetailOut, BloodRequestListOut
from app.schemas.common import AuditLogOut, PaginatedResponse
from app.schemas.donor import DonorVerificationUpdate, DonorWithUserOut
from app.schemas.institution import InstitutionStatusUpdate, InstitutionWithUserOut
from app.schemas.user import AdminUserSummary
from app.services.audit import create_audit_log
from app.services.matching import count_confirmed_matches, create_automatic_matches
from app.services.notifications import create_notification


class AdminRequestStatusUpdate(BaseModel):
    status: RequestStatus


router = APIRouter(prefix="/admin", tags=["admin"])
ADMIN_ROLES = (UserRole.ADMIN,)


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
) -> DashboardStats:
    return DashboardStats(
        total_users=db.scalar(select(func.count(User.id))) or 0,
        total_donors=db.scalar(select(func.count(DonorProfile.id))) or 0,
        pending_institutions=db.scalar(
            select(func.count(Institution.id)).where(Institution.status == InstitutionStatus.PENDING)
        )
        or 0,
        active_requests=db.scalar(
            select(func.count(BloodRequest.id)).where(BloodRequest.status.in_([RequestStatus.APPROVED, RequestStatus.MATCHED]))
        )
        or 0,
        active_matches=db.scalar(
            select(func.count(DonationMatch.id)).where(DonationMatch.status.in_([MatchStatus.PENDING, MatchStatus.ACCEPTED]))
        )
        or 0,
        pending_reports=db.scalar(select(func.count(Report.id)).where(Report.status == ReportStatus.PENDING)) or 0,
        last_updated=datetime.now(timezone.utc),
    )


@router.get("/users", response_model=PaginatedResponse[AdminUserSummary])
def list_users(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
) -> PaginatedResponse[AdminUserSummary]:
    total = db.scalar(select(func.count(User.id)))
    users = list(
        db.scalars(
            select(User).order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        ).all()
    )
    return PaginatedResponse(
        items=[AdminUserSummary.model_validate(u) for u in users],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@router.get("/request-creators", response_model=list[AdminUserSummary])
def list_request_creators(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
) -> list[AdminUserSummary]:
    users = list(
        db.scalars(
            select(User)
            .where(User.created_requests.any())
            .order_by(User.created_at.desc())
        ).all()
    )
    return [AdminUserSummary.model_validate(user) for user in users]


@router.patch("/users/{user_id}/block", response_model=AdminUserSummary)
def block_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
) -> AdminUserSummary:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = False
    create_audit_log(
        db,
        admin_user_id=current_user.id,
        action="block_user",
        entity_type="user",
        entity_id=user.id,
        details={"email": user.email, "role": user.role.value},
    )
    db.commit()
    db.refresh(user)
    return AdminUserSummary.model_validate(user)


@router.get("/donors", response_model=PaginatedResponse[DonorWithUserOut])
def list_donors(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
) -> PaginatedResponse[DonorWithUserOut]:
    total = db.scalar(select(func.count(DonorProfile.id)))
    donors = list(
        db.scalars(
            select(DonorProfile)
            .options(joinedload(DonorProfile.user))
            .order_by(DonorProfile.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )
    return PaginatedResponse(
        items=[DonorWithUserOut.model_validate(d) for d in donors],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@router.get("/institutions", response_model=list[InstitutionWithUserOut])
def list_institutions(
    status_filter: InstitutionStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
) -> list[InstitutionWithUserOut]:
    statement = (
        select(Institution)
        .options(joinedload(Institution.user))
        .order_by(Institution.created_at.desc())
    )
    if status_filter is not None:
        statement = statement.where(Institution.status == status_filter)
    institutions = list(db.scalars(statement).all())
    return [InstitutionWithUserOut.model_validate(institution) for institution in institutions]


@router.patch("/institutions/{institution_id}/status", response_model=InstitutionWithUserOut)
def update_institution_status(
    institution_id: int,
    payload: InstitutionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
) -> InstitutionWithUserOut:
    institution = db.scalar(
        select(Institution).options(joinedload(Institution.user)).where(Institution.id == institution_id)
    )
    if not institution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")
    if payload.status == InstitutionStatus.REJECTED and not payload.rejection_reason:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Rejection reason is required")
    allowed_transitions = {
        InstitutionStatus.PENDING: {InstitutionStatus.APPROVED, InstitutionStatus.REJECTED},
        InstitutionStatus.APPROVED: {InstitutionStatus.REJECTED, InstitutionStatus.SUSPENDED},
        InstitutionStatus.REJECTED: {InstitutionStatus.APPROVED},
        InstitutionStatus.SUSPENDED: {InstitutionStatus.APPROVED},
    }
    if payload.status not in allowed_transitions[institution.status]:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid institution status transition")

    institution.status = payload.status
    institution.rejection_reason = payload.rejection_reason if payload.status == InstitutionStatus.REJECTED else None
    institution.status_changed_by_user_id = current_user.id
    if payload.status == InstitutionStatus.APPROVED:
        institution.approved_at = datetime.now(timezone.utc)
        institution.approved_by_user_id = current_user.id
    elif payload.status in {InstitutionStatus.REJECTED, InstitutionStatus.SUSPENDED}:
        institution.approved_at = None
        institution.approved_by_user_id = None
    create_audit_log(
        db,
        admin_user_id=current_user.id,
        action="update_institution_status",
        entity_type="institution",
        entity_id=institution.id,
        details={"status": payload.status.value, "institution_name": institution.institution_name},
    )
    db.commit()
    db.refresh(institution)
    return InstitutionWithUserOut.model_validate(institution)


@router.patch("/donors/{donor_id}/verify", response_model=DonorWithUserOut)
def verify_donor(
    donor_id: int,
    payload: DonorVerificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
) -> DonorWithUserOut:
    donor = db.scalar(select(DonorProfile).options(joinedload(DonorProfile.user)).where(DonorProfile.id == donor_id))
    if not donor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor not found")
    donor.verification_status = payload.verification_status
    if payload.verification_status == DonorVerificationStatus.BLOCKED:
        donor.user.is_active = False

    create_audit_log(
        db,
        admin_user_id=current_user.id,
        action="verify_donor",
        entity_type="donor_profile",
        entity_id=donor.id,
        details={"verification_status": payload.verification_status.value},
    )
    db.commit()
    db.refresh(donor)
    return DonorWithUserOut.model_validate(donor)


@router.get("/requests", response_model=PaginatedResponse[BloodRequestListOut])
def admin_requests(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
) -> PaginatedResponse[BloodRequestListOut]:
    total = db.scalar(select(func.count(BloodRequest.id)))
    requests = list(
        db.scalars(
            select(BloodRequest)
            .options(joinedload(BloodRequest.matches))
            .order_by(BloodRequest.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).unique().all()
    )
    return PaginatedResponse(
        items=[
            BloodRequestListOut(
                **r.__dict__,
                confirmed_donor_count=count_confirmed_matches(r),
            )
            for r in requests
        ],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@router.patch("/requests/{request_id}/approve", response_model=BloodRequestListOut)
def approve_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
) -> BloodRequestListOut:
    request = db.scalar(
        select(BloodRequest).options(joinedload(BloodRequest.matches), joinedload(BloodRequest.documents)).where(BloodRequest.id == request_id)
    )
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    request.status = RequestStatus.APPROVED
    create_automatic_matches(db, request)
    create_audit_log(
        db,
        admin_user_id=current_user.id,
        action="approve_request",
        entity_type="blood_request",
        entity_id=request.id,
        details={"patient_name": request.patient_name},
    )
    db.commit()
    db.refresh(request)
    return BloodRequestListOut(
        **request.__dict__,
        confirmed_donor_count=count_confirmed_matches(request),
    )


@router.patch("/requests/{request_id}/reject", response_model=BloodRequestListOut)
def reject_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
) -> BloodRequestListOut:
    request = db.scalar(
        select(BloodRequest).options(joinedload(BloodRequest.matches), joinedload(BloodRequest.documents)).where(BloodRequest.id == request_id)
    )
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    request.status = RequestStatus.REJECTED
    create_notification(
        db,
        user_id=request.created_by_user_id,
        title="Blood request removed",
        message=f"Your request #{request.id} for {request.patient_name} was removed by admin review.",
    )
    for match in request.matches:
        if match.status in {MatchStatus.PENDING, MatchStatus.ACCEPTED}:
            match.status = MatchStatus.CANCELLED
        create_notification(
            db,
            user_id=match.donor.user_id,
            title="Matched request removed",
            message=f"Request #{request.id} in {request.city} was removed by admin review. Coordination for this request is now closed.",
        )
    create_audit_log(
        db,
        admin_user_id=current_user.id,
        action="reject_request",
        entity_type="blood_request",
        entity_id=request.id,
        details={"patient_name": request.patient_name},
    )
    db.commit()
    db.refresh(request)
    return BloodRequestListOut(
        **request.__dict__,
        confirmed_donor_count=count_confirmed_matches(request),
    )


@router.patch("/requests/{request_id}/status", response_model=BloodRequestListOut)
def update_request_status(
    request_id: int,
    payload: AdminRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
) -> BloodRequestListOut:
    request = db.scalar(
        select(BloodRequest).options(joinedload(BloodRequest.matches), joinedload(BloodRequest.documents)).where(BloodRequest.id == request_id)
    )
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    old_status = request.status
    new_status = payload.status

    if new_status == old_status:
        db.refresh(request)
        return BloodRequestListOut(
            **request.__dict__,
            confirmed_donor_count=count_confirmed_matches(request),
        )

    if new_status == RequestStatus.APPROVED:
        request.status = RequestStatus.APPROVED
        create_automatic_matches(db, request)
    else:
        request.status = new_status

    if new_status == RequestStatus.REJECTED:
        create_notification(
            db,
            user_id=request.created_by_user_id,
            title="Blood request removed",
            message=f"Your request #{request.id} for {request.patient_name} was removed by admin review.",
        )

    if old_status in (RequestStatus.APPROVED, RequestStatus.MATCHED) and new_status not in {RequestStatus.APPROVED, RequestStatus.MATCHED}:
        for match in request.matches:
            if match.status in {MatchStatus.PENDING, MatchStatus.ACCEPTED}:
                match.status = MatchStatus.CANCELLED
            if new_status == RequestStatus.REJECTED:
                create_notification(
                    db,
                    user_id=match.donor.user_id,
                    title="Matched request removed",
                    message=f"Request #{request.id} in {request.city} was removed by admin review. Coordination for this request is now closed.",
                )

    create_audit_log(
        db,
        admin_user_id=current_user.id,
        action="update_request_status",
        entity_type="blood_request",
        entity_id=request.id,
        details={"patient_name": request.patient_name, "from": old_status.value, "to": new_status.value},
    )
    db.commit()
    db.refresh(request)
    return BloodRequestListOut(
        **request.__dict__,
        confirmed_donor_count=count_confirmed_matches(request),
    )


@router.get("/requests/{request_id}/detail", response_model=BloodRequestDetailOut)
def admin_request_detail(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
) -> BloodRequestDetailOut:
    request = db.scalar(
        select(BloodRequest)
        .options(joinedload(BloodRequest.documents), joinedload(BloodRequest.matches))
        .where(BloodRequest.id == request_id)
    )
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return BloodRequestDetailOut(
        **request.__dict__,
        confirmed_donor_count=count_confirmed_matches(request),
        documents=request.documents,
    )


@router.get("/audit-logs", response_model=PaginatedResponse[AuditLogOut])
def audit_logs(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
) -> PaginatedResponse[AuditLogOut]:
    total = db.scalar(select(func.count(AuditLog.id)))
    logs = list(
        db.scalars(
            select(AuditLog)
            .order_by(AuditLog.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )
    return PaginatedResponse(
        items=[AuditLogOut.model_validate(log) for log in logs],
        total=total or 0,
        page=page,
        page_size=page_size,
    )
