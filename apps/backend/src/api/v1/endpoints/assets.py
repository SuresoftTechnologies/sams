"""
Asset management endpoints.
"""

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.middlewares.auth import get_current_user, require_role
from src.models.user import User as UserModel, UserRole
from src.models.asset import Asset as AssetModel, AssetStatus, AssetGrade
from src.models.asset_history import AssetHistory, HistoryAction
from src.models.category import Category
from src.models.location import Location
from src.schemas.asset import (
    Asset,
    CreateAssetRequest,
    UpdateAssetRequest,
    AssetFilterParams,
)
from src.schemas.common import MessageResponse, PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[Asset])
async def get_assets(
    skip: int = Query(default=0, ge=0, description="Number of items to skip"),
    limit: int = Query(default=20, ge=1, le=100, description="Number of items per page"),
    search: str | None = Query(None, description="Search by name or asset tag"),
    status: AssetStatus | None = Query(None, description="Filter by status"),
    category_id: str | None = Query(None, description="Filter by category"),
    location_id: str | None = Query(None, description="Filter by location"),
    assigned_to: str | None = Query(None, description="Filter by assignee"),
    grade: AssetGrade | None = Query(None, description="Filter by grade"),
    sort_by: str = Query(default="created_at", description="Sort field"),
    sort_order: str = Query(default="desc", description="Sort order (asc/desc)"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> PaginatedResponse[Asset]:
    """
    Get list of assets with filtering, search, and pagination.

    Args:
        skip: Number of items to skip (for pagination)
        limit: Number of items per page
        search: Search term for name or asset tag
        status: Filter by asset status
        category_id: Filter by category
        location_id: Filter by location
        assigned_to: Filter by assignee
        grade: Filter by grade
        sort_by: Field to sort by
        sort_order: Sort order (asc/desc)
        db: Database session
        current_user: Current authenticated user

    Returns:
        Paginated list of assets
    """
    # Build query with joins - exclude soft-deleted assets
    query = (
        select(AssetModel, Category.name.label("category_name"), Location.name.label("location_name"))
        .outerjoin(Category, AssetModel.category_id == Category.id)
        .outerjoin(Location, AssetModel.location_id == Location.id)
        .where(AssetModel.deleted_at.is_(None))
    )

    # Apply search filter
    if search:
        search_filter = or_(
            AssetModel.name.ilike(f"%{search}%"),
            AssetModel.asset_tag.ilike(f"%{search}%"),
            AssetModel.serial_number.ilike(f"%{search}%"),
            AssetModel.model.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)

    # Apply filters
    if status:
        query = query.where(AssetModel.status == status)
    if category_id:
        query = query.where(AssetModel.category_id == category_id)
    if location_id:
        query = query.where(AssetModel.location_id == location_id)
    if assigned_to:
        query = query.where(AssetModel.assigned_to == assigned_to)
    if grade:
        query = query.where(AssetModel.grade == grade)

    # Get total count
    count_query = select(func.count()).select_from(
        select(AssetModel)
        .where(AssetModel.deleted_at.is_(None))
        .subquery()
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Apply sorting
    sort_column = getattr(AssetModel, sort_by, AssetModel.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    # Apply pagination and execute
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    rows = result.all()

    # Build Asset responses with joined data
    items = []
    for row in rows:
        asset_model = row[0]
        category_name = row[1]
        location_name = row[2]

        asset_dict = Asset.model_validate(asset_model, from_attributes=True).model_dump()
        asset_dict["category_name"] = category_name
        asset_dict["location_name"] = location_name
        items.append(Asset(**asset_dict))

    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/by-number/{asset_number}", response_model=Asset)
async def get_asset_by_number(
    asset_number: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> Asset:
    """
    Get asset by asset number (for QR code scanning).

    This endpoint is used when scanning QR codes that contain the asset number
    (e.g., "14-2022-23"). It allows quick lookup for rental/return workflows.

    Args:
        asset_number: Asset number from QR code scan (e.g., "14-2022-23")
        db: Database session
        current_user: Current authenticated user

    Returns:
        Asset object

    Raises:
        HTTPException: 404 if asset not found

    Example:
        QR scan result: "14-2022-23"
        GET /api/v1/assets/by-number/14-2022-23
    """
    result = await db.execute(
        select(AssetModel, Category.name.label("category_name"), Location.name.label("location_name"))
        .outerjoin(Category, AssetModel.category_id == Category.id)
        .outerjoin(Location, AssetModel.location_id == Location.id)
        .where(
            and_(
                AssetModel.asset_tag == asset_number,
                AssetModel.deleted_at.is_(None)
            )
        )
    )
    row = result.one_or_none()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset with number '{asset_number}' not found",
        )

    # Build Asset response with joined data
    asset_model = row[0]
    category_name = row[1]
    location_name = row[2]

    asset_dict = Asset.model_validate(asset_model, from_attributes=True).model_dump()
    asset_dict["category_name"] = category_name
    asset_dict["location_name"] = location_name

    return Asset(**asset_dict)


@router.get("/{asset_id}", response_model=Asset)
async def get_asset(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> Asset:
    """
    Get asset by ID.

    Args:
        asset_id: Asset ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Asset object

    Raises:
        HTTPException: 404 if asset not found
    """
    result = await db.execute(
        select(AssetModel, Category.name.label("category_name"), Location.name.label("location_name"))
        .outerjoin(Category, AssetModel.category_id == Category.id)
        .outerjoin(Location, AssetModel.location_id == Location.id)
        .where(
            and_(
                AssetModel.id == asset_id,
                AssetModel.deleted_at.is_(None)
            )
        )
    )
    row = result.one_or_none()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )

    # Build Asset response with joined data
    asset_model = row[0]
    category_name = row[1]
    location_name = row[2]

    asset_dict = Asset.model_validate(asset_model, from_attributes=True).model_dump()
    asset_dict["category_name"] = category_name
    asset_dict["location_name"] = location_name

    return Asset(**asset_dict)


@router.post("", response_model=Asset, status_code=status.HTTP_201_CREATED)
async def create_asset(
    request: CreateAssetRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
) -> Asset:
    """
    Create new asset (Admin/Manager only).

    Args:
        request: Asset creation data
        db: Database session
        current_user: Current authenticated admin/manager user

    Returns:
        Created asset object

    Raises:
        HTTPException: 400 if asset tag already exists
        HTTPException: 404 if category or location not found
    """
    # Check if asset tag already exists
    existing = await db.execute(
        select(AssetModel).where(AssetModel.asset_tag == request.asset_tag)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Asset tag already exists",
        )

    # Verify category exists
    category_result = await db.execute(
        select(Category).where(Category.id == request.category_id)
    )
    if not category_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    # Verify location exists if provided
    if request.location_id:
        location_result = await db.execute(
            select(Location).where(Location.id == request.location_id)
        )
        if not location_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found",
            )

    # Calculate grade based on purchase date
    grade = AssetGrade.A
    if request.purchase_date:
        years_old = (datetime.now() - request.purchase_date).days / 365.25
        if years_old >= 4:
            grade = AssetGrade.C
        elif years_old >= 2:
            grade = AssetGrade.B

    # Create new asset
    asset_id = str(uuid.uuid4())
    asset = AssetModel(
        id=asset_id,
        asset_tag=request.asset_tag,
        name=request.name,
        category_id=request.category_id,
        location_id=request.location_id,
        status=request.status,
        purchase_date=request.purchase_date,
        purchase_price=request.purchase_price,
        warranty_end=request.warranty_end,
        notes=request.notes,
        grade=grade,
    )

    db.add(asset)

    # Create history entry
    history = AssetHistory(
        id=str(uuid.uuid4()),
        asset_id=asset_id,
        performed_by=current_user.id,
        action=HistoryAction.CREATED,
        description=f"Asset created by {current_user.name}",
        new_values=request.model_dump(mode="json", exclude_unset=True),
    )
    db.add(history)

    await db.commit()
    await db.refresh(asset)

    return Asset.model_validate(asset)


@router.put("/{asset_id}", response_model=Asset)
async def update_asset(
    asset_id: str,
    request: UpdateAssetRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
) -> Asset:
    """
    Update asset (Admin/Manager only).

    Args:
        asset_id: Asset ID to update
        request: Asset update data
        db: Database session
        current_user: Current authenticated admin/manager user

    Returns:
        Updated asset object

    Raises:
        HTTPException: 404 if asset not found
    """
    # Query asset
    result = await db.execute(
        select(AssetModel).where(
            and_(
                AssetModel.id == asset_id,
                AssetModel.deleted_at.is_(None)
            )
        )
    )
    asset = result.scalar_one_or_none()

    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )

    # Store old values for history
    old_values: dict[str, Any] = {}
    update_data = request.model_dump(exclude_unset=True)

    # Update fields if provided
    for field, value in update_data.items():
        old_value = getattr(asset, field)
        if old_value != value:
            old_values[field] = str(old_value) if old_value else None
            setattr(asset, field, value)

    # Create history entry if there were changes
    if old_values:
        history = AssetHistory(
            id=str(uuid.uuid4()),
            asset_id=asset_id,
            performed_by=current_user.id,
            action=HistoryAction.UPDATED,
            description=f"Asset updated by {current_user.name}",
            old_values=old_values,
            new_values=update_data,
        )
        db.add(history)

    await db.commit()
    await db.refresh(asset)

    return Asset.model_validate(asset)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN)),
) -> None:
    """
    Delete asset (soft delete, Admin only).

    Args:
        asset_id: Asset ID to delete
        db: Database session
        current_user: Current authenticated admin user

    Raises:
        HTTPException: 404 if asset not found
    """
    # Query asset
    result = await db.execute(
        select(AssetModel).where(
            and_(
                AssetModel.id == asset_id,
                AssetModel.deleted_at.is_(None)
            )
        )
    )
    asset = result.scalar_one_or_none()

    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )

    # Soft delete
    asset.deleted_at = datetime.now()
    asset.status = AssetStatus.DISPOSED

    # Create history entry
    history = AssetHistory(
        id=str(uuid.uuid4()),
        asset_id=asset_id,
        performed_by=current_user.id,
        action=HistoryAction.DELETED,
        description=f"Asset deleted by {current_user.name}",
    )
    db.add(history)

    await db.commit()


