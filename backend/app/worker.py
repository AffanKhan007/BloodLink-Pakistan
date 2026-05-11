import time

from app.core.config import get_settings


def main() -> None:
    settings = get_settings()
    print(f"BloodLink worker started with Redis: {settings.redis_url}")
    while True:
        time.sleep(60)


if __name__ == "__main__":
    main()

