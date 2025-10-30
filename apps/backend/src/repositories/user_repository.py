"""
User repository for user-specific database operations.

This module provides the UserRepository class with custom methods for
user authentication and user-specific queries.
"""

from datetime import UTC

from sqlalchemy.orm import Session

from src.models.user import User, UserRole
from src.repositories.base import CRUDBase
from src.schemas.user import CreateUserRequest, UpdateUserRequest
from src.utils.security import hash_password, verify_password


class UserRepository(CRUDBase[User, CreateUserRequest, UpdateUserRequest]):
    """
    Repository for User model with custom query methods.

    Extends CRUDBase to provide user-specific operations such as:
    - Query by email
    - Authentication with password verification
    - Role-based queries
    """

    def __init__(self) -> None:
        """Initialize user repository."""
        super().__init__(User)

    def get_by_email(self, db: Session, *, email: str) -> User | None:
        """
        Query user by email address.

        Args:
            db: Database session
            email: Email address to search for

        Returns:
            User if found, None otherwise
        """
        return db.query(User).filter(User.email == email).first()

    def authenticate(self, db: Session, *, email: str, password: str) -> User | None:
        """
        Authenticate a user with email and password.

        Args:
            db: Database session
            email: User email address
            password: Plain text password

        Returns:
            User object if authentication successful, None otherwise

        Example:
            ```python
            user = repository.authenticate(db, email="user@example.com", password="secret")
            if user:
                # Authentication successful
                print(f"Welcome {user.name}")
            else:
                # Authentication failed
                print("Invalid credentials")
            ```
        """
        # Get user by email
        user = self.get_by_email(db, email=email)

        # Return None if user not found
        if not user:
            return None

        # Verify password
        if not verify_password(password, user.password_hash):
            return None

        # Check if user is active
        if not user.is_active:
            return None

        return user

    def create_with_password(self, db: Session, *, obj_in: CreateUserRequest) -> User:
        """
        Create a new user with hashed password.

        Args:
            db: Database session
            obj_in: User creation data including plain text password

        Returns:
            Created user instance

        Note:
            The password field in obj_in will be hashed before storage.
        """
        # Convert to dict
        user_data = obj_in.model_dump()

        # Hash the password
        password = user_data.pop("password")
        password_hash = hash_password(password)

        # Create user with hashed password
        db_user = User(**user_data, password_hash=password_hash)

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return db_user

    def update_password(self, db: Session, *, user: User, new_password: str) -> User:
        """
        Update user password.

        Args:
            db: Database session
            user: User instance to update
            new_password: New plain text password

        Returns:
            Updated user instance
        """
        # Hash new password
        user.password_hash = hash_password(new_password)

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    def get_by_role(
        self, db: Session, *, role: UserRole, skip: int = 0, limit: int = 100
    ) -> list[User]:
        """
        Get users by role.

        Args:
            db: Database session
            role: User role to filter by
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of users with the specified role
        """
        return db.query(User).filter(User.role == role).offset(skip).limit(limit).all()

    def get_active_users(self, db: Session, *, skip: int = 0, limit: int = 100) -> list[User]:
        """
        Get all active users.

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of active users
        """
        return (
            db.query(User)
            .filter(
                User.is_active == True  # noqa: E712
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def deactivate(self, db: Session, *, user_id: str) -> User | None:
        """
        Deactivate a user account.

        Args:
            db: Database session
            user_id: User ID to deactivate

        Returns:
            Deactivated user if found, None otherwise
        """
        user = self.get(db, id=user_id)

        if user:
            user.is_active = False
            db.add(user)
            db.commit()
            db.refresh(user)

        return user

    def activate(self, db: Session, *, user_id: str) -> User | None:
        """
        Activate a user account.

        Args:
            db: Database session
            user_id: User ID to activate

        Returns:
            Activated user if found, None otherwise
        """
        user = self.get(db, id=user_id)

        if user:
            user.is_active = True
            db.add(user)
            db.commit()
            db.refresh(user)

        return user

    def verify_email(self, db: Session, *, user_id: str) -> User | None:
        """
        Mark user email as verified.

        Args:
            db: Database session
            user_id: User ID to verify

        Returns:
            Verified user if found, None otherwise
        """
        user = self.get(db, id=user_id)

        if user:
            user.is_verified = True
            db.add(user)
            db.commit()
            db.refresh(user)

        return user

    def count_by_role(self, db: Session, *, role: UserRole) -> int:
        """
        Count users by role.

        Args:
            db: Database session
            role: User role to count

        Returns:
            Number of users with the specified role
        """
        return db.query(User).filter(User.role == role).count()

    def search_by_name_or_email(
        self, db: Session, *, search_term: str, skip: int = 0, limit: int = 100
    ) -> list[User]:
        """
        Search users by name or email.

        Args:
            db: Database session
            search_term: Search string to match against name or email
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of matching users
        """
        search_pattern = f"%{search_term}%"

        return (
            db.query(User)
            .filter((User.name.ilike(search_pattern)) | (User.email.ilike(search_pattern)))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def exists_by_email(self, db: Session, *, email: str) -> bool:
        """
        Check if a user with the given email exists.

        Args:
            db: Database session
            email: Email address to check

        Returns:
            True if user exists, False otherwise
        """
        return db.query(User).filter(User.email == email).first() is not None

    def update_last_login(self, db: Session, *, user: User) -> User:
        """
        Update user's last login timestamp.

        Args:
            db: Database session
            user: User instance to update

        Returns:
            Updated user instance
        """
        from datetime import datetime

        user.last_login_at = datetime.now(UTC)
        db.add(user)
        db.commit()
        db.refresh(user)

        return user


# Singleton instance
user_repository = UserRepository()
