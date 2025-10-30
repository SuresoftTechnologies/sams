"""
Receipt processing API endpoints.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.middlewares.auth import get_current_user
from src.models.user import User
from src.schemas.receipt import (
    AnalyzeReceiptFromImageResponse,
    AnalyzeReceiptRequest,
    AnalyzeReceiptResponse,
    CreateAssetFromAnalysisRequest,
    CreateAssetFromReceiptResponse,
    ExtractTextResponse,
    OCRMethod,
)
from src.services.asset_from_receipt_service import get_asset_from_receipt_service

router = APIRouter()


@router.post("/extract-text", response_model=ExtractTextResponse)
async def extract_text_from_receipt(
    file: UploadFile = File(default=None),
    image_url: str = Form(default=""),
    method: OCRMethod = Form(default=OCRMethod.DEEPSEEK),
    current_user: User = Depends(get_current_user),
) -> ExtractTextResponse:
    """
    Extract text from receipt image using OCR.

    This endpoint only performs OCR without LLM analysis.
    Useful for previewing extracted text before creating an asset.

    **Input Options** (provide one):
    - `file`: Upload receipt image file (PNG, JPG, JPEG, PDF, WEBP)
    - `image_url`: Provide image URL (alternative to file upload)

    **OCR Method**: DeepSeek OCR API (high accuracy, structured output)
    """
    # Clean up empty values
    if not file or (hasattr(file, 'filename') and not file.filename):
        file = None
    if not image_url or not image_url.strip():
        image_url = None

    # Validate input
    if not file and not image_url:
        raise HTTPException(
            status_code=400,
            detail="파일 또는 이미지 URL 중 하나를 제공해야 합니다."
        )
    
    if file and image_url:
        raise HTTPException(
            status_code=400,
            detail="파일과 이미지 URL을 동시에 제공할 수 없습니다. 하나만 선택하세요."
        )

    # Validate file extension if file is provided
    if file:
        if not file.filename:
            raise HTTPException(status_code=400, detail="파일명이 없습니다.")
        
        allowed_extensions = {".png", ".jpg", ".jpeg", ".pdf", ".webp"}
        file_ext = file.filename.lower().split(".")[-1]
        if f".{file_ext}" not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"지원하지 않는 파일 형식입니다. 지원 형식: {', '.join(allowed_extensions)}",
            )

    try:
        service = get_asset_from_receipt_service()
        result = await service.extract_text_only(file=file, image_url=image_url, method=method)

        return ExtractTextResponse(
            text=str(result["text"]),
            method=method,
            processing_time=float(result["processing_time"]),
            pages=int(result.get("pages", 1)),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"텍스트 추출 실패: {str(e)}")


@router.post("/analyze-text", response_model=AnalyzeReceiptResponse)
async def analyze_receipt_text(
    request: AnalyzeReceiptRequest,
    current_user: User = Depends(get_current_user),
) -> AnalyzeReceiptResponse:
    """
    Analyze receipt text and extract asset information using LLM.

    This endpoint only performs LLM analysis on provided text.
    Text should be pre-extracted using OCR or provided manually.

    **Returns**: Structured asset information (name, model, price, etc.)
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="텍스트가 비어있습니다.")

    try:
        service = get_asset_from_receipt_service()
        analysis, processing_time = await service.analyze_text_only(
            request.text, request.category_id
        )

        return AnalyzeReceiptResponse(
            analysis=analysis,
            processing_time=processing_time,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"텍스트 분석 실패: {str(e)}")


