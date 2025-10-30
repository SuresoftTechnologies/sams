"""
Department model for organizational structure.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class Department(Base):
    """Department model for organizational hierarchy."""

    __tablename__ = "departments"

    # Primary key
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)

    # Department info
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)

    # Hierarchical structure
    parent_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("departments.id"), index=True
    )
    manager_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id")
    )

    # Display order
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

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
    parent: Mapped["Department"] = relationship(
        "Department", remote_side=[id], back_populates="children", lazy="select"
    )
    children: Mapped[list["Department"]] = relationship(
        "Department", back_populates="parent", lazy="select"
    )
    manager: Mapped["User"] = relationship("User", lazy="select")

    def __repr__(self) -> str:
        return f"<Department(id={self.id}, name={self.name}, code={self.code})>"