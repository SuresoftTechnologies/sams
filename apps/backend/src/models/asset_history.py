"""
AssetHistory model for tracking all asset changes.
"""

from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class HistoryAction(str, Enum):
    """History action enum."""

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


class AssetHistory(Base):
    """AssetHistory model for tracking all changes to assets."""

    __tablename__ = "asset_history"

    # Primary key
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)

    # Foreign keys
    asset_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("assets.id"), nullable=False, index=True
    )
    performed_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )

    # Action details
    action: Mapped[HistoryAction] = mapped_column(String(30), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)

    # Change tracking
    from_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"))
    to_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"))
    from_location_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("locations.id"))
    to_location_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("locations.id"))

    # Detailed changes (JSON)
    old_values: Mapped[dict | None] = mapped_column(JSONB)
    new_values: Mapped[dict | None] = mapped_column(JSONB)

    # Related workflow (if applicable)
    workflow_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("workflows.id"))

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    # Relationships
    asset: Mapped["Asset"] = relationship("Asset", lazy="joined")
    user: Mapped["User"] = relationship("User", foreign_keys=[performed_by], lazy="joined")
    from_user: Mapped["User"] = relationship(
        "User", foreign_keys=[from_user_id], lazy="select"
    )
    to_user: Mapped["User"] = relationship(
        "User", foreign_keys=[to_user_id], lazy="select"
    )
    from_location: Mapped["Location"] = relationship(
        "Location", foreign_keys=[from_location_id], lazy="select"
    )
    to_location: Mapped["Location"] = relationship(
        "Location", foreign_keys=[to_location_id], lazy="select"
    )
    # workflow: Mapped["Workflow"] = relationship("Workflow", lazy="select")

    def __repr__(self) -> str:
        return f"<AssetHistory(id={self.id}, asset_id={self.asset_id}, action={self.action})>"
