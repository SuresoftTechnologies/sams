"""
Asset model - core entity for asset management.
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class AssetStatus(str, Enum):
    """Asset status enum."""

    AVAILABLE = "available"
    ASSIGNED = "assigned"
    IN_TRANSIT = "in_transit"
    MAINTENANCE = "maintenance"
    DISPOSED = "disposed"


class AssetGrade(str, Enum):
    """Asset grade based on age."""

    A = "A"  # 0-2 years
    B = "B"  # 2-4 years
    C = "C"  # 4+ years


class Asset(Base):
    """Asset model - core entity for tracking company assets."""

    __tablename__ = "assets"

    # Primary key
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)

    # Asset identification
    asset_tag: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )  # e.g., SRS-11-2024-0001
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    model: Mapped[str | None] = mapped_column(String(100))
    serial_number: Mapped[str | None] = mapped_column(String(100), unique=True, index=True)
    manufacturer: Mapped[str | None] = mapped_column(String(100))

    # Status and grade
    status: Mapped[AssetStatus] = mapped_column(
        String(20), default=AssetStatus.AVAILABLE, nullable=False, index=True
    )
    grade: Mapped[AssetGrade] = mapped_column(String(1), default=AssetGrade.A, nullable=False)

    # Foreign keys
    category_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("categories.id"), nullable=False, index=True
    )
    location_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("locations.id"), index=True
    )
    assigned_to: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), index=True
    )

    # Purchase information
    purchase_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    purchase_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    supplier: Mapped[str | None] = mapped_column(String(100))
    warranty_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # QR Code
    qr_code: Mapped[str | None] = mapped_column(String(255))  # URL or Base64 encoded image

    # Additional info
    description: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    specifications: Mapped[str | None] = mapped_column(Text)  # JSON string

    # Soft delete
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    category: Mapped["Category"] = relationship("Category", lazy="joined")
    location: Mapped["Location"] = relationship("Location", lazy="joined")
    assigned_user: Mapped["User"] = relationship("User", lazy="joined")
    # history: Mapped[list["AssetHistory"]] = relationship("AssetHistory", back_populates="asset")

    @property
    def is_deleted(self) -> bool:
        """Check if asset is soft-deleted."""
        return self.deleted_at is not None

    def __repr__(self) -> str:
        return f"<Asset(id={self.id}, tag={self.asset_tag}, name={self.name}, status={self.status})>"
