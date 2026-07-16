import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import Chat, DonationMatch, DonorProfile, Report, RequestDocument, User, UserRole


router = APIRouter(prefix="/uploads", tags=["uploads"])
settings = get_settings()


@router.get("/request-documents/{document_id}")
def get_request_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = db.get(RequestDocument, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    request = document.request

    if current_user.role in {UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_AGENT}:
        pass
    elif request.created_by_user_id == current_user.id:
        pass
    elif current_user.role == UserRole.INSTITUTION_DONOR:
        chat = db.scalar(
            select(Chat).where(
                Chat.request_id == request.id,
                or_(Chat.participant_one_id == current_user.id, Chat.participant_two_id == current_user.id),
            )
        )
        if not chat:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == UserRole.USER:
        donor = db.scalar(select(DonorProfile).where(DonorProfile.user_id == current_user.id))
        if donor:
            owned_match = db.scalar(
                select(DonationMatch).where(
                    DonationMatch.donor_id == donor.id,
                    DonationMatch.request_id == request.id,
                )
            )
            if not owned_match:
                raise HTTPException(status_code=403, detail="Access denied")
        else:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        raise HTTPException(status_code=403, detail="Access denied")

    file_path = os.path.join(settings.upload_dir, document.file_url)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Stored file missing")
    return FileResponse(path=file_path, filename=document.file_url)


@router.get("/report-evidence/{report_id}")
def get_report_evidence(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.get(Report, report_id)
    if not report or not report.evidence_file:
        raise HTTPException(status_code=404, detail="Evidence not found")
    if current_user.role not in {UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_AGENT}:
        raise HTTPException(status_code=403, detail="Access denied")

    file_path = os.path.join(settings.upload_dir, report.evidence_file)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Stored file missing")
    return FileResponse(path=file_path, filename=report.evidence_file)

