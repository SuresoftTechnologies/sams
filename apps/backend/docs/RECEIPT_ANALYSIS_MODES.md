# 영수증 분석 모드 선택 가이드

## 📊 두 가지 분석 방식 비교

### ⭐ 방식 1: OCR + Qwen3-32B Chat 모델 (기본값, 권장)

```
이미지 → DeepSeek Vision(OCR) → 텍스트 → Qwen3-32B Chat → JSON
```

**언제 사용하나요?**
- 일반적인 경우 (기본 설정)
- JSON 구조화 정확도가 중요한 경우
- 복잡한 추론이 필요한 경우

**장점**:
- ✅ **각 모델의 강점 활용**: DeepSeek Vision은 OCR, Qwen3-32B는 분석
- ✅ Qwen3-32B (32B 파라미터)가 텍스트 이해와 JSON 생성에 특화
- ✅ 복잡한 추론 능력 뛰어남
- ✅ 프롬프트 엔지니어링 효과적

**단점**:
- ⚠️ 2번의 API 호출 필요 (OCR + Chat)
- ⚠️ 약간 느림 (6-10초)
- ⚠️ 시각적 정보 일부 손실 가능

**설정**:
```bash
USE_VISION_FOR_ANALYSIS=false  # 기본값
```

---

### 방식 2: Vision 모델 직접 분석

```
이미지 → Vision 모델 → JSON
```

**언제 사용하나요?**
- 속도가 중요한 경우
- 시각적 정보(레이아웃, 표 구조)가 중요한 경우
- 방식 1의 정확도가 낮을 때 대안으로

**장점**:
- ✅ 1번의 API 호출 (빠름)
- ✅ 이미지 시각적 정보 직접 활용
- ✅ 레이아웃, 표 구조 인식 가능
- ✅ 비용 절감

**단점**:
- ⚠️ JSON 구조화 정확도 낮을 수 있음
- ⚠️ 복잡한 추론 능력 제한적
- ⚠️ Vision 모델이 텍스트 분석에 최적화되지 않음

**설정**:
```bash
USE_VISION_FOR_ANALYSIS=true
```

---

## 🛠️ 설정 방법

### .env 파일 수정

```bash
# DeepSeek OCR API (Vision 모델)
DEEPSEEK_API_BASE=http://10.10.10.200:19751/v1
DEEPSEEK_OCR_MODEL=deepseek-ai/DeepSeek-OCR  # Vision 모델 (OCR)
DEEPSEEK_API_KEY=EMPTY
DEEPSEEK_TIMEOUT=60

# Qwen Chat API (텍스트 분석용)
QWEN_API_BASE=http://10.10.10.200:19750/v1
QWEN_CHAT_MODEL=Qwen/Qwen3-32B  # Chat 모델 (분석)
QWEN_API_KEY=EMPTY
QWEN_TIMEOUT=60

# 분석 방식 선택
USE_VISION_FOR_ANALYSIS=false  # ⭐ false: Qwen3-32B Chat 모델 (권장)
                                # 🔄 true: Vision 직접 분석
```

### 백엔드 재시작

```bash
cd apps/backend
# 서버 재시작
```

---

## 📈 성능 비교 (예상치)

| 항목 | Qwen3-32B Chat (방식 1) | Vision 직접 (방식 2) |
|------|----------------------|-------------------|
| **JSON 정확도** | ⭐⭐⭐⭐⭐ 매우 높음 | ⭐⭐⭐ 보통 |
| **추론 능력** | ⭐⭐⭐⭐⭐ 뛰어남 (32B) | ⭐⭐⭐ 보통 |
| **속도** | ⭐⭐⭐ 보통 (6-10초) | ⭐⭐⭐⭐ 빠름 (4-6초) |
| **시각적 정보** | ⭐⭐⭐ 보통 (일부 손실) | ⭐⭐⭐⭐⭐ 완벽 |
| **비용** | ⭐⭐⭐ 보통 (2회 호출) | ⭐⭐⭐⭐ 저렴 (1회 호출) |

---

## 💡 실무 권장사항

### 1단계: Qwen3-32B Chat 모델로 시작 (기본값)
```bash
USE_VISION_FOR_ANALYSIS=false
```

### 2단계: 테스트
- 여러 영수증으로 테스트
- JSON 구조 정확도 확인
- 신뢰도(confidence) 확인

### 3단계: 필요시 변경
- JSON 오류가 많으면 → Qwen3-32B Chat 모델 유지
- 시각적 정보 손실이 문제면 → Vision 직접 분석 시도
- 속도가 문제면 → Vision 직접 분석 시도

---

## 🔍 문제 해결

### Qwen Chat 모델 사용 시 오류
```json
{
  "error": "Model not found: Qwen/Qwen3-32B",
  ...
}
```

**해결책**: API 서버에 Qwen3-32B 모델이 없는 경우
```bash
# Vision 모델로 전환
USE_VISION_FOR_ANALYSIS=true
```

### Vision 모델 사용 시 이상한 결과
```json
{
  "line_items": [],
  "confidence": 0.0,
  ...
}
```

**해결책**: Chat 모델로 전환
```bash
USE_VISION_FOR_ANALYSIS=false
```

---

## 🧪 테스트 예시

### 방식 1 테스트 (Chat 모델)
```bash
# .env에 설정
USE_VISION_FOR_ANALYSIS=false

# 테스트
curl -X POST "http://localhost:8000/api/v1/receipts/analyze-receipt" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@receipt.jpg"
```

### 방식 2 테스트 (Vision 직접)
```bash
# .env에 설정
USE_VISION_FOR_ANALYSIS=true

# 테스트 (동일한 API)
curl -X POST "http://localhost:8000/api/v1/receipts/analyze-receipt" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@receipt.jpg"
```

**결과 비교**: 두 방식의 JSON 구조와 confidence를 비교하세요.

---

**작성일**: 2024-10-30  
**버전**: 1.1.0 (Qwen3-32B Chat 모델 적용)

