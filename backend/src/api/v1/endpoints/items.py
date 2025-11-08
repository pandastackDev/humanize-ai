"""
Items endpoints - CRUD operations for items.
"""

from fastapi import APIRouter, HTTPException, status

from api.models import Item, ItemCreate, ItemUpdate, ItemCategory, DataResponse, ApiResponse

router = APIRouter()


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
# Endpoints
# ============================================================================


@router.get("/data", response_model=DataResponse)
def get_sample_data():
    """Get all items with Pydantic response model"""
    items_list = list(items_db.values())
    return DataResponse(data=items_list, total=len(items_list))


@router.get("/{item_id}", response_model=Item)
def get_item(item_id: int):
    """Get a specific item by ID"""
    if item_id not in items_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Item with id {item_id} not found"
        )
    return items_db[item_id]


@router.post("/", response_model=Item, status_code=status.HTTP_201_CREATED)
def create_item(item: ItemCreate):
    """Create a new item with Pydantic validation"""
    global next_item_id

    new_item = Item(
        id=next_item_id, name=item.name, value=item.value, category=item.category, tags=item.tags
    )
    items_db[next_item_id] = new_item
    next_item_id += 1

    return new_item


@router.put("/{item_id}", response_model=Item)
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


@router.delete("/{item_id}", response_model=ApiResponse)
def delete_item(item_id: int):
    """Delete an item"""
    if item_id not in items_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Item with id {item_id} not found"
        )

    del items_db[item_id]

    return ApiResponse(success=True, message=f"Item {item_id} deleted successfully")
