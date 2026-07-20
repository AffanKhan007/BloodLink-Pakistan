from datetime import date, datetime, time

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models import BloodUnitStatus, TestingStatus
from app.schemas.common import BaseSchema
from app.utils.validators import validate_blood_group, validate_phone_number


class BloodBankCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    hospital_id: int | None = None
    city: str = Field(min_length=2, max_length=120)
    area: str | None = Field(default=None, max_length=120)
    contact_number: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=255)
    address: str | None = Field(default=None, max_length=500)
    license_number: str | None = Field(default=None, max_length=120)
    verification_status: str = Field(default="pending", max_length=40)


class BloodBankOut(BaseSchema):
    id: int
    name: str
    hospital_id: int | None
    city: str
    area: str | None
    contact_number: str | None
    email: str | None
    address: str | None
    license_number: str | None
    verification_status: str
    created_at: datetime
    updated_at: datetime
    contact_person_name: str | None = None
    contact_person_cnic: str | None = None
    operating_hours: str | None = None
    description: str | None = None
    logo_url: str | None = None
    public_stock_visible: bool = True
    accepts_walkins: bool = True
    verified_at: datetime | None = None
    last_verified_by_admin_id: int | None = None


class BloodUnitCreate(BaseModel):
    donor_profile_id: int | None = None
    blood_group: str
    units_available: int = Field(default=1, ge=1, le=100)
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
    units_available: int
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


class BloodBankCityInventoryItem(BaseSchema):
    blood_group: str
    total_units: int


class BloodBankDiscoveryOut(BloodBankOut):
    available_inventory: list[BloodBankCityInventoryItem]
    contact_user_id: int | None = None


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


class BloodBankRegistration(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    license_number: str = Field(min_length=2, max_length=120)
    contact_person_name: str = Field(min_length=2, max_length=255)
    contact_person_cnic: str = Field(min_length=13, max_length=15)
    contact_number: str = Field(min_length=11, max_length=20)
    email: EmailStr
    city: str = Field(min_length=2, max_length=120)
    area: str | None = Field(default=None, max_length=120)
    address: str | None = Field(default=None, max_length=500)
    latitude: float | None = None
    longitude: float | None = None
    hospital_id: int | None = None
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)
    operating_hours: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=1000)

    @field_validator("contact_number")
    @classmethod
    def validate_contact(cls, value: str) -> str:
        return validate_phone_number(value)

    @field_validator("confirm_password")
    @classmethod
    def validate_passwords_match(cls, value: str, info) -> str:
        password = info.data.get("password")
        if password and value != password:
            raise ValueError("Passwords do not match")
        return value


class BloodBankRegistrationOut(BaseSchema):
    id: int
    name: str
    verification_status: str
    created_at: datetime


class BloodBankProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    operating_hours: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    logo_url: str | None = Field(default=None, max_length=500)
    public_stock_visible: bool | None = None
    accepts_walkins: bool | None = None
    contact_number: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    address: str | None = Field(default=None, max_length=500)
    city: str | None = Field(default=None, min_length=2, max_length=120)
    area: str | None = Field(default=None, max_length=120)
    latitude: float | None = None
    longitude: float | None = None


class BloodBankAdminOut(BloodBankOut):
    verified_at: datetime | None = None
    last_verified_by_admin_id: int | None = None
    contact_person_name: str | None = None
    contact_person_cnic: str | None = None
    operating_hours: str | None = None
    description: str | None = None
    logo_url: str | None = None
    public_stock_visible: bool = True
    accepts_walkins: bool = True


class BloodBankAdminStatusUpdate(BaseModel):
    status: str = Field(pattern=r"^(approved|rejected|suspended)$")
    rejection_reason: str | None = Field(default=None, max_length=1000)


class BloodBankFulfillRequest(BaseModel):
    hospital_id: int | None = None
    notes: str | None = Field(default=None, max_length=500)


class BulkStockUpdateItem(BaseModel):
    blood_group: str
    units_available: int = Field(ge=0)

    @field_validator("blood_group")
    @classmethod
    def validate_group(cls, value: str) -> str:
        return validate_blood_group(value)


class BulkStockUpdate(BaseModel):
    units: list[BulkStockUpdateItem]


class DriveCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    event_date: date
    start_time: time
    end_time: time
    location_address: str | None = Field(default=None, max_length=500)
    city: str = Field(min_length=2, max_length=120)
    target_blood_groups: str | None = Field(default=None, max_length=255)
    expected_capacity: int | None = Field(default=None, gt=0)

    @field_validator("end_time")
    @classmethod
    def validate_end_after_start(cls, value: time, info) -> time:
        start_time = info.data.get("start_time")
        if start_time and value <= start_time:
            raise ValueError("End time must be after start time")
        return value


class DriveOut(BaseSchema):
    id: int
    blood_bank_id: int
    title: str
    description: str | None
    event_date: date
    start_time: time
    end_time: time
    location_address: str | None
    city: str
    target_blood_groups: str | None
    expected_capacity: int | None
    status: str
    created_at: datetime
    updated_at: datetime


class DriveStatusUpdate(BaseModel):
    status: str = Field(pattern=r"^(upcoming|active|completed|cancelled)$")


class DriveRegistrationOut(BaseSchema):
    id: int
    drive_id: int
    donor_id: int
    status: str
    registered_at: datetime
    donor_name: str | None = None


class SlotCreate(BaseModel):
    slot_date: date
    start_time: time
    end_time: time
    max_donors: int = Field(default=5, gt=0)

    @field_validator("end_time")
    @classmethod
    def validate_end_after_start(cls, value: time, info) -> time:
        start_time = info.data.get("start_time")
        if start_time and value <= start_time:
            raise ValueError("End time must be after start time")
        return value


class SlotOut(BaseSchema):
    id: int
    blood_bank_id: int
    slot_date: date
    start_time: time
    end_time: time
    max_donors: int
    booked_count: int
    status: str
    created_at: datetime


class BookingCreate(BaseModel):
    slot_id: int


class BookingOut(BaseSchema):
    id: int
    slot_id: int
    donor_id: int
    status: str
    booked_at: datetime


class BookingStatusUpdate(BaseModel):
    status: str = Field(pattern=r"^(booked|checked_in|completed|cancelled|no_show)$")


class BloodBankAnalyticsOut(BaseModel):
    total_donations: int
    donations_by_group: dict
    donations_by_month: list
    fulfillment_rate: float
    total_fulfilled: int
    total_requests: int
    expiry_rate: float
    total_expired: int
    total_units: int
