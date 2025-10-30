import { createBrowserRouter, Navigate } from 'react-router';
import Root from './root';
import NotFound from './pages/NotFound';
import ErrorPage from './pages/ErrorPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssetList from './pages/AssetList';
import AssetDetail from './pages/AssetDetail';
import AssetForm from './pages/AssetForm';
import Profile from './pages/Profile';
import RequestsPage from './pages/RequestsPage';
import RequestDetailPage from './pages/RequestDetailPage';
import RequestFormPage from './pages/RequestFormPage';
import WorkflowApprovalsPage from './pages/WorkflowApprovalsPage';
import { ProtectedRoute, ManagerRoute } from './components/layout/ProtectedRoute';

/**
 * React Router v7 Configuration
 *
 * Route Structure:
 * - / (Root layout with QueryClient and global providers)
 *   - /login - Authentication page (public)
 *   - / - Redirect to /dashboard
 *   - /dashboard - Main dashboard (protected)
 *   - /assets - Asset list (protected)
 *   - /assets/new - Create new asset (protected - manager/admin)
 *   - /assets/:id - Asset detail (protected)
 *   - /assets/:id/edit - Edit asset (protected - manager/admin)
 *   - /profile - User profile (protected)
 *   - * (404 Not Found)
 *
 * Protected Routes:
 * - All routes except /login require authentication
 * - Asset creation/editing requires manager or admin role
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        // Redirect to dashboard by default
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'assets',
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <AssetList />
              </ProtectedRoute>
            ),
          },
          {
            path: 'new',
            element: (
              <ManagerRoute>
                <AssetForm />
              </ManagerRoute>
            ),
          },
          {
            path: ':id',
            element: (
              <ProtectedRoute>
                <AssetDetail />
              </ProtectedRoute>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <ManagerRoute>
                <AssetForm />
              </ManagerRoute>
            ),
          },
        ],
      },
      {
        path: 'requests',
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <RequestsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'new',
            element: (
              <ProtectedRoute>
                <RequestFormPage />
              </ProtectedRoute>
            ),
          },
          {
            path: ':id',
            element: (
              <ProtectedRoute>
                <RequestDetailPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: 'workflows',
        element: (
          <ManagerRoute>
            <WorkflowApprovalsPage />
          </ManagerRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    // Catch-all route for 404
    path: '*',
    element: <NotFound />,
  },
]);
