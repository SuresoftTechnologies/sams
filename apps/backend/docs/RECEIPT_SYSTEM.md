# 영수증 기반 자산 생성 시스템

## 📋 개요

영수증 이미지를 업로드하면 DeepSeek OCR Vision API로 텍스트를 추출하고, LLM이 분석하여 자동으로 자산 정보를 추출하는 시스템입니다.

**주요 기능**:
- 영수증 이미지/URL에서 텍스트 자동 추출 (OCR)
- LLM 기반 자산 정보 분석 및 추출
- 다중 품목, 세금계산서, 데스크탑 구성품 지원
- 2단계 워크플로우 (분석 → 확인 → 생성)

---

## 🏗️ 아키텍처

### 서비스 구조

```
┌─────────────────────────────────────────────────────────┐
│                  Receipts Router                        │
│            (api/v1/endpoints/receipts.py)               │
│                                                         │
│  엔드포인트:                                             │
│  - POST /receipts/extract-text                         │
│  - POST /receipts/analyze-text                         │
│  - POST /receipts/analyze-receipt       (권장)         │
│  - POST /receipts/create-asset-from-analysis (권장)    │
│  - POST /receipts/create-asset          (Deprecated)   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│          AssetFromReceiptService                        │
│      (services/asset_from_receipt_service.py)           │
│                                                         │
│  역할: 전체 워크플로우 조율                              │
│  - 파일 업로드/다운로드 관리                             │
│  - OCR + LLM 서비스 조합                                │
│  - DB 저장 처리                                         │
│  - 경고 메시지 및 추천값 생성                            │
└──────────────┬──────────────────┬───────────────────────┘
               │                  │
               ↓                  ↓
┌──────────────────────┐    ┌──────────────────────┐
│    OCRService        │    │    LLMService        │
│  (ocr_service.py)    │    │  (llm_service.py)    │
│                      │    │                      │
│  역할: 이미지→텍스트  │    │  역할: 텍스트→데이터  │
│  - Vision API 사용   │    │  - Chat API 사용 ⭐  │
│  - 텍스트 추출       │    │  - 텍스트 분석       │
│  - Base64 인코딩     │    │  - 정보 추출         │
│                      │    │  - JSON 파싱         │
└──────────────────────┘    └──────────────────────┘
         ↓                           ↑
         └───────────────────────────┘
            OCR 텍스트 전달

⭐ 기본값: Chat 모델 사용 (더 정확한 추론)
📝 선택사항: Vision 모델 직접 사용 (시각적 정보 활용)
```

### 서비스 역할

| 서비스 | 입력 | 출력 | API | 역할 |
|--------|------|------|-----|------|
| **OCRService** | 이미지 | 텍스트 | Vision API | OCR 텍스트 추출 |
| **LLMService** | 텍스트 (또는 이미지) | 구조화된 데이터 | **Chat API** (또는 Vision API) | 자산 정보 분석 및 JSON 생성 |
| **AssetFromReceiptService** | 이미지/텍스트 | 자산 또는 분석결과 | 두 API 조합 | 전체 워크플로우 통합 |

**⭐ 권장 설정**: LLMService는 **Qwen3-32B Chat 모델**을 사용하여 OCR 텍스트를 분석합니다.
- Qwen3-32B는 32B 파라미터의 강력한 Chat 모델
- 텍스트 이해 및 JSON 구조화에 최적화됨
- Vision 모델보다 복잡한 추론을 더 정확하게 수행

**선택 사항**: Vision 모델로 이미지 직접 분석 (`USE_VISION_FOR_ANALYSIS=true`)
- 시각적 정보(레이아웃, 표 구조) 활용 가능
- 하지만 JSON 구조화 정확도는 Chat 모델보다 낮을 수 있음

---

## 📡 API 엔드포인트

### 1. 영수증 분석 (미리보기) ⭐ 권장

**Endpoint**: `POST /api/v1/receipts/analyze-receipt`

**용도**: OCR + LLM 분석 (DB 저장 안 함, 미리보기용)

**입력 옵션** (하나 선택):
- 📁 파일 업로드: `-F "file=@receipt.jpg"`
- 🔗 이미지 URL: `-F "image_url=https://example.com/receipt.jpg"`

