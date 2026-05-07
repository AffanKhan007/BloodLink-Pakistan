from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseSchema):
    message: str


class PagelessResponse(BaseSchema):
    pass


class AuditLogOut(BaseSchema):
    id: int
    admin_user_id: int | None
    action: str
    entity_type: str
    entity_id: int
    details: dict
    created_at: datetime

