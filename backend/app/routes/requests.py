import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models import BloodRequest, DonorProfile, MatchStatus, RequestDocument, RequestStatus, User, UserRole
from app.schemas.blood_request import BloodRequestCreate, BloodRequestDetailOut, BloodRequestListOut, BloodRequestOut
from app.services.matching import count_confirmed_matches
from app.utils.validators import ALLOWED_UPLOAD_EXTENSIONS


router = APIRouter(prefix="/requests", tags=["blood_requests"])
settings = get_settings()


def _get_request_for_user(db: Session, request_id: int, user: User) -> BloodRequest:
    request = db.scalar(
        select(BloodRequest)
        .options(joinedload(BloodRequest.documents), joinedload(BloodRequest.matches))
        .where(BloodRequest.id == request_id)
    )
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if user.role == UserRole.RECEIVER and request.created_by_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return request


@router.post("", response_model=BloodRequestOut, status_code=status.HTTP_201_CREATED)
def create_request(
    payload: BloodRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECEIVER)),
) -> BloodRequestOut:
    request = BloodRequest(created_by_user_id=current_user.id, **payload.model_dump())
    db.add(request)
    db.commit()
    db.refresh(request)
    return BloodRequestOut.model_validate(request)


@router.get("", response_model=list[BloodRequestListOut])
def list_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[BloodRequestListOut]:
    statement = select(BloodRequest).options(joinedload(BloodRequest.matches)).order_by(BloodRequest.created_at.desc())
    if current_user.role == UserRole.RECEIVER:
        statement = statement.where(BloodRequest.created_by_user_id == current_user.id)
    elif current_user.role == UserRole.DONOR:
        statement = statement.where(BloodRequest.status.in_([RequestStatus.APPROVED, RequestStatus.MATCHED]))

    requests = list(db.scalars(statement).unique().all())
    return [
        BloodRequestListOut(
            **request.__dict__,
            confirmed_donor_count=count_confirmed_matches(request),
        )
        for request in requests
    ]


@router.get("/{request_id}", response_model=BloodRequestDetailOut)
def get_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BloodRequestDetailOut:
    request = _get_request_for_user(db, request_id, current_user)
    if current_user.role == UserRole.DONOR and request.status not in {RequestStatus.APPROVED, RequestStatus.MATCHED}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return BloodRequestDetailOut(
        **request.__dict__,
        confirmed_donor_count=count_confirmed_matches(request),
        documents=request.documents,
    )


@router.patch("/{request_id}/status", response_model=BloodRequestOut)
def update_request_status(
    request_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> BloodRequestOut:
    request = db.get(BloodRequest, request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    status_value = payload.get("status")
    if status_value not in {status.value for status in RequestStatus}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid status")
    request.status = RequestStatus(status_value)
    db.commit()
    db.refresh(request)
    return BloodRequestOut.model_validate(request)


@router.post("/{request_id}/upload-document", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_document(
    request_id: int,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECEIVER)),
) -> dict:
    request = db.get(BloodRequest, request_id)
    if not request or request.created_by_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    extension = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else ""
    if extension not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")

    content = await file.read()
    max_size_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(content) > max_size_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds size limit")

    os.makedirs(settings.upload_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{extension}"
    destination = os.path.join(settings.upload_dir, filename)
    with open(destination, "wb") as upload_file:
        upload_file.write(content)

    document = RequestDocument(request_id=request.id, document_type=document_type, file_url=filename)
    db.add(document)
    db.commit()
    db.refresh(document)
    return {"id": document.id, "file_url": document.file_url}


@router.patch("/{request_id}/mark-fulfilled", response_model=BloodRequestOut)
def mark_fulfilled(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECEIVER)),
) -> BloodRequestOut:
    request = db.get(BloodRequest, request_id)
    if not request or request.created_by_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    request.status = RequestStatus.FULFILLED
    for match in request.matches:
        if match.status == MatchStatus.ACCEPTED:
            match.status = MatchStatus.COMPLETED
    db.commit()
    db.refresh(request)
    return BloodRequestOut.model_validate(request)


@router.patch("/{request_id}/cancel", response_model=BloodRequestOut)
def cancel_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECEIVER)),
) -> BloodRequestOut:
    request = db.get(BloodRequest, request_id)
    if not request or request.created_by_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    request.status = RequestStatus.CANCELLED
    for match in request.matches:
        if match.status == MatchStatus.PENDING:
            match.status = MatchStatus.CANCELLED
    db.commit()
    db.refresh(request)
    return BloodRequestOut.model_validate(request)

