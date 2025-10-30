# ADR-0003: JWT-Based Authentication Strategy

## Status
**Status**: Accepted

## Context

자산관리 시스템(SAMS)은 세 가지 사용자 역할(직원, 자산담당자, 시스템관리자)을 지원해야 하며, 안전하고 확장 가능한 인증/인가 메커니즘이 필요합니다.

### Requirements
- **사용자 인증**: 이메일/비밀번호 기반 로그인
- **세션 관리**: 로그인 상태 유지 (7일)
- **권한 관리**: 역할 기반 접근 제어 (RBAC)
- **확장성**: 모바일 앱, 외부 API 연동 지원
- **보안**: OWASP Top 10 준수
- **SSO 연동** (Optional): Phase 2+

## Decision

**JWT (JSON Web Token)** 기반 인증을 채택합니다.

### Authentication Flow
1. 사용자가 이메일/비밀번호로 로그인
2. 서버가 자격 증명 검증 후 JWT Access Token + Refresh Token 발급
3. 클라이언트가 Access Token을 요청 헤더에 포함 (Bearer Token)
4. 서버가 토큰 검증 후 API 접근 허용
5. Access Token 만료 시 Refresh Token으로 갱신

### Token Specifications
- **Access Token**:
  - 유효기간: 15분
  - Payload: `{ userId, email, role, iat, exp }`
  - Storage: 메모리 (React State/Zustand)

- **Refresh Token**:
  - 유효기간: 7일
  - Storage: Redis (Token Family, Rotation 지원)
  - HttpOnly Cookie (XSS 방지)

### Libraries
- **Backend**: `@nestjs/passport`, `@nestjs/jwt`, `passport-jwt`
- **Frontend**: `axios` interceptors

## Consequences

### Positive
- ✅ **Stateless**: 서버 세션 불필요, 수평 확장 용이
- ✅ **표준화**: RFC 7519, 널리 사용되는 표준
- ✅ **모바일 지원**: Cookie 불필요, Authorization 헤더만으로 인증
- ✅ **마이크로서비스 친화적**: 토큰 검증만으로 인증 (서비스 간 공유 가능)
- ✅ **SSO 연동 용이**: SAML, OAuth2와 통합 가능

### Negative
- ⚠️ **토큰 탈취 위험**: XSS, CSRF 공격 시 토큰 노출
  - **Mitigation**: HttpOnly Cookie (Refresh), Short-lived Access Token
- ⚠️ **즉시 무효화 불가**: 로그아웃 시 토큰 여전히 유효 (만료까지)
  - **Mitigation**: Redis Blacklist, Refresh Token Rotation
- ⚠️ **Payload 크기**: 토큰에 많은 정보 포함 시 크기 증가
  - **Mitigation**: 최소한의 정보만 포함 (userId, role)

### Risks
- **Refresh Token 탈취**: 공격자가 영구 접근 권한 획득
  - **Mitigation**: Token Family + Rotation (Refresh Token 재사용 감지)
- **시크릿 키 노출**: JWT 서명 키 유출 시 위조 가능
  - **Mitigation**: 환경 변수 관리, 키 정기 교체, HSM 사용 (Production)

## Alternatives Considered

### Alternative 1: Session-Based Authentication
**Pros**:
- 즉시 무효화 가능 (세션 삭제)
- 서버에서 완전한 제어 가능

**Cons**:
- 서버 메모리/Redis 사용 (세션 저장)
- 수평 확장 시 세션 공유 필요 (Sticky Session or Redis)
- 모바일 앱에서 Cookie 처리 복잡

**Decision**: Rejected - Stateless 아키텍처 선호

---

### Alternative 2: OAuth2 (Third-Party)
**Pros**:
- 소셜 로그인 지원 (Google, GitHub 등)
- 표준 프로토콜

**Cons**:
- 내부 사용자만 존재 (외부 사용자 없음)
- OAuth2 구현 복잡도
- 외부 의존성

**Decision**: Deferred - Phase 2에서 고려

---

### Alternative 3: API Key
**Pros**:
- 단순함
- 장기 유효

**Cons**:
- 사용자별 키 관리 어려움
- 권한 세밀화 불가
- 보안 취약 (키 노출 시 즉시 무효화 어려움)

**Decision**: Rejected - 사용자 인증에 부적합

## Implementation Details

### Backend (NestJS)

#### JWT 서명 알고리즘
```typescript
// RS256 (비대칭 키) - Recommended for Production
// HS256 (대칭 키) - Development/MVP

// config/jwt.config.ts
export const jwtConfig = {
  access: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: '15m',
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
  },
};
```

#### Login Endpoint
```typescript
@Post('login')
async login(@Body() loginDto: LoginDto) {
  const user = await this.authService.validateUser(loginDto);

  const accessToken = this.jwtService.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
  }, { expiresIn: '15m' });

  const refreshToken = this.jwtService.sign({
    sub: user.id,
  }, { expiresIn: '7d' });

  // Refresh Token을 Redis에 저장
  await this.redisService.set(`refresh:${user.id}`, refreshToken, 7 * 24 * 60 * 60);

  return {
    accessToken,
    refreshToken, // HttpOnly Cookie로 전송
    user: { id: user.id, email: user.email, role: user.role },
  };
}
```

#### Token Refresh Endpoint
```typescript
@Post('refresh')
async refresh(@Body('refreshToken') refreshToken: string) {
  const payload = this.jwtService.verify(refreshToken);

  // Redis에서 Refresh Token 검증
  const storedToken = await this.redisService.get(`refresh:${payload.sub}`);
  if (storedToken !== refreshToken) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  // 새 Access Token 발급
  const newAccessToken = this.jwtService.sign({
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  }, { expiresIn: '15m' });

  return { accessToken: newAccessToken };
}
```

#### Logout Endpoint
```typescript
@Post('logout')
async logout(@Req() req) {
  const userId = req.user.id;

  // Redis에서 Refresh Token 삭제
  await this.redisService.del(`refresh:${userId}`);

  // (Optional) Access Token을 Blacklist에 추가 (즉시 무효화)
  const token = req.headers.authorization.split(' ')[1];
  await this.redisService.set(`blacklist:${token}`, '1', 15 * 60); // 15분

  return { message: 'Logged out successfully' };
}
```

#### JWT Guard
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
```

#### Role-Based Guard
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

### Frontend (React)

#### Axios Interceptor
```typescript
// api/axios.ts
axios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Access Token 만료 시 Refresh
      const refreshToken = useAuthStore.getState().refreshToken;
      const { data } = await axios.post('/auth/refresh', { refreshToken });

      useAuthStore.getState().setAccessToken(data.accessToken);

      // 실패한 요청 재시도
      error.config.headers.Authorization = `Bearer ${data.accessToken}`;
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### Security Best Practices
1. **HTTPS Only**: 모든 통신 암호화
2. **CSRF Protection**: SameSite Cookie (Refresh Token)
3. **XSS Prevention**: Content Security Policy (CSP)
4. **Rate Limiting**: 로그인 시도 제한 (5회/5분)
5. **Password Hashing**: bcrypt (salt rounds=12)
6. **Token Rotation**: Refresh Token 재사용 감지

## Related Decisions
- [ADR-0001: Technology Stack Selection](./0001-technology-stack-selection.md)
- [ADR-0005: Role-Based Access Control](./0005-rbac.md)

## Metadata
- **Date**: 2025-10-29
- **Author**: Backend Team, Security Team
- **Reviewers**: Tech Lead, Security Officer
- **Tags**: authentication, security, jwt, rbac
