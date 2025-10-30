"""
Repository for workflow comment operations.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.models.workflow_comment import WorkflowComment
from src.repositories.base import CRUDBase
from src.schemas.workflow_comment import WorkflowCommentCreate, WorkflowCommentUpdate


class WorkflowCommentRepository(CRUDBase[WorkflowComment, WorkflowCommentCreate, WorkflowCommentUpdate]):
    """Repository for workflow comment CRUD operations."""

    def __init__(self):
        super().__init__(WorkflowComment)

    async def create_comment(
        self,
        db: AsyncSession,
        workflow_id: str,
        user_id: str,
        comment_data: WorkflowCommentCreate,
    ) -> WorkflowComment:
        """
        Create a new workflow comment.

        Args:
            db: Database session
            workflow_id: ID of the workflow
            user_id: ID of the user creating the comment
            comment_data: Comment creation data

        Returns:
            Created workflow comment
        """
        comment = WorkflowComment(
            id=str(uuid.uuid4()),
            workflow_id=workflow_id,
            user_id=user_id,
            comment=comment_data.comment,
        )

        db.add(comment)
        await db.commit()
        await db.refresh(comment)

        # Load user relationship
        result = await db.execute(
            select(WorkflowComment)
            .where(WorkflowComment.id == comment.id)
            .options(selectinload(WorkflowComment.user))
        )
        return result.scalar_one()

    async def get_comments_by_workflow(
        self,
        db: AsyncSession,
        workflow_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[WorkflowComment]:
        """
        Get all comments for a workflow.

        Args:
            db: Database session
            workflow_id: ID of the workflow
            skip: Number of comments to skip
            limit: Maximum number of comments to return

        Returns:
            List of workflow comments
        """
        result = await db.execute(
            select(WorkflowComment)
            .where(WorkflowComment.workflow_id == workflow_id)
            .options(selectinload(WorkflowComment.user))
            .order_by(WorkflowComment.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_comment(
        self,
        db: AsyncSession,
        comment_id: str,
    ) -> WorkflowComment | None:
        """
        Get a single comment by ID.

        Args:
            db: Database session
            comment_id: ID of the comment

        Returns:
            Workflow comment or None if not found
        """
        result = await db.execute(
            select(WorkflowComment)
            .where(WorkflowComment.id == comment_id)
            .options(selectinload(WorkflowComment.user))
        )
        return result.scalar_one_or_none()

    async def update_comment(
        self,
        db: AsyncSession,
        comment_id: str,
        comment_data: WorkflowCommentUpdate,
    ) -> WorkflowComment | None:
        """
        Update a workflow comment.

        Args:
            db: Database session
            comment_id: ID of the comment to update
            comment_data: Updated comment data

        Returns:
            Updated workflow comment or None if not found
        """
        comment = await self.get_comment(db, comment_id)
        if not comment:
            return None

        comment.comment = comment_data.comment
        await db.commit()
        await db.refresh(comment)

        # Reload with user relationship
        return await self.get_comment(db, comment_id)

    async def delete_comment(
        self,
        db: AsyncSession,
        comment_id: str,
    ) -> bool:
        """
        Delete a workflow comment.

        Args:
            db: Database session
            comment_id: ID of the comment to delete

        Returns:
            True if deleted, False if not found
        """
        comment = await self.get_comment(db, comment_id)
        if not comment:
            return False

        await db.delete(comment)
        await db.commit()
        return True

    async def user_can_modify_comment(
        self,
        db: AsyncSession,
        comment_id: str,
        user_id: str,
    ) -> bool:
        """
        Check if a user can modify (update/delete) a comment.

        Args:
            db: Database session
            comment_id: ID of the comment
            user_id: ID of the user

        Returns:
            True if user can modify the comment
        """
        comment = await self.get_comment(db, comment_id)
        if not comment:
            return False

        return comment.user_id == user_id


# Create singleton instance
workflow_comment_repository = WorkflowCommentRepository()
