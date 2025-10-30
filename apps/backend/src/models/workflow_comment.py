"""
Workflow comment model for tracking discussions on asset requests.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class WorkflowComment(Base):
    """Comment model for workflow discussions between requesters and admins."""

    __tablename__ = "workflow_comments"

    # Primary key
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)

    # Foreign keys
    workflow_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("workflows.id"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )

    # Comment content
    comment: Mapped[str] = mapped_column(Text, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="comments", lazy="joined")
    user: Mapped["User"] = relationship("User", lazy="joined")

    def __repr__(self) -> str:
        return f"<WorkflowComment(id={self.id}, workflow_id={self.workflow_id}, user_id={self.user_id})>"
