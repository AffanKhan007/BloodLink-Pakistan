from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ErrorDetail(BaseSchema):
    code: str
    message: str


class ErrorResponse(BaseSchema):
    error: ErrorDetail


class MessageResponse(BaseSchema):
    message: str


class ConfirmDonorArrivalOut(BaseSchema):
    message: str
    match_id: int


class GovtVerifiedOut(BaseSchema):
    govt_verified: bool


class PaginatedResponse(BaseSchema, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int


class AuditLogOut(BaseSchema):
    id: int
    admin_user_id: int | None
    action: str
    entity_type: str
    entity_id: int
    details: dict
    created_at: datetime

