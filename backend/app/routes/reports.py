from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models import BloodRequest, Report, User, UserRole
from app.schemas.report import ReportCreate, ReportOut


router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def create_report(
    payload: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECEIVER)),
) -> ReportOut:
    request = db.get(BloodRequest, payload.request_id)
    if not request or request.created_by_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    report = Report(**payload.model_dump(), reporter_user_id=current_user.id)
    db.add(report)
    db.commit()
    db.refresh(report)
    return ReportOut.model_validate(report)


@router.get("/me", response_model=list[ReportOut])
def my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECEIVER)),
) -> list[ReportOut]:
    reports = list(
        db.scalars(select(Report).where(Report.reporter_user_id == current_user.id).order_by(Report.created_at.desc())).all()
    )
    return [ReportOut.model_validate(report) for report in reports]

