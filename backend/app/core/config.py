import json
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


def parse_cors_origins(value: str) -> list[str]:
    raw = (value or "").strip()
    if not raw:
        return list(_DEFAULT_ORIGINS)
    if raw.startswith("["):
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return [raw]
        if isinstance(parsed, list) and parsed:
            return [str(item).strip() for item in parsed if str(item).strip()]
        return list(_DEFAULT_ORIGINS)
    return [part.strip() for part in raw.split(",") if part.strip()] or list(_DEFAULT_ORIGINS)


class Settings(BaseSettings):
    api_prefix: str = "/api"
    database_url: str = "sqlite:///./typeform.db"
    upload_dir: Path = Path("uploads")
    cors_origins: str = Field(default="http://localhost:3000,http://127.0.0.1:3000")
    cors_origin_regex: str = r"https://.*\.(vercel\.app|netlify\.app|onrender\.com|up\.railway\.app|railway\.app|rdrt\.dev)"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return parse_cors_origins(self.cors_origins)


settings = Settings()
