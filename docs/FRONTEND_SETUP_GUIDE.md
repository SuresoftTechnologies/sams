# 프론트엔드 설치 가이드

## 빠른 시작

```bash
# 1. 프론트엔드 디렉토리로 이동
cd /Users/chsong/Documents/my-projects/suresoft-ams/apps/frontend

# 2. 의존성 설치
pnpm install

# 3. shadcn/ui 초기화
npx shadcn-ui@latest init

# 4. 필요한 컴포넌트 추가
npx shadcn-ui@latest add button form table dialog input label card badge select tabs

# 5. 개발 서버 시작
pnpm dev
```

---

## 단계별 상세 가이드

### 1. 프로젝트 구조 생성

```bash
cd /Users/chsong/Documents/my-projects/suresoft-ams/apps/frontend

# 기본 디렉토리 구조
mkdir -p src/{components/{ui,layout},features/{assets,checkin,checkout,workflows,dashboard}/{api,components,schemas},lib,stores,types,styles}
```

### 2. package.json 복사

```bash
cp /Users/chsong/Documents/my-projects/suresoft-ams/docs/frontend-package.json package.json
```

또는 수동으로 생성:

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
    "lint": "eslint . --ext ts,tsx",
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

### 3. 의존성 설치

```bash
pnpm install
```

### 4. 설정 파일 복사

#### vite.config.ts
```bash
cp /Users/chsong/Documents/my-projects/suresoft-ams/docs/frontend-configs/vite.config.ts .
```

#### tsconfig.json
```bash
cp /Users/chsong/Documents/my-projects/suresoft-ams/docs/frontend-configs/tsconfig.json .
cp /Users/chsong/Documents/my-projects/suresoft-ams/docs/frontend-configs/tsconfig.node.json .
```

#### tailwind.config.js
```bash
cp /Users/chsong/Documents/my-projects/suresoft-ams/docs/frontend-configs/tailwind.config.js .
```

#### postcss.config.js
```bash
echo 'export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}' > postcss.config.js
```

### 5. shadcn/ui 초기화

```bash
npx shadcn-ui@latest init
```

프롬프트에서 다음과 같이 선택:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

### 6. shadcn/ui 컴포넌트 추가

```bash
# 필수 컴포넌트
npx shadcn-ui@latest add button
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add table
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add select
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add tabs
```

### 7. 스타일 파일 생성

```bash
cp /Users/chsong/Documents/my-projects/suresoft-ams/docs/frontend-configs/globals.css src/styles/globals.css
```

### 8. 라이브러리 파일 생성

#### Query Client
```bash
cp /Users/chsong/Documents/my-projects/suresoft-ams/docs/frontend-configs/query-client.ts src/lib/query-client.ts
```

#### API Client
```bash
cp /Users/chsong/Documents/my-projects/suresoft-ams/docs/frontend-configs/api-client.ts src/lib/api-client.ts
```

#### Utils
```bash
echo 'import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}' > src/lib/utils.ts
```

### 9. Feature 파일 생성

#### Assets API Hooks
```bash
cp /Users/chsong/Documents/my-projects/suresoft-ams/docs/frontend-configs/useAssets.ts src/features/assets/api/useAssets.ts
```

#### Asset Table Component
```bash
cp /Users/chsong/Documents/my-projects/suresoft-ams/docs/frontend-configs/AssetTable.tsx src/features/assets/components/AssetTable.tsx
```

#### Asset Form Component
```bash
cp /Users/chsong/Documents/my-projects/suresoft-ams/docs/frontend-configs/AssetForm.tsx src/features/assets/components/AssetForm.tsx
```

### 10. Routes 설정

```bash
cp /Users/chsong/Documents/my-projects/suresoft-ams/docs/frontend-configs/routes.tsx src/routes.tsx
```

### 11. App 컴포넌트

```bash
cp /Users/chsong/Documents/my-projects/suresoft-ams/docs/frontend-configs/App.tsx src/App.tsx
```

### 12. Entry Point (main.tsx)

```bash
echo "import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);" > src/main.tsx
```

### 13. index.html

```bash
echo '<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SureSoft 자산관리 시스템</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>' > index.html
```

### 14. 환경 변수 설정

```bash
echo 'VITE_API_URL=http://localhost:8000' > .env.development
echo 'VITE_API_URL=https://api.production.com' > .env.production
```

---

## 개발 서버 시작

### 프론트엔드만 실행
```bash
cd /Users/chsong/Documents/my-projects/suresoft-ams/apps/frontend
pnpm dev
```

### 백엔드 + 프론트엔드 동시 실행
```bash
cd /Users/chsong/Documents/my-projects/suresoft-ams
pnpm dev
```

브라우저에서 http://localhost:3000 접속

---

## 추가 페이지 생성

### Dashboard 페이지
```bash
mkdir -p src/pages
echo "import { AssetTable } from '@/features/assets/components/AssetTable';

export default function Dashboard() {
  return (
    <div className=\"p-8\">
      <h1 className=\"text-3xl font-bold mb-6\">대시보드</h1>
      <AssetTable />
    </div>
  );
}" > src/pages/Dashboard.tsx
```

