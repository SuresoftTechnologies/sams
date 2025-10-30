# 프론트엔드 기술 스택 최종 권장안

## 검토 일자
2025-01-29 (해커톤 준비)

---

## Executive Summary

제안된 스택의 **80%는 우수**하지만, 일부 **최신 버전의 불안정성**으로 인해 조정이 필요합니다.

### 핵심 변경사항
1. ❌ React Router v7 → ✅ React Router v6.22+
2. ❌ Tailwind v4 → ✅ Tailwind v3.4+
3. ❌ Vite 7.0 → ✅ Vite 6.x
4. ❌ Zod v4 → ✅ Zod v3.22+
5. ➕ QR코드, 테이블, 차트 라이브러리 추가

---

## 최종 권장 스택

### Core
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "typescript": "^5.3.3",
  "vite": "^6.0.0"
}
```

**선택 이유**:
- React 18.3: 안정적이고 Concurrent Features 지원
- TypeScript 5.3: FastAPI 타입 동기화와 완벽한 호환
- Vite 6.0: 최신 안정화 버전, Lightning-fast HMR

---

### UI Framework & Styling
```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.309.0",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.1",
    "@tailwindcss/forms": "^0.5.7",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.33"
  }
}
```

**shadcn/ui 설치 방법**:
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add select
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
```

**선택 이유**:
- shadcn/ui: 복사-붙여넣기 방식으로 빠른 개발
- Tailwind v3.4: 안정적이고 프로덕션 검증됨
- Radix UI: 접근성 자동 보장 (WCAG AA 준수)
- lucide-react: Tree-shakeable 아이콘

**대안 거부 이유**:
- ❌ Material-UI: 무거움 (~500KB), 커스터마이징 어려움
- ❌ Ant Design: 디자인 자유도 낮음
- ❌ Tailwind v4: 아직 Alpha/Beta 단계

---

### Routing
```json
{
  "react-router-dom": "^6.22.0"
}
```

**선택 이유**:
- React Router v6.22: 안정적이고 성숙함
- Data APIs 지원: `loader`, `action` 활용 가능
- Type-safe routing
- 풍부한 커뮤니티 자료

**대안 거부 이유**:
- ❌ React Router v7: 아직 불안정, Remix 통합으로 API 대폭 변경
- ❌ TanStack Router: 오버엔지니어링 (해커톤에 과함)
- ❌ Next.js App Router: 이 프로젝트는 SPA 방식

**라우팅 구조 예시**:
```typescript
// apps/frontend/src/routes.tsx
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'assets', element: <AssetList /> },
      { path: 'assets/:id', element: <AssetDetail /> },
      { path: 'checkin', element: <CheckIn /> },
      { path: 'checkout', element: <CheckOut /> },
      { path: 'workflows', element: <WorkflowList /> },
    ],
  },
]);
```

---

### State Management
```json
{
  "@tanstack/react-query": "^5.17.0",
  "@tanstack/react-query-devtools": "^5.17.0",
  "zustand": "^4.4.7"
}
```

**선택 이유**:
- TanStack Query: 서버 상태 관리의 표준
  - 자동 캐싱, 재검증, 백그라운드 refetch
  - FastAPI와 완벽한 궁합
  - Devtools로 디버깅 편함
- Zustand: 가볍고 간단한 전역 상태 관리
  - Redux보다 10배 간단
  - 보일러플레이트 없음
  - TypeScript 지원 완벽

**대안 비교**:
- ✅ TanStack Query > SWR (더 강력한 기능)
- ✅ Zustand > Redux (해커톤에 적합)
- ❌ Jotai/Recoil: 오버엔지니어링

**사용 예시**:
```typescript
// Server State (TanStack Query)
const { data: assets } = useQuery({
  queryKey: ['assets'],
  queryFn: () => apiClient.getAssets(),
});

// Client State (Zustand)
const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

---

### Forms & Validation
```json
{
  "react-hook-form": "^7.49.3",
  "zod": "^3.22.4",
  "@hookform/resolvers": "^3.3.4"
}
```

**선택 이유**:
- React Hook Form: 성능 최적화된 폼 라이브러리
  - Uncontrolled forms로 리렌더링 최소화
  - 직관적인 API
- Zod: FastAPI Pydantic과 개념적 일치
  - 타입 안전성
  - 런타임 검증
- Perfect integration

**대안 거부 이유**:
- ❌ Formik: 성능 이슈 (controlled forms)
- ❌ Zod v4: 아직 출시 안됨

**사용 예시**:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const assetSchema = z.object({
  name: z.string().min(1, '자산명은 필수입니다'),
  serialNumber: z.string().min(1, '시리얼 번호는 필수입니다'),
  category: z.enum(['DESKTOP', 'LAPTOP', 'MONITOR']),
});

function AssetForm() {
  const form = useForm({
    resolver: zodResolver(assetSchema),
  });

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

---

### API Integration
```json
{
  "@sams/api-client": "workspace:*",
  "@sams/shared-types": "workspace:*"
}
```

**아키텍처**:
```
FastAPI (OpenAPI spec)
  ↓ (자동 생성)
