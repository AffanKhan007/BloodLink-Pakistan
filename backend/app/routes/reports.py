import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models import Report, User, UserRole
from app.models.report import ReportReason, ReportStatus, ReportedType
from app.schemas.report import ReportCreateResponse, ReportDetailOut, ReportListOut, ReportUpdate, ReportedEntityOut, RelatedReportOut
from app.services.audit import create_audit_log
from app.services.reports import (
    ADMIN_ROLES,
    enforce_rate_limits,
    notify_admins_of_report,
    resolve_entity_label,
    resolve_reported_entity,
    validate_report_target,
)
from app.utils.validators import ALLOWED_UPLOAD_EXTENSIONS


router = APIRouter(prefix="/reports", tags=["reports"])
settings = get_settings()


def _serialize_report_list(db: Session, report: Report) -> ReportListOut:
    reporter = report.reporter or db.get(User, report.reporter_id)
    entity_label = resolve_entity_label(db, report.reported_type, report.reported_id)
    entity = resolve_reported_entity(db, report)
    return ReportListOut(
        id=report.id,
        reporter_id=report.reporter_id,
        reporter_name=reporter.full_name if reporter else "Unknown user",
        reported_type=report.reported_type,
        reported_id=report.reported_id,
        reason=report.reason,
        description=report.description,
        status=report.status,
        created_at=report.created_at,
        entity_label=entity_label,
        entity_admin_path=entity.get("admin_path"),
    )


def _serialize_report_detail(db: Session, report: Report) -> ReportDetailOut:
    base = _serialize_report_list(db, report)
    entity_data = resolve_reported_entity(db, report)
    related = list(
        db.scalars(
            select(Report)
            .options(joinedload(Report.reporter))
            .where(
                Report.reported_type == report.reported_type,
                Report.reported_id == report.reported_id,
                Report.id != report.id,
            )
            .order_by(Report.created_at.desc())
        ).all()
    )
    return ReportDetailOut(
        **base.model_dump(),
        evidence_file=report.evidence_file,
        admin_notes=report.admin_notes,
        updated_at=report.updated_at,
        reported_entity=ReportedEntityOut.model_validate(entity_data),
        related_reports=[
            RelatedReportOut(
                id=item.id,
                reporter_name=item.reporter.full_name if item.reporter else "Unknown user",
                reason=item.reason,
                status=item.status,
                description=item.description,
                created_at=item.created_at,
            )
            for item in related
        ],
    )


@router.post("", response_model=ReportCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    reported_type: ReportedType = Form(...),
    reported_id: int = Form(...),
    reason: ReportReason = Form(...),
    description: str | None = Form(default=None),
    evidence: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportCreateResponse:
    validate_report_target(db, current_user, reported_type, reported_id)
    enforce_rate_limits(db, current_user.id, reported_type, reported_id)

    evidence_filename = None
    if evidence and evidence.filename:
        extension = evidence.filename.rsplit(".", 1)[-1].lower() if "." in evidence.filename else ""
        if extension not in ALLOWED_UPLOAD_EXTENSIONS:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")
        content = await evidence.read()
        max_size_bytes = settings.max_upload_size_mb * 1024 * 1024
        if len(content) > max_size_bytes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds size limit")
        os.makedirs(settings.upload_dir, exist_ok=True)
        evidence_filename = f"report_{uuid.uuid4().hex}.{extension}"
        destination = os.path.join(settings.upload_dir, evidence_filename)
        with open(destination, "wb") as upload_file:
            upload_file.write(content)

    report = Report(
        reporter_id=current_user.id,
        reported_type=reported_type,
        reported_id=reported_id,
        reason=reason,
        description=description.strip() if description and description.strip() else None,
        evidence_file=evidence_filename,
    )
    db.add(report)
    db.flush()
    notify_admins_of_report(db, report, current_user)
    db.commit()
    db.refresh(report)
    return ReportCreateResponse(id=report.id)


@router.get("", response_model=list[ReportListOut])
def list_reports(
    status_filter: ReportStatus | None = Query(default=None, alias="status"),
    reported_type: ReportedType | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
) -> list[ReportListOut]:
    statement = (
        select(Report)
        .options(joinedload(Report.reporter))
        .order_by(Report.created_at.desc())
    )
    if status_filter is not None:
        statement = statement.where(Report.status == status_filter)
    if reported_type is not None:
        statement = statement.where(Report.reported_type == reported_type)
    reports = list(db.scalars(statement).unique().all())
    return [_serialize_report_list(db, report) for report in reports]


@router.get("/{report_id}", response_model=ReportDetailOut)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
) -> ReportDetailOut:
    report = db.scalar(
        select(Report)
        .options(joinedload(Report.reporter))
        .where(Report.id == report_id)
    )
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return _serialize_report_detail(db, report)


@router.patch("/{report_id}", response_model=ReportDetailOut)
def update_report(
    report_id: int,
    payload: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
) -> ReportDetailOut:
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if payload.status is None and payload.admin_notes is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No updates provided")

    details: dict[str, str] = {}
    if payload.status is not None:
        report.status = payload.status
        details["status"] = payload.status.value
    if payload.admin_notes is not None:
        report.admin_notes = payload.admin_notes.strip() or None
        details["admin_notes_updated"] = "true"

    create_audit_log(
        db,
        admin_user_id=current_user.id,
        action="update_report",
        entity_type="report",
        entity_id=report.id,
        details=details,
    )
    db.commit()
    db.refresh(report)
    return _serialize_report_detail(db, report)
