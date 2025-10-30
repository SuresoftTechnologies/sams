"""
Approval model for workflow approval tracking.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base
from src.models.workflow import WorkflowStatus


class Approval(Base):
    """Approval model for tracking workflow approval steps."""

    __tablename__ = "approvals"

    # Primary key
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)

    # Foreign keys
    workflow_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True
    )
    approver_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )

    # Approval status
    status: Mapped[WorkflowStatus] = mapped_column(
        String(20), default=WorkflowStatus.PENDING, nullable=False, index=True
    )

    # Approval comment
    comment: Mapped[str | None] = mapped_column(Text)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="approvals", lazy="select")
    approver: Mapped["User"] = relationship("User", lazy="select")

    def __repr__(self) -> str:
        return f"<Approval(id={self.id}, workflow_id={self.workflow_id}, status={self.status})>"