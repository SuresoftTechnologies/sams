# 이메일 전송 API

이 문서는 smtplib와 email 라이브러리를 사용하여 구현된 이메일 전송 API에 대한 설명입니다.

## 개요

이메일 전송 API는 SMTP 프로토콜을 사용하여 이메일을 발송할 수 있는 기능을 제공합니다. 텍스트와 HTML 형식의 이메일을 모두 지원하며, CC 및 BCC 기능도 지원합니다.

## 환경 설정

### 필수 환경 변수

`.env` 파일에 다음 환경 변수를 설정해야 합니다:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=SureSoft AMS
SMTP_USE_TLS=true
```

### Gmail 사용 시 설정 방법

Gmail을 사용하는 경우 다음 단계를 따르세요:

1. **2단계 인증 활성화**
   - Google 계정 설정으로 이동
   - 보안 > 2단계 인증 활성화

2. **앱 비밀번호 생성**
   - https://myaccount.google.com/apppasswords 접속
   - "앱 비밀번호" 생성
   - 생성된 16자리 비밀번호를 `SMTP_PASSWORD`에 입력

3. **환경 변수 설정**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx
   SMTP_FROM_EMAIL=your-gmail@gmail.com
   ```

### 다른 SMTP 서버 사용

다른 이메일 서비스를 사용하는 경우:

**Outlook/Office365**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
```

**Naver**
```env
SMTP_HOST=smtp.naver.com
SMTP_PORT=587
```

**Daum**
```env
SMTP_HOST=smtp.daum.net
SMTP_PORT=465
SMTP_USE_TLS=false
```

## API 엔드포인트

### POST /api/v1/email/send

이메일을 전송합니다.

#### 요청 본문

```json
{
  "to": ["recipient@example.com"],
  "subject": "테스트 이메일",
  "body": "안녕하세요. 텍스트 본문입니다.",
  "html_body": "<h1>안녕하세요</h1><p>HTML 본문입니다.</p>",
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"]
}
```

#### 필수 필드

- `to` (array of strings): 수신자 이메일 주소 목록 (최소 1개)
- `subject` (string): 이메일 제목 (최소 1자, 최대 200자)
- `body` (string): 텍스트 본문 (최소 1자)

#### 선택 필드

- `html_body` (string): HTML 본문 (선택사항)
- `cc` (array of strings): 참조 수신자 목록 (선택사항)
- `bcc` (array of strings): 숨은 참조 수신자 목록 (선택사항)

#### 응답

**성공 (200 OK)**
```json
{
  "success": true,
  "message": "Email sent successfully to 3 recipient(s)",
  "recipients": [
    "recipient@example.com",
    "cc@example.com",
    "bcc@example.com"
  ],
  "message_id": "<message-id@example.com>"
}
```

**실패 (500 Internal Server Error)**
```json
{
  "detail": "SMTP authentication failed. Please check your credentials."
}
```

## 사용 예제

### cURL

#### 기본 텍스트 이메일
```bash
curl -X POST "http://localhost:8000/api/v1/email/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["recipient@example.com"],
    "subject": "테스트 이메일",
    "body": "안녕하세요. 이것은 테스트 이메일입니다."
  }'
```

#### HTML 이메일
```bash
curl -X POST "http://localhost:8000/api/v1/email/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["recipient@example.com"],
    "subject": "HTML 이메일 테스트",
    "body": "텍스트 버전입니다.",
    "html_body": "<h1>환영합니다!</h1><p>이것은 <strong>HTML</strong> 이메일입니다.</p>"
  }'
```

#### CC 및 BCC 포함
```bash
curl -X POST "http://localhost:8000/api/v1/email/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["recipient@example.com"],
    "subject": "팀 공지사항",
    "body": "중요한 공지사항입니다.",
    "cc": ["manager@example.com"],
    "bcc": ["archive@example.com"]
  }'
```

### Python (requests)

```python
import requests

url = "http://localhost:8000/api/v1/email/send"

# 기본 텍스트 이메일
payload = {
    "to": ["recipient@example.com"],
    "subject": "테스트 이메일",
    "body": "안녕하세요. 이것은 테스트 이메일입니다."
}

response = requests.post(url, json=payload)
print(response.json())
```

### JavaScript (fetch)

```javascript
const sendEmail = async () => {
  const response = await fetch('http://localhost:8000/api/v1/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: ['recipient@example.com'],
      subject: '테스트 이메일',
      body: '안녕하세요. 이것은 테스트 이메일입니다.',
      html_body: '<h1>환영합니다!</h1><p>이것은 HTML 이메일입니다.</p>'
    }),
  });

  const data = await response.json();
  console.log(data);
};

