from datetime import datetime

from app.schemas.common import BaseSchema


class CityOut(BaseSchema):
    id: int
    name: str
    province: str
    is_active: bool
    sort_order: int
    created_at: datetime
