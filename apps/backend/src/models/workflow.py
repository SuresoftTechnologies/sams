"""
Workflow model for asset check-in/check-out requests.
"""

from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class WorkflowType(str, Enum):
    """Workflow type enum."""

    CHECKOUT = "checkout"  # Asset checkout/assignment request
    CHECKIN = "checkin"  # Asset return request
    TRANSFER = "transfer"  # Transfer between users
    MAINTENANCE = "maintenance"  # Maintenance request


class WorkflowStatus(str, Enum):
    """Workflow status enum."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class Workflow(Base):
    """Workflow model for managing asset checkout/checkin requests."""

    __tablename__ = "workflows"

    # Primary key
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)

    # Workflow info
    type: Mapped[WorkflowType] = mapped_column(String(20), nullable=False, index=True)
    status: Mapped[WorkflowStatus] = mapped_column(
        String(20), default=WorkflowStatus.PENDING, nullable=False, index=True
    )

    # Foreign keys
    asset_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("assets.id"), nullable=False, index=True
    )
    requester_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    assignee_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), index=True
    )  # Target user for transfer
    approver_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), index=True
    )

    # Request details
    reason: Mapped[str | None] = mapped_column(Text)  # Reason for request
    expected_return_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )  # For checkout

    # Approval/Rejection
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reject_reason: Mapped[str | None] = mapped_column(Text)

    # Completion
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completion_notes: Mapped[str | None] = mapped_column(Text)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    asset: Mapped["Asset"] = relationship("Asset", back_populates="workflows", lazy="joined")
    requester: Mapped["User"] = relationship(
        "User", foreign_keys=[requester_id], lazy="joined"
    )
    assignee: Mapped["User"] = relationship(
        "User", foreign_keys=[assignee_id], lazy="joined"
    )
    approver: Mapped["User"] = relationship(
        "User", foreign_keys=[approver_id], lazy="joined"
    )
    approvals: Mapped[list["Approval"]] = relationship("Approval", back_populates="workflow", lazy="select")

    def __repr__(self) -> str:
        return f"<Workflow(id={self.id}, type={self.type}, status={self.status}, asset_id={self.asset_id})>"
