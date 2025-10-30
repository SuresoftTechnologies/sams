# 이메일 API 빠른 시작 가이드

## 1. 환경 설정 (3분)

### Step 1: `.env` 파일 생성

`apps/backend/.env` 파일을 생성하고 SMTP 설정을 추가합니다:

```env
# Gmail 사용 시
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=SureSoft AMS
SMTP_USE_TLS=true
```

### Step 2: Gmail 앱 비밀번호 생성 (Gmail 사용 시)

1. https://myaccount.google.com/apppasswords 접속
2. 앱 선택: "메일"
3. 기기 선택: "Windows 컴퓨터" (또는 기타)
4. 생성된 16자리 비밀번호를 `SMTP_PASSWORD`에 복사

### Step 3: 서버 실행

```bash
cd apps/backend
uv run uvicorn src.main:app --reload
```

## 2. API 테스트 (1분)

### PowerShell에서 테스트

```powershell
$body = @{
    to = @("recipient@example.com")
    subject = "테스트 이메일"
    body = "안녕하세요. 테스트 이메일입니다."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/email/send" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### cURL에서 테스트

```bash
curl -X POST "http://localhost:8000/api/v1/email/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["recipient@example.com"],
    "subject": "테스트 이메일",
    "body": "안녕하세요."
  }'
```

### VS Code REST Client에서 테스트

`apps/backend/docs/api-examples.http` 파일을 열고 이메일 예제를 실행합니다.

## 3. 성공 응답

```json
{
  "success": true,
  "message": "Email sent successfully to 1 recipient(s)",
  "recipients": ["recipient@example.com"],
  "message_id": "<message-id@example.com>"
}
```

## 4. 문제 해결

### "SMTP credentials not configured"

→ `.env` 파일에 `SMTP_USER`와 `SMTP_PASSWORD`를 설정했는지 확인하세요.

### "SMTP authentication failed"

→ Gmail 앱 비밀번호가 올바른지 확인하세요. 계정 비밀번호가 아닌 앱 비밀번호를 사용해야 합니다.

### "Connection refused"

→ 네트워크 방화벽 또는 프록시 설정을 확인하세요.

## 5. 다음 단계

- 📖 [상세 API 문서](./EMAIL_API.md) 읽기
- 🔧 [API 예제](./api-examples.http) 실행해보기
- 🎨 HTML 이메일 템플릿 작성하기
- 🔔 자산 등록 시 자동 이메일 알림 기능 추가하기

