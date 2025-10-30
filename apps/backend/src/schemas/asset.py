"""
Asset schemas matching TypeScript shared-types.
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict


class AssetStatus(str, Enum):
    """Asset status enum - matches @ams/shared-types."""

    AVAILABLE = "available"
    ASSIGNED = "assigned"
    IN_TRANSIT = "in_transit"
    MAINTENANCE = "maintenance"
    DISPOSED = "disposed"


class AssetGrade(str, Enum):
    """Asset grade based on age - matches @ams/shared-types."""

    A = "A"  # 0-2 years
    B = "B"  # 2-4 years
    C = "C"  # 4+ years


class Asset(BaseModel):
    """
    Asset model - matches @ams/shared-types Asset interface.
    """

    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Unique asset ID (UUID)")
    asset_tag: str = Field(..., description="Asset tag (e.g., SRS-11-2024-0001)")
    name: str = Field(..., description="Asset name")
    status: AssetStatus = Field(default=AssetStatus.AVAILABLE, description="Current status")

    # Relations
    category_id: str = Field(..., description="Category ID")
    location_id: str | None = Field(None, description="Location ID")
    assigned_to: str | None = Field(None, description="User ID of assignee")

    # Purchase info
    purchase_date: datetime | None = Field(None, description="Purchase date")
    purchase_price: Decimal | None = Field(None, description="Purchase price")
    warranty_end: datetime | None = Field(None, description="Warranty end date")

    # Metadata
    grade: AssetGrade | None = Field(None, description="Asset grade (A/B/C)")
    notes: str | None = Field(None, description="Additional notes")
    qr_code_url: str | None = Field(None, description="QR code image URL")

    # Timestamps
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "asset_tag": "SRS-11-2024-0001",
                "name": "Dell Latitude 5420",
                "status": "available",
                "category_id": "550e8400-e29b-41d4-a716-446655440001",
                "location_id": "550e8400-e29b-41d4-a716-446655440002",
                "purchase_date": "2024-01-15T00:00:00Z",
                "purchase_price": "1200000",
                "warranty_end": "2027-01-15T00:00:00Z",
                "grade": "A",
                "created_at": "2024-01-15T09:00:00Z",
                "updated_at": "2024-01-15T09:00:00Z",
            }
        }
    )


class CreateAssetRequest(BaseModel):
    """Create asset request DTO."""

    asset_tag: str = Field(..., min_length=1, max_length=50, description="Asset tag")
    name: str = Field(..., min_length=1, max_length=200, description="Asset name")
    category_id: str = Field(..., description="Category ID")
    status: AssetStatus = Field(default=AssetStatus.AVAILABLE, description="Initial status")

    location_id: str | None = Field(None, description="Location ID")
    purchase_date: datetime | None = None
    purchase_price: Decimal | None = Field(None, ge=0)
    warranty_end: datetime | None = None
    notes: str | None = Field(None, max_length=1000)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "asset_tag": "SRS-11-2024-0001",
                "name": "Dell Latitude 5420",
                "category_id": "550e8400-e29b-41d4-a716-446655440001",
                "status": "available",
                "location_id": "550e8400-e29b-41d4-a716-446655440002",
                "purchase_date": "2024-01-15T00:00:00Z",
                "purchase_price": "1200000",
                "warranty_end": "2027-01-15T00:00:00Z",
            }
        }
    )


class UpdateAssetRequest(BaseModel):
    """Update asset request DTO - all fields optional."""

    name: str | None = Field(None, min_length=1, max_length=200)
    status: AssetStatus | None = None
    category_id: str | None = None
    location_id: str | None = None
    assigned_to: str | None = None
    purchase_date: datetime | None = None
    purchase_price: Decimal | None = Field(None, ge=0)
    warranty_end: datetime | None = None
    notes: str | None = Field(None, max_length=1000)
    grade: AssetGrade | None = None
