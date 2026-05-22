import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models import (
    BloodBank,
    BloodRequest,
    BloodUnit,
    BloodUnitStatus,
    DonationMatch,
    DonorProfile,
    Institution,
    MatchStatus,
    RequestDocument,
    RequestStatus,
    TestingStatus,
    User,
    UserRole,
)
from app.schemas.blood_bank import BloodBankCityInventoryItem, BloodBankDiscoveryOut
from app.schemas.blood_request import BloodRequestCreate, BloodRequestDetailOut, BloodRequestListOut, BloodRequestOut
from app.schemas.donor import DonorWithUserOut
from app.schemas.institution import InstitutionWithUserOut
from app.services.matching import compatible_donor_groups, count_confirmed_matches, create_automatic_matches
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
    request = BloodRequest(
        created_by_user_id=current_user.id,
        status=RequestStatus.APPROVED,
        **payload.model_dump(),
    )
    db.add(request)
    db.flush()
    create_automatic_matches(db, request)
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
        donor = db.scalar(select(DonorProfile).where(DonorProfile.user_id == current_user.id))
        if not donor:
            return []
        request_ids = list(
            db.scalars(select(DonationMatch.request_id).where(DonationMatch.donor_id == donor.id)).all()
        )
        if not request_ids:
            return []
        statement = statement.where(BloodRequest.id.in_(request_ids))
    elif current_user.role == UserRole.BLOOD_BANK_ADMIN or current_user.role == UserRole.BLOOD_BANK_STAFF:
        if current_user.blood_bank_id:
            bank = db.get(BloodBank, current_user.blood_bank_id)
            if bank:
                statement = statement.where(BloodRequest.city == bank.city)

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
    if current_user.role == UserRole.DONOR:
        donor = db.scalar(select(DonorProfile).where(DonorProfile.user_id == current_user.id))
        if not donor:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        owned_match = db.scalar(
            select(DonationMatch).where(DonationMatch.request_id == request_id, DonationMatch.donor_id == donor.id)
        )
        if not owned_match:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return BloodRequestDetailOut(
        **request.__dict__,
        confirmed_donor_count=count_confirmed_matches(request),
        documents=request.documents,
    )


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


@router.get("/{request_id}/public-donors", response_model=list[DonorWithUserOut])
def request_public_donors(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECEIVER)),
) -> list[DonorWithUserOut]:
    request = _get_request_for_user(db, request_id, current_user)
    compatible_groups = compatible_donor_groups(request.blood_group_needed)
    donors = list(
        db.scalars(
            select(DonorProfile)
            .options(joinedload(DonorProfile.user))
            .where(DonorProfile.city == request.city)
            .where(DonorProfile.blood_group.in_(compatible_groups))
            .where(DonorProfile.availability_status == "available")
            .where(DonorProfile.is_publicly_available.is_(True))
            .order_by(DonorProfile.updated_at.desc())
        ).all()
    )
    return [DonorWithUserOut.model_validate(donor) for donor in donors]


@router.get("/{request_id}/blood-banks", response_model=list[BloodBankDiscoveryOut])
def request_city_blood_banks(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECEIVER)),
) -> list[BloodBankDiscoveryOut]:
    request = _get_request_for_user(db, request_id, current_user)
    compatible_groups = compatible_donor_groups(request.blood_group_needed)
    banks = list(db.scalars(select(BloodBank).where(BloodBank.city == request.city).order_by(BloodBank.name.asc())).all())
    items: list[BloodBankDiscoveryOut] = []
    for bank in banks:
        units = list(
            db.scalars(
                select(BloodUnit)
                .where(BloodUnit.blood_bank_id == bank.id)
                .where(BloodUnit.blood_group.in_(compatible_groups))
                .where(BloodUnit.status == BloodUnitStatus.AVAILABLE)
                .where(BloodUnit.testing_status == TestingStatus.CLEARED)
            ).all()
        )
        grouped: dict[str, int] = {}
        for unit in units:
            grouped[unit.blood_group] = grouped.get(unit.blood_group, 0) + unit.units_available
        contact_user = db.scalar(select(User).where(User.blood_bank_id == bank.id).order_by(User.created_at.asc()))
        items.append(
            BloodBankDiscoveryOut(
                **bank.__dict__,
                available_inventory=[
                    BloodBankCityInventoryItem(blood_group=group, total_units=total)
                    for group, total in sorted(grouped.items())
                ],
                contact_user_id=contact_user.id if contact_user else None,
            )
        )
    return items


@router.get("/{request_id}/institutions", response_model=list[InstitutionWithUserOut])
def request_city_institutions(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.RECEIVER)),
) -> list[InstitutionWithUserOut]:
    request = _get_request_for_user(db, request_id, current_user)
    institutions = list(
        db.scalars(
            select(Institution).options(joinedload(Institution.user)).where(Institution.city == request.city).order_by(Institution.institution_name.asc())
        ).all()
    )
    return [InstitutionWithUserOut.model_validate(item) for item in institutions]


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
