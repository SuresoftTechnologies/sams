# Frontend Setup Tasks - SureSoft AMS

프론트엔드 앱 생성 및 설정 작업 목록

---

## 📦 Phase 1: 프로젝트 초기화

### 1.1 Vite 프로젝트 생성
- [x] `npm create vite@latest` 실행
- [x] 프로젝트 이름: `frontend` (apps/frontend)
- [x] Framework: React
- [x] Variant: TypeScript + SWC
- [x] 디렉토리 이동 및 기본 파일 확인

### 1.2 Package.json 설정
- [x] package.json 수정 (name: `@ams/frontend`)
- [x] 핵심 의존성 설치
  - [x] react-router (v7)
  - [x] @react-router/dev
  - [x] @react-router/node
- [x] UI 라이브러리 설치
  - [x] tailwindcss
  - [x] @tailwindcss/vite
  - [x] lucide-react
  - [x] clsx
  - [x] tailwind-merge
- [x] 상태 관리 설치
  - [x] @tanstack/react-query
  - [x] zustand (선택적)
- [x] 폼 관리 설치
  - [x] react-hook-form
  - [x] zod
  - [x] @hookform/resolvers
- [x] 유틸리티 설치
  - [x] date-fns
  - [x] @types/node
- [x] Workspace 패키지 연결
  - [x] @ams/shared-types
  - [x] @ams/api-client

### 1.3 개발 도구 설치
- [x] ESLint 설정
- [x] Prettier 설정 (선택적)
- [x] eslint-config-prettier 설치 (ESLint ↔ Prettier 충돌 방지)
- [x] 스크립트 추가 (typecheck, format, format:check)

**추가 완료된 package.json 스크립트:**
```json
"lint": "eslint .",
"typecheck": "tsc --noEmit",
"format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css}\"",
"format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css}\""
```

**도구별 역할 분리 (모범 사례):**
- TypeScript: 타입 체크만 (`--noEmit`)
- ESLint: 코드 품질, 버그 탐지 (포맷팅 규칙 비활성화)
- Prettier: 코드 포맷팅 전담

---

## ⚙️ Phase 2: 빌드 도구 설정

### 2.1 Vite 설정 (vite.config.ts)
- [x] React plugin 추가 (`@vitejs/plugin-react-swc`)
- [x] Tailwind CSS v4 plugin 추가 (`@tailwindcss/vite`)
- [x] Path alias 설정 (`@/` → `./src`)
- [x] 포트 설정 (5173)
- [ ] ~~React Router v7 plugin~~ (Phase 5에서 재설정 예정 - 호환성 이슈)

