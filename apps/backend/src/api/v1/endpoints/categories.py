"""
Category management endpoints.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.middlewares.auth import get_current_user, require_role
from src.models.category import Category as CategoryModel
from src.models.user import User as UserModel
from src.models.user import UserRole
from src.schemas.category import Category, CreateCategoryRequest, UpdateCategoryRequest
from src.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[Category])
async def get_categories(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    is_active: bool | None = Query(None, description="Filter by active status"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> PaginatedResponse[Category]:
    """
    Get list of categories.

    Args:
        skip: Number of items to skip
        limit: Number of items per page
        is_active: Filter by active status
        db: Database session
        current_user: Current authenticated user

    Returns:
        Paginated list of categories
    """
    query = select(CategoryModel)

    if is_active is not None:
        query = query.where(CategoryModel.is_active == is_active)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Apply pagination
    query = query.offset(skip).limit(limit).order_by(CategoryModel.name)
    result = await db.execute(query)
    categories = result.scalars().all()

    return PaginatedResponse(
        items=[Category.model_validate(cat) for cat in categories],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{category_id}", response_model=Category)
async def get_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> Category:
    """
    Get category by ID.

    Args:
        category_id: Category ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Category object

    Raises:
        HTTPException: 404 if category not found
    """
    result = await db.execute(
        select(CategoryModel).where(CategoryModel.id == category_id)
    )
    category = result.scalar_one_or_none()

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    return Category.model_validate(category)


@router.post("", response_model=Category, status_code=status.HTTP_201_CREATED)
async def create_category(
    request: CreateCategoryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN)),
) -> Category:
    """
    Create new category (Admin only).

    Args:
        request: Category creation data
        db: Database session
        current_user: Current authenticated admin user

    Returns:
        Created category object

    Raises:
        HTTPException: 400 if code already exists
    """
    # Check if code already exists
    existing = await db.execute(
        select(CategoryModel).where(CategoryModel.code == request.code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category code already exists",
        )

    # Create category
    category = CategoryModel(
        id=str(uuid.uuid4()),
        name=request.name,
        code=request.code,
        description=request.description,
        is_active=True,
    )

    db.add(category)
    await db.commit()
    await db.refresh(category)

    return Category.model_validate(category)


@router.put("/{category_id}", response_model=Category)
async def update_category(
    category_id: str,
    request: UpdateCategoryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN)),
) -> Category:
    """
    Update category (Admin only).

    Args:
        category_id: Category ID
        request: Category update data
        db: Database session
        current_user: Current authenticated admin user

    Returns:
        Updated category object

    Raises:
        HTTPException: 404 if category not found
    """
    result = await db.execute(
        select(CategoryModel).where(CategoryModel.id == category_id)
    )
    category = result.scalar_one_or_none()

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    # Update fields
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    await db.commit()
    await db.refresh(category)

    return Category.model_validate(category)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN)),
) -> None:
    """
    Delete category (Admin only).

    Note: This is a hard delete. Categories with assets should not be deleted.

    Args:
        category_id: Category ID
        db: Database session
        current_user: Current authenticated admin user

    Raises:
        HTTPException: 404 if category not found
        HTTPException: 400 if category has associated assets
    """
    result = await db.execute(
        select(CategoryModel).where(CategoryModel.id == category_id)
    )
    category = result.scalar_one_or_none()

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    # TODO: Check if category has assets before deleting
    # For now, we'll allow deletion

    await db.delete(category)
    await db.commit()
