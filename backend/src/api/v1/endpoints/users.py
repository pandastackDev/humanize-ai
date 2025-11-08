"""
Users endpoints - User management operations.
"""

from fastapi import APIRouter, status

from api.models import User, UserCreate

router = APIRouter()


# ============================================================================
# Endpoints
# ============================================================================


@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
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
