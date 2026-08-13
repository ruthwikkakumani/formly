import json
from pathlib import Path

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


def unquote(value: str) -> str:
    raw = (value or "").strip()
    if len(raw) >= 2 and raw[0] == raw[-1] and raw[0] in {'"', "'"}:
        return raw[1:-1].strip()
    return raw


def parse_cors_origins(value: str) -> list[str]:
    raw = unquote(value or "")
    if not raw:
        return list(_DEFAULT_ORIGINS)
    if raw.startswith("["):
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return [raw]
        if isinstance(parsed, list) and parsed:
            return [unquote(str(item)) for item in parsed if str(item).strip()]
        return list(_DEFAULT_ORIGINS)
    return [unquote(part) for part in raw.split(",") if part.strip()] or list(_DEFAULT_ORIGINS)


class Settings(BaseSettings):
    api_prefix: str = "/api"
    database_url: str = "sqlite:///./typeform.db"
    upload_dir: Path = Path("uploads")
    cors_origins: str = Field(default="http://localhost:3000,http://127.0.0.1:3000")
    cors_origin_regex: str = r"https://.*\.(vercel\.app|netlify\.app|onrender\.com|up\.railway\.app|railway\.app|rdrt\.dev)"
    frontend_url: str = "http://localhost:3000"
    auth_secret: str = "formly-change-me"
    resend_api_key: str = ""
    invite_from_email: str = "Formly <onboarding@resend.dev>"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    # Assignment reviewer: created on startup if missing. Not the workspace owner.
    reviewer_email: str = "reviewer@formly.dev"
    reviewer_password: str = "FormlyReview1"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator(
        "database_url",
        "frontend_url",
        "cors_origins",
        "smtp_host",
        "smtp_user",
        "smtp_password",
        "smtp_from",
        "auth_secret",
        "resend_api_key",
        "invite_from_email",
        "reviewer_email",
        "reviewer_password",
        mode="before",
    )
    @classmethod
    def strip_env_quotes(cls, value: object) -> object:
        return unquote(value) if isinstance(value, str) else value

    @field_validator("smtp_port", mode="before")
    @classmethod
    def unquote_smtp_port(cls, value: object) -> object:
        if isinstance(value, str):
            cleaned = unquote(value)
            if cleaned.isdigit():
                return int(cleaned)
            return 587
        return value or 587

    @field_validator("smtp_password", mode="after")
    @classmethod
    def strip_smtp_password_spaces(cls, value: str) -> str:
        return "".join((value or "").split())

    @model_validator(mode="after")
    def default_smtp_from(self):
        if not self.smtp_from.strip():
            self.smtp_from = self.smtp_user
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return parse_cors_origins(self.cors_origins)

    @property
    def is_local_dev(self) -> bool:
        host = (self.frontend_url or "").lower()
        return "localhost" in host or "127.0.0.1" in host


settings = Settings()
