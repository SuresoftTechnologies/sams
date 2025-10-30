"""
Category schemas.
"""

from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class Category(BaseModel):
    """Category model."""

    id: str = Field(..., description="Unique category ID (UUID)")
    name: str = Field(..., description="Category name")
    code: str = Field(..., description="Category code")
    description: str | None = Field(None, description="Category description")
    is_active: bool = Field(default=True, description="Active status")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "노트북",
                "code": "NOTEBOOK",
                "description": "노트북 컴퓨터",
                "is_active": True,
                "created_at": "2024-01-15T09:00:00Z",
                "updated_at": "2024-01-15T09:00:00Z",
            }
        }
    )


class CreateCategoryRequest(BaseModel):
    """Create category request DTO."""

    name: str = Field(..., min_length=1, max_length=100, description="Category name")
    code: str = Field(..., min_length=1, max_length=20, description="Category code")
    description: str | None = Field(None, max_length=500, description="Description")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "노트북",
                "code": "NOTEBOOK",
                "description": "노트북 컴퓨터",
            }
        }
    )


class UpdateCategoryRequest(BaseModel):
    """Update category request DTO - all fields optional."""

    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    is_active: bool | None = None
