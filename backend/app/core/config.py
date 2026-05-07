from functools import lru_cache
import json
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "BloodLink Pakistan API"
    database_url: str = "sqlite:///./bloodlink.db"
    secret_key: str = "change_this_secret"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    backend_cors_origins: List[str] = ["http://localhost:5173"]
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 5
    environment: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def split_cors_origins(cls, value: str | List[str]) -> List[str]:
        if isinstance(value, str):
            value = value.strip()
            if value.startswith("["):
                try:
                    parsed = json.loads(value)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except json.JSONDecodeError:
                    pass
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
