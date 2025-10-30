"""
Location management endpoints.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.middlewares.auth import get_current_user, require_role
from src.models.user import User as UserModel, UserRole
from src.models.location import Location as LocationModel
from src.schemas.location import Location, CreateLocationRequest, UpdateLocationRequest
from src.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[Location])
async def get_locations(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    is_active: bool | None = Query(None, description="Filter by active status"),
    site: str | None = Query(None, description="Filter by site"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> PaginatedResponse[Location]:
    """
    Get list of locations.

    Args:
        skip: Number of items to skip
        limit: Number of items per page
        is_active: Filter by active status
        site: Filter by site
        db: Database session
        current_user: Current authenticated user

    Returns:
        Paginated list of locations
    """
    query = select(LocationModel)

    if is_active is not None:
        query = query.where(LocationModel.is_active == is_active)
    if site:
        query = query.where(LocationModel.site == site)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Apply pagination
    query = query.offset(skip).limit(limit).order_by(LocationModel.name)
    result = await db.execute(query)
    locations = result.scalars().all()

    return PaginatedResponse(
        items=[Location.model_validate(loc) for loc in locations],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{location_id}", response_model=Location)
async def get_location(
    location_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> Location:
    """
    Get location by ID.

    Args:
        location_id: Location ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Location object

    Raises:
        HTTPException: 404 if location not found
    """
    result = await db.execute(
        select(LocationModel).where(LocationModel.id == location_id)
    )
    location = result.scalar_one_or_none()

    if location is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found",
        )

    return Location.model_validate(location)


@router.post("", response_model=Location, status_code=status.HTTP_201_CREATED)
async def create_location(
    request: CreateLocationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN)),
) -> Location:
    """
    Create new location (Admin only).

    Args:
        request: Location creation data
        db: Database session
        current_user: Current authenticated admin user

    Returns:
        Created location object

    Raises:
        HTTPException: 400 if code already exists
    """
    # Check if code already exists
    existing = await db.execute(
        select(LocationModel).where(LocationModel.code == request.code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location code already exists",
        )

    # Create location
    location = LocationModel(
        id=str(uuid.uuid4()),
        name=request.name,
        code=request.code,
        site=request.site,
        building=request.building,
        floor=request.floor,
        room=request.room,
        is_active=True,
    )

    db.add(location)
    await db.commit()
    await db.refresh(location)

    return Location.model_validate(location)


@router.put("/{location_id}", response_model=Location)
async def update_location(
    location_id: str,
    request: UpdateLocationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN)),
) -> Location:
    """
    Update location (Admin only).

    Args:
        location_id: Location ID
        request: Location update data
        db: Database session
        current_user: Current authenticated admin user

    Returns:
        Updated location object

    Raises:
        HTTPException: 404 if location not found
    """
    result = await db.execute(
        select(LocationModel).where(LocationModel.id == location_id)
    )
    location = result.scalar_one_or_none()

    if location is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found",
        )

    # Update fields
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(location, field, value)

    await db.commit()
    await db.refresh(location)

    return Location.model_validate(location)


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    location_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN)),
) -> None:
    """
    Delete location (Admin only).

    Note: This is a hard delete. Locations with assets should not be deleted.

    Args:
        location_id: Location ID
        db: Database session
        current_user: Current authenticated admin user

    Raises:
        HTTPException: 404 if location not found
        HTTPException: 400 if location has associated assets
    """
    result = await db.execute(
        select(LocationModel).where(LocationModel.id == location_id)
    )
    location = result.scalar_one_or_none()

    if location is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found",
        )

    # TODO: Check if location has assets before deleting
    # For now, we'll allow deletion

    await db.delete(location)
    await db.commit()
