# Security Architecture

## 📋 Overview

이 문서는 자산관리 시스템(SAMS)의 보안 아키텍처를 설명합니다. 인증/인가, 데이터 보호, 네트워크 보안, 감사 로그, 위협 모델링을 다룹니다.

## 🔐 Authentication & Authorization

### Authentication Methods

#### 1. JWT-Based Authentication
- **Access Token**: 15분 유효, 메모리 저장
- **Refresh Token**: 7일 유효, Redis + HttpOnly Cookie
- **Token Rotation**: Refresh Token 재사용 감지 및 차단

```mermaid
sequenceDiagram
    actor User
    participant Client
    participant API
    participant Redis
    participant DB

    User->>Client: 이메일/비밀번호 입력
    Client->>API: POST /auth/login
    API->>DB: 사용자 검증
    DB-->>API: 사용자 정보
    API->>API: bcrypt 비밀번호 검증
    API->>API: JWT 생성 (Access + Refresh)
    API->>Redis: Refresh Token 저장
    API-->>Client: Access Token + Refresh Token
    Client->>Client: Access Token 메모리 저장
    Client->>Client: Refresh Token HttpOnly Cookie

    Note over Client,API: 인증된 요청
    Client->>API: GET /assets (Bearer Token)
    API->>API: JWT 검증
    API->>API: 권한 확인 (RBAC)
    API->>DB: 데이터 조회
    DB-->>API: 자산 목록
    API-->>Client: JSON 응답
```

#### 2. Password Policy
- **최소 길이**: 8자 이상
- **복잡도**: 영문 대소문자, 숫자, 특수문자 중 3종 이상
- **해싱**: bcrypt, salt rounds=12
- **만료**: 90일 (권장 변경)
- **재사용 제한**: 최근 5개 비밀번호 사용 불가

#### 3. Multi-Factor Authentication (MFA) - Phase 2
- TOTP (Time-based One-Time Password)
- SMS/Email OTP
- 관리자 계정 필수, 일반 사용자 선택

### Authorization (RBAC)

#### Role Definitions

| Role       | Permissions                                      |
|------------|--------------------------------------------------|
| **Admin**  | 모든 권한 (사용자 관리, 시스템 설정)            |
| **Manager**| 자산 CRUD, 승인 처리, 통계 조회                 |
| **Employee**| 본인 자산 조회, 반출/반납 요청                  |

#### Permission Matrix

| Resource         | Admin | Manager | Employee |
|------------------|-------|---------|----------|
| 사용자 생성       | ✅    | ❌      | ❌       |
| 사용자 조회       | ✅    | ✅      | ❌       |
| 자산 생성         | ✅    | ✅      | ❌       |
| 자산 수정         | ✅    | ✅      | ❌       |
| 자산 삭제         | ✅    | ✅      | ❌       |
| 자산 조회 (전체)  | ✅    | ✅      | ❌       |
| 자산 조회 (본인)  | ✅    | ✅      | ✅       |
| 반출 요청         | ✅    | ✅      | ✅       |
| 반출 승인         | ✅    | ✅      | ❌       |
| 통계 조회         | ✅    | ✅      | ❌       |
| 시스템 설정       | ✅    | ❌      | ❌       |

#### Implementation (NestJS)
```typescript
// Decorator
@Roles('admin', 'manager')
@Get('assets')
async getAssets() { ... }

// Guard
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

## 🛡️ Data Security

### Encryption

#### 1. Data in Transit
- **Protocol**: TLS 1.3
- **Certificate**: Let's Encrypt (Auto-renewal)
- **Cipher Suites**: ECDHE-RSA-AES256-GCM-SHA384 (최소)
- **HSTS**: Strict-Transport-Security header

```nginx
# Nginx TLS Configuration
ssl_protocols TLSv1.3;
ssl_ciphers 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256';
ssl_prefer_server_ciphers on;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

#### 2. Data at Rest
- **Database**: PostgreSQL TDE (Transparent Data Encryption) - Production
- **Object Storage**: MinIO Server-Side Encryption (SSE-S3)
- **Backups**: AES-256 암호화
- **Sensitive Columns**: 추가 암호화 (email, phone 등)

```typescript
// Column-level encryption example
import * as crypto from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

### Data Masking

#### PII (Personally Identifiable Information)
- **Logs**: 이메일, 전화번호 마스킹
- **API Response**: 필요 시 부분 마스킹 (example@***.com)

```typescript
// Log masking
const maskEmail = (email: string) => {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}***@${domain}`;
};

logger.info(`User login: ${maskEmail(user.email)}`);
```

## 🌐 Network Security

### Architecture Layers

