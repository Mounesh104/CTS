"""
app/core/config.py
------------------
Application settings loaded from environment variables / .env file.
Uses pydantic-settings for type-safe config with validation.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # SQLite database file path
    database_url: str = "./paprs.db"

    # CORS — comma-separated origins in env, parsed to list
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Debug flag
    debug: bool = True

    @property
    def cors_origins_list(self) -> List[str]:
        """Return CORS origins as a list of stripped strings."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


# Singleton instance imported by the rest of the app
settings = Settings()
