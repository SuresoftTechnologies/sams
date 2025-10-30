"""
AssetAttachment model for managing asset-related files.
"""

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class AssetAttachment(Base):
    """AssetAttachment model for managing files attached to assets."""

    __tablename__ = "asset_attachments"

    # Primary key
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)

    # Foreign keys
    asset_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    uploaded_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )

    # File information
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    file_type: Mapped[str | None] = mapped_column(String(50))  # MIME type
    file_size: Mapped[int | None] = mapped_column(BigInteger)  # Size in bytes

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    asset: Mapped["Asset"] = relationship("Asset", back_populates="attachments", lazy="select")
    uploader: Mapped["User"] = relationship("User", lazy="select")

    def __repr__(self) -> str:
        return f"<AssetAttachment(id={self.id}, asset_id={self.asset_id}, file_name={self.file_name})>"