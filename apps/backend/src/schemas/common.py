"""
Common schemas for API responses and pagination.
"""

from typing import TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Pagination query parameters."""

    skip: int = Field(default=0, ge=0, description="Number of items to skip")
    limit: int = Field(default=20, ge=1, le=100, description="Number of items per page")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "skip": 0,
                "limit": 20,
            }
        }
    )


class PaginatedResponse[T](BaseModel):
    """Generic paginated response wrapper."""

    items: list[T] = Field(..., description="List of items")
    total: int = Field(..., ge=0, description="Total number of items")
    skip: int = Field(..., ge=0, description="Number of items skipped")
    limit: int = Field(..., ge=1, description="Items per page")

    @property
    def page(self) -> int:
        """Current page number (1-based)."""
        return (self.skip // self.limit) + 1

    @property
    def pages(self) -> int:
        """Total number of pages."""
        return (self.total + self.limit - 1) // self.limit

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [],
                "total": 100,
                "skip": 0,
                "limit": 20,
            }
        }
    )


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str = Field(..., description="Response message")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "Operation completed successfully",
            }
        }
    )


class ErrorResponse(BaseModel):
    """Error response."""

    detail: str = Field(..., description="Error detail message")
    code: str | None = Field(None, description="Error code")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "detail": "Resource not found",
                "code": "NOT_FOUND",
            }
        }
    )
