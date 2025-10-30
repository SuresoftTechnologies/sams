/**
 * Role Guard Component
 *
 * Conditionally renders children based on user role.
 * Useful for showing/hiding UI elements based on permissions.
 *
 * @example
 * ```tsx
 * // Show only for admins
 * <RoleGuard allowedRoles={['admin']}>
 *   <AdminButton />
 * </RoleGuard>
 *
 * // Show for admins and managers
 * <RoleGuard allowedRoles={['admin', 'manager']}>
 *   <ManagerPanel />
 * </RoleGuard>
 *
 * // Show fallback for unauthorized users
 * <RoleGuard allowedRoles={['admin']} fallback={<div>Access Denied</div>}>
 *   <AdminPanel />
 * </RoleGuard>
 * ```
 */

import type { ReactNode } from 'react';
import { useHasRole } from '@/hooks/useRole';
import type { User } from '@/stores/auth-store';

type UserRole = User['role'];

interface RoleGuardProps {
  /**
   * Roles that are allowed to see the children
   */
  allowedRoles: UserRole[];

  /**
   * Content to render
   */
  children: ReactNode;

  /**
   * Optional fallback content to show when user doesn't have required role
   */
  fallback?: ReactNode;
}

/**
 * RoleGuard Component
 * Renders children only if user has one of the allowed roles
 */
export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const hasRole = useHasRole(...allowedRoles);

  if (!hasRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * AdminOnly Component
 * Shorthand for admin-only content
 */
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * ManagerOrAbove Component
 * Shorthand for manager and admin content
 */
export function ManagerOrAbove({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin', 'manager']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * EmployeeOnly Component
 * Shorthand for employee-only content
 */
export function EmployeeOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['employee']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}
