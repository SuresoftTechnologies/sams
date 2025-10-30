"""
Asset history schemas for API responses.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class HistoryAction(str, Enum):
    """History action enum - matches model."""

    CREATED = "created"
    UPDATED = "updated"
    ASSIGNED = "assigned"
    UNASSIGNED = "unassigned"
    TRANSFERRED = "transferred"
    LOCATION_CHANGED = "location_changed"
    STATUS_CHANGED = "status_changed"
    MAINTENANCE_START = "maintenance_start"
    MAINTENANCE_END = "maintenance_end"
    DISPOSED = "disposed"
    DELETED = "deleted"
    RESTORED = "restored"


class AssetHistoryUser(BaseModel):
    """User information for history."""

    id: str
    name: str
    email: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AssetHistory(BaseModel):
    """
    Asset history response schema.

    Represents a single event in an asset's lifecycle.
    """

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "asset_id": "550e8400-e29b-41d4-a716-446655440001",
                "action": "created",
                "description": "Asset created: Dell Latitude 5420",
                "performed_by": "550e8400-e29b-41d4-a716-446655440002",
                "user_name": "홍길동",
                "old_values": None,
                "new_values": {"status": "stock", "category_id": "..."},
                "created_at": "2024-10-31T10:00:00Z",
            }
        }
    )

    id: str = Field(..., description="History record ID (UUID)")
    asset_id: str = Field(..., description="Asset ID")
    action: HistoryAction = Field(..., description="Type of action performed")
    description: str | None = Field(None, description="Human-readable description in Korean")
    performed_by: str = Field(..., description="User ID who performed the action")

    # Joined user data
    user_name: str | None = Field(None, description="Name of user who performed action")
    user_email: str | None = Field(None, description="Email of user who performed action")

    # Change tracking
    from_user_id: str | None = Field(None, description="Previous user ID (for assignments)")
    to_user_id: str | None = Field(None, description="New user ID (for assignments)")
    from_location_id: str | None = Field(None, description="Previous location ID")
    to_location_id: str | None = Field(None, description="New location ID")

    # Detailed changes (JSON)
    old_values: dict | None = Field(None, description="Previous values (JSONB)")
    new_values: dict | None = Field(None, description="New values (JSONB)")

    # Related workflow
    workflow_id: str | None = Field(None, description="Related workflow ID (if applicable)")

    # Timestamp
    created_at: datetime = Field(..., description="When this event occurred")


class AssetHistoryListResponse(BaseModel):
    """Response for list of asset history events."""

    items: list[AssetHistory] = Field(..., description="List of history events")
    total: int = Field(..., description="Total number of events")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "asset_id": "550e8400-e29b-41d4-a716-446655440001",
                        "action": "created",
                        "description": "Asset created",
                        "user_name": "홍길동",
                        "created_at": "2024-10-31T10:00:00Z",
                    }
                ],
                "total": 25,
            }
        }
    )
