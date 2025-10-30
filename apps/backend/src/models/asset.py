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
    """Asset status enum - based on actual Excel data."""

    ISSUED = "issued"  # [지급장비] - 직원에게 지급된 장비
    LOANED = "loaned"  # [대여용] - 대여 가능한 장비
    GENERAL = "general"  # [일반장비] - 일반 사용 장비
    STOCK = "stock"  # [재고] - 재고/보관 중
    SERVER_ROOM = "server_room"  # [서버실] - 서버실 장비
    DISPOSED = "disposed"  # [불용] - 폐기/불용 처리


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
        String(20), default=AssetStatus.STOCK, nullable=False, index=True
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
    purchase_request: Mapped[str | None] = mapped_column(String(100))  # 구매 품의
    tax_invoice_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))  # 세금계산서 발행일
    warranty_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    
    # Excel columns: furniture/detailed category
    furniture_category: Mapped[str | None] = mapped_column(String(50))  # 집기품목
    detailed_category: Mapped[str | None] = mapped_column(String(50))  # 상세품목
    
    # Asset usage history (from Excel)
    checkout_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))  # 반출날짜
    return_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))  # 반납날짜
    previous_user_1: Mapped[str | None] = mapped_column(String(100))  # 이전 사용자 1
    previous_user_2: Mapped[str | None] = mapped_column(String(100))  # 이전 사용자 2
    first_user: Mapped[str | None] = mapped_column(String(100))  # 최초 사용자
    
    # Asset identification (additional)
    old_asset_number: Mapped[str | None] = mapped_column(String(50))  # 기존번호
    qr_code_exists: Mapped[str | None] = mapped_column(String(10))  # QR코드 유무

    # QR Code
    qr_code: Mapped[str | None] = mapped_column(String(255))  # URL or Base64 encoded image

    # Additional info
    description: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)  # 비고
    special_notes: Mapped[str | None] = mapped_column(Text)  # 특이사항
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
    # lazy="select": 기본 lazy loading, API에서 명시적으로 JOIN 제어
    # 이렇게 하면 불필요한 조인을 방지하고 성능 최적화 가능
    category: Mapped["Category"] = relationship("Category", lazy="select")
    location: Mapped["Location"] = relationship("Location", lazy="select")
    assigned_user: Mapped["User"] = relationship("User", lazy="select")
    # history: Mapped[list["AssetHistory"]] = relationship("AssetHistory", back_populates="asset")

    @property
    def is_deleted(self) -> bool:
        """Check if asset is soft-deleted."""
        return self.deleted_at is not None

    def __repr__(self) -> str:
        return f"<Asset(id={self.id}, tag={self.asset_tag}, name={self.name}, status={self.status})>"
