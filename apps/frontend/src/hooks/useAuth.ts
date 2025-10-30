import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { authService, type LoginRequest } from '@/services/auth-service';
import { useAuthStore, type User } from '@/stores/auth-store';

/**
 * Authentication Hooks
 *
 * Custom hooks for auth operations using TanStack Query
 * - useLogin: Login mutation with token storage and state management
 * - useLogout: Logout mutation with cleanup
 * - useCurrentUser: Get current user query with caching
 */

/**
 * Login mutation hook
 * Handles authentication, token storage, and user state management
 */
export function useLogin() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {
      // Store tokens and user in auth store
      login(
        {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_type: data.token_type,
        },
        data.user
      );

      // Cache user data in react-query
      queryClient.setQueryData(['currentUser'], data.user);

      // Show success message
      toast.success('로그인 성공', {
        description: `${data.user.full_name}님, 다시 오신 것을 환영합니다!`,
      });

      // Navigate to dashboard
      navigate('/dashboard');
    },
    onError: (error: Error) => {
      toast.error('로그인 실패', {
        description: error.message || '인증 정보를 확인하고 다시 시도해주세요.',
      });
    },
  });
}

/**
 * Logout mutation hook
 * Clears tokens, user state, and cache
 */
export function useLogout() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear auth store
      logout();

      // Clear all cached queries
      queryClient.clear();

      // Show success message
      toast.success('로그아웃 성공');

      // Navigate to login page
      navigate('/login');
    },
    onError: (error: Error) => {
      // Even if server logout fails, clear local state
      logout();
      queryClient.clear();

      toast.error('로그아웃 완료 (오류 발생)', {
        description: error.message,
      });

      navigate('/login');
    },
  });
}

/**
 * Get current user query hook
 * Fetches user profile from /auth/me endpoint
 */
export function useCurrentUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await authService.getCurrentUser();
      // Sync with auth store
      setUser(user);
      return user;
    },
    enabled: isAuthenticated, // Only fetch if authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

/**
 * Check if user has specific role
 */
export function useHasRole(...roles: User['role'][]): boolean {
  const user = useAuthStore((state) => state.user);
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Get current user from store (no API call)
 */
export function useUser(): User | null {
  return useAuthStore((state) => state.user);
}
