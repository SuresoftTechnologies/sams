/**
 * Authentication Store (Zustand)
 *
 * Global state management for authentication.
 * Manages user state, login/logout actions, and token synchronization.
 *
 * @example
 * ```typescript
 * import { useAuthStore } from '@/stores/auth-store';
 *
 * function MyComponent() {
 *   const { user, isAuthenticated, setUser, logout } = useAuthStore();
 *
 *   if (!isAuthenticated) {
 *     return <div>Please login</div>;
 *   }
 *
 *   return <div>Welcome, {user?.name}</div>;
 * }
 * ```
 */

import { create } from 'zustand';
import { authStorage, type TokenResponse } from '@/lib/auth-storage';

/**
 * User data structure (from backend /auth/me endpoint)
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  department?: string | null;
  employee_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Auth store state
 */
interface AuthState {
  // Current user data
  user: User | null;

  // Authentication status
  isAuthenticated: boolean;

  // Loading state (for async operations)
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  login: (tokens: TokenResponse, user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

/**
 * Auth store hook
 */
export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: authStorage.isAuthenticated(),
  isLoading: false,

  /**
   * Set current user data
   */
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  /**
   * Set loading state
   */
  setLoading: (isLoading) =>
    set({
      isLoading,
    }),

  /**
   * Login action
   * Stores tokens and user data
   */
  login: (tokens, user) => {
    try {
      console.log('[Auth Store] Login called with user:', user);
      console.log('[Auth Store] User role:', user.role);
      console.log('[Auth Store] User name:', user.name);

      // Store tokens in localStorage
      authStorage.setTokens(tokens);

      // Update state
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      console.log('[Auth Store] Login successful, state updated');
    } catch (error) {
      console.error('[Auth Store] Login failed:', error);
      throw error;
    }
  },

  /**
   * Logout action
   * Clears tokens and user data
   */
  logout: () => {
    // Clear tokens from localStorage
    authStorage.clearTokens();

    // Reset state
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  /**
   * Update user data (e.g., after profile update)
   */
  updateUser: (userData) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    })),
}));

/**
 * Selector hooks for convenience
 */
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