@sams/api-client (TypeScript types)
  ↓
TanStack Query (캐싱, 재검증)
  ↓
React Components
```

**장점**:
- 타입 안전성 보장
- 백엔드 변경사항 즉시 반영
- 수동 타입 관리 불필요

---

### 필수 추가 라이브러리

#### QR코드 (요구사항)
```json
{
  "qrcode.react": "^3.1.0",
  "@zxing/browser": "^0.1.5"
}
```

**사용 케이스**:
- `qrcode.react`: QR코드 생성 (자산 라벨 출력)
- `@zxing/browser`: QR코드 스캔 (체크인/아웃)

---

#### 테이블 (1,182개 자산)
```json
{
  "@tanstack/react-table": "^8.11.0",
  "@tanstack/react-virtual": "^3.0.0"
}
```

**선택 이유**:
- TanStack Table: Headless 테이블 라이브러리
  - 정렬, 필터링, 페이지네이션
  - 가상 스크롤 지원
  - 완전한 타입 안전성
- TanStack Virtual: 대량 데이터 성능 최적화
  - 1,000+ 아이템도 부드럽게 스크롤

**대안 비교**:
- ❌ Ag-Grid: 유료 ($1,000+)
- ❌ Material Table: 무겁고 커스터마이징 어려움

---

#### 차트/대시보드
```json
{
  "recharts": "^2.10.0"
}
```

**선택 이유**:
- React 전용으로 설계됨
- 선언적 API
- 반응형 디자인
- 충분한 기능 (해커톤에 적합)

**대안 비교**:
- ❌ Chart.js: 명령형 API (React와 맞지 않음)
- ❌ D3.js: 학습 곡선 높음 (해커톤 부적합)

---

#### 날짜/시간
```json
{
  "date-fns": "^3.0.0",
  "react-day-picker": "^8.10.0"
}
```

**선택 이유**:
- date-fns: Tree-shakeable, Immutable
- react-day-picker: Lightweight 날짜 선택기

---

#### 알림/토스트
```json
{
  "sonner": "^1.3.0"
}
```

**선택 이유**:
- 가장 가볍고 심플한 토스트 라이브러리
- shadcn/ui와 완벽한 호환

---

### 선택적 추가 라이브러리

#### Excel 임포트/익스포트
```json
{
  "xlsx": "^0.18.5"
}
```

**사용 케이스**: 자산 데이터 일괄 업로드/다운로드

---

#### PDF 생성
```json
{
  "jspdf": "^2.5.1",
  "jspdf-autotable": "^3.8.0"
}
```

**사용 케이스**: 자산 리포트 PDF 출력

---

#### 드래그앤드롭
```json
{
  "@hello-pangea/dnd": "^16.5.0"
}
```

**사용 케이스**: 워크플로우 단계 재정렬

---

## 통합 검토

### 백엔드 호환성
| 항목 | 상태 | 비고 |
|------|------|------|
| FastAPI OpenAPI → TypeScript | ✅ | 자동 생성 파이프라인 구축됨 |
| Pydantic ↔ Zod | ✅ | 개념적 일치 |
| TanStack Query + FastAPI | ✅ | 완벽한 궁합 |
| JWT 인증 흐름 | ✅ | 구현 가능 |

### 생태계 호환성
| 항목 | 상태 | 비고 |
|------|------|------|
| ESM 지원 | ✅ | 모든 라이브러리 |
| TypeScript | ✅ | 완벽한 타입 정의 |
| Vite 호환 | ✅ | 빠른 HMR |
| React 18 | ✅ | Concurrent Features |

### 성능 분석
| 지표 | 예상값 | 목표 |
|------|--------|------|
| 번들 사이즈 (gzipped) | ~250KB | <300KB |
| First Load | <1초 | <3초 |
| HMR | <50ms | <100ms |
| Table Rendering (1,000+ rows) | 60fps | 30fps+ |

---

## 해커톤 적합성

### 빠른 개발 (✅ 매우 우수)
1. **shadcn/ui**: `npx shadcn add button` 즉시 사용
2. **TanStack Query**: API 통합 5분
3. **React Hook Form + Zod**: 폼 구현 10분
4. **Vite**: 빌드 대기 0초
5. **TypeScript 자동 생성**: API 변경사항 즉시 반영

### 학습 곡선 (✅ 낮음)
- React Hooks: 대부분의 개발자 숙련
- TanStack Query: 직관적
- React Hook Form: 간단
- shadcn/ui: 예제 풍부

### 위험 요소 (✅ 제거됨)
- ✅ React Router v6: 안정적
- ✅ Tailwind v3.4: 프로덕션 검증
- ✅ Vite 6.x: 최신 안정화
- ✅ Zod v3.22: 성숙함

---

## 프로젝트 구조 예시

```
apps/frontend/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root component
│   ├── routes.tsx                  # React Router routes
│   │
│   ├── components/                 # shadcn/ui components
│   │   ├── ui/                     # Auto-generated by shadcn
│   │   │   ├── button.tsx
│   │   │   ├── form.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── asset/
│   │   │   ├── AssetTable.tsx
│   │   │   ├── AssetForm.tsx
│   │   │   └── AssetQRCode.tsx
│   │   └── ...
│   │
│   ├── features/                   # Feature-based organization
│   │   ├── assets/
│   │   │   ├── api/                # TanStack Query hooks
│   │   │   │   ├── useAssets.ts
│   │   │   │   ├── useCreateAsset.ts
│   │   │   │   └── useUpdateAsset.ts
│   │   │   ├── components/
│   │   │   ├── schemas/            # Zod schemas
│   │   │   │   └── assetSchema.ts
│   │   │   └── types/
│   │   ├── checkin/
│   │   ├── checkout/
│   │   ├── workflows/
│   │   └── dashboard/
│   │
│   ├── lib/                        # Utilities
│   │   ├── api-client.ts           # API client wrapper
│   │   ├── query-client.ts         # TanStack Query config
│   │   └── utils.ts                # clsx, cn, etc.
│   │
│   ├── stores/                     # Zustand stores
│   │   ├── useAuthStore.ts
│   │   └── useUIStore.ts
│   │
│   ├── styles/
│   │   └── globals.css             # Tailwind imports
│   │
│   └── types/                      # Global types
│       └── index.ts
│
├── public/                         # Static assets
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 최종 package.json

