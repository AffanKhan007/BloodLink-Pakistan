from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema


class ReceiverProfileCreate(BaseModel):
    city: str | None = Field(default=None, min_length=2, max_length=120)
    area: str | None = Field(default=None, min_length=2, max_length=120)
    notes: str | None = Field(default=None, max_length=1000)


class ReceiverProfileOut(BaseSchema):
    id: int
    user_id: int
    city: str | None
    area: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
