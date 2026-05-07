from datetime import datetime

from pydantic import EmailStr

from app.models import UserRole
from app.schemas.common import BaseSchema


class UserSummary(BaseSchema):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AdminUserSummary(UserSummary):
    phone: str
