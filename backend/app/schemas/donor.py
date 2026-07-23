from datetime import date, datetime, timedelta

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models import DonorVerificationStatus
from app.schemas.common import BaseSchema
from app.schemas.user import UserSummary
from app.utils.validators import validate_blood_group, validate_last_donation_date


class DonorProfileCreate(BaseModel):
    blood_group: str
    city: str = Field(min_length=2, max_length=120)
    area: str = Field(min_length=2, max_length=120)
    age: int = Field(ge=18, le=65)
    gender: str = Field(min_length=1, max_length=30)
    last_donation_date: date | None = None
    availability_status: str = Field(pattern="^(available|unavailable)$")
    is_publicly_available: bool = False
    health_notes: str | None = Field(default=None, max_length=1000)
    latitude: float | None = None
    longitude: float | None = None
    location_opt_in: bool = False

    @field_validator("blood_group")
    @classmethod
    def validate_group(cls, value: str) -> str:
        return validate_blood_group(value)

    @field_validator("last_donation_date")
    @classmethod
    def validate_last_donation(cls, value: date | None) -> date | None:
        return validate_last_donation_date(value)


class DonorAvailabilityUpdate(BaseModel):
    availability_status: str = Field(pattern="^(available|unavailable)$")
    is_publicly_available: bool | None = None


class DonorProfileOut(BaseSchema):
    id: int
    user_id: int
    blood_group: str
    city: str
    area: str
    age: int
    gender: str
    last_donation_date: date | None
    availability_status: str
    is_publicly_available: bool
    verification_status: DonorVerificationStatus
    health_notes: str | None
    latitude: float | None = None
    longitude: float | None = None
    location_opt_in: bool = False
    blood_group_verified: bool = False
    matches_accepted: int = 0
    matches_completed: int = 0
    matches_no_show: int = 0
    next_eligible_date: date | None = None
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="after")
    def compute_next_eligible(self) -> "DonorProfileOut":
        if self.last_donation_date:
            self.next_eligible_date = self.last_donation_date + timedelta(days=90)
        else:
            self.next_eligible_date = None
        return self


class DonorWithUserOut(DonorProfileOut):
    user: UserSummary


class DonorVerificationUpdate(BaseModel):
    verification_status: DonorVerificationStatus
