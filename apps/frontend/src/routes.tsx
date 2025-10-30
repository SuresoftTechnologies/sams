import { createBrowserRouter } from 'react-router';
import Root from './root';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssetList from './pages/AssetList';
import AssetDetail from './pages/AssetDetail';
import AssetForm from './pages/AssetForm';
import Profile from './pages/Profile';

/**
 * React Router v7 Configuration
 *
 * Route Structure:
 * - / (Root layout with QueryClient and global providers)
 *   - /login - Authentication page
 *   - /dashboard - Main dashboard (redirects from /)
 *   - /assets - Asset list with search/filter
 *   - /assets/new - Create new asset form
 *   - /assets/:id - Asset detail view
 *   - /assets/:id/edit - Edit asset form (uses AssetForm component)
 *   - /profile - User profile and settings
 *   - * (404 Not Found)
 *
 * Note: Protected routes will be added in Phase 9
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        // Redirect to dashboard by default
        element: <Dashboard />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'assets',
        children: [
          {
            index: true,
            element: <AssetList />,
          },
          {
            path: 'new',
            element: <AssetForm />,
          },
          {
            path: ':id',
            element: <AssetDetail />,
          },
          {
            path: ':id/edit',
            element: <AssetForm />,
          },
        ],
      },
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
  {
    // Catch-all route for 404
    path: '*',
    element: <NotFound />,
  },
]);
