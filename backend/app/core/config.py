from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    api_prefix: str = "/api"
    database_url: str = "sqlite:///./typeform.db"
    upload_dir: Path = Path("uploads")
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )
    cors_origin_regex: str = r"https://.*\.(vercel\.app|netlify\.app|onrender\.com|up\.railway\.app|railway\.app|rdrt\.dev)"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
