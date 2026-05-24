from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./fairsplit.db"
    jwt_secret_key: str = "replace-with-a-long-random-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    frontend_origin: str = "http://localhost:5173"

    openai_api_key: str | None = None
    openai_base_url: str | None = None
    openai_model: str = "gpt-4o-mini"
    assistant_model: str | None = None
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"

    sentry_dsn: str | None = None

    google_client_id: str | None = None
    google_client_secret: str | None = None

    github_client_id: str | None = None
    github_client_secret: str | None = None

    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    mail_from: str | None = None
    mail_from_name: str = "FairSplit AI"

    admin_email: str = "admin@fairsplit.ai"
    admin_password: str = "Admin@12345"
    admin_name: str = "FairSplit Admin"

    demo_user_email: str = "student@fairsplit.ai"
    demo_user_password: str = "Student@123"
    demo_user_name: str = "Demo Student"

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