@router.get("/{asset_id}/history", response_model=list[dict])
async def get_asset_history(
    asset_id: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> list[dict]:
    """
    Get asset history.

    Args:
        asset_id: Asset ID
        skip: Number of items to skip
        limit: Number of items per page
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of history entries

    Raises:
        HTTPException: 404 if asset not found
    """
    # Verify asset exists
    asset_result = await db.execute(
        select(AssetModel).where(AssetModel.id == asset_id)
    )
    if not asset_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )

    # Query history
    query = (
        select(AssetHistory)
        .where(AssetHistory.asset_id == asset_id)
        .order_by(AssetHistory.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    history_entries = result.scalars().all()

    # Convert to dict for response
    return [
        {
            "id": entry.id,
            "action": entry.action,
            "description": entry.description,
            "performed_by": entry.performed_by,
            "old_values": entry.old_values,
            "new_values": entry.new_values,
            "created_at": entry.created_at,
        }
        for entry in history_entries
    ]


@router.patch("/{asset_id}/status", response_model=Asset)
async def change_asset_status(
    asset_id: str,
    new_status: AssetStatus = Query(..., description="New asset status"),
    reason: str | None = Query(None, description="Reason for status change"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
) -> Asset:
    """
    Change asset status (Admin/Manager only).

    Args:
        asset_id: Asset ID
        new_status: New status to set
        reason: Optional reason for status change
        db: Database session
        current_user: Current authenticated admin/manager user

    Returns:
        Updated asset object

    Raises:
        HTTPException: 404 if asset not found
    """
    # Query asset
    result = await db.execute(
        select(AssetModel).where(
            and_(
                AssetModel.id == asset_id,
                AssetModel.deleted_at.is_(None)
            )
        )
    )
    asset = result.scalar_one_or_none()

    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )

    old_status = asset.status
    asset.status = new_status

    # Create history entry
    history = AssetHistory(
        id=str(uuid.uuid4()),
        asset_id=asset_id,
        performed_by=current_user.id,
        action=HistoryAction.STATUS_CHANGED,
        description=reason or f"Status changed from {old_status} to {new_status}",
        old_values={"status": old_status},
        new_values={"status": new_status},
    )
    db.add(history)

    await db.commit()
    await db.refresh(asset)

    return Asset.model_validate(asset)


@router.patch("/{asset_id}/location", response_model=Asset)
async def change_asset_location(
    asset_id: str,
    new_location_id: str = Query(..., description="New location ID"),
    reason: str | None = Query(None, description="Reason for location change"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
) -> Asset:
    """
    Change asset location (Admin/Manager only).

    Args:
        asset_id: Asset ID
        new_location_id: New location ID
        reason: Optional reason for location change
        db: Database session
        current_user: Current authenticated admin/manager user

    Returns:
        Updated asset object

    Raises:
        HTTPException: 404 if asset or location not found
    """
    # Verify location exists
    location_result = await db.execute(
        select(Location).where(Location.id == new_location_id)
    )
    if not location_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found",
        )

    # Query asset
    result = await db.execute(
        select(AssetModel).where(
            and_(
                AssetModel.id == asset_id,
                AssetModel.deleted_at.is_(None)
            )
        )
    )
    asset = result.scalar_one_or_none()

    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )

    old_location_id = asset.location_id
    asset.location_id = new_location_id

    # Create history entry
    history = AssetHistory(
        id=str(uuid.uuid4()),
        asset_id=asset_id,
        performed_by=current_user.id,
        action=HistoryAction.LOCATION_CHANGED,
        description=reason or "Location changed",
        from_location_id=old_location_id,
        to_location_id=new_location_id,
        old_values={"location_id": old_location_id},
        new_values={"location_id": new_location_id},
    )
    db.add(history)

    await db.commit()
    await db.refresh(asset)

    return Asset.model_validate(asset)


@router.patch("/{asset_id}/user", response_model=Asset)
async def assign_asset_user(
    asset_id: str,
    user_id: str | None = Query(None, description="User ID to assign (null to unassign)"),
    reason: str | None = Query(None, description="Reason for assignment/unassignment"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
) -> Asset:
    """
    Assign or unassign asset to user (Admin/Manager only).

    Args:
        asset_id: Asset ID
        user_id: User ID to assign (null to unassign)
        reason: Optional reason for assignment change
        db: Database session
        current_user: Current authenticated admin/manager user

    Returns:
        Updated asset object

    Raises:
        HTTPException: 404 if asset or user not found
    """
    # Verify user exists if provided
    if user_id:
        user_result = await db.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        if not user_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

    # Query asset
    result = await db.execute(
        select(AssetModel).where(
            and_(
                AssetModel.id == asset_id,
                AssetModel.deleted_at.is_(None)
            )
        )
    )
    asset = result.scalar_one_or_none()

    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )

    old_user_id = asset.assigned_to
    asset.assigned_to = user_id

    # Update status based on assignment
    if user_id:
        asset.status = AssetStatus.ASSIGNED
        action = HistoryAction.ASSIGNED
        description = reason or f"Asset assigned to user {user_id}"
    else:
        asset.status = AssetStatus.AVAILABLE
        action = HistoryAction.UNASSIGNED
        description = reason or "Asset unassigned"

    # Create history entry
    history = AssetHistory(
        id=str(uuid.uuid4()),
        asset_id=asset_id,
        performed_by=current_user.id,
        action=action,
        description=description,
        from_user_id=old_user_id,
        to_user_id=user_id,
        old_values={"assigned_to": old_user_id},
        new_values={"assigned_to": user_id},
    )
    db.add(history)

    await db.commit()
    await db.refresh(asset)

    return Asset.model_validate(asset)
