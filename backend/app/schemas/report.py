from datetime import datetime

from pydantic import BaseModel, Field

from app.models.report import ReportReason, ReportStatus, ReportedType
from app.schemas.chat import ChatMessageOut
from app.schemas.common import BaseSchema
from app.schemas.user import ChatUserSummary


class AdminConversationPreview(BaseSchema):
    id: int
    request_id: int | None
    subject: str | None
    participant_one: ChatUserSummary
    participant_two: ChatUserSummary
    messages: list[ChatMessageOut]


class ReportCreateResponse(BaseSchema):
    id: int
    message: str = "Report submitted"


class ReportListOut(BaseSchema):
    id: int
    reporter_id: int
    reporter_name: str
    reported_type: ReportedType
    reported_id: int
    reason: ReportReason
    description: str | None
    status: ReportStatus
    created_at: datetime
    entity_label: str
    entity_admin_path: str | None = None


class RelatedReportOut(BaseSchema):
    id: int
    reporter_name: str
    reason: ReportReason
    status: ReportStatus
    description: str | None
    created_at: datetime


class ReportedEntityOut(BaseSchema):
    reported_type: ReportedType
    reported_id: int
    label: str
    summary: str | None = None
    admin_path: str | None = None
    request_id: int | None = None
    conversation: AdminConversationPreview | None = None


class ReportDetailOut(ReportListOut):
    evidence_file: str | None
    admin_notes: str | None
    updated_at: datetime
    reported_entity: ReportedEntityOut
    related_reports: list[RelatedReportOut]


class ReportUpdate(BaseModel):
    status: ReportStatus | None = None
    admin_notes: str | None = Field(default=None, max_length=5000)
