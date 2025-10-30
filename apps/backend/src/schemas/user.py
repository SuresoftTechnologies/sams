"""
User schemas matching TypeScript shared-types.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserRole(str, Enum):
    """User role enum - matches @ams/shared-types."""

    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"


class User(BaseModel):
    """
    User model - matches @ams/shared-types User interface.
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
