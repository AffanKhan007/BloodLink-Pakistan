from datetime import datetime

from pydantic import BaseModel, Field

from app.models import ReportStatus
from app.schemas.common import BaseSchema


class ReportCreate(BaseModel):
    reported_user_id: int
    request_id: int
    reason: str = Field(min_length=10, max_length=1000)


class ReportStatusUpdate(BaseModel):
    status: ReportStatus


class ReportOut(BaseSchema):
    id: int
    reporter_user_id: int
    reported_user_id: int
    request_id: int
    reason: str
    status: ReportStatus
    created_at: datetime

