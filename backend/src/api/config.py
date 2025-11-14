"""
Application configuration and settings.
"""

from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env file manually (not directly in pydantic-settings)
# This gives more control and works better with different environments
# Path: backend/src/api/config.py -> backend/.env
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=False)


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

    # OpenRouter Configuration (Primary LLM Provider)
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_REFERRER_URL: str = "http://localhost:3000"
    OPENROUTER_MODEL_GPT4: str = "openai/gpt-4-turbo"
    OPENROUTER_MODEL_CLAUDE: str = "anthropic/claude-3.5-sonnet"
    OPENROUTER_MODEL_EMBEDDING: str = "openai/text-embedding-3-large"

    # OpenAI Configuration (Fallback)
    OPENAI_API_KEY: str = ""
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-large"
    OPENAI_LLM_MODEL: str = "gpt-4-turbo-preview"

    # Anthropic Configuration (Fallback)
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_LLM_MODEL: str = "claude-3-5-sonnet-20241022"

    # Language Detection
    FASTTEXT_MODEL_PATH: str = ""  # Optional: path to FastText model file

    # Validation Thresholds
    SEMANTIC_SIMILARITY_THRESHOLD: float = 0.92
    STYLE_SIMILARITY_THRESHOLD: float = 0.90

    # Text Chunking Configuration
    MAX_CHUNK_TOKENS: int = 1000
    MIN_CHUNK_TOKENS: int = 500

    model_config = {
        "case_sensitive": True,
        # Removed "env_file" - we load .env manually above
        # This way pydantic reads from environment variables (loaded by dotenv)
    }


settings = Settings()
