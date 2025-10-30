"""
User management endpoints.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.middlewares.auth import get_current_user, require_role
from src.models.user import User as UserModel, UserRole
from src.schemas.user import User, CreateUserRequest, UpdateUserRequest, UserRole as UserRoleSchema
from src.schemas.common import MessageResponse, PaginatedResponse
from src.utils.security import hash_password

router = APIRouter()


@router.get("", response_model=PaginatedResponse[User])
async def get_users(
    skip: int = Query(default=0, ge=0, description="Number of items to skip"),
    limit: int = Query(default=20, ge=1, le=100, description="Number of items per page"),
    search: str | None = Query(None, description="Search by name or email"),
    role: UserRoleSchema | None = Query(None, description="Filter by role"),
    is_active: bool | None = Query(None, description="Filter by active status"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN)),
) -> PaginatedResponse[User]:
    """
    Get list of users (Admin only).

    Supports pagination, search, and filtering.

    Args:
        skip: Number of items to skip (for pagination)
        limit: Number of items per page
        search: Search term for name or email
        role: Filter by user role
        is_active: Filter by active status
        db: Database session
        current_user: Current authenticated admin user

    Returns:
        Paginated list of users
    """
    # Build query
    query = select(UserModel)

    # Apply search filter
    if search:
        search_filter = or_(
            UserModel.name.ilike(f"%{search}%"),
            UserModel.email.ilike(f"%{search}%"),
            UserModel.department.ilike(f"%{search}%")
        )
        query = query.where(search_filter)

    # Apply role filter
    if role:
        query = query.where(UserModel.role == role)

    # Apply active status filter
    if is_active is not None:
        query = query.where(UserModel.is_active == is_active)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Apply pagination and execute
    query = query.offset(skip).limit(limit).order_by(UserModel.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()

    return PaginatedResponse(
        items=[User.model_validate(user) for user in users],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> User:
    """
    Get user by ID.

    Users can view their own profile or admins can view any user.

    Args:
        user_id: User ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        User object

    Raises:
        HTTPException: 404 if user not found
        HTTPException: 403 if user doesn't have permission
    """
    # Check permission - users can only view themselves unless admin
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user",
        )

    # Query user
    result = await db.execute(
        select(UserModel).where(UserModel.id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return User.model_validate(user)


@router.post("", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: CreateUserRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN)),
) -> User:
    """
    Create new user (Admin only).

    Args:
        request: User creation data
        db: Database session
        current_user: Current authenticated admin user

    Returns:
        Created user object

    Raises:
        HTTPException: 400 if email already exists
    """
    # Check if email already exists
    existing = await db.execute(
        select(UserModel).where(UserModel.email == request.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    user = UserModel(
        id=str(uuid.uuid4()),
        email=request.email,
        password_hash=hash_password(request.password),
        name=request.name,
        role=request.role,
        department=request.department,
        employee_id=request.employee_id,
        is_active=True,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return User.model_validate(user)


@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    request: UpdateUserRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN)),
) -> User:
    """
    Update user (Admin only).

    Args:
        user_id: User ID to update
        request: User update data
        db: Database session
        current_user: Current authenticated admin user

    Returns:
        Updated user object

    Raises:
        HTTPException: 404 if user not found
    """
    # Query user
    result = await db.execute(
        select(UserModel).where(UserModel.id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Update fields if provided
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)

    return User.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN)),
) -> None:
    """
    Delete user (Admin only).

    Note: This is a hard delete. Consider implementing soft delete in production.

    Args:
        user_id: User ID to delete
        db: Database session
        current_user: Current authenticated admin user

    Raises:
        HTTPException: 404 if user not found
        HTTPException: 400 if trying to delete self
    """
    # Prevent deleting self
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    # Query user
    result = await db.execute(
        select(UserModel).where(UserModel.id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Delete user
    await db.delete(user)
    await db.commit()


@router.patch("/{user_id}/role", response_model=User)
async def change_user_role(
    user_id: str,
    role: UserRoleSchema = Query(..., description="New user role"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN)),
) -> User:
    """
    Change user role (Admin only).

    Args:
        user_id: User ID
        role: New role to assign
        db: Database session
        current_user: Current authenticated admin user

    Returns:
        Updated user object

    Raises:
        HTTPException: 404 if user not found
        HTTPException: 400 if trying to change own role
    """
    # Prevent changing own role
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role",
        )

    # Query user
    result = await db.execute(
        select(UserModel).where(UserModel.id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Update role
    user.role = role
    await db.commit()
    await db.refresh(user)

    return User.model_validate(user)