**파라미터**:
- `ocr_method` (선택): OCR 방식 (기본값: deepseek)

**✨ 새로운 기능**: 카테고리 자동 추론!
- LLM이 영수증에서 품목 타입(노트북/데스크탑/모니터)을 추출
- 시스템이 자동으로 카테고리 코드/UUID 매핑
- 사용자가 category_id를 수동으로 입력할 필요 없음!

**예시 (파일)**:
```bash
curl -X POST "http://localhost:8000/api/v1/receipts/analyze-receipt" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@receipt.jpg"
```

**예시 (URL)**:
```bash
curl -X POST "http://localhost:8000/api/v1/receipts/analyze-receipt" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image_url=https://example.com/receipt.jpg"
```

**응답**:
```json
{
  "extracted_text": "영수증\n델코리아\n...",
  "analysis": {
    "document_type": "영수증",
    "purchase_date": "2024-01-15",
    "supplier": "델코리아",
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
  },
  "suggested_name": "Dell Latitude 5420 (수량: 2)",
  "suggested_notes": "문서 유형: 영수증 | 공급업체: 델코리아 | 품목: 노트북: Dell Latitude 5420 | 영수증 분석 신뢰도: 95.00%",
  "suggested_category_code": "12",
  "warnings": []
}
```

**✨ 새로 추가된 필드**:
- `suggested_category_code`: 자동 추론된 카테고리 코드 ("11"=데스크탑, "12"=노트북, "14"=모니터)

---

### 2. 자산 생성 (확정) ⭐ 권장

**Endpoint**: `POST /api/v1/receipts/create-asset-from-analysis`

**용도**: 사용자가 확인/수정한 데이터로 자산 생성 (DB 저장)

**파라미터**:
```typescript
{
  asset_tag: string;        // 필수
  name: string;             // 필수
  category_id: string;      // 필수
  location_id?: string;
  purchase_date?: datetime;
  purchase_price?: Decimal;
  warranty_end?: datetime;
  notes?: string;
}
```

**예시**:
```bash
curl -X POST "http://localhost:8000/api/v1/receipts/create-asset-from-analysis" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "asset_tag": "SRS-12-2024-0001",
    "name": "Dell Latitude 5420 노트북",
    "category_id": "550e8400-e29b-41d4-a716-446655440001",
    "location_id": "LOCATION_UUID",
    "purchase_date": "2024-01-15T00:00:00",
    "purchase_price": "1200000",
    "notes": "모델: 5420 | 공급업체: 델코리아"
  }'
```

**💡 팁**: `category_id`는 이전 단계(`/analyze-receipt`)의 `suggested_category_code`를 사용하여 카테고리를 선택하거나, 프론트엔드에서 카테고리 UUID를 직접 조회하여 사용하면 됩니다!

---

### 3. 텍스트 추출 (OCR만)

**Endpoint**: `POST /api/v1/receipts/extract-text`

**용도**: 이미지에서 텍스트만 추출

**입력 옵션**: 파일 또는 URL
**출력**:
```json
{
  "text": "영수증\n델코리아\n...",
  "method": "deepseek",
  "processing_time": 2.5,
  "pages": 1
}
```

---

### 4. 텍스트 분석 (LLM만)

**Endpoint**: `POST /api/v1/receipts/analyze-text`

**용도**: 추출된 텍스트에서 자산 정보 분석

**입력**:
```json
{
  "text": "영수증 텍스트...",
  "category_id": "CATEGORY_UUID"  // 선택
}
```

**출력**:
```json
{
  "analysis": {
    "name": "Dell Latitude 5420",
    "model": "5420",
    "manufacturer": "Dell",
    "purchase_date": "2024-01-15",
    "purchase_price": 1200000,
    "confidence": 0.92
  },
  "processing_time": 2.3
}
```

---

### 5. 자산 즉시 생성 (Deprecated) ⚠️

**Endpoint**: `POST /api/v1/receipts/create-asset`

**용도**: OCR + LLM + DB 저장을 한 번에 실행 (사용자 확인 없음)

**권장하지 않음**: 대신 `/analyze-receipt` + `/create-asset-from-analysis` 사용

---

## 🔄 권장 워크플로우 (2단계)

