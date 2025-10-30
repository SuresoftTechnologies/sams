"""
User model for authentication and authorization.
"""

from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class UserRole(str, Enum):
    """User role enum."""

    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"


class User(Base):
    """User model for authentication and user management."""

    __tablename__ = "users"

    # Primary key
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)

    # Authentication
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Profile
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[UserRole] = mapped_column(String(20), default=UserRole.EMPLOYEE, nullable=False, index=True)
    department_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("departments.id"), index=True
    )
    phone: Mapped[str | None] = mapped_column(String(20))
    avatar_url: Mapped[str | None] = mapped_column(String(500))

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationships
    department: Mapped["Department | None"] = relationship(
        "Department", foreign_keys=[department_id], back_populates="members", lazy="select"
    )
    managed_department: Mapped["Department | None"] = relationship(
        "Department", foreign_keys="Department.manager_id", back_populates="manager", lazy="select"
    )
    # assets: Mapped[list["Asset"]] = relationship("Asset", back_populates="assigned_user")
    # workflows_requested: Mapped[list["Workflow"]] = relationship(
    #     "Workflow", foreign_keys="Workflow.requester_id", back_populates="requester"
    # )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
