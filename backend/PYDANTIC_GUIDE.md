# Pydantic Guide

This guide demonstrates how to use Pydantic in the Humanize backend API.

## What is Pydantic?

Pydantic is a data validation library that uses Python type annotations. It's the foundation of FastAPI's request/response validation and provides:

- **Data validation** using Python type hints
- **Serialization** to/from JSON, dict, etc.
- **JSON Schema** generation
- **IDE support** with autocomplete and type checking

## Installation

Pydantic is already installed in this project. Dependencies are in:

```bash
# Install dependencies
pip install -r requirements.txt

# Or using uv
uv pip install -r requirements.txt
```

## Quick Start

### Basic Model

```python
from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool = True  # Default value

# Create instance
user = User(id=1, name="John Doe", email="john@example.com")

# Access fields
print(user.name)  # John Doe

# Convert to dict
print(user.model_dump())

# Convert to JSON
print(user.model_dump_json())
```

## Key Features

### 1. Field Validation

```python
from pydantic import BaseModel, Field

class Product(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., gt=0)  # Must be greater than 0
    quantity: int = Field(default=0, ge=0)  # Greater than or equal to 0
    discount: float = Field(None, ge=0, le=100)  # Between 0-100
```

### 2. Email and URL Validation

```python
from pydantic import BaseModel, EmailStr, HttpUrl

class Contact(BaseModel):
    email: EmailStr  # Validates email format
    website: HttpUrl  # Validates URL format
```

### 3. Custom Validators

```python
from pydantic import BaseModel, field_validator

class Password(BaseModel):
    value: str
    
    @field_validator("value")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain uppercase letter")
        return v
```

### 4. Model Validators

```python
from pydantic import BaseModel, model_validator

class DateRange(BaseModel):
    start_date: datetime
    end_date: datetime
    
    @model_validator(mode="after")
    def validate_dates(self) -> "DateRange":
        if self.end_date <= self.start_date:
            raise ValueError("End date must be after start date")
        return self
```

### 5. Nested Models

```python
class Address(BaseModel):
    street: str
    city: str
    zip_code: str

class Person(BaseModel):
    name: str
    address: Address

person = Person(
    name="John",
    address=Address(street="123 Main", city="NYC", zip_code="10001")
)
```

### 6. Enums

```python
from enum import Enum

class Status(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"

class Task(BaseModel):
    title: str
    status: Status = Status.PENDING
```

## FastAPI Integration

Pydantic models integrate seamlessly with FastAPI:

### Request Body Validation

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class ItemCreate(BaseModel):
    name: str
    price: float

@app.post("/items")
def create_item(item: ItemCreate):
    # FastAPI automatically validates the request body
    return {"item": item}
```

### Response Model

```python
class Item(BaseModel):
    id: int
    name: str
    price: float

@app.get("/items/{item_id}", response_model=Item)
def get_item(item_id: int):
    # FastAPI validates the response matches the model
    return Item(id=item_id, name="Example", price=9.99)
```

### Partial Updates

```python
class ItemUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None

@app.put("/items/{item_id}")
def update_item(item_id: int, update: ItemUpdate):
    # Only update provided fields
    update_data = update.model_dump(exclude_unset=True)
    # ... apply updates ...
```

## API Endpoints in This Project

### GET /api/data
Returns a list of all items with validation.

```bash
curl http://localhost:8000/api/data
```

### GET /api/items/{item_id}
Get a specific item by ID.

```bash
curl http://localhost:8000/api/items/1
```

### POST /api/items
Create a new item with validation.

```bash
curl -X POST http://localhost:8000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Item",
    "value": 99.99,
    "category": "electronics",
    "tags": ["tech", "gadget"]
  }'
```

### PUT /api/items/{item_id}
Update an existing item.

```bash
curl -X PUT http://localhost:8000/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "value": 149.99
  }'
```

### DELETE /api/items/{item_id}
Delete an item.

```bash
curl -X DELETE http://localhost:8000/api/items/1
```

### POST /api/users
Create a user with email and password validation.

```bash
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "password": "SecurePass123"
  }'
```

## Running the Examples

### Start the API Server

```bash
cd backend
uvicorn src.api.main:app --reload
```

Then visit:
- **API Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

### Run Standalone Examples

```bash
cd backend
python src/api/pydantic_examples.py
```

This will demonstrate:
- Basic model usage
- Validation errors
- Nested models
- Custom validators
- Model updates
- Custom methods

## Best Practices

### 1. Use Type Hints

```python
# Good
class User(BaseModel):
    name: str
    age: int

# Bad
class User(BaseModel):
    name = ""
    age = 0
```

### 2. Add Field Descriptions

```python
class Product(BaseModel):
    name: str = Field(..., description="Product name")
    price: float = Field(..., gt=0, description="Price in USD")
```

### 3. Use Separate Models for Input/Output

```python
# Input (create)
class ItemCreate(BaseModel):
    name: str
    value: float

# Output (response)
class Item(BaseModel):
    id: int
    name: str
    value: float
    created_at: datetime

# Update (partial)
class ItemUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[float] = None
```

### 4. Handle Validation Errors

```python
from pydantic import ValidationError

try:
    user = User(name="John", age="invalid")
except ValidationError as e:
    print(e.errors())
```

### 5. Use Model Config

```python
class MyModel(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",  # Forbid extra fields
    )
```

## Common Validations

| Constraint | Description | Example |
|------------|-------------|---------|
| `gt` | Greater than | `Field(gt=0)` |
| `ge` | Greater than or equal | `Field(ge=0)` |
| `lt` | Less than | `Field(lt=100)` |
| `le` | Less than or equal | `Field(le=100)` |
| `min_length` | Minimum length | `Field(min_length=3)` |
| `max_length` | Maximum length | `Field(max_length=50)` |
| `pattern` | Regex pattern | `Field(pattern=r"^\d{3}-\d{3}$")` |

## Resources

- [Pydantic Documentation](https://docs.pydantic.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Examples in this project](src/api/pydantic_examples.py)
- [API Implementation](src/api/main.py)

## Testing

You can test the validation by sending invalid data:

```bash
# This will fail - negative value
curl -X POST http://localhost:8000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "value": -10}'

# This will fail - invalid email
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "email": "invalid-email",
    "password": "SecurePass123"
  }'
```

FastAPI will automatically return a 422 Unprocessable Entity response with detailed validation errors.

