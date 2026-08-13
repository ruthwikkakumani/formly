from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    api_prefix: str = "/api"
    database_url: str = "sqlite:///./typeform.db"
    upload_dir: Path = Path("uploads")
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
