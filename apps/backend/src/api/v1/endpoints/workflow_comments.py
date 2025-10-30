"""
Workflow comment management endpoints.
"""


from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.middlewares.auth import get_current_user
from src.models.user import User as UserModel
from src.models.user import UserRole
from src.models.workflow import Workflow as WorkflowModel
from src.repositories.workflow_comment_repository import workflow_comment_repository
from src.schemas.workflow_comment import (
    WorkflowCommentCreate,
    WorkflowCommentResponse,
    WorkflowCommentUpdate,
)

router = APIRouter()


async def check_workflow_access(
    workflow_id: str,
    current_user: UserModel,
    db: AsyncSession,
) -> WorkflowModel:
    """
    Check if user has access to the workflow.

    Args:
        workflow_id: ID of the workflow
        current_user: Current authenticated user
        db: Database session

    Returns:
        Workflow if accessible

    Raises:
        HTTPException: If workflow not found or access denied
    """
    # Get workflow
    result = await db.execute(
        select(WorkflowModel).where(WorkflowModel.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    # Check access based on role
    if current_user.role == UserRole.EMPLOYEE:
        # Employees can only access their own workflows
        if workflow.requester_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this workflow",
            )
    # Managers and Admins can access all workflows

    return workflow


@router.post(
    "/workflows/{workflow_id}/comments",
    response_model=WorkflowCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_workflow_comment(
    workflow_id: str = Path(..., description="Workflow ID"),
    comment_data: WorkflowCommentCreate = ...,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> WorkflowCommentResponse:
    """
    Create a new comment on a workflow.

    Args:
        workflow_id: ID of the workflow
        comment_data: Comment creation data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created comment

    Raises:
        HTTPException: If workflow not found or access denied
    """
    # Check workflow access
    await check_workflow_access(workflow_id, current_user, db)

    # Create comment
    comment = await workflow_comment_repository.create_comment(
        db=db,
        workflow_id=workflow_id,
        user_id=current_user.id,
        comment_data=comment_data,
    )

    return WorkflowCommentResponse.model_validate(comment)


@router.get(
    "/workflows/{workflow_id}/comments",
    response_model=list[WorkflowCommentResponse],
)
async def get_workflow_comments(
    workflow_id: str = Path(..., description="Workflow ID"),
    skip: int = Query(0, ge=0, description="Number of comments to skip"),
    limit: int = Query(100, ge=1, le=500, description="Number of comments to return"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> list[WorkflowCommentResponse]:
    """
    Get all comments for a workflow.

    Args:
        workflow_id: ID of the workflow
        skip: Number of comments to skip
        limit: Maximum number of comments to return
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of workflow comments

    Raises:
        HTTPException: If workflow not found or access denied
    """
    # Check workflow access
    await check_workflow_access(workflow_id, current_user, db)

    # Get comments
    comments = await workflow_comment_repository.get_comments_by_workflow(
        db=db,
        workflow_id=workflow_id,
        skip=skip,
        limit=limit,
    )

    return [WorkflowCommentResponse.model_validate(comment) for comment in comments]


@router.put(
    "/workflows/{workflow_id}/comments/{comment_id}",
    response_model=WorkflowCommentResponse,
)
async def update_workflow_comment(
    workflow_id: str = Path(..., description="Workflow ID"),
    comment_id: str = Path(..., description="Comment ID"),
    comment_data: WorkflowCommentUpdate = ...,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> WorkflowCommentResponse:
    """
    Update a workflow comment.

    Only the comment author or admins can update comments.

    Args:
        workflow_id: ID of the workflow
        comment_id: ID of the comment to update
        comment_data: Updated comment data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Updated comment

    Raises:
        HTTPException: If comment not found or access denied
    """
    # Check workflow access
    await check_workflow_access(workflow_id, current_user, db)

    # Check if user can modify comment
    comment = await workflow_comment_repository.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    if comment.workflow_id != workflow_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment does not belong to this workflow",
        )

    # Only comment author or admin can update
    if comment.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own comments",
        )

    # Update comment
    updated_comment = await workflow_comment_repository.update_comment(
        db=db,
        comment_id=comment_id,
        comment_data=comment_data,
    )

    if not updated_comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Failed to update comment",
        )

    return WorkflowCommentResponse.model_validate(updated_comment)


@router.delete(
    "/workflows/{workflow_id}/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_workflow_comment(
    workflow_id: str = Path(..., description="Workflow ID"),
    comment_id: str = Path(..., description="Comment ID"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> None:
    """
    Delete a workflow comment.

    Only the comment author or admins can delete comments.

    Args:
        workflow_id: ID of the workflow
        comment_id: ID of the comment to delete
        db: Database session
        current_user: Current authenticated user

    Raises:
        HTTPException: If comment not found or access denied
    """
    # Check workflow access
    await check_workflow_access(workflow_id, current_user, db)

    # Check if user can delete comment
    comment = await workflow_comment_repository.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    if comment.workflow_id != workflow_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment does not belong to this workflow",
        )

    # Only comment author or admin can delete
    if comment.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own comments",
        )

    # Delete comment
    deleted = await workflow_comment_repository.delete_comment(db, comment_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Failed to delete comment",
        )
