"""
WorkflowHistory model for tracking workflow state transitions.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base
from src.models.workflow import WorkflowStatus


class WorkflowHistory(Base):
    """WorkflowHistory model for tracking all workflow state changes."""

    __tablename__ = "workflow_history"

    # Primary key
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)

    # Foreign keys
    workflow_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("workflows.id"), nullable=False, index=True
    )
    changed_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False
    )

    # State transition
    from_status: Mapped[WorkflowStatus | None] = mapped_column(String(20))
    to_status: Mapped[WorkflowStatus] = mapped_column(String(20), nullable=False)

    # Change details
    comment: Mapped[str | None] = mapped_column(Text)

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    # Relationships
    workflow: Mapped["Workflow"] = relationship("Workflow", lazy="select")
    user: Mapped["User"] = relationship("User", lazy="select")

    def __repr__(self) -> str:
        return f"<WorkflowHistory(id={self.id}, workflow_id={self.workflow_id}, from={self.from_status}, to={self.to_status})>"
