"""Application configuration using Pydantic Settings."""

import uuid
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DEFAULT_OWNER_ID: uuid.UUID = uuid.UUID("00000000-0000-0000-0000-000000000001")
    GEMINI_API_KEY: str = ""
    """Application settings loaded from environment or .env files."""

    DATABASE_URL: str = "sqlite:///./pcc.db"
    CORS_ORIGINS: str = "http://localhost:5173,https://pcc-backend-ten.vercel.app,capacitor://localhost,https://localhost,http://tauri.localhost,https://tauri.localhost,tauri://localhost,http://localhost"
    WEATHER_API_KEY: str = "29b21b5a2f9aca2282088c7c61c30ea2"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS comma-separated string to a list of origins."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