```
Step 1: 분석
──────────────────────────────
사용자 → [POST /receipts/analyze-receipt]
         ↓
    영수증 이미지/URL (category_id 입력 불필요!)
         ↓
    OCR (텍스트 추출)
         ↓
    LLM (정보 분석 + item_type 추출)
         ↓
    카테고리 자동 추론 (노트북 → 12)
         ↓
    분석 결과 반환
    - suggested_name, suggested_notes
    - suggested_category_code, suggested_category_id ✨
    - confidence, warnings
    ✅ DB 저장 안 함

Step 2: 확인 및 생성
──────────────────────────────
사용자가 결과 확인/수정
(카테고리는 이미 자동으로 채워짐!)
         ↓
[POST /receipts/create-asset-from-analysis]
         ↓
    DB에 자산 저장
         ↓
    완료!
```

**장점**:
- ✅ 사용자가 분석 결과를 먼저 확인
- ✅ 잘못된 정보 수정 기회
- ✅ 낮은 신뢰도 결과 검토 후 생성
- ✅ 정확한 자산 데이터 보장
- ✨ **카테고리 자동 추론으로 입력 단계 최소화**

---

## 📊 데이터 구조

### ReceiptAnalysisResult

```python
{
  # 문서 정보
  "document_type": "영수증",              # 영수증/세금계산서
  "purchase_date": "2024-01-15",          # 구매일
  
  # 공급업체
  "supplier": "델코리아",
  
  # 품목 리스트
  "line_items": [
    {
      "item_type": "노트북",
      "name": "Dell Latitude 5420",
      "quantity": 2,                      # 수량
      "unit_price": 1200000,              # 단가
      "model": "Latitude 5420",
      "specifications": "i5-1135G7, 16GB RAM, 512GB SSD"
    }
  ],
  
  # 신뢰도
  "confidence": 0.95,
  
  # 원본 데이터 (참고용)
  "raw_data": { ... }
}
```

**필드 설명**:
- `document_type`: 문서 유형 (영수증/세금계산서)
- `purchase_date`: 구매일자
- `supplier`: 공급업체/구매처 이름
- `line_items`: 품목 리스트
  - `item_type`: 자산 유형 (데스크탑/노트북/모니터)
  - `name`: 품목명
  - `quantity`: 수량
  - `unit_price`: 단가
  - `model`: 모델명 (선택)
  - `specifications`: 상세 사양 (선택)
- `confidence`: 분석 신뢰도 (0.0~1.0)
- `raw_data`: LLM이 반환한 원본 JSON (참고용)

---

## 🚀 설치 및 설정

### 1. 의존성 설치

```bash
cd apps/backend
uv pip install openai aiofiles
```

### 2. 환경 변수 (.env)

```bash
# DeepSeek OCR API (Vision 모델)
DEEPSEEK_API_BASE=http://10.10.10.200:19751/v1
DEEPSEEK_OCR_MODEL=deepseek-ai/DeepSeek-OCR  # Vision 모델 (OCR 전용)
DEEPSEEK_API_KEY=EMPTY
DEEPSEEK_TIMEOUT=60

# Qwen Chat API (텍스트 분석용)
QWEN_API_BASE=http://10.10.10.200:19750/v1
QWEN_CHAT_MODEL=Qwen/Qwen3-32B  # Chat 모델 (텍스트 분석 전용, 권장!)
QWEN_API_KEY=EMPTY
QWEN_TIMEOUT=60

# Receipt Analysis Settings
USE_VISION_FOR_ANALYSIS=false  # false: Chat 모델 사용 (권장), true: Vision 모델 직접 사용

# 파일 업로드
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=10
```

**⭐ 권장 설정**:
- `USE_VISION_FOR_ANALYSIS=false` (기본값)
- **Qwen3-32B Chat 모델**이 텍스트 분석 및 JSON 구조화에 더 뛰어남
- 각 모델이 자신의 강점(OCR vs 텍스트 분석)에만 집중

**대안 설정**:
- `USE_VISION_FOR_ANALYSIS=true`
- Vision 모델이 이미지를 직접 보면서 분석
- 시각적 정보 활용 가능하지만 JSON 정확도는 낮을 수 있음

### 3. 디렉토리 생성

```bash
mkdir -p apps/backend/uploads
```

---

## 📝 신뢰도 기반 처리

