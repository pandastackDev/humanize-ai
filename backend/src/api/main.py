from datetime import datetime
from enum import Enum
from typing import Optional, List

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict


app = FastAPI(
    title="Humanize API",
    description="FastAPI backend for humanize with Pydantic examples",
    version="1.0.0",
)


# ============================================================================
# Pydantic Models - Examples
# ============================================================================


class ItemCategory(str, Enum):
    """Example Enum for categories"""

    ELECTRONICS = "electronics"
    CLOTHING = "clothing"
    FOOD = "food"
    BOOKS = "books"


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
# In-memory storage (for demonstration)
# ============================================================================

items_db: dict[int, Item] = {
    1: Item(id=1, name="Laptop", value=999.99, category=ItemCategory.ELECTRONICS, tags=["tech"]),
    2: Item(id=2, name="T-Shirt", value=29.99, category=ItemCategory.CLOTHING, tags=["fashion"]),
    3: Item(id=3, name="Python Book", value=49.99, category=ItemCategory.BOOKS, tags=["education"]),
}
next_item_id = 4


# ============================================================================
# API Endpoints
# ============================================================================


@app.get("/api/data", response_model=DataResponse)
def get_sample_data():
    """Get all items with Pydantic response model"""
    items_list = list(items_db.values())
    return DataResponse(data=items_list, total=len(items_list))


@app.get("/api/items/{item_id}", response_model=Item)
def get_item(item_id: int):
    """Get a specific item by ID"""
    if item_id not in items_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Item with id {item_id} not found"
        )
    return items_db[item_id]


@app.post("/api/items", response_model=Item, status_code=status.HTTP_201_CREATED)
def create_item(item: ItemCreate):
    """Create a new item with Pydantic validation"""
    global next_item_id

    new_item = Item(
        id=next_item_id, name=item.name, value=item.value, category=item.category, tags=item.tags
    )
    items_db[next_item_id] = new_item
    next_item_id += 1

    return new_item


@app.put("/api/items/{item_id}", response_model=Item)
def update_item(item_id: int, item_update: ItemUpdate):
    """Update an existing item"""
    if item_id not in items_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Item with id {item_id} not found"
        )

    stored_item = items_db[item_id]
    update_data = item_update.model_dump(exclude_unset=True)

    updated_item = stored_item.model_copy(update=update_data)
    items_db[item_id] = updated_item

    return updated_item


@app.delete("/api/items/{item_id}", response_model=ApiResponse)
def delete_item(item_id: int):
    """Delete an item"""
    if item_id not in items_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Item with id {item_id} not found"
        )

    del items_db[item_id]

    return ApiResponse(success=True, message=f"Item {item_id} deleted successfully")


@app.post("/api/users", response_model=User, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate):
    """Create a user with email validation and password strength requirements"""
    # In a real app, you'd hash the password and store it in a database
    new_user = User(
        id=1,  # In a real app, this would be auto-generated
        username=user.username,
        email=user.email,
        full_name=user.full_name,
    )
    return new_user


@app.get("/", response_class=HTMLResponse)
def read_root():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FastAPI backend for humanize</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
    </head>
    <body>
        <ul>
            <li><a href="/scalar">Open Scalar UI (TODO) →</a></li>
            <li><a href="/docs">Open Swagger UI →</a></li>
            <li><a href="/redoc">Open ReDoc UI →</a></li>
            <li><a href="/openapi.json">Open OpenAPI JSON →</a></li>
        </ul>
    </body>
    </html>
    """