sendEmail();
```

### TypeScript (axios)

```typescript
import axios from 'axios';

interface SendEmailRequest {
  to: string[];
  subject: string;
  body: string;
  html_body?: string;
  cc?: string[];
  bcc?: string[];
}

interface EmailResponse {
  success: boolean;
  message: string;
  recipients: string[];
  message_id?: string;
}

const sendEmail = async (request: SendEmailRequest): Promise<EmailResponse> => {
  const response = await axios.post<EmailResponse>(
    'http://localhost:8000/api/v1/email/send',
    request
  );
  
  return response.data;
};

// 사용 예제
sendEmail({
  to: ['recipient@example.com'],
  subject: '테스트 이메일',
  body: '안녕하세요.',
  html_body: '<h1>환영합니다!</h1>'
})
  .then(data => console.log('이메일 전송 성공:', data))
  .catch(error => console.error('이메일 전송 실패:', error));
```

## 에러 처리

### 일반적인 에러와 해결 방법

#### 1. SMTP 인증 실패
```json
{
  "detail": "SMTP authentication failed. Please check your credentials."
}
```
**해결 방법**: 
- SMTP_USER와 SMTP_PASSWORD가 올바른지 확인
- Gmail의 경우 앱 비밀번호를 사용하고 있는지 확인

#### 2. 환경 변수 미설정
```json
{
  "detail": "SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD in environment variables."
}
```
**해결 방법**: 
- .env 파일에 SMTP 설정 추가
- 서버 재시작

#### 3. SMTP 연결 실패
```json
{
  "detail": "SMTP error occurred: [Errno 111] Connection refused"
}
```
**해결 방법**: 
- SMTP_HOST와 SMTP_PORT가 올바른지 확인
- 방화벽 설정 확인
- 네트워크 연결 확인

## 보안 고려사항

1. **환경 변수 사용**: SMTP 자격 증명은 반드시 환경 변수로 관리하고 코드에 하드코딩하지 마세요.

2. **앱 비밀번호**: Gmail 등 주요 이메일 서비스는 앱 비밀번호를 사용하세요. 계정 비밀번호를 직접 사용하지 마세요.

3. **TLS 사용**: SMTP_USE_TLS=true로 설정하여 암호화된 연결을 사용하세요.

4. **Rate Limiting**: 프로덕션 환경에서는 API에 rate limiting을 적용하여 스팸 발송을 방지하세요.

5. **이메일 검증**: 수신자 이메일 주소의 유효성을 검증합니다 (pydantic의 EmailStr 타입 사용).

## API 문서

서버 실행 후 다음 URL에서 대화형 API 문서를 확인할 수 있습니다:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 테스트

### 개발 환경에서 테스트

```bash
# 백엔드 디렉토리로 이동
cd apps/backend

# 환경 변수 설정 (.env 파일 생성)
cp .env.example .env
# .env 파일을 편집하여 SMTP 설정 입력

# 서버 실행
uv run uvicorn src.main:app --reload

# 다른 터미널에서 테스트 요청 전송
curl -X POST "http://localhost:8000/api/v1/email/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["your-test-email@example.com"],
    "subject": "API 테스트",
    "body": "이메일 API가 정상 작동합니다!"
  }'
```

## 문제 해결

### 이메일이 전송되지 않는 경우

1. **환경 변수 확인**
   ```bash
   # 환경 변수가 올바르게 설정되었는지 확인
   echo $SMTP_USER
   echo $SMTP_PASSWORD
   ```

2. **로그 확인**
   - FastAPI 서버의 로그를 확인하여 자세한 에러 메시지 확인

3. **SMTP 서버 연결 테스트**
   ```python
   import smtplib
   
   try:
       server = smtplib.SMTP('smtp.gmail.com', 587)
       server.starttls()
       server.login('your-email@gmail.com', 'your-app-password')
       print("연결 성공!")
       server.quit()
   except Exception as e:
       print(f"연결 실패: {e}")
   ```

4. **이메일 제공업체 설정 확인**
   - Gmail: 2단계 인증 및 앱 비밀번호
   - Outlook: SMTP 사용 허용
   - 기타: 각 서비스의 SMTP 설정 문서 참조

## 향후 개선 사항

- [ ] 이메일 템플릿 시스템 추가
- [ ] 첨부파일 지원
- [ ] 비동기 이메일 전송 (Celery/Redis 사용)
- [ ] 이메일 전송 기록 저장
- [ ] 재시도 로직 추가
- [ ] 이메일 큐 시스템 구현

