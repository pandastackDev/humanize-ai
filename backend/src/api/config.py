"""
Application configuration and settings.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # Project Info
    PROJECT_NAME: str = "Humanize API"
    PROJECT_DESCRIPTION: str = "FastAPI backend for humanize app"
    VERSION: str = "1.0.0"

    # API Configuration
    API_V1_STR: str = "/api/v1"

    # CORS Settings (if needed)
    ALLOWED_ORIGINS: list[str] = ["*"]

    # Environment
    ENVIRONMENT: str = "development"

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
    }


settings = Settings()
