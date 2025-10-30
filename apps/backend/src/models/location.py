"""
Location model for asset tracking.
"""

from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class LocationSite(str, Enum):
    """Location site enum."""

    PANGYO = "pangyo"  # 판교
    DAEJEON = "daejeon"  # 대전


class Location(Base):
    """Location model for tracking asset physical locations."""

    __tablename__ = "locations"

    # Primary key
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)

    # Location hierarchy
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)

    # Detailed location info
    site: Mapped[LocationSite | None] = mapped_column(String(50), index=True)  # e.g., "판교", "대전"
    building: Mapped[str | None] = mapped_column(String(50))  # e.g., "본관", "연구동"
    floor: Mapped[str | None] = mapped_column(String(10))  # e.g., "3F", "B1"
    room: Mapped[str | None] = mapped_column(String(20))  # e.g., "301호", "회의실A"

    description: Mapped[str | None] = mapped_column(Text)

    # Coordinates (optional, for mapping)
    latitude: Mapped[float | None] = mapped_column()
    longitude: Mapped[float | None] = mapped_column()

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
    # assets: Mapped[list["Asset"]] = relationship("Asset", back_populates="location")

    def __repr__(self) -> str:
        full_location = f"{self.site}/{self.building}/{self.floor}/{self.room}"
        return f"<Location(id={self.id}, name={self.name}, location={full_location})>"
