import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import type { LoginFormData } from '@/lib/validators';

/**
 * Authentication Hooks
 *
 * Custom hooks for auth operations using TanStack Query
 * - useLogin: Login mutation
 * - useLogout: Logout mutation
 * - useCurrentUser: Get current user query
 *
 * TODO Phase 9: Connect to actual API endpoints
 */

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

// Mock login API call
const loginApi = async (credentials: LoginFormData): Promise<LoginResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock validation
  if (credentials.email === 'demo@suresoft.com' && credentials.password === 'demo123') {
    return {
      user: {
        id: '1',
        name: 'Demo User',
        email: credentials.email,
        role: 'admin',
      },
      token: 'mock-jwt-token-12345',
    };
  }

  throw new Error('Invalid credentials');
};

// Mock logout API call
const logoutApi = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  // Clear token from storage
  localStorage.removeItem('auth_token');
};

// Mock get current user API call
const getCurrentUserApi = async (): Promise<User | null> => {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    id: '1',
    name: 'Demo User',
    email: 'demo@suresoft.com',
    role: 'admin',
  };
};

/**
 * Login mutation hook
 */
export function useLogin() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      // Store token
      localStorage.setItem('auth_token', data.token);

      // Show success message
      toast.success('Login successful', {
        description: `Welcome back, ${data.user.name}!`,
      });

      // Navigate to dashboard
      navigate('/dashboard');
    },
    onError: (error: Error) => {
      toast.error('Login failed', {
        description: error.message || 'Please check your credentials and try again.',
      });
    },
  });
}

/**
 * Logout mutation hook
 */
export function useLogout() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      toast.success('Logged out successfully');
      navigate('/login');
    },
    onError: (error: Error) => {
      toast.error('Logout failed', {
        description: error.message,
      });
    },
  });
}

/**
 * Get current user query hook
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUserApi,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}
