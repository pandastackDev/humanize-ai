"""
Comprehensive Pydantic Examples
================================

This file demonstrates various Pydantic features and best practices.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

from pydantic import (
    BaseModel,
    Field,
    field_validator,
    model_validator,
    EmailStr,
    ConfigDict,
    ValidationError,
)


# ============================================================================
# 1. Basic Models
# ============================================================================


class Person(BaseModel):
    """Basic Pydantic model"""

    name: str
    age: int
    email: EmailStr


# ============================================================================
# 2. Models with Field Constraints
# ============================================================================


class Product(BaseModel):
    """Model with various field constraints"""

    name: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., gt=0, description="Price must be positive")
    quantity: int = Field(default=0, ge=0, description="Stock quantity")
    discount_percentage: Optional[float] = Field(default=None, ge=0, le=100)
    sku: str = Field(..., pattern=r"^[A-Z]{3}-\d{6}$")  # e.g., ABC-123456


# ============================================================================
# 3. Nested Models
# ============================================================================


class Address(BaseModel):
    """Address model"""

    street: str
    city: str
    state: str = Field(..., min_length=2, max_length=2)  # US state code
    zip_code: str = Field(..., pattern=r"^\d{5}(-\d{4})?$")
    country: str = "USA"


class Customer(BaseModel):
    """Customer with nested address"""

    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Address
    shipping_address: Optional[Address] = None

    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
    )


# ============================================================================
# 4. Custom Validators
# ============================================================================


class UserRegistration(BaseModel):
    """Model with custom validators"""

    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=8)
    password_confirm: str
    age: int = Field(..., ge=13)

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        """Ensure username is alphanumeric"""
        if not v.isalnum():
            raise ValueError("Username must be alphanumeric")
        return v.lower()

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Validate password strength"""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v

    @model_validator(mode="after")
    def passwords_match(self) -> "UserRegistration":
        """Ensure passwords match"""
        if self.password != self.password_confirm:
            raise ValueError("Passwords do not match")
        return self


# ============================================================================
# 5. Enums
# ============================================================================


class OrderStatus(str, Enum):
    """Order status enum"""

    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class PaymentMethod(str, Enum):
    """Payment method enum"""

    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    PAYPAL = "paypal"
    BANK_TRANSFER = "bank_transfer"


class Order(BaseModel):
    """Order with enum fields"""

    id: int
    status: OrderStatus = OrderStatus.PENDING
    payment_method: PaymentMethod
    items: List[str]
    total: float = Field(..., gt=0)
    created_at: datetime = Field(default_factory=datetime.now)


# ============================================================================
# 6. Optional and Default Values
# ============================================================================


class BlogPost(BaseModel):
    """Blog post with optional fields and defaults"""

    title: str
    content: str
    author: str
    tags: List[str] = Field(default_factory=list)
    published: bool = False
    views: int = 0
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ============================================================================
# 7. Model Configuration
# ============================================================================


class StrictModel(BaseModel):
    """Model with strict validation"""

    model_config = ConfigDict(
        str_strip_whitespace=True,
        str_min_length=1,
        strict=True,  # Strict type checking
        validate_assignment=True,  # Validate on attribute assignment
        validate_default=True,
        extra="forbid",  # Forbid extra fields
    )

    name: str
    value: int


class FlexibleModel(BaseModel):
    """Model that allows extra fields"""

    model_config = ConfigDict(extra="allow")

    name: str
    value: int
    # Any extra fields will be stored in __pydantic_extra__


# ============================================================================
# 8. JSON Schema Customization
# ============================================================================


class APIKey(BaseModel):
    """API Key model with custom JSON schema"""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "Production API Key",
                    "key": "sk_live_xxxxxxxxxxxxxxxx",
                    "permissions": ["read", "write"],
                    "expires_at": "2025-12-31T23:59:59Z",
                }
            ]
        }
    )

    name: str
    key: str = Field(..., min_length=20)
    permissions: List[str]
    expires_at: datetime


# ============================================================================
# 9. Model Methods
# ============================================================================