```json
{
  "name": "@sams/frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist node_modules .turbo"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.22.0",

    "@tanstack/react-query": "^5.17.0",
    "@tanstack/react-query-devtools": "^5.17.0",
    "@tanstack/react-table": "^8.11.0",
    "@tanstack/react-virtual": "^3.0.0",

    "react-hook-form": "^7.49.3",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4",

    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",

    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.309.0",

    "qrcode.react": "^3.1.0",
    "@zxing/browser": "^0.1.5",

    "recharts": "^2.10.0",
    "date-fns": "^3.0.0",
    "react-day-picker": "^8.10.0",
    "sonner": "^1.3.0",
    "zustand": "^4.4.7",

    "@sams/api-client": "workspace:*",
    "@sams/shared-types": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^6.18.1",
    "@typescript-eslint/parser": "^6.18.1",
    "@vitejs/plugin-react": "^4.2.1",

    "vite": "^6.0.0",
    "typescript": "^5.3.3",

    "tailwindcss": "^3.4.1",
    "tailwindcss-animate": "^1.0.7",
    "@tailwindcss/forms": "^0.5.7",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.33",

    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",

    "@sams/config": "workspace:*"
  }
}
```

---

## 설치 가이드

### 1. 프론트엔드 앱 생성
```bash
cd /Users/chsong/Documents/my-projects/suresoft-ams/apps/frontend

# Vite 프로젝트 초기화 (이미 있다면 스킵)
pnpm create vite . --template react-ts

# 의존성 설치
pnpm install
```

### 2. shadcn/ui 설정
```bash
npx shadcn-ui@latest init

# 필요한 컴포넌트 추가
npx shadcn-ui@latest add button
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add select
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add tabs
```

### 3. Tailwind 설정
```bash
# tailwind.config.js
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
  ],
}
```

### 4. TanStack Query 설정
```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      retry: 1,
    },
  },
});
```

### 5. API Client 통합
```typescript
// src/lib/api-client.ts
import type { paths } from '@sams/api-client';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = {
  async getAssets() {
    const response = await fetch(`${BASE_URL}/api/v1/assets`);
    return response.json();
  },
  // ... other methods
};
```

