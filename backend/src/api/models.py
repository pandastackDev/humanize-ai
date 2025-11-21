"""
Pydantic models for API request/response validation.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

# ============================================================================
# Enums
# ============================================================================


class ItemCategory(str, Enum):
    """Example Enum for categories"""

    ELECTRONICS = "electronics"
    CLOTHING = "clothing"
    FOOD = "food"
    BOOKS = "books"


# ============================================================================
# Item Models
# ============================================================================


class Item(BaseModel):
    """Basic Pydantic model with validation"""

    id: int = Field(..., gt=0, description="Item ID must be positive")
    name: str = Field(..., min_length=1, max_length=100, description="Item name")
    value: float = Field(..., ge=0, description="Item value must be non-negative")
    category: ItemCategory | None = None
    tags: list[str] = Field(default_factory=list)

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "name": "Laptop",
                    "value": 999.99,
                    "category": "electronics",
                    "tags": ["tech", "portable"],
                }
            ]
        }
    )


class ItemCreate(BaseModel):
    """Model for creating new items (without ID)"""

    name: str = Field(..., min_length=1, max_length=100)
    value: float = Field(..., ge=0)
    category: ItemCategory | None = None
    tags: list[str] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v or v.strip() == "":
            raise ValueError("Name cannot be empty or whitespace")
        return v.strip()


class ItemUpdate(BaseModel):
    """Model for updating items (all fields optional)"""

    name: str | None = Field(None, min_length=1, max_length=100)
    value: float | None = Field(None, ge=0)
    category: ItemCategory | None = None
    tags: list[str] | None = None


# ============================================================================
# User Models
# ============================================================================


class User(BaseModel):
    """Example model with email validation"""

    id: int
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr  # Validates email format
    full_name: str | None = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "username": "johndoe",
                    "email": "john@example.com",
                    "full_name": "John Doe",
                    "is_active": True,
                }
            ]
        }
    )


class UserCreate(BaseModel):
    """Model for creating users"""

    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_]+$")
    email: EmailStr
    full_name: str | None = None
    password: str = Field(..., min_length=8)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


# ============================================================================
# Response Models
# ============================================================================


class DataResponse(BaseModel):
    """Response model for list of items"""

    data: list[Item]
    total: int
    timestamp: datetime = Field(default_factory=datetime.now)


class ApiResponse(BaseModel):
    """Generic API response wrapper"""

    success: bool
    message: str
    data: dict | None = None


# ============================================================================
# Humanize Models
# ============================================================================


class LengthMode(str, Enum):
    """Length mode for humanization"""

    SHORTEN = "shorten"
    EXPAND = "expand"
    STANDARD = "standard"


class HumanizeRequest(BaseModel):
    """Request model for humanize endpoint"""

    input_text: str = Field(..., min_length=1, description="Text to humanize")
    tone: str | None = Field(None, description="Writing tone (e.g., 'academic', 'casual')")
    length_mode: LengthMode = Field(
        LengthMode.STANDARD, description="Length mode: 'shorten', 'expand', or 'standard'"
    )
    style_sample: str | None = Field(
        None, description="Style sample text (min 150 words required if provided)"
    )
    readability_level: str | None = Field(None, description="Readability level")
    language: str | None = Field(
        None, description="Target language (auto-detected if not provided)"
    )

    @field_validator("style_sample")
    @classmethod
    def validate_style_sample_word_count(cls, v: str | None) -> str | None:
        """
        Validate that style_sample has at least 150 words if provided.

        Args:
            v: Style sample text (optional)

        Returns:
            The style sample text if valid

        Raises:
            ValueError: If style_sample is provided but has less than 150 words
        """
        if v is not None and v.strip():
            word_count = len(v.strip().split())
            if word_count < 150:
                raise ValueError(
                    f"style_sample must have at least 150 words, but got {word_count} words. "
                    f"Please provide a longer style sample for better results."
                )
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "input_text": "The utilization of advanced technological systems facilitates enhanced productivity.",
                    "tone": "academic",
                    "length_mode": "standard",
                    "readability_level": "university",
                }
            ]
        }
    )


class Metrics(BaseModel):
    """Metrics for humanization process"""

    semantic_similarity: float | None = None
    style_similarity: float | None = None
    word_count: int | None = None
    character_count: int | None = None
    original_word_count: int | None = None
    processing_time_ms: float | None = None
    chunks_used: int | None = None
    sentence_length_variance: float | None = None
    avg_sentence_length: float | None = None
    lexical_diversity: float | None = None


class Metadata(BaseModel):
    """Metadata for humanization process"""

    detected_language: str | None = None
    language_confidence: float | None = None
    chunk_count: int | None = None
    model_used: str | None = None
    semantic_passed: bool | None = None
    style_passed: bool | None = None


class HumanizeResponse(BaseModel):
    """Response model for humanize endpoint"""

    humanized_text: str = Field(..., description="Humanized text")
    language: str | None = Field(None, description="Detected/target language")
    metrics: Metrics | None = None
    metadata: Metadata | None = None

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "humanized_text": "Using advanced technology helps us work more efficiently.",
                    "language": "en",
                    "metrics": {
                        "semantic_similarity": 0.95,
                        "style_similarity": 0.88,
                        "word_count": 120,
                        "character_count": 650,
                        "processing_time_ms": 1250.5,
                    },
                    "metadata": {
                        "detected_language": "en",
                        "chunk_count": 1,
                        "model_used": "openai/gpt-4-turbo",
                    },
                }
            ]
        }
    )


# ============================================================================
# Subscription Models
# ============================================================================


class SubscriptionPlan(str, Enum):
    """Subscription plan types"""

    BASIC = "basic"
    PRO = "pro"
    ULTRA = "ultra"
    FREE = "free"


class SubscriptionStatus(str, Enum):
    """Subscription status"""

    ACTIVE = "active"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"
    UNPAID = "unpaid"
    TRIALING = "trialing"


class SubscriptionCheckRequest(BaseModel):
    """Request model for checking subscription status"""

    user_id: str = Field(..., description="WorkOS user ID")
    organization_id: str | None = Field(None, description="WorkOS organization ID")


class SubscriptionInfo(BaseModel):
    """Subscription information response"""

    plan: SubscriptionPlan
    status: SubscriptionStatus
    word_limit: int
    words_used: int
    words_remaining: int
    request_limit: int
    requests_used: int
    billing_period: str  # "monthly" or "annual"
    current_period_end: str | None = None
    stripe_customer_id: str | None = None
    stripe_subscription_id: str | None = None


class UsageTrackingRequest(BaseModel):
    """Request model for tracking usage"""

    user_id: str = Field(..., description="WorkOS user ID")
    organization_id: str | None = Field(None, description="WorkOS organization ID")
    words: int = Field(..., gt=0, description="Number of words used")
    request_type: str = Field(default="humanize", description="Type of request")


class UsageTrackingResponse(BaseModel):
    """Response model for usage tracking"""

    success: bool
    words_used: int
    words_remaining: int
    limit_exceeded: bool


# ============================================================================
# Detection Models
# ============================================================================


class DetectorType(str, Enum):
    """AI detector types"""

    GPTZERO = "gptzero"
    COPYLEAKS = "copyleaks"
    SAPLING = "sapling"
    WRITER = "writer"
    ZEROGPT = "zerogpt"
    ORIGINALITY = "originality"
    QUILLBOT = "quillbot"
    TURNITIN = "turnitin"
    GRAMMARLY = "grammarly"
    SCRIBBR = "scribbr"
    INTERNAL = "internal"


class DetectRequest(BaseModel):
    """Request model for AI detection endpoint"""

    text: str = Field(..., min_length=1, description="Text to analyze for AI detection")
    language: str | None = Field(None, description="Language code (auto-detected if not provided)")
    detectors: list[DetectorType] | None = Field(
        None, description="List of detectors to use (all enabled if not specified)"
    )
    include_internal_analysis: bool = Field(
        True, description="Include internal feature analysis (perplexity, entropy, n-grams)"
    )
    enable_caching: bool = Field(
        True, description="Enable caching of detection results for faster repeat queries"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "text": "The utilization of advanced technological systems facilitates enhanced productivity.",
                    "language": "en",
                    "detectors": ["gptzero", "internal"],
                    "include_internal_analysis": True,
                }
            ]
        }
    )


class DetectCompareRequest(BaseModel):
    """Request model for comparing original vs humanized detection scores."""

    original_text: str = Field(..., min_length=1, description="Original text to evaluate")
    humanized_text: str = Field(..., min_length=1, description="Humanized text to compare against")
    detectors: list[DetectorType] | None = Field(
        None, description="Optional list of detectors to use for both texts"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "original_text": "The utilization of advanced technological systems facilitates enhanced productivity.",
                    "humanized_text": "I can tell the new software really helps the team stay on top of things.",
                    "detectors": ["gptzero", "internal"],
                }
            ]
        }
    )


class DetectorResult(BaseModel):
    """Individual detector result"""

    detector: DetectorType
    ai_probability: float = Field(..., ge=0, le=1, description="Probability of AI-generated (0-1)")
    human_probability: float = Field(
        ..., ge=0, le=1, description="Probability of human-written (0-1)"
    )
    ai_probability_pct: float = Field(
        ..., ge=0, le=100, description="AI probability as percentage (0-100%)"
    )
    human_probability_pct: float = Field(
        ..., ge=0, le=100, description="Human probability as percentage (0-100%)"
    )
    confidence: float = Field(..., ge=0, le=1, description="Confidence in the result")
    confidence_pct: float = Field(
        ..., ge=0, le=100, description="Confidence as percentage (0-100%)"
    )
    details: dict | None = Field(None, description="Additional detector-specific details")
    error: str | None = Field(None, description="Error message if detection failed")
    response_time_ms: float | None = Field(None, description="API response time in milliseconds")


class InternalAnalysis(BaseModel):
    """Internal linguistic feature analysis"""

    perplexity_score: float | None = Field(
        None, description="Perplexity score (lower = more AI-like)"
    )
    entropy_score: float | None = Field(
        None, description="Entropy score (lower = more uniform/AI-like)"
    )
    ngram_variance: float | None = Field(
        None, description="N-gram variance (lower = more repetitive/AI-like)"
    )
    avg_sentence_length: float | None = Field(None, description="Average sentence length")
    sentence_length_variance: float | None = Field(
        None, description="Sentence length variance (higher = more varied/human-like)"
    )
    lexical_diversity: float | None = Field(
        None, description="Lexical diversity (unique words / total words)"
    )
    burstiness_score: float | None = Field(
        None, description="Burstiness score (variation in word usage patterns)"
    )
    ai_likelihood_internal: float = Field(
        ..., ge=0, le=1, description="Overall AI likelihood based on internal analysis"
    )


class DetectResponse(BaseModel):
    """Response model for AI detection endpoint"""

    text_sample: str = Field(..., description="First 200 characters of analyzed text")
    language: str | None = Field(None, description="Detected language")
    human_likelihood_pct: float = Field(
        ..., ge=0, le=100, description="Overall human likelihood percentage (0-100)"
    )
    ai_likelihood_pct: float = Field(
        ..., ge=0, le=100, description="Overall AI likelihood percentage (0-100)"
    )
    confidence: float = Field(..., ge=0, le=1, description="Overall confidence in the assessment")
    detector_results: list[DetectorResult] = Field(
        default_factory=list, description="Results from individual detectors"
    )
    internal_analysis: InternalAnalysis | None = Field(
        None, description="Internal linguistic feature analysis"
    )
    metadata: dict | None = Field(
        None,
        description="Additional metadata (word count, processing time, detectors used, etc.)",
    )
    cached: bool = Field(False, description="Whether this result was served from cache")

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "text_sample": "The utilization of advanced technological systems...",
                    "language": "en",
                    "human_likelihood_pct": 72.5,
                    "ai_likelihood_pct": 27.5,
                    "confidence": 0.85,
                    "detector_results": [
                        {
                            "detector": "gptzero",
                            "ai_probability": 0.28,
                            "human_probability": 0.72,
                            "confidence": 0.87,
                            "response_time_ms": 450,
                        }
                    ],
                    "metadata": {
                        "word_count": 125,
                        "processing_time_ms": 1500,
                        "detectors_used": 3,
                    },
                }
            ]
        }
    )