@router.post("/analyze-receipt", response_model=AnalyzeReceiptFromImageResponse)
async def analyze_receipt_from_image(
    file: UploadFile = File(default=None),
    image_url: str = Form(default=""),
    ocr_method: OCRMethod = Form(default=OCRMethod.DEEPSEEK),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AnalyzeReceiptFromImageResponse:
    """
    Analyze receipt from image - Preview only (no DB save).

    **Workflow**:
    1. Extract text from receipt using OCR
    2. Analyze text with LLM to extract asset information
    3. Auto-infer category from item_type (노트북 → 12, 데스크탑 → 11, 모니터 → 14)
    4. Generate suggested name and notes
    5. Return analysis result for user review

    **Use Case**: User wants to review/modify the extracted information before creating asset.

    **Input Options** (provide one):
    - `file`: Upload receipt image file (PNG, JPG, JPEG, PDF, WEBP)
    - `image_url`: Provide image URL (alternative to file upload)

    **Returns**: Analysis result with:
    - Suggested asset name, notes
    - **Auto-inferred category_id** (no manual input needed!)
    - Extracted information (price, date, supplier, etc.)
    - Confidence score and warnings

    **Note**: No asset is created. Use `/receipts/create-asset-from-analysis` to create asset after review.
    """
    # Clean up empty values (FastAPI might send empty string for file)
    if not file or (hasattr(file, 'filename') and not file.filename):
        file = None
    if not image_url or not image_url.strip():
        image_url = None

    # Validate input: either file or image_url must be provided
    if not file and not image_url:
        raise HTTPException(
            status_code=400, 
            detail="파일 또는 이미지 URL 중 하나를 제공해야 합니다."
        )
    
    if file and image_url:
        raise HTTPException(
            status_code=400,
            detail="파일과 이미지 URL을 동시에 제공할 수 없습니다. 하나만 선택하세요."
        )

    # Validate file extension if file is provided
    if file:
        if not file.filename:
            raise HTTPException(status_code=400, detail="파일명이 없습니다.")
        
        allowed_extensions = {".png", ".jpg", ".jpeg", ".pdf", ".webp"}
        file_ext = file.filename.lower().split(".")[-1]
        if f".{file_ext}" not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"지원하지 않는 파일 형식입니다. 지원 형식: {', '.join(allowed_extensions)}",
            )

    try:
        service = get_asset_from_receipt_service()
        result = await service.analyze_receipt_from_image(
            file=file,
            image_url=image_url,
            category_id=None,  # Not used anymore - auto-inferred from item_type
            ocr_method=ocr_method,
            db=db,  # For category lookup
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"영수증 분석 실패: {str(e)}")


@router.post("/create-asset-from-analysis")
async def create_asset_from_analysis(
    request: CreateAssetFromAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Create asset from user-reviewed analysis result.

    **Workflow**:
    1. User has already called `/receipts/analyze-receipt`
    2. User reviewed and possibly modified the analysis result
    3. This endpoint creates the asset with confirmed data

    **Use Case**: Create asset after user has reviewed the OCR/LLM analysis.

    **Required Fields**:
    - asset_tag: Asset tag (user can modify or use suggested)
    - name: Asset name (user can modify or use suggested_name)
    - category_id: Category ID

    **Optional Fields**:
    - location_id, purchase_date, purchase_price, warranty_end, notes

    **Returns**: Created asset object
    """
    try:
        service = get_asset_from_receipt_service()
        asset = await service.create_asset_from_analysis(
            db=db,
            request=request,
            created_by=current_user.id,
        )

        return asset

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"자산 생성 실패: {str(e)}")


@router.post("/create-asset", response_model=CreateAssetFromReceiptResponse, deprecated=True)
async def create_asset_from_receipt(
    file: Annotated[UploadFile, File(description="Receipt image or PDF file")],
    category_id: Annotated[str, Form(description="Asset category ID")],
    location_id: Annotated[
        str | None, Form(description="Initial location ID")
    ] = None,
    ocr_method: Annotated[
        OCRMethod, Form(description="OCR method to use")
    ] = OCRMethod.DEEPSEEK,
    auto_generate_tag: Annotated[
        bool, Form(description="Auto-generate asset tag")
    ] = True,
    asset_tag_prefix: Annotated[
        str | None, Form(description="Asset tag prefix")
    ] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CreateAssetFromReceiptResponse:
    """
    Create asset from receipt image - Full workflow (DEPRECATED).

    ⚠️ **DEPRECATED**: Use `/receipts/analyze-receipt` + `/receipts/create-asset-from-analysis` instead.
    
    This endpoint creates asset immediately without user review.
    For better UX, use the two-step workflow:
    1. POST /receipts/analyze-receipt (preview)
    2. POST /receipts/create-asset-from-analysis (create after review)

    **Workflow**:
    1. Extract text from receipt using OCR
    2. Analyze text with LLM to extract asset information
    3. Generate asset tag (if auto_generate_tag=true)
    4. Create asset in database immediately
    5. Return created asset with metadata

    **Supported formats**: PNG, JPG, JPEG, PDF, WEBP

    **Note**: Low confidence results will include warnings, but asset is already created.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="파일명이 없습니다.")

    # Check file extension
    allowed_extensions = {".png", ".jpg", ".jpeg", ".pdf", ".webp"}
    file_ext = file.filename.lower().split(".")[-1]
    if f".{file_ext}" not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 파일 형식입니다. 지원 형식: {', '.join(allowed_extensions)}",
        )

    try:
        service = get_asset_from_receipt_service()
        result = await service.create_asset_from_receipt(
            db=db,
            file=file,
            category_id=category_id,
            created_by=current_user.id,
            location_id=location_id,
            ocr_method=ocr_method,
            auto_generate_tag=auto_generate_tag,
            asset_tag_prefix=asset_tag_prefix,
        )

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"자산 생성 실패: {str(e)}"
        )