```mermaid
graph TB
    subgraph "Internet"
        USER[User]
    end

    subgraph "DMZ"
        WAF[WAF<br/>Web Application Firewall]
        LB[Load Balancer<br/>Nginx]
    end

    subgraph "Application Zone"
        API[API Server]
        WORKER[Background Worker]
    end

    subgraph "Data Zone"
        DB[(PostgreSQL)]
        REDIS[(Redis)]
    end

    USER -->|HTTPS| WAF
    WAF -->|Filter| LB
    LB -->|HTTP| API
    API -->|Queue| REDIS
    REDIS -->|Dequeue| WORKER
    API -->|SQL| DB
    WORKER -->|SQL| DB

    classDef dmz fill:#ffcccc
    classDef app fill:#ccffcc
    classDef data fill:#ccccff

    class WAF,LB dmz
    class API,WORKER app
    class DB,REDIS data
```

### Firewall Rules

#### Ingress Rules
| Source       | Destination     | Port  | Protocol | Action |
|--------------|-----------------|-------|----------|--------|
| Internet     | WAF             | 443   | HTTPS    | Allow  |
| WAF          | Load Balancer   | 80    | HTTP     | Allow  |
| Load Balancer| API Server      | 4000  | HTTP     | Allow  |
| API Server   | PostgreSQL      | 5432  | TCP      | Allow  |
| API Server   | Redis           | 6379  | TCP      | Allow  |
| All          | All             | *     | *        | Deny   |

#### Egress Rules
| Source       | Destination     | Port  | Protocol | Action |
|--------------|-----------------|-------|----------|--------|
| API Server   | Email SMTP      | 587   | TLS      | Allow  |
| API Server   | HR System       | 443   | HTTPS    | Allow  |
| All          | Internet        | *     | *        | Deny   |

### Web Application Firewall (WAF)

#### Protection Rules
- **OWASP Top 10**: SQL Injection, XSS, CSRF 차단
- **Rate Limiting**: IP당 100 req/min
- **Geo-Blocking**: 한국 외 접속 차단 (Optional)
- **Bot Detection**: 자동화 공격 차단

```nginx
# ModSecurity WAF Rules
SecRule REQUEST_URI "@rx (union|select|insert|drop)" \
    "id:1001,phase:2,deny,status:403,msg:'SQL Injection Detected'"

SecRule ARGS "@rx <script" \
    "id:1002,phase:2,deny,status:403,msg:'XSS Detected'"
```

### DDoS Protection
- **Layer 4**: SYN Flood, UDP Flood 방어
- **Layer 7**: HTTP Flood, Slowloris 방어
- **Cloudflare**: DDoS 보호 (Optional, Production)

## 🔍 Audit Logging

### Log Types

#### 1. Authentication Logs
- 로그인 성공/실패
- 비밀번호 변경
- 토큰 발급/갱신
- 로그아웃

```json
{
  "timestamp": "2025-10-29T10:30:00Z",
  "event": "user.login.success",
  "userId": "uuid",
  "email": "user@example.com",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

#### 2. Asset Operation Logs
- 자산 생성/수정/삭제
- 자산 배정/반납
- 워크플로우 상태 변경

```json
{
  "timestamp": "2025-10-29T10:35:00Z",
  "event": "asset.update",
  "assetId": "uuid",
  "userId": "uuid",
  "changes": {
    "status": { "from": "available", "to": "assigned" },
    "currentUserId": { "from": null, "to": "uuid" }
  }
}
```

#### 3. Access Logs
- API 호출 이력
- 권한 거부 이벤트

```json
{
  "timestamp": "2025-10-29T10:40:00Z",
  "event": "api.access",
  "method": "GET",
  "path": "/api/assets",
  "userId": "uuid",
  "statusCode": 200,
  "responseTime": 120
}
```

### Log Storage & Retention
- **Storage**: Elasticsearch (ELK Stack)
- **Retention**: 1년 (법적 요구사항 준수)
- **Archive**: Cold storage (S3 Glacier)

### Log Analysis
- **Real-time Alerts**: Kibana Alerts
- **Anomaly Detection**: 비정상 로그인 패턴 감지
- **Dashboards**: Grafana + Loki

## 🚨 Threat Modeling

### STRIDE Analysis

| Threat                  | Attack Vector                        | Mitigation                          |
|-------------------------|--------------------------------------|-------------------------------------|
| **Spoofing**            | 계정 탈취, 토큰 위조                  | JWT 서명 검증, MFA                  |
| **Tampering**           | 데이터 무단 수정                      | HTTPS, 트랜잭션, 권한 검증          |
| **Repudiation**         | 작업 부인                             | 감사 로그, 타임스탬프               |
| **Information Disclosure**| 민감 정보 노출                      | 암호화, 마스킹, 최소 권한 원칙      |
| **Denial of Service**   | DDoS, 리소스 고갈                     | Rate Limiting, WAF, Auto-scaling    |
| **Elevation of Privilege**| 권한 상승 공격                       | RBAC, 입력 검증, 최소 권한 원칙     |

### Attack Scenarios

#### Scenario 1: SQL Injection
**Attack**: 공격자가 검색 쿼리에 SQL 코드 삽입
```
GET /api/assets?name=' OR '1'='1
```

**Mitigation**:
- Parameterized Queries (Prisma ORM)
- Input Validation (Zod, class-validator)
- WAF SQL Injection Rules

#### Scenario 2: XSS (Cross-Site Scripting)
**Attack**: 악성 스크립트를 자산 이름에 삽입
```
<script>alert('XSS')</script>
```

**Mitigation**:
- Input Sanitization (DOMPurify)
- Content Security Policy (CSP)
- Output Encoding

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
```

