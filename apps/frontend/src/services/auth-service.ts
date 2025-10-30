/**
 * Authentication Service
 *
 * Service layer for authentication-related API calls.
 * Handles login, logout, token refresh, and user profile operations.
 */

import { api } from '@/lib/api';
import type { TokenResponse } from '@/lib/auth-storage';
import type { User } from '@/stores/auth-store';

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response (includes tokens and user data)
 */
export interface LoginResponse extends TokenResponse {
  user: User;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refresh_token: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

/**
 * Authentication Service
 */
export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/api/v1/auth/login', credentials);
    return response;
  },

  /**
   * Logout (invalidate refresh token on server)
   */
  async logout(): Promise<void> {
    try {
      await api.post<void>('/api/v1/auth/logout');
    } catch (error) {
      // Ignore errors on logout - clear local tokens anyway
      console.error('Logout API error:', error);
    }
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response;
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/v1/auth/me');
    return response;
  },

  /**
   * Change password for current user
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await api.put<void>('/api/v1/auth/change-password', data);
  },

  /**
   * Register new user (if registration is enabled)
   */
  async register(userData: {
    email: string;
    password: string;
    full_name: string;
  }): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/api/v1/auth/register', userData);
    return response;
  },
};
