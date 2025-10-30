"""
Service for creating assets from receipt images using OCR and LLM.
"""

import time
from pathlib import Path
from uuid import uuid4

import aiohttp
from fastapi import HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.models.asset import Asset
from src.schemas.asset import CreateAssetRequest
from src.schemas.receipt import (
    AnalyzeReceiptFromImageResponse,
    CreateAssetFromAnalysisRequest,
    CreateAssetFromReceiptResponse,
    OCRMethod,
    ReceiptAnalysisResult,
)
from src.services.asset_service import AssetService
from src.services.llm_service import LLMService, get_llm_service
from src.services.ocr_service import OCRService, get_ocr_service


class AssetFromReceiptService:
    """Service for creating assets from receipt images."""

    def __init__(
        self,
        ocr_service: OCRService | None = None,
        llm_service: LLMService | None = None,
    ) -> None:
        """Initialize service with OCR and LLM services."""
        self.ocr_service = ocr_service or get_ocr_service()
        self.llm_service = llm_service or get_llm_service()

    async def create_asset_from_receipt(
        self,
        db: AsyncSession,
        file: UploadFile,
        category_id: str,
        created_by: str,
        location_id: str | None = None,
        ocr_method: OCRMethod = OCRMethod.DEEPSEEK,
        auto_generate_tag: bool = True,
        asset_tag_prefix: str | None = None,
    ) -> CreateAssetFromReceiptResponse:
        """
        Create asset from receipt image - full workflow.

        Steps:
        1. Save uploaded file
        2. Extract text using OCR
        3. Analyze text with LLM
        4. Generate asset tag
        5. Create asset in database
        6. Return result with metadata

        Args:
            db: Database session
            file: Uploaded file
            category_id: Asset category ID
            created_by: User ID creating the asset
            location_id: Optional initial location
            ocr_method: OCR method to use
            auto_generate_tag: Auto-generate asset tag
            asset_tag_prefix: Optional asset tag prefix

        Returns:
            CreateAssetFromReceiptResponse with asset and metadata
        """
        start_time = time.time()
        warnings: list[str] = []

        # Step 1: Save uploaded file
        file_path = await self._save_upload_file(file)

        try:
            # Step 2: Extract text using OCR
            ocr_result = await self.ocr_service.extract_text(file_path)
            extracted_text = str(ocr_result["text"])

            if not extracted_text.strip():
                warnings.append("OCR 추출 결과가 비어있습니다. 이미지 품질을 확인하세요.")

            # Step 3: Analyze with LLM (이미지 + 텍스트 함께 전달)
            analysis, llm_time = await self.llm_service.analyze_receipt(
                extracted_text,
                category_id=category_id,
                image_path=file_path  # 원본 이미지 전달!
            )

            # Check confidence
            if analysis.confidence < 0.3:
                warnings.append(
                    f"분석 신뢰도가 낮습니다 ({analysis.confidence:.2f}). 수동 검토가 필요합니다."
                )

            # Step 4: Generate asset tag if needed
            if auto_generate_tag:
                asset_tag = await AssetService.generate_asset_number(
                    db, category_id, analysis.purchase_date
                )
                if asset_tag_prefix:
                    asset_tag = f"{asset_tag_prefix}-{asset_tag}"
            else:
                # If not auto-generating, use a UUID
                asset_tag = f"RECEIPT-{uuid4().hex[:8].upper()}"
                warnings.append("자산 태그를 자동 생성했습니다. 필요시 수정하세요.")

            # Step 5: Create asset in database
            asset_data = self._build_asset_request(
                analysis=analysis,
                asset_tag=asset_tag,
                category_id=category_id,
                location_id=location_id,
            )

            asset = await AssetService.create_asset(
                db=db, asset_data=asset_data, created_by=created_by
            )

            # Calculate total time
            total_time = time.time() - start_time

            # Step 6: Return result
            return CreateAssetFromReceiptResponse(
                asset=self._asset_to_dict(asset),
                extracted_text=extracted_text,
                analysis=analysis,
                ocr_method=ocr_method,
                total_time=total_time,
                warnings=warnings,
            )

        finally:
            # Clean up temporary file
            self._cleanup_file(file_path)

    async def extract_text_only(
        self,
        file: UploadFile | None = None,
        image_url: str | None = None,
        method: OCRMethod = OCRMethod.DEEPSEEK
    ) -> dict[str, str | float | int]:
        """
        Extract text from receipt image only (no LLM analysis).

        Args:
            file: Uploaded file (provide either file or image_url)
            image_url: Image URL (provide either file or image_url)
            method: OCR method to use (unused, always uses DeepSeek)

        Returns:
            Dictionary with text, processing_time, pages, method
        """
        if file:
            file_path = await self._save_upload_file(file)
        elif image_url:
            file_path = await self._download_image_from_url(image_url)
        else:
            raise ValueError("Either file or image_url must be provided")

        try:
            result = await self.ocr_service.extract_text(file_path)
            return result
        finally:
            self._cleanup_file(file_path)

    async def analyze_text_only(
        self, text: str, category_id: str | None = None
    ) -> tuple[ReceiptAnalysisResult, float]:
        """
        Analyze receipt text only (no OCR).

        Args:
            text: Receipt text to analyze
            category_id: Optional category hint

        Returns:
            Tuple of (ReceiptAnalysisResult, processing_time)
        """
        return await self.llm_service.analyze_receipt(text, category_id)

    async def analyze_receipt_from_image(
        self,
        file: UploadFile | None = None,
        image_url: str | None = None,
        category_id: str | None = None,  # Deprecated, ignored
        ocr_method: OCRMethod = OCRMethod.DEEPSEEK,
        db: "AsyncSession | None" = None,  # For category inference
    ) -> AnalyzeReceiptFromImageResponse:
        """
        Analyze receipt from image - OCR + LLM analysis only (no DB save).

        This method allows users to preview analysis results before saving to DB.

        Steps:
        1. Save uploaded file or download from URL
        2. Extract text using OCR
        3. Analyze text with LLM (category_id is ignored)
        4. Infer category from item_type
        5. Generate suggested name and notes
        6. Return analysis result with warnings

        Args:
            file: Uploaded receipt image (provide either file or image_url)
            image_url: Receipt image URL (provide either file or image_url)
            category_id: Deprecated, ignored (kept for backward compatibility)
            ocr_method: OCR method to use
            db: Database session for category lookup (optional)

        Returns:
            AnalyzeReceiptFromImageResponse with analysis, suggestions, and auto-inferred category
        """
        start_time = time.time()
        warnings: list[str] = []

        # Step 1: Save uploaded file or download from URL
        if file:
            file_path = await self._save_upload_file(file)
        elif image_url:
            file_path = await self._download_image_from_url(image_url)
        else:
            raise ValueError("Either file or image_url must be provided")

        try:
            # Step 2: Extract text using OCR
            ocr_result = await self.ocr_service.extract_text(file_path)
            extracted_text = str(ocr_result["text"])

            if not extracted_text.strip():
                warnings.append("OCR 추출 결과가 비어있습니다. 이미지 품질을 확인하세요.")

            # Step 3: Analyze with LLM (이미지 + 텍스트 함께 전달)
            analysis, llm_time = await self.llm_service.analyze_receipt(
                extracted_text,
                category_id=None,
                image_path=file_path  # 원본 이미지 전달!
            )

            # Check confidence
            if analysis.confidence < 0.3:
                warnings.append(
                    f"분석 신뢰도가 낮습니다 ({analysis.confidence:.2f}). 수동 검토가 필요합니다."
                )
            elif analysis.confidence < 0.7:
                warnings.append(
                    f"분석 신뢰도가 보통입니다 ({analysis.confidence:.2f}). 주요 필드를 확인하세요."
                )

            # Step 3.5: Infer category from item_type
            suggested_category_code = None

            if analysis.line_items:
                from src.utils.category_mapper import infer_category_code

                item_type = analysis.line_items[0].item_type
                suggested_category_code = infer_category_code(item_type)

                if not suggested_category_code:
                    warnings.append(
                        f"카테고리를 자동으로 추론할 수 없습니다 (품목 타입: {item_type}). "
                        "수동으로 선택해주세요."
                    )

            # Step 4: Generate suggested name and notes
            # 여러 품목이 있을 경우 요약 생성
            if len(analysis.line_items) > 1:
                item_summary = ", ".join([
                    f"{item.item_type} {item.quantity}개"
                    for item in analysis.line_items
                ])
                suggested_name = f"복수 품목 ({item_summary})"
            elif len(analysis.line_items) == 1:
                item = analysis.line_items[0]
                suggested_name = item.name or "미확인 자산"
                if item.quantity > 1:
                    suggested_name = f"{suggested_name} (수량: {item.quantity})"
            else:
                suggested_name = "품목 없음"

            suggested_notes = self._build_notes(analysis)

            # Calculate total time
            processing_time = time.time() - start_time

            # Step 5: Return analysis result
            return AnalyzeReceiptFromImageResponse(
                extracted_text=extracted_text,
                analysis=analysis,
                ocr_method=ocr_method,
                suggested_name=suggested_name,
                suggested_notes=suggested_notes,
                suggested_category_code=suggested_category_code,
                processing_time=processing_time,
                warnings=warnings,
            )

        finally:
            # Clean up temporary file
            self._cleanup_file(file_path)

    async def create_asset_from_analysis(
        self,
        db: AsyncSession,
        request: CreateAssetFromAnalysisRequest,
        created_by: str,
    ) -> dict:
        """
        Create asset from user-confirmed analysis result.

        This method creates an asset based on analysis data that user has reviewed/modified.

        Args:
            db: Database session
            request: Analysis-based asset creation request
            created_by: User ID creating the asset

        Returns:
            Created asset dictionary
        """
        # Build CreateAssetRequest from user-confirmed data
        asset_data = CreateAssetRequest(
            asset_tag=request.asset_tag,
            name=request.name,
            category_id=request.category_id,
            location_id=request.location_id,
            purchase_date=request.purchase_date,
            purchase_price=request.purchase_price,
            notes=request.notes,
        )

        # Create asset
        asset = await AssetService.create_asset(
            db=db, asset_data=asset_data, created_by=created_by
        )

        return self._asset_to_dict(asset)

    async def _save_upload_file(self, file: UploadFile) -> Path:
        """
        Save uploaded file to temporary location.

        Args:
            file: Uploaded file

        Returns:
            Path to saved file
        """
        # Create upload directory if not exists
        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename
        file_ext = Path(file.filename or "image.jpg").suffix
        file_name = f"{uuid4().hex}{file_ext}"
        file_path = upload_dir / file_name

        # Save file
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        return file_path

    async def _download_image_from_url(self, url: str) -> Path:
        """
        Download image from URL to temporary location.

        Args:
            url: Image URL

        Returns:
            Path to downloaded file

        Raises:
            HTTPException: If download fails or URL is invalid
        """
        # Create upload directory if not exists
        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Determine file extension from URL
        url_path = url.split("?")[0]  # Remove query params
        file_ext = Path(url_path).suffix.lower()

        # Default to .jpg if no extension or unsupported
        allowed_extensions = {".png", ".jpg", ".jpeg", ".pdf", ".webp"}
        if file_ext not in allowed_extensions:
            file_ext = ".jpg"

        # Generate unique filename
        file_name = f"{uuid4().hex}{file_ext}"
        file_path = upload_dir / file_name

        try:
            # Download image with timeout
            timeout = aiohttp.ClientTimeout(total=30)  # 30 seconds timeout
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(url) as response:
                    if response.status != 200:
                        raise HTTPException(
                            status_code=400,
                            detail=f"이미지 다운로드 실패: HTTP {response.status}"
                        )

                    # Check content type
                    content_type = response.headers.get("Content-Type", "")
                    if not content_type.startswith(("image/", "application/pdf")):
                        raise HTTPException(
                            status_code=400,
                            detail=f"지원하지 않는 파일 타입입니다: {content_type}"
                        )

                    # Download and save
                    content = await response.read()

                    # Check file size (max 10MB by default)
                    max_size = getattr(settings, "MAX_UPLOAD_SIZE_MB", 10) * 1024 * 1024
                    if len(content) > max_size:
                        raise HTTPException(
                            status_code=400,
                            detail=f"파일 크기가 너무 큽니다 (최대 {max_size // (1024 * 1024)}MB)"
                        )

                    with open(file_path, "wb") as f:
                        f.write(content)

            return file_path

        except aiohttp.ClientError as e:
            raise HTTPException(
                status_code=400,
                detail=f"이미지 다운로드 실패: {str(e)}"
            )
        except Exception as e:
            # Clean up partial file if exists
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(
                status_code=500,
                detail=f"이미지 처리 실패: {str(e)}"
            )

    def _cleanup_file(self, file_path: Path) -> None:
        """
        Remove temporary file.

        Args:
            file_path: Path to file to remove
        """
        try:
            if file_path.exists():
                file_path.unlink()
        except Exception:
            pass  # Ignore cleanup errors

    def _build_notes(self, analysis: ReceiptAnalysisResult) -> str | None:
        """
        Build notes field content from analysis result.

        Args:
            analysis: LLM analysis result

        Returns:
            Formatted notes string or None
        """
        notes_parts = []

        # Document info
        if analysis.document_type:
            notes_parts.append(f"문서 유형: {analysis.document_type}")

        # Supplier info
        if analysis.supplier:
            notes_parts.append(f"공급업체: {analysis.supplier}")

        # Line items summary
        if analysis.line_items:
            items_summary = []
            for item in analysis.line_items:
                item_info = f"{item.item_type}: {item.name}"
                if item.quantity > 1:
                    item_info += f" x{item.quantity}"
                if item.model:
                    item_info += f" ({item.model})"
                items_summary.append(item_info)
            notes_parts.append("품목: " + ", ".join(items_summary))

        # Confidence
        notes_parts.append(f"영수증 분석 신뢰도: {analysis.confidence:.2%}")

        return " | ".join(notes_parts) if notes_parts else None

    def _build_asset_request(
        self,
        analysis: ReceiptAnalysisResult,
        asset_tag: str,
        category_id: str,
        location_id: str | None = None,
    ) -> CreateAssetRequest:
        """
        Build CreateAssetRequest from analysis result.

        Note: If multiple items exist, only the first item is used.
        For batch creation, use a different endpoint.

        Args:
            analysis: LLM analysis result
            asset_tag: Generated asset tag
            category_id: Category ID
            location_id: Optional location ID

        Returns:
            CreateAssetRequest object
        """
        # Build notes from analysis
        notes = self._build_notes(analysis)

        # Use first line item if available, otherwise use defaults
        if analysis.line_items:
            first_item = analysis.line_items[0]
            name = first_item.name or "미확인 자산"

            # Use first item's unit price (calculate total if needed)
            if first_item.unit_price:
                purchase_price = first_item.unit_price * first_item.quantity
            else:
                purchase_price = None
        else:
            name = "미확인 자산"
            purchase_price = None

        return CreateAssetRequest(
            asset_tag=asset_tag,
            name=name,
            category_id=category_id,
            location_id=location_id,
            purchase_date=analysis.purchase_date,
            purchase_price=purchase_price,
            notes=notes,
        )

    def _asset_to_dict(self, asset: Asset) -> dict:
        """
        Convert Asset model to dictionary for response.

        Args:
            asset: Asset model

        Returns:
            Dictionary representation
        """
        return {
            "id": asset.id,
            "asset_tag": asset.asset_tag,
            "name": asset.name,
            "status": asset.status.value,
            "category_id": asset.category_id,
            "location_id": asset.location_id,
            "grade": asset.grade.value,
            "purchase_date": asset.purchase_date.isoformat() if asset.purchase_date else None,
            "purchase_price": str(asset.purchase_price) if asset.purchase_price else None,
            "warranty_end": asset.warranty_end.isoformat() if asset.warranty_end else None,
            "notes": asset.notes,
            "created_at": asset.created_at.isoformat(),
            "updated_at": asset.updated_at.isoformat(),
        }


# Singleton instance
_asset_from_receipt_service: AssetFromReceiptService | None = None


def get_asset_from_receipt_service() -> AssetFromReceiptService:
    """Get or create AssetFromReceiptService instance."""
    global _asset_from_receipt_service
    if _asset_from_receipt_service is None:
        _asset_from_receipt_service = AssetFromReceiptService()
    return _asset_from_receipt_service