### AssetList 페이지
```bash
echo "import { AssetTable } from '@/features/assets/components/AssetTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function AssetList() {
  return (
    <div className=\"p-8\">
      <div className=\"flex justify-between items-center mb-6\">
        <h1 className=\"text-3xl font-bold\">자산 목록</h1>
        <Button>
          <Plus className=\"mr-2 h-4 w-4\" />
          자산 등록
        </Button>
      </div>
      <AssetTable />
    </div>
  );
}" > src/pages/AssetList.tsx
```

### AssetDetail 페이지
```bash
echo "import { useParams } from 'react-router-dom';
import { useAsset } from '@/features/assets/api/useAssets';

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: asset, isLoading } = useAsset(id!);

  if (isLoading) return <div>로딩 중...</div>;
  if (!asset) return <div>자산을 찾을 수 없습니다</div>;

  return (
    <div className=\"p-8\">
      <h1 className=\"text-3xl font-bold mb-6\">{asset.name}</h1>
      <div className=\"bg-white rounded-lg shadow p-6\">
        <dl className=\"grid grid-cols-2 gap-4\">
          <div>
            <dt className=\"text-sm font-medium text-gray-500\">시리얼 번호</dt>
            <dd className=\"text-lg\">{asset.serial_number}</dd>
          </div>
          <div>
            <dt className=\"text-sm font-medium text-gray-500\">분류</dt>
            <dd className=\"text-lg\">{asset.category}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}" > src/pages/AssetDetail.tsx
```

### CheckIn/CheckOut 페이지
```bash
echo "export default function CheckIn() {
  return (
    <div className=\"p-8\">
      <h1 className=\"text-3xl font-bold mb-6\">체크인</h1>
      <div>QR 코드 스캔 기능 구현 예정</div>
    </div>
  );
}" > src/pages/CheckIn.tsx

echo "export default function CheckOut() {
  return (
    <div className=\"p-8\">
      <h1 className=\"text-3xl font-bold mb-6\">체크아웃</h1>
      <div>QR 코드 스캔 기능 구현 예정</div>
    </div>
  );
}" > src/pages/CheckOut.tsx
```

### WorkflowList 페이지
```bash
echo "export default function WorkflowList() {
  return (
    <div className=\"p-8\">
      <h1 className=\"text-3xl font-bold mb-6\">워크플로우</h1>
      <div>워크플로우 목록 구현 예정</div>
    </div>
  );
}" > src/pages/WorkflowList.tsx
```

### RootLayout 컴포넌트
```bash
echo "import { Outlet, Link } from 'react-router-dom';

export function RootLayout() {
  return (
    <div className=\"min-h-screen bg-gray-50\">
      {/* Header */}
      <header className=\"bg-white shadow\">
        <div className=\"max-w-7xl mx-auto px-4 py-4\">
          <nav className=\"flex gap-6\">
            <Link to=\"/\" className=\"text-lg font-semibold\">
              SureSoft AMS
            </Link>
            <Link to=\"/assets\" className=\"hover:text-blue-600\">
              자산 목록
            </Link>
            <Link to=\"/checkin\" className=\"hover:text-blue-600\">
              체크인
            </Link>
            <Link to=\"/checkout\" className=\"hover:text-blue-600\">
              체크아웃
            </Link>
            <Link to=\"/workflows\" className=\"hover:text-blue-600\">
              워크플로우
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}" > src/components/layout/RootLayout.tsx
```

---

## 빌드 및 배포

### 프로덕션 빌드
```bash
pnpm build
```

빌드 결과는 `dist/` 디렉토리에 생성됩니다.

### 프로덕션 미리보기
```bash
pnpm preview
```

### Docker 배포 (선택사항)
```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages ./packages

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/frontend ./apps/frontend

# Build
RUN pnpm --filter @sams/frontend build

# Production
FROM nginx:alpine
COPY --from=0 /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 문제 해결

### Port 3000이 이미 사용 중
```bash
# vite.config.ts에서 포트 변경
export default defineConfig({
  server: {
    port: 3001,
  },
});
```

### API 연결 안됨
```bash
# .env.development 확인
VITE_API_URL=http://localhost:8000

# 백엔드가 실행 중인지 확인
curl http://localhost:8000/api/v1/health
```

### shadcn/ui 컴포넌트 스타일 깨짐
```bash
# globals.css가 main.tsx에서 import되었는지 확인
# tailwind.config.js의 content 경로 확인
```

### TypeScript 에러
```bash
# 타입 확인
pnpm typecheck

# api-client 재생성
pnpm --filter @sams/api-client generate
```

---

## 다음 단계

1. QR코드 생성/스캔 기능 구현
2. 대시보드 차트 추가
3. 체크인/아웃 워크플로우 구현
4. 권한 관리 및 인증
5. 테스트 작성

---

## 유용한 명령어

```bash
# 타입 체크
pnpm typecheck

# 린트
pnpm lint

# 포맷
pnpm format

# 빌드
pnpm build

# 전체 클린
pnpm clean
```

---

## 참고 자료

- [shadcn/ui 문서](https://ui.shadcn.com/)
- [TanStack Query 문서](https://tanstack.com/query/latest)
- [React Hook Form 문서](https://react-hook-form.com/)
- [Zod 문서](https://zod.dev/)
- [Vite 문서](https://vitejs.dev/)

---

**설치 완료 후**: http://localhost:3000 에서 앱을 확인하세요!
