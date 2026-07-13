from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema
from app.schemas.user import ChatUserSummary


class ChatCreate(BaseModel):
    target_user_id: int
    request_id: int | None = None
    subject: str | None = Field(default=None, max_length=255)
    initial_message: str | None = Field(default=None, min_length=1, max_length=2000)


class ChatMessageCreate(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ChatMessageOut(BaseSchema):
    id: int
    chat_id: int
    sender_id: int
    message: str
    created_at: datetime


class ChatSummaryOut(BaseSchema):
    id: int
    request_id: int | None
    subject: str | None
    counterpart: ChatUserSummary
    last_message: str | None = None
    last_message_at: datetime | None = None
    unread_count: int = 0
    created_at: datetime
    updated_at: datetime


class ChatDetailOut(BaseSchema):
    id: int
    request_id: int | None
    subject: str | None
    counterpart: ChatUserSummary
    messages: list[ChatMessageOut]
    created_at: datetime
    updated_at: datetime
