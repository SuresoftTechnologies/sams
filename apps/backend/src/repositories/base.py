"""
Base repository implementing generic CRUD operations.

This module provides the CRUDBase generic class that can be used as a base
for all repository classes to avoid code duplication.
"""

from typing import Any

from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.database import Base


class CRUDBase[ModelType: Base, CreateSchemaType: BaseModel, UpdateSchemaType: BaseModel]:
    """
    Generic base class for CRUD operations.

    This class implements standard Create, Read, Update, Delete operations
    that can be inherited by specific repository classes.

    Type Parameters:
        ModelType: SQLAlchemy model class
        CreateSchemaType: Pydantic schema for creation
        UpdateSchemaType: Pydantic schema for updates

    Example:
        ```python
        class UserRepository(CRUDBase[User, CreateUserRequest, UpdateUserRequest]):
            def __init__(self):
                super().__init__(User)
        ```
    """

    def __init__(self, model: type[ModelType]) -> None:
        """
        Initialize the CRUD repository with a model class.

        Args:
            model: SQLAlchemy model class to perform operations on
        """
        self.model = model

    def get(self, db: Session, id: Any) -> ModelType | None:
        """
        Get a single record by ID.

        Args:
            db: Database session
            id: Primary key value

        Returns:
            Model instance if found, None otherwise
        """
        return db.query(self.model).filter(self.model.id == id).first()

    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100) -> list[ModelType]:
        """
        Get multiple records with pagination.

        Args:
            db: Database session
            skip: Number of records to skip (offset)
            limit: Maximum number of records to return

        Returns:
            List of model instances
        """
        return db.query(self.model).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """
        Create a new record.

        Args:
            db: Database session
            obj_in: Pydantic schema containing creation data

        Returns:
            Created model instance

        Example:
            ```python
            user_data = CreateUserRequest(email="test@example.com", name="Test")
            user = repository.create(db, obj_in=user_data)
            ```
        """
        # Convert Pydantic model to dict
        obj_in_data = obj_in.model_dump()

        # Create model instance from dict
        db_obj = self.model(**obj_in_data)

        # Add to session and commit
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        return db_obj

    def update(
        self, db: Session, *, db_obj: ModelType, obj_in: UpdateSchemaType | dict[str, Any]
    ) -> ModelType:
        """
        Update an existing record.

        Args:
            db: Database session
            db_obj: Existing model instance to update
            obj_in: Pydantic schema or dict containing update data

        Returns:
            Updated model instance

        Note:
            Only fields that are explicitly set (not None) will be updated.
            This allows for partial updates.
        """
        # Convert to dict if Pydantic model
        update_data = obj_in if isinstance(obj_in, dict) else obj_in.model_dump(exclude_unset=True)

        # Update model attributes
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        # Commit changes
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        return db_obj

    def delete(self, db: Session, *, id: Any) -> ModelType | None:
        """
        Delete a record by ID (hard delete).

        Args:
            db: Database session
            id: Primary key value

        Returns:
            Deleted model instance if found, None otherwise

        Warning:
            This performs a hard delete. For models with soft delete support,
            use the specific repository's delete method instead.
        """
        obj = db.query(self.model).filter(self.model.id == id).first()

        if obj:
            db.delete(obj)
            db.commit()

        return obj

    def count(self, db: Session) -> int:
        """
        Count total records.

        Args:
            db: Database session

        Returns:
            Total number of records
        """
        return db.query(self.model).count()

    def exists(self, db: Session, *, id: Any) -> bool:
        """
        Check if a record exists by ID.

        Args:
            db: Database session
            id: Primary key value

        Returns:
            True if record exists, False otherwise
        """
        return db.query(self.model).filter(self.model.id == id).first() is not None
