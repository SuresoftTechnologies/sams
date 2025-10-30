"""
Asset schemas matching TypeScript shared-types.
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from src.schemas.common import PaginatedResponse


class AssetStatus(str, Enum):
    """Asset status enum - based on actual Excel data."""

    ISSUED = "issued"  # [지급장비] - 직원에게 지급된 장비
    LOANED = "loaned"  # [대여용] - 대여 가능한 장비
    GENERAL = "general"  # [일반장비] - 일반 사용 장비
    STOCK = "stock"  # [재고] - 재고/보관 중
    SERVER_ROOM = "server_room"  # [서버실] - 서버실 장비
    DISPOSED = "disposed"  # [불용] - 폐기/불용 처리


class AssetGrade(str, Enum):
    """Asset grade based on age - matches @sams/shared-types."""

    A = "A"  # 0-2 years
    B = "B"  # 2-4 years
    C = "C"  # 4+ years


class Asset(BaseModel):
    """
    Asset model - matches @sams/shared-types Asset interface.
    """

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "asset_tag": "SRS-11-2024-0001",
                "status": "stock",
                "category_id": "550e8400-e29b-41d4-a716-446655440001",
                "location_id": "550e8400-e29b-41d4-a716-446655440002",
                "purchase_date": "2024-01-15T00:00:00Z",
                "purchase_price": "1200000",
                "grade": "A",
                "created_at": "2024-01-15T09:00:00Z",
                "updated_at": "2024-01-15T09:00:00Z",
            }
        }
    )

    id: str = Field(..., description="Unique asset ID (UUID)")
    asset_tag: str = Field(..., description="Asset tag (e.g., SRS-11-2024-0001)")
    model: str | None = Field(None, description="Asset model (규격/모델명)")
    serial_number: str | None = Field(None, description="Serial number")
    status: AssetStatus = Field(default=AssetStatus.STOCK, description="Current status")

    # Relations
    category_id: str = Field(..., description="Category ID")
    location_id: str | None = Field(None, description="Location ID")
    assigned_to: str | None = Field(None, description="User ID of assignee")

    # Computed fields (joined from relations)
    category_name: str | None = Field(None, description="Category name (from join)")
    location_name: str | None = Field(None, description="Location name (from join)")
    assigned_user_name: str | None = Field(None, description="Assigned user name (from join)")

    # User history (stored as strings in DB)
    previous_user_1: str | None = Field(None, description="Previous user 1")
    previous_user_2: str | None = Field(None, description="Previous user 2")
    first_user: str | None = Field(None, description="First user")

    # Purchase info
    purchase_date: datetime | None = Field(None, description="Purchase date (구매연일)")
    purchase_price: Decimal | None = Field(None, description="Purchase price (구매가)")
    supplier: str | None = Field(None, description="Supplier (구매처)")

    # QR Code
    qr_code: str | None = Field(None, description="QR code URL or Base64")

    # Metadata
    grade: AssetGrade | None = Field(None, description="Asset grade (A/B/C)")
    description: str | None = Field(None, description="Asset description")
    notes: str | None = Field(None, description="Additional notes")
    specifications: str | None = Field(None, description="Technical specifications (JSON)")

    # Timestamps
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class CreateAssetRequest(BaseModel):
    """Create asset request DTO."""

    asset_tag: str | None = Field(None, min_length=1, max_length=50, description="Asset tag (auto-generated if not provided)")
    model: str | None = Field(None, max_length=255, description="Asset model/specification")
    serial_number: str | None = Field(None, max_length=255, description="Serial number")
    category_id: str = Field(..., description="Category ID")
    status: AssetStatus = Field(default=AssetStatus.STOCK, description="Initial status")

    location_id: str | None = Field(None, description="Location ID")
    purchase_date: datetime | None = None
    purchase_price: Decimal | None = Field(None, ge=0)
    supplier: str | None = Field(None, max_length=255, description="Supplier name")
    notes: str | None = Field(None, max_length=1000)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "asset_tag": "SRS-11-2024-0001",
                "model": "Dell Latitude 5420",
                "serial_number": "ABC123456",
                "category_id": "550e8400-e29b-41d4-a716-446655440001",
                "status": "stock",
                "location_id": "550e8400-e29b-41d4-a716-446655440002",
                "purchase_date": "2024-01-15T00:00:00Z",
                "purchase_price": "1200000",
                "supplier": "Dell Korea",
            }
        }
    )


class UpdateAssetRequest(BaseModel):
    """Update asset request DTO - all fields optional."""

    status: AssetStatus | None = None
    category_id: str | None = None
    location_id: str | None = None
    assigned_to: str | None = None
    purchase_date: datetime | None = None
    purchase_price: Decimal | None = Field(None, ge=0)
    notes: str | None = Field(None, max_length=1000)
    grade: AssetGrade | None = None


class AssetFilterParams(BaseModel):
    """Asset filter and search parameters."""

    search: str | None = Field(None, description="Search term (asset_tag, model, serial_number)")
    status: AssetStatus | None = Field(None, description="Filter by status")
    category_id: str | None = Field(None, description="Filter by category")
    location_id: str | None = Field(None, description="Filter by location")
    assigned_to: str | None = Field(None, description="Filter by assignee")
    grade: AssetGrade | None = Field(None, description="Filter by grade")
    sort_by: str | None = Field(None, description="Sort field")
    sort_order: str | None = Field(None, description="Sort order (asc/desc)")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "search": "Dell",
                "status": "stock",
                "category_id": "550e8400-e29b-41d4-a716-446655440001",
                "sort_by": "created_at",
                "sort_order": "desc",
            }
        }
    )


class AssetListResponse(PaginatedResponse[Asset]):
    """Paginated asset list response."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "items": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "asset_tag": "SRS-11-2024-0001",
                "status": "stock",
                        "category_id": "550e8400-e29b-41d4-a716-446655440001",
                        "grade": "A",
                        "created_at": "2024-01-15T09:00:00Z",
                        "updated_at": "2024-01-15T09:00:00Z",
                    }
                ],
                "total": 100,
                "skip": 0,
                "limit": 20,
            }
        }
    )
