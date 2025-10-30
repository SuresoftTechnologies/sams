# vLLM API 문서 요약

## 📌 서버 정보

- **Base URL**: `http://10.10.10.200:19751/v1`
- **모델**: `deepseek-ai/DeepSeek-OCR`
- **API 타입**: OpenAI 호환 API

---

## 🔧 기본 엔드포인트

### 상태 확인

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| `GET` | `/health` | 서버 상태 확인 |
| `GET` | `/load` | 서버 부하 메트릭 조회 |
| `GET` | `/ping` | 핑 체크 (SageMaker용) |
| `POST` | `/ping` | 핑 체크 (SageMaker용) |
| `GET` | `/version` | vLLM 버전 정보 |

---

## 🤖 모델 관련 API

### GET /v1/models
사용 가능한 모델 목록 조회

**응답 예시**:
```json
{
  "data": [
    {
      "id": "deepseek-ai/DeepSeek-OCR",
      "object": "model",
      ...
    }
  ]
}
```

---

## 💬 주요 추론 API

### 1. POST /v1/chat/completions
채팅 완성 생성 (OpenAI ChatGPT API 호환)

**요청 파라미터**:
```json
{
  "model": "deepseek-ai/DeepSeek-OCR",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "temperature": 0.7,
  "top_p": 1.0,
  "max_tokens": 1000,
  "stream": false
}
```

**주요 파라미터**:
- `messages`: 대화 메시지 배열
  - `role`: `developer`, `system`, `user`, `assistant`
  - `content`: 메시지 내용
- `temperature`: 샘플링 온도 (0.0 ~ 2.0)
- `top_p`: nucleus sampling
- `max_tokens`: 최대 생성 토큰 수
- `stream`: 스트리밍 응답 여부
- `frequency_penalty`: 반복 억제
- `presence_penalty`: 새로운 주제 장려

### 2. POST /v1/completions
텍스트 완성 생성

**요청 파라미터**:
```json
{
  "model": "deepseek-ai/DeepSeek-OCR",
  "prompt": "Once upon a time",
  "max_tokens": 100,
  "temperature": 0.7,
  "top_p": 1.0,
  "n": 1,
  "stream": false,
  "echo": false
}
```

**주요 파라미터**:
- `prompt`: 입력 프롬프트 (문자열 또는 토큰 배열)
- `best_of`: 생성할 후보 수
- `echo`: 프롬프트를 응답에 포함할지 여부
- `logit_bias`: 특정 토큰의 확률 조정

### 3. POST /v1/embeddings
텍스트 임베딩 생성

**요청 파라미터**:
```json
{
  "model": "deepseek-ai/DeepSeek-OCR",
  "input": ["텍스트 1", "텍스트 2"],
  "encoding_format": "float",
  "dimensions": 768,
  "add_special_tokens": true
}
```

**주요 파라미터**:
- `input`: 입력 텍스트 배열 (또는 토큰 배열)
- `encoding_format`: `"float"` (기본값)
- `dimensions`: 출력 임베딩 차원
- `truncate_prompt_tokens`: 프롬프트 토큰 자르기

---

## 🔢 토큰화 API

### POST /tokenize
텍스트를 토큰으로 변환

**요청 파라미터**:
```json
{
  "model": "deepseek-ai/DeepSeek-OCR",
  "prompt": "Hello, world!",
  "add_special_tokens": true,
  "return_token_strs": false
}
```

**파라미터 설명**:
- `prompt`: 입력 텍스트
- `add_special_tokens`: 특수 토큰 (BOS, EOS 등) 추가 여부
- `return_token_strs`: 토큰 문자열도 함께 반환할지 여부

### POST /detokenize
토큰을 텍스트로 변환

**요청 파라미터**:
```json
{
  "model": "deepseek-ai/DeepSeek-OCR",
  "tokens": [123, 456, 789]
}
```

---

## 🎯 비동기 응답 API

### POST /v1/responses
비동기 응답 생성 작업 시작

**요청 파라미터**:
```json
{
  "background": false,
  "include": ["code_interpreter_call.outputs"],
  "input": "string",
  "instructions": "string",
  "max_output_tokens": 0,
  "max_tool_calls": 0,
  "metadata": {},
  "model": "string",
  "modalities": ["text"],
  "response_format": {},
  "tools": []
}
```

### GET /v1/responses/{response_id}
특정 응답 작업 조회

### POST /v1/responses/{response_id}/cancel
특정 응답 작업 취소

---

## 🔄 추가 기능

### POST /pooling
풀링 작업 수행 (임베딩 등)

### POST /classify
분류 작업 수행

---

## 🚨 HTTP 응답 코드

| 코드 | 설명 |
|------|------|
| `200` | 성공 |
| `400` | 잘못된 요청 (Bad Request) |
| `404` | 리소스를 찾을 수 없음 (Not Found) |
| `422` | 유효성 검증 오류 (Validation Error) |
| `500` | 내부 서버 오류 (Internal Server Error) |
| `501` | 구현되지 않음 (Not Implemented) |

**에러 응답 형식**:
```json
{
  "error": {
    "message": "오류 메시지",
    "type": "오류 타입",
    "param": "문제가 된 파라미터",
    "code": 0
  }
}
```

---

## 💡 사용 예시

### Python (OpenAI SDK 사용)
```python
from openai import OpenAI

client = OpenAI(
    api_key="EMPTY",
    base_url="http://10.10.10.200:19751/v1"
)

response = client.chat.completions.create(
    model="deepseek-ai/DeepSeek-OCR",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)
```

### Python (LiteLLM 사용)
```python
import litellm

response = litellm.completion(
    model="openai/deepseek-ai/DeepSeek-OCR",
    messages=[{"role": "user", "content": "Hello!"}],
    api_base="http://10.10.10.200:19751/v1",
    api_key="EMPTY"
)

print(response.choices[0].message.content)
```

### cURL
```bash
curl -X POST "http://10.10.10.200:19751/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-ai/DeepSeek-OCR",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "temperature": 0.7,
    "max_tokens": 100
  }'
```

---

## 📚 참고 사항

1. **OpenAI API 호환성**: 이 API는 OpenAI의 API 스펙과 거의 동일하게 설계되어 있어, OpenAI SDK를 그대로 사용할 수 있습니다.

2. **스트리밍 지원**: `/v1/chat/completions`와 `/v1/completions` 엔드포인트는 Server-Sent Events (SSE)를 통한 스트리밍을 지원합니다.

3. **모델 특화 기능**: DeepSeek-OCR 모델은 OCR(광학 문자 인식)에 특화되어 있으므로, 이미지에서 텍스트를 추출하는 작업에 최적화되어 있습니다.

4. **인증**: 현재 설정에서는 API 키가 필요하지 않거나 `"EMPTY"`로 설정할 수 있습니다.

---

## 🔗 관련 파일

- **테스트 스크립트**: `test_vllm_litellm.py`
- **API 문서**: `swagger_api_docs.html`
- **Base URL**: `http://10.10.10.200:19751/v1`

