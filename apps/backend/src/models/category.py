"""
Category model for asset classification.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class Category(Base):
    """Category model for grouping assets."""

    __tablename__ = "categories"

    # Primary key
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)

    # Category info
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)

    # Hierarchical structure
    parent_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("categories.id"), index=True
    )

    # Display order
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Icon/Color for UI (optional)
    icon: Mapped[str | None] = mapped_column(String(50))
    color: Mapped[str | None] = mapped_column(String(7))  # Hex color code

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    # assets: Mapped[list["Asset"]] = relationship("Asset", back_populates="category")

    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name={self.name}, code={self.code})>"
