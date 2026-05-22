from datetime import datetime

from app.schemas.common import BaseSchema


class DashboardStats(BaseSchema):
    total_users: int
    total_donors: int
    approved_donors: int
    pending_institutions: int
    pending_requests: int
    approved_requests: int
    active_matches: int
    pending_reports: int
    last_updated: datetime


class RequestApprovalResponse(BaseSchema):
    id: int
    status: str
