from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models import InstitutionStatus
from app.schemas.common import BaseSchema
from app.schemas.user import ChatUserSummary
from app.utils.validators import validate_blood_group, validate_contact_number


def _normalize_groups(raw: str | None) -> str | None:
    if raw is None or raw.strip() == "":
        return None
    groups: list[str] = []
    for part in raw.split(","):
        cleaned = part.strip()
        if cleaned:
            groups.append(validate_blood_group(cleaned))
    return ", ".join(dict.fromkeys(groups))


class InstitutionProfileCreate(BaseModel):
    institution_name: str = Field(min_length=2, max_length=255)
    institution_type: str = Field(min_length=2, max_length=120)
    city: str = Field(min_length=2, max_length=120)
    area: str | None = Field(default=None, max_length=120)
    contact_person: str = Field(min_length=2, max_length=150)
    contact_person_designation: str | None = Field(default=None, max_length=120)
    email: EmailStr
    phone: str
    address: str = Field(min_length=5, max_length=500)
    website_social_link: str | None = Field(default=None, max_length=255)
    proof_document_url: str | None = Field(default=None, max_length=255)
    available_blood_groups: str | None = Field(default=None, max_length=255)
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return validate_contact_number(value)

    @field_validator("available_blood_groups")
    @classmethod
    def validate_groups(cls, value: str | None) -> str | None:
        return _normalize_groups(value)


class InstitutionOut(BaseSchema):
    id: int
    user_id: int
    institution_name: str
    institution_type: str
    city: str
    area: str | None
    contact_person: str
    contact_person_designation: str | None
    email: EmailStr
    phone: str
    address: str
    website_social_link: str | None
    proof_document_url: str | None
    status: InstitutionStatus
    rejection_reason: str | None
    available_blood_groups: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class InstitutionWithUserOut(InstitutionOut):
    user: ChatUserSummary


class InstitutionRegisterRequest(BaseModel):
    institution_name: str = Field(min_length=2, max_length=255)
    institution_type: str = Field(min_length=2, max_length=120)
    city: str = Field(min_length=2, max_length=120)
    area: str | None = Field(default=None, max_length=120)
    address: str = Field(min_length=5, max_length=500)
    contact_person: str = Field(min_length=2, max_length=150)
    contact_person_designation: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str
    password: str = Field(min_length=8, max_length=128)
    website_social_link: str | None = Field(default=None, max_length=255)
    proof_document_url: str | None = Field(default=None, max_length=255)

    @field_validator("phone")
    @classmethod
    def validate_registration_phone(cls, value: str) -> str:
        return validate_contact_number(value)

    @field_validator("password")
    @classmethod
    def validate_registration_password(cls, value: str) -> str:
        if not any(ch.isdigit() for ch in value) or not any(ch.isalpha() for ch in value):
            raise ValueError("Password must contain letters and numbers")
        return value


class InstitutionStatusUpdate(BaseModel):
    status: InstitutionStatus
    rejection_reason: str | None = Field(default=None, max_length=1000)