### 2.2 TypeScript 설정 (tsconfig.json)
- [x] baseUrl 및 paths 설정
- [x] 컴파일러 옵션 확인
- [x] @ams/* 패키지 타입 인식 확인

### 2.3 Tailwind CSS 설정
- [x] src/index.css 수정
  ```css
  @import "tailwindcss";
  ```
- [x] Tailwind CSS v4 호환 (shadcn/ui CSS 변수는 Phase 3에서 추가 예정)

---

## 🎨 Phase 3: shadcn/ui 설정

### 3.1 shadcn/ui 초기화
- [x] components.json 수동 생성 (tsconfig path alias 이슈로 수동 설정)
- [x] 스타일 선택: Default
- [x] Base color 선택: Zinc
- [x] CSS variables: Yes
- [x] Tailwind CSS v4 호환 설정

### 3.2 기본 컴포넌트 설치
- [x] button, input, form, table 설치
- [x] dialog, card, badge 설치
- [x] dropdown-menu, select 설치
- [x] label (자동 설치됨)
- [x] sonner (toast) 설치
- [x] class-variance-authority 추가 설치
- [x] 총 11개 컴포넌트 설치 완료

### 3.3 lib/utils.ts 확인
- [x] src/lib/utils.ts 생성
- [x] cn() 함수 생성 확인
- [x] clsx + tailwind-merge 통합 확인

### 3.4 CSS 변수 설정
- [x] src/index.css에 shadcn/ui CSS 변수 추가
- [x] Light/Dark 테마 변수 설정
- [x] border-border, bg-background 유틸리티 추가

---

## 🗂️ Phase 4: 프로젝트 구조 생성

### 4.1 디렉토리 구조 생성
```
src/
├── components/
│   ├── ui/              # shadcn/ui 컴포넌트
│   ├── layout/          # 레이아웃 컴포넌트
│   └── features/        # 기능별 컴포넌트
├── pages/               # 페이지 컴포넌트
├── hooks/               # Custom hooks
├── lib/                 # 유틸리티
├── services/            # API 서비스
├── stores/              # Zustand 스토어 (필요시)
├── types/               # 추가 타입 정의
└── App.tsx
```

- [x] components/layout 폴더 생성
- [x] components/features 폴더 생성
- [x] pages 폴더 생성
- [x] hooks 폴더 생성
- [x] lib 폴더 생성 (utils.ts 포함)
- [x] services 폴더 생성
- [x] stores 폴더 생성 (선택적)
- [x] types 폴더 생성

### 4.2 .gitignore 업데이트
- [x] node_modules
- [x] dist
- [x] .env.local
- [x] 기타 빌드 아티팩트

---

## 🔌 Phase 5: React Router v7 설정

### 5.1 Root 컴포넌트 생성
- [x] src/root.tsx 생성
- [x] Outlet 컴포넌트로 자식 라우트 렌더링
- [x] 전역 레이아웃 설정

### 5.2 라우트 정의
- [x] src/routes.tsx 생성
- [x] 기본 라우트 구조:
  ```
  / (Root Layout)
  ├── /login (로그인)
  ├── /dashboard (대시보드)
  ├── /assets (자산 목록)
  ├── /assets/:id (자산 상세)
  ├── /assets/new (자산 생성)
  └── /profile (프로필)
  ```

### 5.3 404 페이지
- [x] NotFound.tsx 생성

---

## 🌐 Phase 6: TanStack Query 설정

### 6.1 QueryClient 설정
- [x] lib/query-client.ts 생성
- [x] QueryClient 인스턴스 생성
- [x] 기본 옵션 설정 (staleTime, cacheTime 등)

### 6.2 QueryClientProvider 통합
- [x] App.tsx에 QueryClientProvider 추가
- [x] React Query Devtools 추가 (개발 모드)

### 6.3 API Client 통합
- [x] @ams/api-client import
- [x] lib/api.ts 생성 (API 설정)
- [x] Base URL 설정 (환경변수)

---

## 📝 Phase 7: 기본 페이지 생성

### 7.1 레이아웃 컴포넌트
- [x] components/layout/RootLayout.tsx
  - [x] Header (네비게이션)
  - [x] Sidebar (메뉴)
  - [x] Main content area
  - [x] Footer
- [x] components/layout/Header.tsx
- [x] components/layout/Sidebar.tsx

### 7.2 인증 페이지
- [x] pages/Login.tsx
  - [x] 로그인 폼 (React Hook Form + Zod)
  - [x] 이메일/비밀번호 입력
  - [x] 로그인 API 호출 (useMutation)

### 7.3 대시보드 페이지
- [x] pages/Dashboard.tsx
  - [x] 통계 카드 (총 자산 수, 사용 중, 사용 가능 등)
  - [x] 최근 활동 목록
  - [x] 차트 (선택적)

### 7.4 자산 목록 페이지
- [x] pages/Assets.tsx
  - [x] 자산 목록 테이블 (shadcn/ui Table)
  - [x] 검색/필터 기능
  - [x] 페이지네이션 (준비됨)
  - [x] useQuery로 데이터 페칭

### 7.5 자산 상세 페이지
- [x] pages/AssetDetail.tsx
  - [x] 자산 정보 표시
  - [x] QR 코드 표시 (placeholder)
  - [x] 수정/삭제 버튼
  - [x] 히스토리 (체크인/아웃) (placeholder)

### 7.6 자산 생성/수정 페이지
- [x] pages/AssetForm.tsx
  - [x] 자산 폼 (React Hook Form + Zod)
  - [x] 카테고리 선택
  - [x] 위치 선택
  - [x] 구매 정보 입력
  - [x] useMutation으로 저장

### 7.7 Custom Hooks
- [x] hooks/useAuth.ts (useLogin, useLogout, useCurrentUser)
- [x] hooks/useAssets.ts (CRUD operations)

### 7.8 Validation & Utils
- [x] lib/validators.ts (Zod schemas)
- [x] Mock data for development

---

## 🎯 Phase 8: 기능별 컴포넌트 구현

### 8.1 자산 관련 컴포넌트
- [ ] components/features/AssetTable.tsx
- [ ] components/features/AssetCard.tsx
- [ ] components/features/AssetFilters.tsx
- [ ] components/features/AssetQRCode.tsx (qrcode.react)

### 8.2 Custom Hooks
- [ ] hooks/useAssets.ts
  - [ ] useGetAssets (목록)
  - [ ] useGetAsset (상세)
  - [ ] useCreateAsset (생성)
  - [ ] useUpdateAsset (수정)
  - [ ] useDeleteAsset (삭제)
- [ ] hooks/useAuth.ts
  - [ ] useLogin
  - [ ] useLogout
  - [ ] useCurrentUser

### 8.3 유틸리티 함수
- [ ] lib/format.ts (날짜, 숫자 포맷팅)
- [ ] lib/constants.ts (상수 정의)
- [ ] lib/validators.ts (Zod 스키마)

---

## 🔐 Phase 9: 인증/인가

### 9.1 인증 상태 관리
- [ ] Zustand store for auth (선택적)
- [ ] localStorage에 토큰 저장
- [ ] API Client에 토큰 자동 주입

### 9.2 Protected Routes
- [ ] components/ProtectedRoute.tsx
- [ ] 로그인 체크
- [ ] 미인증 시 /login 리다이렉트

### 9.3 권한 기반 UI
- [ ] Role-based rendering
- [ ] Admin 전용 기능

---

## 🎨 Phase 10: 스타일링 & UX

### 10.1 다크 모드 (선택적)
- [ ] ThemeProvider 구현
- [ ] 토글 버튼
- [ ] localStorage에 저장

### 10.2 로딩 상태
- [ ] Skeleton 컴포넌트
- [ ] Spinner 컴포넌트
- [ ] TanStack Query isPending 활용

### 10.3 에러 핸들링
- [ ] Error Boundary
- [ ] Toast 알림 (sonner)
- [ ] 에러 페이지

### 10.4 반응형 디자인
- [ ] 모바일 레이아웃
- [ ] 태블릿 레이아웃
- [ ] Tailwind breakpoints 활용

---

## 🧪 Phase 11: 테스트 & 최적화

### 11.1 기본 테스트 (선택적)
- [ ] Vitest 설정
- [ ] 컴포넌트 단위 테스트
- [ ] API hooks 테스트

### 11.2 성능 최적화
- [ ] React.memo 적용
- [ ] useMemo/useCallback 최적화
- [ ] Code splitting (React.lazy)
- [ ] 이미지 최적화

### 11.3 번들 사이즈 체크
- [ ] `pnpm build` 실행
- [ ] 번들 사이즈 확인
- [ ] 필요시 최적화

---

## 🚀 Phase 12: 통합 & 배포 준비

### 12.1 백엔드 연동
- [ ] OpenAPI 스펙 가져오기
- [ ] @ams/api-client 타입 생성
- [ ] API 엔드포인트 연결 확인

### 12.2 환경 변수 설정
- [ ] .env.example 생성
- [ ] VITE_API_URL 설정
- [ ] 환경별 설정 (dev, staging, prod)

### 12.3 빌드 테스트
- [ ] `pnpm build` 성공 확인
- [ ] `pnpm preview` 로컬 테스트
- [ ] 프로덕션 빌드 검증

### 12.4 문서화
- [ ] README.md 작성
- [ ] 컴포넌트 사용법 문서
- [ ] API 호출 예시

---

## 📋 Phase 13: 최종 점검

### 13.1 코드 품질
- [ ] ESLint 경고/에러 해결
- [ ] TypeScript 타입 에러 해결
- [ ] Console 경고 제거
- [ ] 불필요한 import 제거

### 13.2 기능 테스트
- [ ] 로그인/로그아웃
- [ ] 자산 목록 조회
- [ ] 자산 생성
- [ ] 자산 수정
- [ ] 자산 삭제
- [ ] 검색/필터
- [ ] 페이지네이션

### 13.3 UX 체크
- [ ] 로딩 상태 표시
- [ ] 에러 메시지 표시
- [ ] 성공 알림
- [ ] 반응형 동작 확인
- [ ] 접근성 체크 (키보드 네비게이션)

---

## 🎉 완료!

모든 체크리스트 완료 후:
- [ ] Turborepo 통합 확인 (`pnpm dev` from root)
- [ ] Git commit & push
- [ ] 팀원과 공유

---

**예상 소요 시간**: 18-24시간 (2-3일)
**우선순위**: Phase 1-7 필수, Phase 8-13 단계적 진행

**생성일**: 2025-10-29
**프로젝트**: SureSoft AMS (슈커톤 해커톤)
