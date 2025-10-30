"""
QR Code generation endpoints.
"""

import io

import qrcode
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.database import get_db
from src.middlewares.auth import get_current_user
from src.models.asset import Asset as AssetModel
from src.models.user import User as UserModel

router = APIRouter()


def generate_qr_code_image(data: str, box_size: int = 10, border: int = 2) -> bytes:
    """
    Generate QR code image as PNG bytes.

    Args:
        data: Data to encode in QR code
        box_size: Size of each box in pixels
        border: Border size in boxes

    Returns:
        PNG image bytes
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=box_size,
        border=border,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    # Convert to bytes
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return buffer.getvalue()


@router.get("/generate/{asset_id}")
async def generate_asset_qr_code(
    asset_id: str,
    size: int = Query(default=300, ge=100, le=1000, description="QR code size in pixels"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> Response:
    """
    Generate QR code for asset.

    Returns QR code image as PNG.

    Args:
        asset_id: Asset ID
        size: QR code size in pixels
        db: Database session
        current_user: Current authenticated user

    Returns:
        PNG image response

    Raises:
        HTTPException: 404 if asset not found
    """
    # Verify asset exists
    result = await db.execute(
        select(AssetModel).where(AssetModel.id == asset_id)
    )
    asset = result.scalar_one_or_none()

    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )

    # Generate QR code data (URL to asset detail page)
    # In production, this should be the actual frontend URL
    qr_data = f"{settings.APP_FRONTEND_URL}/assets/{asset_id}"

    # Calculate box size based on desired size
    box_size = max(1, size // 33)  # Approximate calculation

    # Generate QR code
    qr_image_bytes = generate_qr_code_image(qr_data, box_size=box_size)

    return Response(
        content=qr_image_bytes,
        media_type="image/png",
        headers={
            "Content-Disposition": f'inline; filename="asset_{asset.asset_tag}_qr.png"'
        },
    )


@router.get("/decode")
async def decode_qr_code(
    data: str = Query(..., description="QR code data to decode"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> dict:
    """
    Decode and validate QR code data.

    Args:
        data: QR code data (URL or asset ID)
        db: Database session
        current_user: Current authenticated user

    Returns:
        Asset information

    Raises:
        HTTPException: 404 if asset not found
        HTTPException: 400 if QR code data is invalid
    """
    # Extract asset ID from data
    # Handle both full URLs and direct asset IDs
    asset_id = data
    if "/assets/" in data:
        try:
            asset_id = data.split("/assets/")[-1].split("?")[0]
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid QR code data format",
            )

    # Query asset
    result = await db.execute(
        select(AssetModel).where(AssetModel.id == asset_id)
    )
    asset = result.scalar_one_or_none()

    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )

    return {
        "id": asset.id,
        "asset_tag": asset.asset_tag,
        "model": asset.model,
        "status": asset.status,
        "category_id": asset.category_id,
        "location_id": asset.location_id,
        "assigned_to": asset.assigned_to,
    }


@router.post("/bulk-generate")
async def bulk_generate_qr_codes(
    asset_ids: list[str] = Query(..., description="List of asset IDs"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> dict:
    """
    Generate QR codes for multiple assets in bulk.

    Returns URLs for downloading individual QR codes.

    Args:
        asset_ids: List of asset IDs
        db: Database session
        current_user: Current authenticated user

    Returns:
        Dictionary with asset IDs and their QR code URLs

    Raises:
        HTTPException: 400 if no asset IDs provided
    """
    if not asset_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No asset IDs provided",
        )

    # Query assets
    result = await db.execute(
        select(AssetModel).where(AssetModel.id.in_(asset_ids))
    )
    assets = result.scalars().all()

    # Generate QR code URLs
    qr_codes = []
    for asset in assets:
        qr_codes.append({
            "asset_id": asset.id,
            "asset_tag": asset.asset_tag,
            "model": asset.model,
            "qr_code_url": f"/api/v1/qrcode/generate/{asset.id}",
        })

    return {
        "total": len(qr_codes),
        "qr_codes": qr_codes,
    }


@router.get("/print/{asset_id}")
async def get_printable_qr_label(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> dict:
    """
    Get printable QR code label data.

    Returns asset information and QR code URL for printing labels.

    Args:
        asset_id: Asset ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Printable label data

    Raises:
        HTTPException: 404 if asset not found
    """
    # Verify asset exists
    result = await db.execute(
        select(AssetModel).where(AssetModel.id == asset_id)
    )
    asset = result.scalar_one_or_none()

    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )

    return {
        "asset_id": asset.id,
        "asset_tag": asset.asset_tag,
        "model": asset.model,
        "category": asset.category.name if asset.category else None,
        "location": asset.location.name if asset.location else None,
        "qr_code_url": f"/api/v1/qrcode/generate/{asset.id}?size=200",
        "label_format": {
            "width": "2.5in",  # Standard label size
            "height": "1.5in",
            "qr_size": "1.2in",
        },
    }
