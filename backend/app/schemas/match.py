from datetime import datetime

from pydantic import BaseModel

from app.models import MatchStatus
from app.schemas.common import BaseSchema
from app.schemas.donor import DonorWithUserOut


class MatchCreate(BaseModel):
    request_id: int
    donor_id: int


class MatchOut(BaseSchema):
    id: int
    request_id: int
    donor_id: int
    status: MatchStatus
    accepted_at: datetime | None
    rejected_at: datetime | None
    completed_at: datetime | None
    created_at: datetime


class MatchDetailOut(MatchOut):
    donor: DonorWithUserOut
    donor_phone: str | None = None

