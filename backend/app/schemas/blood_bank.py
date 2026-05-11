from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models import BloodUnitStatus, TestingStatus
from app.schemas.common import BaseSchema
from app.utils.validators import validate_blood_group


class BloodBankCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    hospital_id: int | None = None
    city: str = Field(min_length=2, max_length=120)
    area: str | None = Field(default=None, max_length=120)
    address: str | None = Field(default=None, max_length=500)
    license_number: str | None = Field(default=None, max_length=120)
    verification_status: str = Field(default="pending", max_length=40)


class BloodBankOut(BaseSchema):
    id: int
    name: str
    hospital_id: int | None
    city: str
    area: str | None
    address: str | None
    license_number: str | None
    verification_status: str
    created_at: datetime
    updated_at: datetime


class BloodUnitCreate(BaseModel):
    donor_profile_id: int | None = None
    blood_group: str
    component_type: str = Field(default="whole_blood", min_length=2, max_length=60)
    collected_at: datetime
    expires_at: datetime
    testing_status: TestingStatus = TestingStatus.PENDING
    status: BloodUnitStatus = BloodUnitStatus.COLLECTED
    storage_location: str | None = Field(default=None, max_length=255)

    @field_validator("blood_group")
    @classmethod
    def validate_group(cls, value: str) -> str:
        return validate_blood_group(value)

    @field_validator("expires_at")
    @classmethod
    def validate_expiry(cls, value: datetime, info) -> datetime:
        collected_at = info.data.get("collected_at")
        if collected_at and value <= collected_at:
            raise ValueError("Expiry must be after collected time")
        return value


class BloodUnitOut(BaseSchema):
    id: int
    unit_code: str
    qr_code_value: str
    donor_profile_id: int | None
    blood_bank_id: int
    blood_group: str
    component_type: str
    collected_at: datetime
    expires_at: datetime
    testing_status: TestingStatus
    status: BloodUnitStatus
    storage_location: str | None
    created_at: datetime
    updated_at: datetime


class InventorySummaryOut(BaseSchema):
    blood_bank: BloodBankOut
    total_units: int
    available_units: int
    reserved_units: int
    expiring_soon_units: int
    units: list[BloodUnitOut]


class BloodUnitStatusUpdate(BaseModel):
    status: BloodUnitStatus
    testing_status: TestingStatus | None = None


class BloodUnitIssue(BaseModel):
    hospital_id: int
    notes: str | None = None


class BloodUnitTransfer(BaseModel):
    to_blood_bank_id: int
    notes: str | None = None


class InventoryMovementOut(BaseSchema):
    id: int
    blood_unit_id: int
    from_blood_bank_id: int | None
    to_blood_bank_id: int | None
    issued_to_hospital_id: int | None
    movement_type: str
    movement_time: datetime
    performed_by: int | None
    notes: str | None
