from datetime import datetime

from app.schemas.common import BaseSchema


class NotificationOut(BaseSchema):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

