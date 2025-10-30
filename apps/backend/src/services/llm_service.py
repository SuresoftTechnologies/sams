"""
LLM Service - Text Analysis and Information Extraction

이 서비스는 영수증 텍스트/이미지를 분석하여 구조화된 자산 정보를 추출합니다.
DeepSeek Vision API를 사용하여 분석합니다.

역할:
  - 텍스트 또는 이미지 → 구조화된 데이터 (자산 정보 추출)
  - Vision 모델 사용 (이미지를 직접 보면서 분석 가능)
  - JSON 형식으로 정보 반환

참고:
  - OCRService는 텍스트 추출만 수행
  - LLMService는 추출된 텍스트 + 원본 이미지를 함께 사용하여 더 정확한 분석 수행
"""

import base64
import json
import time
from datetime import datetime
from decimal import Decimal
from pathlib import Path

from openai import AsyncOpenAI

from src.config import settings
from src.schemas.receipt import ReceiptAnalysisResult


class LLMService:
    """Service for LLM-based receipt analysis."""

    def __init__(self) -> None:
        """Initialize LLM service with separate clients for Vision and Chat."""
        # DeepSeek Vision 클라이언트 (OCR 및 Vision 분석용)
        self.vision_client = AsyncOpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url=settings.DEEPSEEK_API_BASE,
            timeout=settings.DEEPSEEK_TIMEOUT,
        )
        
        # Qwen Chat 클라이언트 (텍스트 분석용)
        self.chat_client = AsyncOpenAI(
            api_key=settings.QWEN_API_KEY,
            base_url=settings.QWEN_API_BASE,
            timeout=settings.QWEN_TIMEOUT,
        )

    async def analyze_receipt(
        self, 
        text: str, 
        category_id: str | None = None,
        image_path: Path | None = None
    ) -> tuple[ReceiptAnalysisResult, float]:
        """
        Analyze receipt and extract asset information.
        
        두 가지 분석 방식을 지원합니다:
        1. Chat 모델 (권장): OCR 텍스트를 Chat 모델로 분석 (더 정확한 추론)
        2. Vision 모델: 이미지를 Vision 모델로 직접 분석 (시각적 정보 활용)

        Args:
            text: Extracted text from receipt (OCR 결과)
            category_id: Optional category ID hint (deprecated, 무시됨)
            image_path: Optional path to original image (Vision 모드에서 사용)

        Returns:
            Tuple of (ReceiptAnalysisResult, processing_time)
        """
        start_time = time.time()

        # 분석 방식 선택
        if settings.USE_VISION_FOR_ANALYSIS and image_path and image_path.exists():
            # 방식 1: Vision 모델이 이미지를 직접 보면서 분석
            client = self.vision_client
            model = settings.DEEPSEEK_OCR_MODEL
            message_content = self._build_vision_message(text, image_path)
        else:
            # 방식 2: Qwen Chat 모델로 OCR 텍스트 분석 (권장!)
            client = self.chat_client
            model = settings.QWEN_CHAT_MODEL
            message_content = self._build_text_only_message(text)

        # Call API (DeepSeek Vision 또는 Qwen Chat)
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": self._get_system_prompt()},
                {"role": "user", "content": message_content},
            ],
            temperature=0.2,
            max_tokens=2048,  # JSON 응답을 위해 증가
        )

        response_text = response.choices[0].message.content or "{}"
        processing_time = time.time() - start_time

        # Parse response
        try:
            analysis = self._parse_response(response_text)
        except Exception as e:
            # If parsing fails, return low confidence result
            analysis = ReceiptAnalysisResult(
                confidence=0.0,
                raw_data={"error": str(e), "raw_response": response_text, "model_used": model},
            )

        return analysis, processing_time

    def _get_system_prompt(self) -> str:
        """Get system prompt for receipt analysis."""
        return """당신은 구매 영수증 및 세금계산서에서 IT 자산 정보를 추출하는 전문가입니다.

영수증/세금계산서 텍스트를 분석하여 다음 정보를 JSON 형식으로 추출하세요:

## 📋 필수 추출 정보

### 1. 문서 정보
- document_type: 문서 유형 ("영수증" 또는 "세금계산서")
- purchase_date: 구매일자 (YYYY-MM-DD 형식)

### 2. 구매처 정보
- purchasing: 구매처명

### 3. 품목 정보 (line_items 배열)
**중요**: 한 영수증에 여러 품목이 있을 수 있습니다. 각 품목을 별도로 추출하세요.
품목 별로도 규격이 다르다면 각각 추출하세요.

각 품목마다:
- item_type: 자산 유형 ("데스크탑", "노트북", "모니터" 중 하나)
- name: 품목명
- quantity: 수량 (중요!)
- unit_price: 단가 (숫자만)
- model: 모델명/규격 (선택)
- specifications: 상세 사양 (CPU, RAM, SSD 등) (선택)

### 4. 신뢰도
- confidence: 추출 신뢰도 (0.0~1.0)

## ⚠️ 중요 주의사항

1. **여러 품목 처리**: 
   - 모니터 2대, 노트북 1대가 함께 있으면 line_items에 각각 추가
   - 각 품목의 수량(quantity)을 정확히 파악

2. **데스크탑 조립 영수증 자동 인식 (중요!)**:
   - 영수증에 PC 구성 부품들(메인보드, CPU, RAM, VGA/그래픽카드, SSD/HDD, 케이스, 파워 등)이 나열되어 있고,
   - "조립비", "조립 PC", "조립TEST" 등의 항목이 있다면,
   - 이것은 **데스크탑 조립 영수증**입니다.
   - 이 경우:
     * item_type: "데스크탑"
     * name: "조립 PC" 또는 적절한 명칭 (예: "조립 PC (AMD 라이젠 7 2700)")
     * quantity: 1 (조립된 데스크탑 대수)
     * unit_price: 총 구성품 가격의 합계 (조립비 포함)
     * specifications: 주요 사양만 간단히 요약 (CPU, RAM 용량, 저장장치 용량 등)

3. **필드 제한**:
   - 위에 명시된 필드만 추출하세요
   - supplier, invoice_number, invoice_date, subtotal, tax_amount, total_amount, warranty 등의 필드는 추출하지 마세요
   - line_items에는 item_type, name, quantity, unit_price, model, specifications만 포함하세요

추출할 수 없는 정보는 null로 표시하세요.
반드시 유효한 JSON 형식으로 응답하세요.

## 예시 1: 단일 품목 (노트북 2대)
{
  "document_type": "세금계산서",
  "purchase_date": "2024-01-15",
  "purchasing": "델코리아",
  "line_items": [
    {
      "item_type": "노트북",
      "name": "Dell Latitude 5420",
      "quantity": 2,
      "unit_price": 1200000,
      "model": "Latitude 5420",
      "specifications": "i5-1135G7, 16GB RAM, 512GB SSD"
    }
  ],
  "confidence": 0.95
}

## 예시 2: 데스크탑 조립 영수증 (부품 리스트 + 조립비 인식)
{
  "document_type": "영수증",
  "purchase_date": "2019-02-11",
  "purchasing": "컴퓨존",
  "line_items": [
    {
      "item_type": "데스크탑",
      "name": "조립 PC (AMD 라이젠 7 2700)",
      "quantity": 1,
      "unit_price": 747200,
      "model": "조립PC",
      "specifications": "AMD 라이젠 7 2700, 16GB DDR4, 256GB NVMe SSD, RX570 8GB"
    }
  ],
  "confidence": 0.92
}

## 예시 3: 여러 품목 (데스크탑 1대 + 모니터 2대)
{
  "document_type": "영수증",
  "purchase_date": "2024-01-20",
  "purchasing": "컴퓨존",
  "line_items": [
    {
      "item_type": "데스크탑",
      "name": "조립 PC",
      "quantity": 1,
      "unit_price": 1500000,
      "model": "사무용 조립PC",
      "specifications": "i5-12400, 16GB DDR4, 512GB NVMe SSD"
    },
    {
      "item_type": "모니터",
      "name": "LG 27인치 모니터",
      "quantity": 2,
      "unit_price": 150000,
      "model": "27ML600",
      "specifications": "27인치 FHD IPS"
    }
  ],
  "confidence": 0.90
}
"""

    def _build_vision_message(self, text: str, image_path: Path) -> list:
        """
        Build message content with image for Vision API.
        
        Vision 모델에게 이미지와 OCR 텍스트를 함께 제공합니다.
        이미지를 직접 보면서 분석하므로 더 정확합니다.
        
        Args:
            text: OCR로 추출된 텍스트 (참고용)
            image_path: 원본 이미지 경로
            
        Returns:
            Vision API용 content 배열
        """
        # Encode image to base64
        image_base64 = self._encode_image(image_path)
        image_url = f"data:image/jpeg;base64,{image_base64}"
        
        return [
            {
                "type": "text",
                "text": f"""다음은 영수증 이미지입니다. 이미지를 보고 IT 자산 정보를 JSON 형식으로 추출하세요.

참고: OCR로 추출된 텍스트
{text}

위 텍스트는 참고용이며, 반드시 이미지를 직접 확인하여 정확한 정보를 추출하세요."""
            },
            {
                "type": "image_url",
                "image_url": {"url": image_url, "detail": "high"}
            }
        ]
    
    def _build_text_only_message(self, text: str) -> str:
        """
        Build message content with text only (fallback).
        
        이미지가 없을 때 텍스트만으로 분석합니다.
        Vision 모델에게 텍스트만 주는 것이므로 정확도가 떨어질 수 있습니다.
        
        Args:
            text: OCR로 추출된 텍스트
            
        Returns:
            텍스트 프롬프트
        """
        return f"""다음 영수증 텍스트를 분석하여 자산 정보를 JSON 형식으로 추출하세요:

{text}"""
    
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

    def _parse_response(self, response_text: str) -> ReceiptAnalysisResult:
        """
        Parse LLM response and create ReceiptAnalysisResult.

        Args:
            response_text: Raw response from LLM

        Returns:
            ReceiptAnalysisResult object
        """
        # Extract JSON from response
        json_text = response_text.strip()
        
        # Remove <think> tags (Qwen 모델이 사고 과정을 출력하는 경우)
        import re
        json_text = re.sub(r'<think>.*?</think>', '', json_text, flags=re.DOTALL)
        json_text = json_text.strip()
        
        # Handle markdown code blocks
        if json_text.startswith("```json"):
            json_text = json_text[7:]  # Remove ```json
        if json_text.startswith("```"):
            json_text = json_text[3:]  # Remove ```
        if json_text.endswith("```"):
            json_text = json_text[:-3]  # Remove ```
        json_text = json_text.strip()

        # Parse JSON
        data = json.loads(json_text)

        # Helper function to parse date
        def parse_date(date_str: str | None) -> datetime | None:
            if not date_str:
                return None
            try:
                return datetime.fromisoformat(date_str)
            except (ValueError, TypeError):
                return None

        # Helper function to parse decimal
        def parse_decimal(value: str | int | float | None) -> Decimal | None:
            if value is None:
                return None
            try:
                return Decimal(str(value))
            except (ValueError, TypeError):
                return None

        # Parse dates
        purchase_date = parse_date(data.get("purchase_date"))

        # Parse line items
        from src.schemas.receipt import ReceiptLineItem

        line_items = []
        for item_data in data.get("line_items", []):
            # Create line item
            line_items.append(
                ReceiptLineItem(
                    item_type=item_data.get("item_type", "기타"),
                    name=item_data.get("name", ""),
                    quantity=int(item_data.get("quantity", 1)),
                    unit_price=parse_decimal(item_data.get("unit_price")),
                    model=item_data.get("model"),
                    specifications=item_data.get("specifications"),
                )
            )

        # Get confidence (default to 0.5 if not provided)
        confidence = float(data.get("confidence", 0.5))

        return ReceiptAnalysisResult(
            document_type=data.get("document_type", "영수증"),
            purchase_date=purchase_date,
            supplier=data.get("purchasing"),  # Use 'purchasing' field from LLM
            line_items=line_items,
            confidence=confidence,
            raw_data=data,
        )


# Singleton instance
_llm_service: LLMService | None = None


def get_llm_service() -> LLMService:
    """Get or create LLM service instance."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service

