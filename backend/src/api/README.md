# API Structure Documentation

## Overview

This API follows FastAPI best practices with a modular, scalable architecture.

## Best Practices Implemented

### 1. **Centralized Configuration** (`config.py`)
- Settings managed via `pydantic-settings`
- Environment variables support with `.env` file
- Easy to modify without changing code

### 2. **API Versioning** (`/api/v1`)
- Versioned endpoints for backward compatibility
- Future versions can coexist (e.g., `/api/v2`)
- Clean upgrade path for clients

### 3. **Router-Based Organization**
- Endpoints grouped by resource (items, users)
- Each router is independent and testable
- Easy to add new features

### 4. **Separation of Concerns**
- **Models** (`models.py`): Pydantic schemas for validation
- **Endpoints** (`v1/endpoints/`): Business logic and handlers
- **Config** (`config.py`): Application settings
- **Main** (`main.py`): App initialization and routing

## Project Structure

```
backend/src/api/
├── main.py                 # FastAPI app initialization
├── config.py               # Settings and configuration
├── models.py               # Pydantic models
└── v1/                     # API version 1
    ├── __init__.py         # Router aggregation
    └── endpoints/          # Endpoint modules
        ├── __init__.py
        ├── items.py        # Items CRUD operations
        └── users.py        # User management
```

## API Endpoints

All endpoints are now prefixed with `/api/v1`:

### Items
- `GET /api/v1/items/data` - Get all items
- `GET /api/v1/items/{item_id}` - Get specific item
- `POST /api/v1/items/` - Create new item
- `PUT /api/v1/items/{item_id}` - Update item
- `DELETE /api/v1/items/{item_id}` - Delete item

### Users
- `POST /api/v1/users/` - Create new user

### Documentation
- `GET /` - API information (JSON)
- `GET /docs-page` - Documentation links (HTML)
- `GET /scalar` - Scalar API reference
- `GET /docs` - Swagger UI
- `GET /redoc` - ReDoc UI

## Configuration

Edit `config.py` or create a `.env` file:

```env
PROJECT_NAME="My Custom API"
VERSION="2.0.0"
API_V1_STR="/api/v1"
ENVIRONMENT="production"
```

## Adding New Endpoints

1. Create a new file in `v1/endpoints/` (e.g., `products.py`)
2. Define your router and endpoints
3. Import and include in `v1/__init__.py`

Example:

```python
# v1/endpoints/products.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def list_products():
    return {"products": []}
```

```python
# v1/__init__.py
from .endpoints import items, users, products

router = APIRouter()
router.include_router(items.router, prefix="/items", tags=["Items"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(products.router, prefix="/products", tags=["Products"])
```

## Migration Notes

**Old endpoints → New endpoints:**
- `/api/data` → `/api/v1/items/data`
- `/api/items/...` → `/api/v1/items/...`
- `/api/users/...` → `/api/v1/users/...`

## Benefits

✅ **Scalability**: Easy to add new versions or features  
✅ **Maintainability**: Clear separation of concerns  
✅ **Testability**: Each router can be tested independently  
✅ **Configuration**: Centralized settings management  
✅ **Standards**: Follows FastAPI and REST best practices