| 신뢰도 | 설명 | 권장 조치 |
|--------|------|----------|
| ≥ 0.7 | 높음 | 확인 후 바로 생성 가능 |
| 0.3~0.7 | 보통 | 주요 필드 검토 후 생성 |
| < 0.3 | 낮음 | 전체 수동 검토 필수 |

---

## 🎯 사용 예시

### TypeScript/React

```typescript
// Step 1: 영수증 분석 (category_id 불필요!)
const formData = new FormData();
formData.append('file', file);
// category_id 입력 필요 없음! ✨

const analysisResponse = await fetch('/api/v1/receipts/analyze-receipt', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
const analysis = await analysisResponse.json();

// 사용자에게 결과 표시 (신뢰도, 추천값, 자동 추론된 카테고리)
showAnalysisReview(analysis);

// Step 2: 사용자 확인 후 자산 생성
const assetData = {
  asset_tag: await generateAssetTag(analysis.suggested_category_code),
  name: analysis.suggested_name,           // 또는 사용자 수정값
  category_id: await getCategoryIdFromCode(analysis.suggested_category_code),  // 코드로 UUID 조회
  purchase_date: analysis.analysis.purchase_date,
  purchase_price: analysis.analysis.line_items[0]?.unit_price,
  notes: analysis.suggested_notes,
};

const assetResponse = await fetch('/api/v1/receipts/create-asset-from-analysis', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(assetData)
});
const asset = await assetResponse.json();
```

### Python

```python
import requests

# Step 1: 분석 (category_id 불필요!)
files = {'file': open('receipt.jpg', 'rb')}
response = requests.post(
    'http://localhost:8000/api/v1/receipts/analyze-receipt',
    headers={'Authorization': f'Bearer {token}'},
    files=files
)
analysis = response.json()

# Step 2: 생성 (category_id는 프론트엔드에서 코드로 조회)
asset_data = {
    'asset_tag': f"SRS-{analysis['suggested_category_code']}-2024-0001",
    'name': analysis['suggested_name'],
    'category_id': get_category_id_from_code(analysis['suggested_category_code']),
    'purchase_price': analysis['analysis']['line_items'][0]['unit_price'],
}
response = requests.post(
    'http://localhost:8000/api/v1/receipts/create-asset-from-analysis',
    headers={'Authorization': f'Bearer {token}'},
    json=asset_data
)
asset = response.json()
```

---

## 🔧 주요 기능

### 1. 카테고리 자동 추론 ✨ NEW!
- LLM이 영수증에서 품목 타입 추출 (노트북, 데스크탑, 모니터)
- 시스템이 자동으로 카테고리 코드 추론
  - "노트북" → 코드 12
  - "데스크탑" → 코드 11
  - "모니터" → 코드 14
- 프론트엔드에서 코드로 카테고리 UUID를 조회하여 사용
- 잘못된 카테고리 선택 방지

### 2. 이미지 URL 지원
- 파일 업로드 대신 URL 제공 가능
- HTTP/HTTPS 지원
- 최대 10MB, 30초 타임아웃

### 3. 다중 품목 지원
- 한 영수증에 여러 품목 추출
- 각 품목의 수량, 단가, 총액 파악
- 현재는 첫 번째 품목만 자산으로 생성

### 4. 세금계산서 정보
- 세금계산서 번호, 발행일
- 공급가액, 세액, 합계 분리
- 사업자등록번호

### 5. 데스크탑 조립 인식
- 영수증에 PC 부품들(메인보드, CPU, RAM, VGA, SSD, 케이스, 파워 등)과 조립비가 있으면 데스크탑으로 자동 인식
- 주요 사양만 specifications에 요약 (예: "AMD 라이젠 7, 16GB DDR4, 256GB SSD")
- 구성품을 일일이 나열할 필요 없음

---

## ⚠️ 주의사항

### 파일 처리
- 지원 형식: PNG, JPG, JPEG, PDF, WEBP
- 최대 크기: 10MB (환경 변수로 변경 가능)
- 처리 후 자동 삭제

### URL 다운로드
- 공개 URL이어야 함 (인증 불필요)
- `file`과 `image_url` 중 하나만 제공
- Content-Type: `image/*` 또는 `application/pdf`