class BankAccount(BaseModel):
    """Bank account with custom methods"""

    account_number: str = Field(..., pattern=r"^\d{10,12}$")
    balance: float = Field(default=0.0, ge=0)
    currency: str = "USD"
    is_active: bool = True

    def deposit(self, amount: float) -> float:
        """Deposit money"""
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")
        self.balance += amount
        return self.balance

    def withdraw(self, amount: float) -> float:
        """Withdraw money"""
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")
        if amount > self.balance:
            raise ValueError("Insufficient funds")
        self.balance -= amount
        return self.balance

    def model_dump_safe(self) -> dict:
        """Export without sensitive data"""
        data = self.model_dump()
        # Mask account number
        data["account_number"] = f"****{data['account_number'][-4:]}"
        return data


# ============================================================================
# 10. Inheritance
# ============================================================================


class BaseEntity(BaseModel):
    """Base model with common fields"""

    id: int
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None


class Task(BaseEntity):
    """Task inheriting from BaseEntity"""

    title: str
    description: Optional[str] = None
    completed: bool = False
    priority: int = Field(default=1, ge=1, le=5)


class Event(BaseEntity):
    """Event inheriting from BaseEntity"""

    name: str
    location: str
    start_time: datetime
    end_time: datetime

    @model_validator(mode="after")
    def validate_times(self) -> "Event":
        """Ensure end time is after start time"""
        if self.end_time <= self.start_time:
            raise ValueError("End time must be after start time")
        return self


# ============================================================================
# Usage Examples
# ============================================================================


def example_basic_usage():
    """Example: Basic model usage"""
    print("\n=== Basic Usage ===")

    # Create instance
    person = Person(name="John Doe", age=30, email="john@example.com")
    print(f"Person: {person}")

    # Convert to dict
    print(f"As dict: {person.model_dump()}")

    # Convert to JSON
    print(f"As JSON: {person.model_dump_json()}")


def example_validation_errors():
    """Example: Handling validation errors"""
    print("\n=== Validation Errors ===")

    try:
        # This will fail - invalid email
        Person(name="Jane", age=25, email="invalid-email")
    except ValidationError as e:
        print(f"Validation error: {e}")
        print(f"\nErrors dict: {e.errors()}")


def example_nested_models():
    """Example: Working with nested models"""
    print("\n=== Nested Models ===")

    customer = Customer(
        id=1,
        name="Alice Smith",
        email="alice@example.com",
        address=Address(street="123 Main St", city="New York", state="NY", zip_code="10001"),
    )
    print(f"Customer: {customer}")
    print(f"Address: {customer.address.city}, {customer.address.state}")


def example_custom_validators():
    """Example: Custom validators"""
    print("\n=== Custom Validators ===")

    try:
        user = UserRegistration(
            username="johndoe123",
            email="john@example.com",
            password="SecurePass123",
            password_confirm="SecurePass123",
            age=25,
        )
        print(f"Valid user: {user.username}")
    except ValidationError as e:
        print(f"Validation error: {e}")


def example_model_updates():
    """Example: Updating models"""
    print("\n=== Model Updates ===")

    product = Product(name="Laptop", price=999.99, quantity=10, sku="LAP-123456")

    # Update using model_copy
    updated = product.model_copy(update={"price": 899.99, "quantity": 8})
    print(f"Original: ${product.price}, Stock: {product.quantity}")
    print(f"Updated: ${updated.price}, Stock: {updated.quantity}")


def example_bank_account():
    """Example: Model with custom methods"""
    print("\n=== Bank Account ===")

    account = BankAccount(account_number="1234567890", balance=1000.0)
    print(f"Initial balance: ${account.balance}")

    account.deposit(500.0)
    print(f"After deposit: ${account.balance}")

    account.withdraw(200.0)
    print(f"After withdrawal: ${account.balance}")

    print(f"Safe export: {account.model_dump_safe()}")


if __name__ == "__main__":
    """Run all examples"""
    print("=" * 60)
    print("Pydantic Examples")
    print("=" * 60)

    example_basic_usage()
    example_validation_errors()
    example_nested_models()
    example_custom_validators()
    example_model_updates()
    example_bank_account()

    print("\n" + "=" * 60)
    print("All examples completed!")
    print("=" * 60)
