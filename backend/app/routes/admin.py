from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
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
    MatchStatus,
    Report,
    ReportStatus,
    RequestStatus,
    User,
    UserRole,
)
from app.schemas.admin import DashboardStats
from app.schemas.blood_request import BloodRequestListOut
from app.schemas.common import AuditLogOut
from app.schemas.donor import DonorVerificationUpdate, DonorWithUserOut
from app.schemas.report import ReportOut, ReportStatusUpdate
from app.schemas.user import AdminUserSummary
from app.services.audit import create_audit_log
from app.services.matching import count_confirmed_matches, get_matching_donors


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> DashboardStats:
    return DashboardStats(
        total_users=db.scalar(select(func.count(User.id))) or 0,
        total_donors=db.scalar(select(func.count(DonorProfile.id))) or 0,
        approved_donors=db.scalar(
            select(func.count(DonorProfile.id)).where(DonorProfile.verification_status == DonorVerificationStatus.APPROVED)
        )
        or 0,
        pending_requests=db.scalar(
            select(func.count(BloodRequest.id)).where(BloodRequest.status == RequestStatus.PENDING_REVIEW)
        )
        or 0,
        approved_requests=db.scalar(
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


@router.get("/users", response_model=list[AdminUserSummary])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> list[AdminUserSummary]:
    users = list(db.scalars(select(User).order_by(User.created_at.desc())).all())
    return [AdminUserSummary.model_validate(user) for user in users]


@router.patch("/users/{user_id}/block", response_model=AdminUserSummary)
def block_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
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


@router.get("/donors", response_model=list[DonorWithUserOut])
def list_donors(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> list[DonorWithUserOut]:
    donors = list(
        db.scalars(select(DonorProfile).options(joinedload(DonorProfile.user)).order_by(DonorProfile.created_at.desc())).all()
    )
    return [DonorWithUserOut.model_validate(donor) for donor in donors]


@router.patch("/donors/{donor_id}/verify", response_model=DonorWithUserOut)
def verify_donor(
    donor_id: int,
    payload: DonorVerificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
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


@router.get("/requests", response_model=list[BloodRequestListOut])
def admin_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> list[BloodRequestListOut]:
    requests = list(
        db.scalars(
            select(BloodRequest).options(joinedload(BloodRequest.matches)).order_by(BloodRequest.created_at.desc())
        ).unique().all()
    )
    return [
        BloodRequestListOut(
            **request.__dict__,
            confirmed_donor_count=count_confirmed_matches(request),
        )
        for request in requests
    ]


@router.patch("/requests/{request_id}/approve", response_model=BloodRequestListOut)
def approve_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> BloodRequestListOut:
    request = db.scalar(select(BloodRequest).options(joinedload(BloodRequest.matches)).where(BloodRequest.id == request_id))
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    request.status = RequestStatus.APPROVED
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
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> BloodRequestListOut:
    request = db.scalar(select(BloodRequest).options(joinedload(BloodRequest.matches)).where(BloodRequest.id == request_id))
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    request.status = RequestStatus.REJECTED
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


@router.get("/requests/{request_id}/candidates", response_model=list[DonorWithUserOut])
def matching_candidates(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> list[DonorWithUserOut]:
    request = db.get(BloodRequest, request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    donors = get_matching_donors(db, request)
    return [DonorWithUserOut.model_validate(donor) for donor in donors]


@router.get("/reports", response_model=list[ReportOut])
def admin_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> list[ReportOut]:
    reports = list(db.scalars(select(Report).order_by(Report.created_at.desc())).all())
    return [ReportOut.model_validate(report) for report in reports]


@router.patch("/reports/{report_id}/status", response_model=ReportOut)
def update_report_status(
    report_id: int,
    payload: ReportStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> ReportOut:
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    report.status = payload.status
    create_audit_log(
        db,
        admin_user_id=current_user.id,
        action="update_report_status",
        entity_type="report",
        entity_id=report.id,
        details={"status": payload.status.value},
    )
    db.commit()
    db.refresh(report)
    return ReportOut.model_validate(report)


@router.get("/audit-logs", response_model=list[AuditLogOut])
def audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> list[AuditLogOut]:
    logs = list(db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc())).all())
    return [AuditLogOut.model_validate(log) for log in logs]
