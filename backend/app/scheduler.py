import time
from datetime import datetime, timezone

from sqlalchemy import select, update

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.models import BloodUnit, BloodUnitStatus


EXPIRY_CHECK_INTERVAL_SECONDS = 300


def expire_blood_units() -> int:
    """Flip status to 'expired' for all available/collected units past their expires_at."""
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        result = db.execute(
            update(BloodUnit)
            .where(
                BloodUnit.expires_at <= now,
                BloodUnit.status.in_([
                    BloodUnitStatus.COLLECTED,
                    BloodUnitStatus.TESTING_PENDING,
                    BloodUnitStatus.CLEARED,
                    BloodUnitStatus.AVAILABLE,
                ]),
            )
            .values(status=BloodUnitStatus.EXPIRED)
        )
        db.commit()
        count = result.rowcount
        if count:
            print(f"Scheduler: expired {count} blood unit(s)")
        return count
    finally:
        db.close()


def run() -> None:
    settings = get_settings()
    print(f"BloodLink scheduler started with Redis: {settings.redis_url}")
    while True:
        try:
            expire_blood_units()
        except Exception as exc:
            print(f"Scheduler error in expire_blood_units: {exc}")
        time.sleep(EXPIRY_CHECK_INTERVAL_SECONDS)


def main() -> None:
    run()


if __name__ == "__main__":
    main()
