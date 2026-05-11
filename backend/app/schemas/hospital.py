from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models import UrgencyLevel
from app.schemas.blood_request import BloodRequestOut
from app.schemas.common import BaseSchema
from app.utils.validators import validate_blood_group, validate_phone_number, validate_required_by


class HospitalCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    city: str = Field(min_length=2, max_length=120)
    area: str | None = Field(default=None, max_length=120)
    address: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=32)
    verification_status: str = Field(default="pending", max_length=40)


class HospitalOut(BaseSchema):
    id: int
    name: str
    city: str
    area: str | None
    address: str | None
    phone: str | None
    verification_status: str
    created_at: datetime
    updated_at: datetime


class HospitalDashboardOut(BaseSchema):
    hospital: HospitalOut
    total_requests: int
    active_requests: int
    fulfilled_requests: int
    requests: list[BloodRequestOut]


class HospitalBloodRequestCreate(BaseModel):
    patient_name: str = Field(min_length=2, max_length=150)
    blood_group_needed: str
    units_required: int = Field(gt=0, le=10)
    ward_room: str = Field(min_length=1, max_length=120)
    urgency_level: UrgencyLevel
    attendant_name: str = Field(min_length=2, max_length=150)
    attendant_phone: str
    required_by: datetime

    @field_validator("blood_group_needed")
    @classmethod
    def validate_group(cls, value: str) -> str:
        return validate_blood_group(value)

    @field_validator("attendant_phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return validate_phone_number(value)

    @field_validator("required_by")
    @classmethod
    def validate_required_by_dt(cls, value: datetime) -> datetime:
        return validate_required_by(value)


class DonorArrivalConfirm(BaseModel):
    match_id: int
