"""
Evaluation configuration for humanize/detect testing.
"""

from pydantic_settings import BaseSettings


class EvalConfig(BaseSettings):
    """Configuration for evaluation scripts."""

    # API endpoints
    API_BASE_URL: str = "http://localhost:8000"
    HUMANIZE_ENDPOINT: str = "/api/v1/humanize/"
    DETECT_ENDPOINT: str = "/api/v1/detect/"

    # External detector APIs (for pass-rate testing)
    GPTZERO_API_KEY: str = ""
    ZEROGPT_API_KEY: str = ""
    ORIGINALITY_API_KEY: str = ""
    SAPLING_API_KEY: str = ""
    WRITER_API_KEY: str = ""
    COPYLEAKS_API_KEY: str = ""
    QUILLBOT_API_KEY: str = ""

    # LLM APIs (for generating test samples)
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    # Test thresholds
    SEMANTIC_SIMILARITY_THRESHOLD: float = 0.85  # Min cosine similarity for semantic preservation
    STYLE_SIMILARITY_THRESHOLD: float = 0.75  # Min similarity for style adherence
    DETECTOR_PASS_THRESHOLD: float = 0.70  # Min human likelihood to "pass" detection
    DETECTOR_SUCCESS_RATE: float = 0.75  # % of samples that must pass detector test

    # Length mode tolerances
    LENGTH_STANDARD_MIN: float = 0.9
    LENGTH_STANDARD_MAX: float = 1.1
    LENGTH_SHORTEN_MAX: float = 0.8
    LENGTH_EXPAND_MIN: float = 1.2

    # Supported tones for testing
    SUPPORTED_TONES: list[str] = [
        "Standard",
        "Professional",
        "Academic",
        "Blog/SEO",
        "Casual",
        "Creative",
        "Scientific",
        "Technical",
    ]

    # Tier 1 languages (full testing)
    TIER1_LANGUAGES: list[str] = [
        "en",  # English
        "es",  # Spanish
        "zh",  # Chinese (Simplified)
        "hi",  # Hindi
        "ar",  # Arabic
    ]

    # Tier 2 languages (automated metrics only)
    TIER2_LANGUAGES: list[str] = [
        "bn",
        "pt",
        "ru",
        "ur",
        "id",
        "fr",
        "de",
        "ja",
        "sw",
        "mr",
        "te",
        "tr",
        "vi",
        "ko",
        "ta",
        "it",
        "th",
        "gu",
        "pl",
        "uk",
    ]

    # Test sample sizes
    MIN_SHORT_TEXT_WORDS: int = 80
    MAX_SHORT_TEXT_WORDS: int = 200
    MIN_LONG_TEXT_WORDS: int = 400
    MAX_LONG_TEXT_WORDS: int = 800
    MIN_STYLE_SAMPLE_WORDS: int = 150
    MAX_STYLE_SAMPLE_WORDS: int = 300

    # Test dataset paths
    DATASET_DIR: str = "eval/datasets"
    RESULTS_DIR: str = "eval/results"

    # Embedding model for semantic similarity
    EMBEDDING_MODEL: str = "paraphrase-multilingual-mpnet-base-v2"

    # Test modes
    SKIP_EXTERNAL_DETECTORS: bool = False  # Set True to skip external API calls
    CACHE_DETECTOR_RESULTS: bool = True  # Cache results to save API costs

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global config instance
config = EvalConfig()
