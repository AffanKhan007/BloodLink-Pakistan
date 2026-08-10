import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models import Institution, InstitutionStatus, User, UserRole
from app.schemas.institution import InstitutionOut, InstitutionWithUserOut
from app.utils.validators import ALLOWED_UPLOAD_EXTENSIONS, validate_blood_group, validate_contact_number


router = APIRouter(prefix="/institutions", tags=["institutions"])
settings = get_settings()


def _get_institution_for_user(db: Session, user_id: int) -> Institution:
    institution = db.scalar(select(Institution).where(Institution.user_id == user_id))
    if not institution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution profile not found")
    return institution


def _normalize_groups(raw: str | None) -> str | None:
    if raw is None or raw.strip() == "":
        return None
    groups = []
    for part in raw.split(","):
        cleaned = part.strip()
        if cleaned:
            groups.append(validate_blood_group(cleaned))
    return ", ".join(dict.fromkeys(groups))


def _validate_email(value: str) -> str:
    try:
        return str(TypeAdapter(EmailStr).validate_python(value)).lower()
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Official email must be valid") from exc


async def _store_institution_proof(file: UploadFile) -> str:
    extension = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else ""
    if extension not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Proof document must be a PDF, JPG, JPEG, or PNG file")

    content = await file.read()
    max_size_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(content) > max_size_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Proof document exceeds size limit")

    proof_dir = os.path.join(settings.upload_dir, "institution_proofs")
    os.makedirs(proof_dir, exist_ok=True)
    filename = f"institution_proofs/{uuid.uuid4().hex}.{extension}"
    with open(os.path.join(settings.upload_dir, filename), "wb") as upload_file:
        upload_file.write(content)
    return filename


async def _apply_profile_form(
    institution: Institution,
    *,
    institution_name: str,
    institution_type: str,
    city: str,
    area: str,
    address: str,
    contact_person: str,
    contact_person_designation: str,
    email: str,
    phone: str,
    website_social_link: str | None,
    operating_hours: str | None,
    available_blood_groups: str | None,
    notes: str | None,
    proof_document: UploadFile | None,
) -> bool:
    institution.institution_name = institution_name
    institution.institution_type = institution_type
    institution.city = city
    institution.area = area
    institution.address = address
    institution.contact_person = contact_person
    institution.contact_person_designation = contact_person_designation
    institution.email = _validate_email(email)
    institution.phone = validate_contact_number(phone)
    institution.website_social_link = website_social_link or None
    institution.operating_hours = operating_hours or None
    institution.available_blood_groups = _normalize_groups(available_blood_groups)
    institution.notes = notes or None
    if proof_document and proof_document.filename:
        institution.proof_document_url = await _store_institution_proof(proof_document)
        return True
    return False


@router.post("/me", response_model=InstitutionOut)
async def upsert_institution_profile(
    institution_name: str = Form(...),
    institution_type: str = Form(...),
    city: str = Form(...),
    area: str = Form(...),
    address: str = Form(...),
    contact_person: str = Form(...),
    contact_person_designation: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    website_social_link: str | None = Form(default=None),
    operating_hours: str | None = Form(default=None),
    available_blood_groups: str | None = Form(default=None),
    notes: str | None = Form(default=None),
    proof_document: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INSTITUTION_DONOR)),
) -> InstitutionOut:
    institution = _get_institution_for_user(db, current_user.id)
    if institution.status != InstitutionStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only approved institutions can update their public institution profile.",
        )
    proof_reuploaded = await _apply_profile_form(
        institution,
        institution_name=institution_name,
        institution_type=institution_type,
        city=city,
        area=area,
        address=address,
        contact_person=contact_person,
        contact_person_designation=contact_person_designation,
        email=email,
        phone=phone,
        website_social_link=website_social_link,
        operating_hours=operating_hours,
        available_blood_groups=available_blood_groups,
        notes=notes,
        proof_document=proof_document,
    )
    if proof_reuploaded:
        institution.status = InstitutionStatus.PENDING
        institution.approved_at = None
        institution.approved_by_user_id = None
        institution.status_changed_by_user_id = current_user.id
    db.commit()
    db.refresh(institution)
    return InstitutionOut.model_validate(institution)


@router.get("/me", response_model=InstitutionOut)
def get_institution_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INSTITUTION_DONOR)),
) -> InstitutionOut:
    institution = _get_institution_for_user(db, current_user.id)
    return InstitutionOut.model_validate(institution)


@router.post("/me/resubmit", response_model=InstitutionOut)
async def resubmit_institution_profile(
    institution_name: str = Form(...),
    institution_type: str = Form(...),
    city: str = Form(...),
    area: str = Form(...),
    address: str = Form(...),
    contact_person: str = Form(...),
    contact_person_designation: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    website_social_link: str | None = Form(default=None),
    operating_hours: str | None = Form(default=None),
    available_blood_groups: str | None = Form(default=None),
    notes: str | None = Form(default=None),
    proof_document: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INSTITUTION_DONOR)),
) -> InstitutionOut:
    institution = _get_institution_for_user(db, current_user.id)
    if institution.status != InstitutionStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only rejected institutions can resubmit verification details.",
        )
    await _apply_profile_form(
        institution,
        institution_name=institution_name,
        institution_type=institution_type,
        city=city,
        area=area,
        address=address,
        contact_person=contact_person,
        contact_person_designation=contact_person_designation,
        email=email,
        phone=phone,
        website_social_link=website_social_link,
        operating_hours=operating_hours,
        available_blood_groups=available_blood_groups,
        notes=notes,
        proof_document=proof_document,
    )
    institution.status = InstitutionStatus.PENDING
    institution.rejection_reason = None
    institution.status_changed_by_user_id = current_user.id
    db.commit()
    db.refresh(institution)
    return InstitutionOut.model_validate(institution)


@router.get("", response_model=list[InstitutionWithUserOut])
def list_institutions(
    city: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[InstitutionWithUserOut]:
    if current_user.role not in {UserRole.MEMBER, UserRole.ADMIN, UserRole.INSTITUTION_DONOR}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    if current_user.role == UserRole.INSTITUTION_DONOR:
        institution = _get_institution_for_user(db, current_user.id)
        if institution.status != InstitutionStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
            detail="Institution approval is required before using institution features.",
        )
    statement = select(Institution).options(joinedload(Institution.user)).order_by(Institution.institution_name.asc())
    if current_user.role != UserRole.ADMIN:
        statement = statement.where(Institution.status == InstitutionStatus.APPROVED)
    if city:
        statement = statement.where(Institution.city == city)
    institutions = list(db.scalars(statement).all())
    return [InstitutionWithUserOut.model_validate(item) for item in institutions]