#### Scenario 3: CSRF (Cross-Site Request Forgery)
**Attack**: 피해자가 의도하지 않은 요청 전송

**Mitigation**:
- SameSite Cookie (Refresh Token)
- CSRF Token (Double Submit Cookie)
- Origin/Referer Header 검증

```typescript
// CSRF Middleware
app.use(csrf({ cookie: { httpOnly: true, sameSite: 'strict' } }));
```

#### Scenario 4: Brute Force Attack
**Attack**: 비밀번호 무차별 대입 공격

**Mitigation**:
- Rate Limiting (5 attempts / 5 min)
- Account Lockout (30분)
- CAPTCHA (3회 실패 시)

```typescript
// Rate Limiting (express-rate-limit)
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5분
  max: 5, // 최대 5회
  message: 'Too many login attempts, please try again later.',
});

app.post('/auth/login', loginLimiter, authController.login);
```

## 🔧 Security Best Practices

### Secure Development Lifecycle (SDL)

1. **Design Phase**
   - Threat Modeling (STRIDE)
   - Security Requirements 정의

2. **Development Phase**
   - Secure Coding Guidelines (OWASP)
   - Static Analysis (SonarQube, ESLint)
   - Dependency Scanning (npm audit, Snyk)

3. **Testing Phase**
   - Penetration Testing
   - Vulnerability Scanning (OWASP ZAP)
   - Security Unit Tests

4. **Deployment Phase**
   - Secrets Management (HashiCorp Vault, AWS Secrets Manager)
   - Container Security (Trivy, Clair)
   - Infrastructure as Code Security (Checkov)

5. **Operations Phase**
   - Monitoring & Alerting
   - Incident Response Plan
   - Regular Security Audits

### Secrets Management

```yaml
# .env.example
JWT_ACCESS_SECRET=<generate-random-256-bit-secret>
JWT_REFRESH_SECRET=<generate-random-256-bit-secret>
DATABASE_URL=postgresql://user:password@localhost:5432/sams
REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=<generate-random-256-bit-key>
```

**Best Practices**:
- ❌ `.env` 파일을 Git에 커밋하지 않음
- ✅ `.env.example`만 커밋 (템플릿)
- ✅ Production: AWS Secrets Manager, HashiCorp Vault
- ✅ 정기적인 키 교체 (90일)

### Dependency Security

```bash
# npm audit
npm audit --audit-level=high

# Snyk scan
snyk test

# Automated updates
npm install -g npm-check-updates
ncu -u
```

### Container Security

```dockerfile
# 최소 권한 실행 (non-root)
USER node

# Multi-stage build (불필요한 파일 제거)
FROM node:20-alpine AS builder
...

FROM node:20-alpine
COPY --from=builder /app/dist ./dist
```

## 📊 Security Metrics

### Key Performance Indicators (KPIs)

| Metric                     | Target      | Measurement Frequency |
|----------------------------|-------------|-----------------------|
| 평균 취약점 수정 시간      | < 7일       | 주간                  |
| Critical 취약점 수         | 0           | 일일                  |
| 인증 실패율                | < 5%        | 일일                  |
| 비정상 로그인 탐지         | 100%        | 실시간                |
| 패치 적용률                | > 95%       | 월간                  |

## 🔗 Related Documents
- [ADR-0003: Authentication Strategy](./adr/0003-authentication-strategy.md)
- [Data Architecture](./04-data-architecture.md)
- [Deployment Architecture](./06-deployment-architecture.md)

## 📝 Version History

| Version | Date       | Author            | Changes                |
|---------|------------|-------------------|------------------------|
| 1.0.0   | 2025-10-29 | Security Team     | Initial version        |
