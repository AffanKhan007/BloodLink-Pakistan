from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema


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