### 성능
- OCR: 2~5초
- LLM 분석: 2~4초
- 전체 워크플로우: 6~10초

---

## 📚 코드 참조

| 파일 | 역할 |
|------|------|
| `api/v1/endpoints/receipts.py` | API 엔드포인트 정의 |
| `services/ocr_service.py` | OCR 서비스 (이미지→텍스트 추출, 참고용) |
| `services/llm_service.py` | **LLM 서비스 (이미지→구조화된 데이터, Vision 모델 사용)** |
| `services/asset_from_receipt_service.py` | 통합 워크플로우 |
| `schemas/receipt.py` | 스키마 정의 |

---

**작성일**: 2024-10-30  
**버전**: 4.2.0 (불필요한 필드 제거, 간소화)

## 🔄 버전 4.2.0 주요 변경사항

### 응답 구조 간소화

**제거된 필드들**:
- ❌ `invoice_number`, `invoice_date` (세금계산서 정보)
- ❌ `supplier_business_number` (사업자등록번호)
- ❌ `subtotal`, `tax_amount`, `total_amount` (금액 상세)
- ❌ `warranty_period`, `warranty_end` (보증 정보)
- ❌ `line_items[].total_price` (품목 총액)
- ❌ `line_items[].manufacturer` (제조사)
- ❌ `line_items[].serial_number` (시리얼 번호)
- ❌ `line_items[].components` (구성품 배열)
- ❌ `suggested_category_id` (카테고리 UUID)

**유지된 핵심 필드**:
- ✅ `document_type` (문서 유형)
- ✅ `purchase_date` (구매일)
- ✅ `supplier` (구매처)
- ✅ `line_items` (품목 리스트)
  - `item_type`, `name`, `quantity`, `unit_price`, `model`, `specifications`
- ✅ `confidence` (신뢰도)
- ✅ `suggested_category_code` (카테고리 코드)

**변경 이유**:
- LLM 프롬프트 단순화로 응답 정확도 향상
- 실제 사용되는 필드만 남겨 API 응답 크기 감소
- 자산 생성에 필수적인 정보에만 집중

---

## 🔄 버전 4.1.0 주요 변경사항

### 두 가지 분석 방식 지원

#### ⭐ 방식 1: OCR + Qwen3-32B Chat 모델 분리 (기본값, 권장)
```
이미지 → DeepSeek Vision(OCR) → 텍스트 → Qwen3-32B Chat → JSON
```

**모델 구성**:
- **OCR**: DeepSeek-OCR Vision 모델 (10.10.10.200:19751)
- **분석**: Qwen3-32B Chat 모델 (10.10.10.200:19750) ⭐

**장점**:
- ✅ **각 모델이 자신의 강점 발휘**
  - DeepSeek Vision: 이미지 → 텍스트 추출 (특화됨)
  - Qwen3-32B Chat: 텍스트 분석 및 JSON 생성 (32B 대형 모델, 특화됨)
- ✅ Qwen3-32B가 복잡한 추론에 더 뛰어남
- ✅ 프롬프트 엔지니어링 효과적
- ✅ 더 정확한 JSON 구조화

**단점**:
- ⚠️ 2번의 API 호출 (약간 느림)
- ⚠️ 시각적 정보 일부 손실

**설정**: `USE_VISION_FOR_ANALYSIS=false` (기본값)

---

#### 방식 2: Vision 모델 직접 분석 (선택 사항)
```
이미지 → Vision 모델 → JSON
```

**장점**:
- ✅ 1번의 API 호출 (빠름)
- ✅ 이미지 시각적 정보 직접 활용
- ✅ 레이아웃, 표 구조 인식 가능

**단점**:
- ⚠️ JSON 구조화 정확도 낮을 수 있음
- ⚠️ 복잡한 추론 능력 제한적

**설정**: `USE_VISION_FOR_ANALYSIS=true`

---

### 💡 실무 권장사항

**기본적으로 방식 1(Qwen3-32B Chat 모델)을 사용하고, 테스트 후 정확도가 낮으면 방식 2를 시도하세요.**

각 모델의 특화 분야:
- **DeepSeek Vision 모델**: 이미지 → 텍스트 변환 (OCR)
- **Qwen3-32B Chat 모델**: 텍스트 이해, 추론, JSON 생성 (32B 대형 모델)

