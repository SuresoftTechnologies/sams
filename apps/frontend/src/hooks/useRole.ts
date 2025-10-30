/**
 * Role Management Hooks
 *
 * Custom hooks for role-based access control.
 * Provides utilities to check user roles and permissions.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAdmin, isManager, hasRole } = useRole();
 *
 *   if (isAdmin) {
 *     return <AdminPanel />;
 *   }
 *
 *   if (hasRole('manager', 'admin')) {
 *     return <ManagerPanel />;
 *   }
 *
 *   return <EmployeePanel />;
 * }
 * ```
 */

import { useAuthStore, type User } from '@/stores/auth-store';

type UserRole = User['role'];

/**
 * Role management hook
 */
export function useRole() {
  const user = useAuthStore((state) => state.user);

  /**
   * Check if user has any of the specified roles
   */
  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  /**
   * Check if user is admin
   */
  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  /**
   * Check if user is manager
   */
  const isManager = (): boolean => {
    return user?.role === 'manager';
  };

  /**
   * Check if user is employee
   */
  const isEmployee = (): boolean => {
    return user?.role === 'employee';
  };

  /**
   * Check if user is admin or manager
   */
  const isManagerOrAbove = (): boolean => {
    return hasRole('admin', 'manager');
  };

  /**
   * Get current user role
   */
  const role = user?.role || null;

  return {
    role,
    hasRole,
    isAdmin,
    isManager,
    isEmployee,
    isManagerOrAbove,
  };
}

/**
 * Hook to check if user has specific role (returns boolean)
 * Useful for conditional rendering
 */
export function useHasRole(...roles: UserRole[]): boolean {
  const user = useAuthStore((state) => state.user);
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin(): boolean {
  const user = useAuthStore((state) => state.user);
  return user?.role === 'admin';
}

/**
 * Hook to check if user is manager
 */
export function useIsManager(): boolean {
  const user = useAuthStore((state) => state.user);
  return user?.role === 'manager';
}

/**
 * Hook to check if user is admin or manager
 */
export function useIsManagerOrAbove(): boolean {
  const user = useAuthStore((state) => state.user);
  return user?.role === 'admin' || user?.role === 'manager';
}

/**
 * Get current user role
 */
export function useCurrentRole(): UserRole | null {
  const user = useAuthStore((state) => state.user);
  return user?.role || null;
}
