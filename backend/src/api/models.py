"""
Pydantic models for API request/response validation.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List

from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict


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
    category: Optional[ItemCategory] = None
    tags: List[str] = Field(default_factory=list)

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
    category: Optional[ItemCategory] = None
    tags: List[str] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v or v.strip() == "":
            raise ValueError("Name cannot be empty or whitespace")
        return v.strip()


class ItemUpdate(BaseModel):
    """Model for updating items (all fields optional)"""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    value: Optional[float] = Field(None, ge=0)
    category: Optional[ItemCategory] = None
    tags: Optional[List[str]] = None


# ============================================================================
# User Models
# ============================================================================


class User(BaseModel):
    """Example model with email validation"""

    id: int
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr  # Validates email format
    full_name: Optional[str] = None
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
    full_name: Optional[str] = None
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

    data: List[Item]
    total: int
    timestamp: datetime = Field(default_factory=datetime.now)


class ApiResponse(BaseModel):
    """Generic API response wrapper"""

    success: bool
    message: str
    data: Optional[dict] = None


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
    tone: Optional[str] = Field(None, description="Writing tone (e.g., 'academic', 'casual')")
    length_mode: LengthMode = Field(
        LengthMode.STANDARD, description="Length mode: 'shorten', 'expand', or 'standard'"
    )
    style_sample: Optional[str] = Field(
        None, description="Style sample text (min 150 words recommended)"
    )
    readability_level: Optional[str] = Field(None, description="Readability level")
    language: Optional[str] = Field(
        None, description="Target language (auto-detected if not provided)"
    )

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

    semantic_similarity: Optional[float] = None
    style_similarity: Optional[float] = None
    word_count: Optional[int] = None
    character_count: Optional[int] = None
    processing_time_ms: Optional[float] = None
    sentence_length_variance: Optional[float] = None
    avg_sentence_length: Optional[float] = None
    lexical_diversity: Optional[float] = None


class Metadata(BaseModel):
    """Metadata for humanization process"""

    detected_language: Optional[str] = None
    language_confidence: Optional[float] = None
    chunk_count: Optional[int] = None
    model_used: Optional[str] = None


class HumanizeResponse(BaseModel):
    """Response model for humanize endpoint"""

    humanized_text: str = Field(..., description="Humanized text")
    language: Optional[str] = Field(None, description="Detected/target language")
    metrics: Optional[Metrics] = None
    metadata: Optional[Metadata] = None

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
