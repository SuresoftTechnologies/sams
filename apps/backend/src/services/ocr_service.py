"""
OCR Service - Image to Text Extraction

이 서비스는 영수증 이미지에서 텍스트를 추출합니다.
DeepSeek Vision API를 사용하여 이미지를 직접 처리합니다.

역할:
  - 이미지 → 텍스트 추출 (OCR)
  - Vision 모델 사용
  
다음 단계:
  - 추출된 텍스트는 LLMService에서 분석됨
"""

import base64
import time
from pathlib import Path

from openai import AsyncOpenAI

from src.config import settings


class OCRService:
    """Service for OCR text extraction."""

    def __init__(self) -> None:
        """Initialize OCR service."""
        self.deepseek_client = AsyncOpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url=settings.DEEPSEEK_API_BASE,
            timeout=settings.DEEPSEEK_TIMEOUT,
        )

    async def extract_text(
        self, file_path: Path
    ) -> dict[str, str | float | int]:
        """
        Extract text using DeepSeek OCR API (vision model).

        Args:
            file_path: Path to image file

        Returns:
            Dictionary with text, processing_time, pages
        """
        start_time = time.time()

        # Read and encode image as base64
        image_base64 = self._encode_image(file_path)
        image_url = f"data:image/jpeg;base64,{image_base64}"

        # Call DeepSeek OCR API (Vision model for text extraction)
        response = await self.deepseek_client.chat.completions.create(
            model=settings.DEEPSEEK_OCR_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "당신은 OCR 전문가입니다. 이미지에서 모든 텍스트를 정확하게 추출하세요. 추출한 텍스트만 반환하고 다른 설명이나 주석은 절대 추가하지 마세요.",
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "이 이미지에서 보이는 모든 텍스트를 원본 그대로 추출해주세요. 레이아웃과 줄바꿈을 유지하세요.",
                        },
                        {"type": "image_url", "image_url": {"url": image_url, "detail": "auto"}},
                    ],
                },
            ],
            temperature=0.1,  # OCR은 매우 정확해야 하므로 낮은 temperature
            max_tokens=2048,
        )

        text = response.choices[0].message.content or ""
        processing_time = time.time() - start_time

        return {
            "text": text,
            "processing_time": processing_time,
            "pages": 1,  # DeepSeek processes one image at a time
            "method": "deepseek",
        }

    def _encode_image(self, file_path: Path) -> str:
        """
        Encode image file to base64 string.

        Args:
            file_path: Path to image file

        Returns:
            Base64 encoded string
        """
        with open(file_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")


# Singleton instance
_ocr_service: OCRService | None = None


def get_ocr_service() -> OCRService:
    """Get or create OCR service instance."""
    global _ocr_service
    if _ocr_service is None:
        _ocr_service = OCRService()
    return _ocr_service

