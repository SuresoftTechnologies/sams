# API Client Integration Guide

이 문서는 SureSoft AMS 프론트엔드의 API Client 통합 사용법을 설명합니다.

## 목차

- [개요](#개요)
- [환경 설정](#환경-설정)
- [API Client 사용법](#api-client-사용법)
- [인증 관리](#인증-관리)
- [서비스 레이어](#서비스-레이어)
- [에러 핸들링](#에러-핸들링)
- [타입 안전성](#타입-안전성)
- [React Query 통합](#react-query-통합)

---

## 개요

프론트엔드는 `@ams/api-client` 패키지를 사용하여 백엔드 API와 통신합니다.

**주요 기능:**
- Type-safe API 호출 (OpenAPI 기반 타입 생성)
- 자동 토큰 관리 (localStorage)
- Request/Response 인터셉터
- 에러 핸들링
- 401/403 자동 처리 (로그인 리다이렉트)

**파일 구조:**
```
src/
├── lib/
│   ├── api.ts                  # API client 설정
│   ├── api-usage-examples.ts  # 사용 예시 (개발용)
│   └── query-client.ts         # React Query 설정
├── services/
│   ├── auth.service.ts         # 인증 서비스
│   └── asset.service.ts        # 자산 서비스
└── types/
    └── api.ts                  # API 타입 정의
```

---

## 환경 설정

### 1. 환경변수 설정

`.env.local` 파일을 생성하고 API URL을 설정합니다:

```bash
# .env.local
VITE_API_URL=http://localhost:8000
VITE_ENV=development
VITE_ENABLE_DEVTOOLS=true
```

**프로덕션 환경:**
```bash
# .env.production
VITE_API_URL=https://api.suresoft-ams.com
VITE_ENV=production
VITE_ENABLE_DEVTOOLS=false
```

### 2. 타입 정의

환경변수 타입은 `src/vite-env.d.ts`에 정의되어 있습니다:

```typescript
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ENV: 'development' | 'staging' | 'production';
  readonly VITE_ENABLE_DEVTOOLS: string;
}
```

---

## API Client 사용법

### 기본 사용법

```typescript
import { api } from '@/lib/api';

// GET request
const assets = await api.get('/api/v1/assets', { limit: 10 });

// POST request
const newAsset = await api.post('/api/v1/assets', {
  name: 'MacBook Pro',
  category_id: 'cat-123',
});

// PATCH request
const updated = await api.patch(`/api/v1/assets/${id}`, {
  status: 'in_use',
});

// DELETE request
await api.delete(`/api/v1/assets/${id}`);
```

### 파일 업로드

```typescript
const formData = new FormData();
formData.append('file', file);

const result = await api.upload('/api/v1/assets/import', formData);
```

---

## 인증 관리

### 로그인

```typescript
import { authService } from '@/services/auth.service';
import { isAuthenticated } from '@/lib/api';

// Login
const response = await authService.login({
  email: 'user@example.com',
  password: 'password',
});

// 토큰은 자동으로 localStorage에 저장되고
// API 헤더에 추가됩니다

// 인증 상태 확인
if (isAuthenticated()) {
  console.log('User is logged in');
}
```

### 로그아웃

```typescript
// Logout
await authService.logout();
// 토큰이 자동으로 제거됩니다
```

### 수동 토큰 관리

```typescript
import { setAuthToken, clearTokens, getStoredToken } from '@/lib/api';

// 토큰 설정
setAuthToken('your-jwt-token');

// 토큰 가져오기
const token = getStoredToken();

// 토큰 제거
clearTokens();
```

### 토큰 자동 갱신 (구현 예정)

```typescript
import { authService } from '@/services/auth.service';
import { getStoredRefreshToken } from '@/lib/api';

const refreshToken = getStoredRefreshToken();
if (refreshToken) {
  const response = await authService.refreshToken(refreshToken);
  // 새 토큰이 자동으로 저장됩니다
}
```

---

## 서비스 레이어

### Auth Service

```typescript
import { authService } from '@/services/auth.service';

// 로그인
await authService.login({ email, password });

// 회원가입
await authService.register({ email, password, full_name });

// 로그아웃
await authService.logout();

// 현재 사용자 정보
const user = await authService.getCurrentUser();
```

### Asset Service

```typescript
import { assetService } from '@/services/asset.service';

// 목록 조회
const response = await assetService.getAssets({
  skip: 0,
  limit: 10,
  search: 'laptop',
  status: 'available',
});

// 단일 조회
const asset = await assetService.getAsset(assetId);

// 생성
const newAsset = await assetService.createAsset({
  name: 'MacBook Pro',
  serial_number: 'MBP2024',
  category_id: 'cat-123',
  location_id: 'loc-456',
});

// 수정
const updated = await assetService.updateAsset(assetId, {
  status: 'maintenance',
});

// 삭제
await assetService.deleteAsset(assetId);

// 검색
const results = await assetService.searchAssets('laptop');

// 카테고리별 조회
const assets = await assetService.getAssetsByCategory(categoryId);

// Check-in/out
await assetService.checkInAsset(assetId);
await assetService.checkOutAsset(assetId, { user_id: userId });
```

---

## 에러 핸들링

### 자동 에러 처리

API Client는 다음 에러를 자동으로 처리합니다:

- **401 Unauthorized**: 토큰을 제거하고 로그인 페이지로 리다이렉트
- **403 Forbidden**: "권한이 없습니다" 에러 발생

### 에러 캐치

```typescript
import { ApiError } from '@/lib/api';

try {
  const asset = await assetService.getAsset('non-existent-id');
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message);
    console.error('Status:', error.status);
    console.error('Data:', error.data);
  }
}
```

### React에서 에러 처리

```typescript
import { toast } from 'sonner';

async function handleCreateAsset(data) {
  try {
    const asset = await assetService.createAsset(data);
    toast.success('자산이 생성되었습니다');
    return asset;
  } catch (error) {
    toast.error(error.message || '자산 생성에 실패했습니다');
    throw error;
  }
}
```

---

## 타입 안전성

### API 타입 사용

```typescript
import type {
  Asset,
  AssetCreate,
  AssetUpdate,
  LoginRequest,
  TokenResponse,
} from '@/types/api';

// 자산 생성 데이터 타입
const createData: AssetCreate = {
  name: 'MacBook Pro',
  category_id: 'cat-123',
  location_id: 'loc-456',
  // TypeScript가 필수 필드를 체크합니다
};

// 자산 타입
const asset: Asset = await assetService.createAsset(createData);
```

### OpenAPI 타입 직접 사용

```typescript
import type { components, operations } from '@ams/api-client';

// 컴포넌트 스키마
type Asset = components['schemas']['Asset'];
type User = components['schemas']['User'];

// Operation 타입
type GetAssetsResponse = operations['get_assets_api_v1_assets_get']['responses']['200']['content']['application/json'];
```

---

## React Query 통합

### Custom Hook 예시

**hooks/useAssets.ts:**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetService } from '@/services/asset.service';
import type { AssetCreate, AssetQueryParams } from '@/types/api';
import { toast } from 'sonner';

// 자산 목록 조회
export function useAssets(params?: AssetQueryParams) {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: () => assetService.getAssets(params),
  });
}

// 단일 자산 조회
export function useAsset(assetId: string) {
  return useQuery({
    queryKey: ['assets', assetId],
    queryFn: () => assetService.getAsset(assetId),
    enabled: !!assetId,
  });
}

// 자산 생성
export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssetCreate) => assetService.createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('자산이 생성되었습니다');
    },
    onError: (error) => {
      toast.error(error.message || '자산 생성에 실패했습니다');
    },
  });
}

