from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import City
from app.schemas.city import CityOut


router = APIRouter(prefix="/cities", tags=["cities"])


@router.get("", response_model=list[CityOut])
def list_cities(db: Session = Depends(get_db)) -> list[CityOut]:
    cities = list(db.scalars(select(City).where(City.is_active.is_(True)).order_by(City.sort_order.asc(), City.name.asc())).all())
    return [CityOut.model_validate(city) for city in cities]
