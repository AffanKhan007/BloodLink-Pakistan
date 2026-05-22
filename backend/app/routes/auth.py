from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models import Institution, InstitutionStatus, ReceiverProfile, User, UserRole
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserOut
from app.schemas.institution import InstitutionRegisterRequest


router = APIRouter(prefix="/auth", tags=["auth"])


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
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    db.flush()
    if user.role == UserRole.RECEIVER:
        db.add(ReceiverProfile(user_id=user.id))
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return AuthResponse(access_token=token, token_type="bearer", user=UserOut.model_validate(user))


@router.post("/register/institution", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_institution(payload: InstitutionRegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    existing_user = db.scalar(select(User).where((User.email == payload.email) | (User.phone == payload.phone)))
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or phone already registered")

    user = User(
        full_name=payload.institution_name,
        email=payload.email.lower(),
        phone=payload.phone,
        password_hash=get_password_hash(payload.password),
        role=UserRole.INSTITUTION_DONOR,
        is_active=True,
    )
    db.add(user)
    db.flush()
    db.add(
        Institution(
            user_id=user.id,
            institution_name=payload.institution_name,
            institution_type=payload.institution_type,
            city=payload.city,
            area=payload.area,
            contact_person=payload.contact_person,
            contact_person_designation=payload.contact_person_designation,
            email=payload.email.lower(),
            phone=payload.phone,
            address=payload.address,
            website_social_link=payload.website_social_link,
            proof_document_url=payload.proof_document_url,
            status=InstitutionStatus.PENDING_APPROVAL,
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
