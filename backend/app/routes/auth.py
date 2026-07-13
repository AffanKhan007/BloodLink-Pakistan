import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models import Institution, InstitutionStatus, User, UserRole
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserOut
from app.utils.validators import ALLOWED_UPLOAD_EXTENSIONS, validate_contact_number


router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _validate_password(value: str) -> None:
    if len(value) < 8 or not any(ch.isdigit() for ch in value) or not any(ch.isalpha() for ch in value):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password must contain letters and numbers")


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


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    existing_user = db.scalar(select(User).where((User.email == payload.email) | (User.phone == payload.phone)))
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or phone already registered")

    user = User(
        full_name=payload.full_name,
        email=payload.email.lower(),
        phone=payload.phone,
        password_hash=get_password_hash(payload.password),
        role=UserRole.USER,
        is_active=True,
    )
    db.add(user)
    db.flush()
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return AuthResponse(access_token=token, token_type="bearer", user=UserOut.model_validate(user))


@router.post("/register/institution", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register_institution(
    institution_name: str = Form(...),
    institution_type: str = Form(...),
    city: str = Form(...),
    area: str = Form(...),
    address: str = Form(...),
    contact_person: str = Form(...),
    contact_person_designation: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    confirm_authorized: bool = Form(...),
    website_social_link: str | None = Form(default=None),
    proof_document: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> AuthResponse:
    if not confirm_authorized:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Authorization confirmation is required")
    _validate_password(password)
    phone = validate_contact_number(phone)
    email = _validate_email(email)
    existing_user = db.scalar(select(User).where((User.email == email) | (User.phone == phone)))
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or phone already registered")
    proof_document_url = await _store_institution_proof(proof_document)

    user = User(
        full_name=institution_name,
        email=email,
        phone=phone,
        password_hash=get_password_hash(password),
        role=UserRole.INSTITUTION_DONOR,
        is_active=True,
    )
    db.add(user)
    db.flush()
    db.add(
        Institution(
            user_id=user.id,
            institution_name=institution_name,
            institution_type=institution_type,
            city=city,
            area=area,
            contact_person=contact_person,
            contact_person_designation=contact_person_designation,
            email=email,
            phone=phone,
            address=address,
            website_social_link=website_social_link or None,
            proof_document_url=proof_document_url,
            status=InstitutionStatus.PENDING,
        )
    )
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return AuthResponse(access_token=token, token_type="bearer", user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    identifier = (payload.email.lower() if payload.email else payload.identifier or "").strip()
    user = db.scalar(select(User).where((User.email == identifier.lower()) | (User.phone == identifier)))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is blocked")

    token = create_access_token(str(user.id))
    return AuthResponse(access_token=token, token_type="bearer", user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)
