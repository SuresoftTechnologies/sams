/**
 * Protected Route Component
 *
 * Wraps routes that require authentication.
 * Redirects to login page if user is not authenticated.
 * Shows loading state while checking authentication.
 *
 * @example
 * ```tsx
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * ```
 */

import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '@/stores/auth-store';
import { useCurrentUser } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Optional roles required to access this route
   * If provided, user must have one of these roles
   */
  requiredRoles?: Array<'admin' | 'manager' | 'employee'>;
}

/**
 * Protected Route Component
 * Checks authentication and optionally role-based access
 */
export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  // Fetch current user if authenticated but user data not loaded
  const { isLoading, error } = useCurrentUser();

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Loading user data
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Failed to load user - redirect to login
  if (error || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user.role);

    if (!hasRequiredRole) {
      // User doesn't have required role - show forbidden page or redirect
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-zinc-900">403</h1>
            <p className="mt-2 text-lg text-zinc-600">Access Denied</p>
            <p className="mt-1 text-sm text-zinc-500">
              You don't have permission to access this page.
            </p>
            <p className="mt-4">
              <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
                Go back to Dashboard
              </a>
            </p>
          </div>
        </div>
      );
    }
  }

  // All checks passed - render children
  return <>{children}</>;
}

/**
 * Admin-only route wrapper
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute requiredRoles={['admin']}>{children}</ProtectedRoute>;
}

/**
 * Manager or Admin route wrapper
 */
export function ManagerRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute requiredRoles={['admin', 'manager']}>{children}</ProtectedRoute>;
}