// 자산 수정
export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssetUpdate }) =>
      assetService.updateAsset(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets', variables.id] });
      toast.success('자산이 수정되었습니다');
    },
    onError: (error) => {
      toast.error(error.message || '자산 수정에 실패했습니다');
    },
  });
}

// 자산 삭제
export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetId: string) => assetService.deleteAsset(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('자산이 삭제되었습니다');
    },
    onError: (error) => {
      toast.error(error.message || '자산 삭제에 실패했습니다');
    },
  });
}
```

### 컴포넌트에서 사용

```typescript
import { useAssets, useCreateAsset } from '@/hooks/useAssets';

function AssetList() {
  const { data, isLoading, error } = useAssets({ limit: 10 });
  const createAsset = useCreateAsset();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const handleCreate = async (formData) => {
    await createAsset.mutateAsync(formData);
  };

  return (
    <div>
      <h1>Assets ({data?.total})</h1>
      {data?.items.map(asset => (
        <div key={asset.id}>{asset.name}</div>
      ))}
    </div>
  );
}
```

---

## 추가 참고사항

### API 초기화

API Client는 앱 시작 시 자동으로 초기화됩니다 (`root.tsx`):

```typescript
import { initializeApiClient } from '@/lib/api';

useEffect(() => {
  initializeApiClient();
}, []);
```

### 개발 모드 디버깅

React Query DevTools를 사용하여 API 호출을 디버깅할 수 있습니다:

```typescript
// lib/query-client.ts
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// 개발 모드에서만 활성화
{import.meta.env.VITE_ENABLE_DEVTOOLS === 'true' && (
  <ReactQueryDevtools initialIsOpen={false} />
)}
```

### API 베이스 URL 변경

런타임에 API URL을 변경할 수 있습니다:

```typescript
import { setApiConfig } from '@ams/api-client';

setApiConfig({
  baseUrl: 'https://new-api-url.com',
});
```

---

## 문제 해결

### 401 에러 (Unauthorized)

- 토큰이 만료되었거나 유효하지 않음
- 자동으로 로그인 페이지로 리다이렉트됨
- 다시 로그인 필요

### 403 에러 (Forbidden)

- 권한이 없는 리소스에 접근
- 역할(Role) 확인 필요

### CORS 에러

- 백엔드에서 CORS 설정 확인
- `VITE_API_URL`이 올바른지 확인

### 타입 에러

- `@ams/api-client` 패키지 재빌드: `pnpm --filter @ams/api-client build`
- OpenAPI 스펙이 최신인지 확인

---

## 다음 단계

1. **Phase 7**: 기본 페이지 생성 (Login, Dashboard, Assets)
2. **Phase 8**: Custom hooks 구현 (useAssets, useAuth 등)
3. **Phase 9**: Protected Routes 구현
4. **Phase 10**: 에러 핸들링 & UX 개선

---

**생성일**: 2025-10-30
**작성자**: SureSoft AMS Team
**버전**: 1.0.0
