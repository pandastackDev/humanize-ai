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

    # OpenAI Configuration
    OPENAI_API_KEY: str = ""
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-large"
    OPENAI_LLM_MODEL: str = "gpt-4-turbo"  # Direct API uses model name without prefix

    # Anthropic Configuration
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_LLM_MODEL: str = "claude-3-5-sonnet-20241022"  # Direct API - latest version

    # Language Detection
    # Path can be absolute or relative to project root
    FASTTEXT_MODEL_PATH: str = "models/lid.176.bin"

    # Cloud Language Detection API (optional - for languages outside Lingua's support or high scalability)
    # Google Cloud Translation API
    GOOGLE_CLOUD_TRANSLATE_API_KEY: str = ""
    USE_CLOUD_LANGUAGE_DETECTION: bool = False  # Enable cloud API as fallback

    # Language Detection Benchmarking
    ENABLE_LANGUAGE_DETECTION_METRICS: bool = True  # Track accuracy and latency metrics

    # Validation Thresholds
    SEMANTIC_SIMILARITY_THRESHOLD: float = 0.85  # Lowered from 0.92 for more flexibility
    STYLE_SIMILARITY_THRESHOLD: float = 0.75  # Lowered from 0.90 for more flexibility

    # Text Chunking Configuration
    MAX_CHUNK_TOKENS: int = 1000
    MIN_CHUNK_TOKENS: int = 500
    CHUNK_OVERLAP_TOKENS: int = 100  # Increased overlap for better boundary smoothing

    # Humanization Strategy Configuration
    USE_ADVANCED_PIPELINE: bool = False  # Use strategic single-pass (v2) for better results
    USE_V2_PROMPTS: bool = False  # V2 prompts (strategic subtlety)
    USE_V4_PROMPTS: bool = True  # V4 prompts (Originality.AI optimized) - RECOMMENDED
    ADVANCED_PIPELINE_MIN_WORDS: int = 1500  # Use multi-phase only for very long texts

    # LLM Settings for Humanization (V4 - Originality.AI Optimized)
    # Based on analysis of 93% human-scored text
    # Optimized for consistency AND quality (lower temperature for more consistent output)
    HUMANIZATION_TEMPERATURE: float = 0.70  # Lower for more consistent output (was 0.82)
    HUMANIZATION_TOP_P: float = 0.90  # Tighter sampling for more consistent word choices (was 0.93)
    HUMANIZATION_FREQUENCY_PENALTY: float = 0.50  # Reduced for more consistent phrasing (was 0.60)
    HUMANIZATION_PRESENCE_PENALTY: float = (
        0.35  # Reduced for more consistent topic coverage (was 0.45)
    )

    # V4 Pattern Breaker Settings
    PATTERN_BREAKER_AGGRESSIVENESS: float = 0.6  # 0.0-1.0 (0.6 = conservative, less expansion)

    # Model Preferences for Different Phases
    # Note: Model names may include provider prefix (e.g., "anthropic/claude-3-5-sonnet-20241022")
    # For direct Anthropic API, prefix will be stripped to "claude-3-5-sonnet-20241022"
    PRIMARY_HUMANIZATION_MODEL: str = "anthropic/claude-3-5-sonnet-20241022"  # Best for naturalness
    COMPRESSION_MODEL: str = "anthropic/claude-3-haiku-20240307"  # Fast, good for compression
    FALLBACK_HUMANIZATION_MODEL: str = "openai/gpt-4-turbo"  # Updated to current model

    # Temperature Settings by Phase
    COMPRESSION_TEMPERATURE: float = 0.70
    RECONSTRUCTION_TEMPERATURE: float = 0.75
    RHYTHM_RANDOMIZATION_TEMPERATURE: float = 0.80  # Highest for maximum variation
    NOISE_INJECTION_TEMPERATURE: float = 0.78
    FINAL_TUNING_TEMPERATURE: float = 0.75

    # Authenticity / Anti-Detection Controls
    AUTHENTICITY_PASS_ENABLED: bool = True
    AUTHENTICITY_PASS_MIN_WORDS: int = 180
    # Enable invisible characters for better AI detection bypass (like the sample output)
    INVISIBLE_CHAR_NOISE_ENABLED: bool = True
    INVISIBLE_CHAR_INSERT_EVERY_N_WORDS: int = 15  # Insert every 15 words for natural distribution

    # Length Enforcement Ratios
    LENGTH_STANDARD_MIN_RATIO: float = 0.65
    LENGTH_STANDARD_MAX_RATIO: float = 1.35
    LENGTH_SHORTEN_MIN_RATIO: float = 0.6
    LENGTH_SHORTEN_MAX_RATIO: float = 0.85
    LENGTH_EXPAND_MIN_RATIO: float = 1.2
    LENGTH_EXPAND_MAX_RATIO: float = 1.5

    # Stripe Configuration
    STRIPE_API_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = (
        "whsec_2c43d2dffc60a2f3445332cc33ce9196977bb1c62615ed1014d5fe33a3398c2c"
    )

    # Subscription Limits (words per month)
    SUBSCRIPTION_LIMITS: dict[str, dict[str, int]] = {
        "free": {"words": 2500, "request_limit": 10},
        "basic": {"words": 5000, "request_limit": 100},
        "pro": {"words": 15000, "request_limit": 500},
        "ultra": {"words": 30000, "request_limit": 1000},
    }

    # Request Limits (words per request)
    REQUEST_LIMITS: dict[str, int] = {
        "free": 500,
        "basic": 500,
        "pro": 1500,
        "ultra": 3000,
    }

    # Convex Backend URL (for subscription queries)
    CONVEX_URL: str = ""
    CONVEX_DEPLOYMENT_KEY: str = ""
    CONVEX_ACCESS_TOKEN: str = ""  # Team Access Token for authentication

    # AI Detection API Keys (for /detect endpoint)
    # Note: These are optional - detectors will work in demo mode without keys
    GPTZERO_API_KEY: str = ""
    COPYLEAKS_API_KEY: str = ""
    SAPLING_API_KEY: str = ""
    WRITER_API_KEY: str = ""
    ZEROGPT_API_KEY: str = ""
    ORIGINALITY_API_KEY: str = ""
    QUILLBOT_API_KEY: str = ""
    TURNITIN_API_KEY: str = ""
    GRAMMARLY_API_KEY: str = ""
    SCRIBBR_API_KEY: str = ""

    # Detection Cache Configuration
    DETECTION_CACHE_SIZE: int = 1000
    DETECTION_CACHE_TTL_SECONDS: int = 3600  # 1 hour

    model_config = {
        "case_sensitive": True,
        # Removed "env_file" - we load .env manually above
        # This way pydantic reads from environment variables (loaded by dotenv)
    }


settings = Settings()
