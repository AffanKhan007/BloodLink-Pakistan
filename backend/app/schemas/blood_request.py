from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models import RequestStatus, UrgencyLevel
from app.schemas.common import BaseSchema
from app.utils.validators import validate_blood_group, validate_phone_number, validate_required_by


class BloodRequestCreate(BaseModel):
    patient_name: str = Field(min_length=2, max_length=150)
    blood_group_needed: str
    units_required: int = Field(gt=0, le=10)
    hospital_name: str = Field(min_length=2, max_length=200)
    city: str = Field(min_length=2, max_length=120)
    area: str = Field(min_length=2, max_length=120)
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


class BloodRequestStatusUpdate(BaseModel):
    status: RequestStatus


class BloodRequestOut(BaseSchema):
    id: int
    created_by_user_id: int
    hospital_id: int | None = None
    patient_name: str
    blood_group_needed: str
    units_required: int
    hospital_name: str
    city: str
    area: str
    ward_room: str
    urgency_level: UrgencyLevel
    attendant_name: str
    attendant_phone: str
    required_by: datetime
    status: RequestStatus
    created_at: datetime
    updated_at: datetime


class BloodRequestListOut(BloodRequestOut):
    confirmed_donor_count: int = 0


class RequestDocumentOut(BaseSchema):
    id: int
    request_id: int
    document_type: str
    file_url: str
    uploaded_at: datetime


class BloodRequestDetailOut(BloodRequestListOut):
    documents: list[RequestDocumentOut] = []