---

## 개발 워크플로우

### 1. 백엔드 OpenAPI 생성
```bash
cd /Users/chsong/Documents/my-projects/suresoft-ams
pnpm --filter @sams/backend generate:openapi
```

### 2. TypeScript 타입 자동 생성
```bash
pnpm --filter @sams/api-client generate
```

### 3. 프론트엔드 개발 시작
```bash
pnpm --filter @sams/frontend dev
```

### 4. 모든 앱 동시 실행
```bash
pnpm dev  # Turborepo가 병렬 실행
```

---

## 성능 최적화 체크리스트

### 번들 사이즈
- [ ] Dynamic imports (code splitting)
- [ ] Tree-shaking 활용
- [ ] Lazy load routes
- [ ] Image optimization

### 런타임 성능
- [ ] React.memo로 불필요한 리렌더링 방지
- [ ] TanStack Virtual로 큰 리스트 최적화
- [ ] Debounce 검색 입력
- [ ] Optimistic updates

### 개발자 경험
- [ ] TypeScript strict 모드
- [ ] ESLint + Prettier
- [ ] Pre-commit hooks (husky + lint-staged)
- [ ] TanStack Query Devtools

---

## 접근성 체크리스트

Radix UI 기반 shadcn/ui를 사용하면 대부분 자동으로 보장됩니다:

- [x] ARIA labels
- [x] Keyboard navigation
- [x] Focus management
- [x] Screen reader support
- [ ] Color contrast (수동 확인 필요)
- [ ] Text alternatives for images

---

## 타임라인 예상 (해커톤 기준)

| 단계 | 소요 시간 | 작업 |
|------|-----------|------|
| 프로젝트 설정 | 1시간 | Vite + shadcn/ui + 의존성 설치 |
| 레이아웃 구성 | 2시간 | Header, Sidebar, Footer |
| 자산 목록 | 3시간 | TanStack Table + 필터링 |
| 자산 등록/수정 | 3시간 | React Hook Form + Zod |
| QR코드 기능 | 2시간 | 생성 + 스캔 |
| 체크인/아웃 | 3시간 | 워크플로우 구현 |
| 대시보드 | 2시간 | 차트 + 통계 |
| 통합 테스트 | 2시간 | 버그 수정 |
| **총계** | **18시간** | 2-3일 작업량 |

---

## 위험 요소 및 대응

| 위험 | 확률 | 영향 | 대응책 |
|------|------|------|--------|
| API 타입 불일치 | 낮음 | 중간 | OpenAPI 자동 생성으로 예방 |
| 성능 이슈 (1,000+ 자산) | 중간 | 높음 | TanStack Virtual 사용 |
| QR코드 스캔 실패 | 중간 | 중간 | 수동 입력 옵션 제공 |
| 브라우저 호환성 | 낮음 | 낮음 | 모던 브라우저만 지원 명시 |

---

## 최종 결론

### 원래 제안 대비 변경사항
| 항목 | 원래 제안 | 최종 권장 | 이유 |
|------|-----------|-----------|------|
| React Router | v7 | v6.22+ | 안정성 |
| Tailwind | v4 | v3.4+ | 프로덕션 검증 |
| Vite | 7.0 | 6.x | 최신 안정화 버전 |
| Zod | v4 | v3.22+ | 아직 미출시 |

### 추가된 라이브러리
- QR코드: qrcode.react + @zxing/browser
- 테이블: @tanstack/react-table + @tanstack/react-virtual
- 차트: recharts
- 날짜: date-fns + react-day-picker
- 토스트: sonner

### 종합 평가

| 카테고리 | 점수 | 평가 |
|----------|------|------|
| 해커톤 적합성 | 9.5/10 | 매우 우수 |
| 기술 선택 | 9/10 | 우수 (일부 조정 필요) |
| 백엔드 통합 | 10/10 | 완벽 |
| 생태계 호환성 | 10/10 | 완벽 |
| 성능 | 9/10 | 우수 |
| 개발자 경험 | 10/10 | 완벽 |

### 최종 추천
**수정된 스택을 그대로 사용하세요.** 빠른 개발, 타입 안전성, 성능 모두 만족합니다.

---

## 참고 자료

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [TanStack Table Documentation](https://tanstack.com/table/latest)
- [Vite Documentation](https://vitejs.dev/)

---

**작성자**: Claude (Frontend Specialist)
**검토 일자**: 2025-01-29
**프로젝트**: SureSoft 자산관리 시스템 (슈커톤 해커톤)
