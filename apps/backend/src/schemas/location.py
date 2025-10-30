"""
Location schemas.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class Location(BaseModel):
    """Location model."""

    id: str = Field(..., description="Unique location ID (UUID)")
    name: str = Field(..., description="Location name")
    code: str = Field(..., description="Location code")
    site: str | None = Field(None, description="Site (e.g., 판교, 대전)")
    building: str | None = Field(None, description="Building")
    floor: str | None = Field(None, description="Floor")
    room: str | None = Field(None, description="Room number")
    is_active: bool = Field(default=True, description="Active status")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "판교 본사 3층 개발실",
                "code": "PG-HQ-3F-DEV",
                "site": "판교",
                "building": "본사",
                "floor": "3F",
                "room": "개발실",
                "is_active": True,
                "created_at": "2024-01-15T09:00:00Z",
                "updated_at": "2024-01-15T09:00:00Z",
            }
        }
    )


class CreateLocationRequest(BaseModel):
    """Create location request DTO."""

    name: str = Field(..., min_length=1, max_length=100, description="Location name")
    code: str = Field(..., min_length=1, max_length=20, description="Location code")
    site: str | None = Field(None, max_length=50, description="Site")
    building: str | None = Field(None, max_length=50, description="Building")
    floor: str | None = Field(None, max_length=10, description="Floor")
    room: str | None = Field(None, max_length=20, description="Room")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "판교 본사 3층 개발실",
                "code": "PG-HQ-3F-DEV",
                "site": "판교",
                "building": "본사",
                "floor": "3F",
                "room": "개발실",
            }
        }
    )


class UpdateLocationRequest(BaseModel):
    """Update location request DTO - all fields optional."""

    name: str | None = Field(None, min_length=1, max_length=100)
    site: str | None = Field(None, max_length=50)
    building: str | None = Field(None, max_length=50)
    floor: str | None = Field(None, max_length=10)
    room: str | None = Field(None, max_length=20)
    is_active: bool | None = None
