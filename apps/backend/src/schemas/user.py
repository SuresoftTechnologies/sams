"""
User schemas matching TypeScript shared-types.
"""

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, EmailStr, Field

if TYPE_CHECKING:  # pragma: no cover
    from src.models.user import User as UserModel


class UserRole(str, Enum):
    """User role enum - matches @sams/shared-types."""

    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"


class User(BaseModel):
    """
    User model - matches @sams/shared-types User interface.
    """

    id: str = Field(..., description="Unique user ID (UUID)")
    email: EmailStr = Field(..., description="Email address")
    name: str = Field(..., description="Full name")
    role: UserRole = Field(default=UserRole.EMPLOYEE, description="User role")

    department: str | None = Field(None, description="Department")
    employee_id: str | None = Field(None, description="Employee ID")
    is_active: bool = Field(default=True, description="Account active status")

    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "john.doe@suresoft.com",
                "name": "John Doe",
                "role": "employee",
                "department": "IT",
                "employee_id": "EMP-2024-001",
                "is_active": True,
                "created_at": "2024-01-15T09:00:00Z",
                "updated_at": "2024-01-15T09:00:00Z",
            }
        }
    )

    @classmethod
    def from_model(cls, user: "UserModel") -> "User":
        """Convert SQLAlchemy User model to Pydantic schema without triggering lazy loads."""

        # Extract department without triggering async lazy loading
        department_value = None
        user_dict = getattr(user, "__dict__", {})
        if "department" in user_dict:
            department_obj = user_dict["department"]
            if department_obj is not None:
                department_value = getattr(department_obj, "name", None) or getattr(
                    department_obj, "id", None
                )

        if department_value is None:
            department_value = getattr(user, "department_id", None)

        role_value = getattr(user, "role", None)
        if hasattr(role_value, "value"):
            role_value = role_value.value

        return cls(
            id=user.id,
            email=user.email,
            name=user.name,
            role=role_value,
            department=department_value,
            employee_id=getattr(user, "employee_id", None),
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )


class CreateUserRequest(BaseModel):
    """Create user request DTO."""

    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., min_length=8, description="Password")
    name: str = Field(..., min_length=1, max_length=100, description="Full name")
    role: UserRole = Field(default=UserRole.EMPLOYEE, description="User role")
    department: str | None = Field(None, max_length=100)
    employee_id: str | None = Field(None, max_length=50)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "john.doe@suresoft.com",
                "password": "SecurePass123!",
                "name": "John Doe",
                "role": "employee",
                "department": "IT",
                "employee_id": "EMP-2024-001",
            }
        }
    )


class UpdateUserRequest(BaseModel):
    """Update user request DTO - all fields optional."""

    name: str | None = Field(None, min_length=1, max_length=100)
    role: UserRole | None = None
    department: str | None = Field(None, max_length=100)
    employee_id: str | None = Field(None, max_length=50)
    is_active: bool | None = None
