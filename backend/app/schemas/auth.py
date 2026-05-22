from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models import UserRole
from app.schemas.common import BaseSchema
from app.utils.validators import validate_phone_number


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone: str
    password: str = Field(min_length=8, max_length=128)
    role: UserRole

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return validate_phone_number(value)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(ch.isdigit() for ch in value) or not any(ch.isalpha() for ch in value):
            raise ValueError("Password must contain letters and numbers")
        return value

    @field_validator("role")
    @classmethod
    def disallow_public_admin(cls, value: UserRole) -> UserRole:
        if value not in {UserRole.DONOR, UserRole.RECEIVER, UserRole.INSTITUTION_DONOR}:
            raise ValueError("Only donor, receiver, and institution donor accounts can be self-registered")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseSchema):
    id: int
    full_name: str
    email: EmailStr
    phone: str
    role: UserRole
    hospital_id: int | None = None
    blood_bank_id: int | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AuthResponse(BaseSchema):
    access_token: str
    token_type: str
    user: UserOut
