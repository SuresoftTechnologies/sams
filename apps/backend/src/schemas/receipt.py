"""
Receipt processing schemas.
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class OCRMethod(str, Enum):
    """OCR extraction method."""

    DEEPSEEK = "deepseek"


class ExtractTextRequest(BaseModel):
    """Request to extract text from receipt image."""

    method: OCRMethod = Field(default=OCRMethod.DEEPSEEK, description="OCR method to use")


class ExtractTextResponse(BaseModel):
    """Response with extracted text."""

    text: str = Field(..., description="Extracted text from image")
    method: OCRMethod = Field(..., description="OCR method used")
    processing_time: float = Field(..., description="Processing time in seconds")
    pages: int = Field(default=1, description="Number of pages processed")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "text": "영수증\n델코리아\n제품명: Dell Latitude 5420\n...",
                "method": "deepseek",
                "processing_time": 1.5,
                "pages": 1,
            }
        }
    )


class ReceiptLineItem(BaseModel):
    """Individual line item from receipt."""

    item_type: str = Field(..., description="Asset type (데스크탑, 노트북, 모니터, etc.)")
    name: str = Field(..., description="Item name")
    quantity: int = Field(default=1, description="Quantity")
    unit_price: Decimal | None = Field(None, description="Unit price")
    model: str | None = Field(None, description="Model number")
    specifications: str | None = Field(None, description="Specifications/details")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "item_type": "노트북",
                "name": "Dell Latitude 5420",
                "quantity": 2,
                "unit_price": "1200000",
                "model": "5420",
                "specifications": "i5-1135G7, 16GB RAM, 512GB SSD",
            }
        }
    )


class ReceiptAnalysisResult(BaseModel):
    """Extracted asset information from receipt text."""

    # Document information
    document_type: str = Field(
        default="영수증", description="Document type (영수증, 세금계산서, etc.)"
    )
    purchase_date: datetime | None = Field(None, description="Purchase date")

    # Supplier information
    supplier: str | None = Field(None, description="Supplier/Vendor name")

    # Line items
    line_items: list[ReceiptLineItem] = Field(
        default_factory=list, description="List of purchased items"
    )

    # Metadata
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    raw_data: dict | None = Field(None, description="Raw extracted data")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "document_type": "영수증",
                "purchase_date": "2024-01-15T00:00:00Z",
                "supplier": "델코리아",
                "line_items": [
                    {
                        "item_type": "노트북",
                        "name": "Dell Latitude 5420",
                        "quantity": 2,
                        "unit_price": "1200000",
                        "model": "5420",
                        "specifications": "i5-1135G7, 16GB RAM, 512GB SSD",
                    }
                ],
                "confidence": 0.95,
            }
        }
    )


class AnalyzeReceiptRequest(BaseModel):
    """Request to analyze receipt text."""

    text: str = Field(..., min_length=1, description="Receipt text to analyze")
    category_id: str | None = Field(None, description="Category ID hint for analysis")


class AnalyzeReceiptResponse(BaseModel):
    """Response with analyzed receipt information."""

    analysis: ReceiptAnalysisResult
    processing_time: float = Field(..., description="Processing time in seconds")


class CreateAssetFromReceiptRequest(BaseModel):
    """Request to create asset from receipt."""

    category_id: str = Field(..., description="Asset category ID")
    location_id: str | None = Field(None, description="Initial location ID")
    ocr_method: OCRMethod = Field(
        default=OCRMethod.DEEPSEEK, description="OCR method to use"
    )
    auto_generate_tag: bool = Field(
        default=True, description="Auto-generate asset tag"
    )
    asset_tag_prefix: str | None = Field(None, description="Asset tag prefix override")


class AnalyzeReceiptFromImageResponse(BaseModel):
    """Response with receipt analysis from image (before DB save)."""

    extracted_text: str = Field(..., description="Extracted text from receipt")
    analysis: ReceiptAnalysisResult = Field(..., description="Analyzed receipt information")
    ocr_method: OCRMethod = Field(..., description="OCR method used")
    suggested_name: str = Field(..., description="Suggested asset name (manufacturer + name)")
    suggested_notes: str | None = Field(None, description="Suggested notes field content")
    suggested_category_code: str | None = Field(
        None, 
        description="Auto-inferred category code (11=데스크탑, 12=노트북, 14=모니터)"
    )
    processing_time: float = Field(..., description="Total processing time in seconds")
    warnings: list[str] = Field(default_factory=list, description="Processing warnings")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "extracted_text": "영수증\n델코리아\n...",
                "analysis": {
                    "document_type": "영수증",
                    "purchase_date": "2024-01-15T00:00:00",
                    "supplier": "델코리아",
                    "line_items": [
                        {
                            "item_type": "노트북",
                            "name": "Dell Latitude 5420",
                            "quantity": 2,
                            "unit_price": "1200000",
                            "model": "5420",
                            "specifications": "i5-1135G7, 16GB RAM, 512GB SSD",
                        }
                    ],
                    "confidence": 0.95,
                },
                "ocr_method": "deepseek",
                "suggested_name": "Dell Latitude 5420",
                "suggested_notes": "모델: 5420 | 공급업체: 델코리아 | 영수증 분석 신뢰도: 95.00%",
                "suggested_category_code": "12",
                "processing_time": 4.2,
                "warnings": [],
            }
        }
    )


class CreateAssetFromAnalysisRequest(BaseModel):
    """Request to create asset from analysis result."""

    # Required fields
    asset_tag: str = Field(..., description="Asset tag")
    name: str = Field(..., min_length=1, description="Asset name")
    category_id: str = Field(..., description="Asset category ID")

    # Optional fields from analysis
    location_id: str | None = Field(None, description="Initial location ID")
    purchase_date: datetime | None = Field(None, description="Purchase date")
    purchase_price: Decimal | None = Field(None, description="Purchase price")
    notes: str | None = Field(None, description="Additional notes")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "asset_tag": "SRS-11-2024-0001",
                "name": "Dell Latitude 5420",
                "category_id": "550e8400-e29b-41d4-a716-446655440001",
                "location_id": "550e8400-e29b-41d4-a716-446655440002",
                "purchase_date": "2024-01-15T00:00:00Z",
                "purchase_price": "1200000",
                "notes": "모델: 5420 | 공급업체: 델코리아 | 영수증 분석 신뢰도: 95.00%",
            }
        }
    )


class CreateAssetFromReceiptResponse(BaseModel):
    """Response with created asset from receipt."""

    asset: dict = Field(..., description="Created asset object")
    extracted_text: str = Field(..., description="Extracted text from receipt")
    analysis: ReceiptAnalysisResult = Field(..., description="Analyzed receipt information")
    ocr_method: OCRMethod = Field(..., description="OCR method used")
    total_time: float = Field(..., description="Total processing time in seconds")
    warnings: list[str] = Field(default_factory=list, description="Processing warnings")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "asset": {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "asset_tag": "SRS-11-2024-0001",
                    "name": "Dell Latitude 5420",
                },
                "extracted_text": "영수증\n델코리아\n...",
                "analysis": {
                    "name": "Dell Latitude 5420",
                    "manufacturer": "Dell",
                    "confidence": 0.95,
                },
                "ocr_method": "deepseek",
                "total_time": 4.2,
                "warnings": [],
            }
        }
    )

