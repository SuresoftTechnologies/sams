// src/routes.tsx
import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { RootLayout } from './components/layout/RootLayout';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AssetList = lazy(() => import('./pages/AssetList'));
const AssetDetail = lazy(() => import('./pages/AssetDetail'));
const CheckIn = lazy(() => import('./pages/CheckIn'));
const CheckOut = lazy(() => import('./pages/CheckOut'));
const WorkflowList = lazy(() => import('./pages/WorkflowList'));

// Loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-lg">로딩 중...</div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'assets',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AssetList />
          </Suspense>
        ),
      },
      {
        path: 'assets/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AssetDetail />
          </Suspense>
        ),
      },
      {
        path: 'checkin',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CheckIn />
          </Suspense>
        ),
      },
      {
        path: 'checkout',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CheckOut />
          </Suspense>
        ),
      },
      {
        path: 'workflows',
        element: (
          <Suspense fallback={<PageLoader />}>
            <WorkflowList />
          </Suspense>
        ),
      },
    ],
  },
]);
