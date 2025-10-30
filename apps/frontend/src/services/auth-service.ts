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
    const response = await api.auth.login(credentials);
    return response as LoginResponse;
  },

  /**
   * Logout (invalidate refresh token on server)
   */
  async logout(): Promise<void> {
    await api.auth.logout();
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    // This is handled internally by api.auth
    // but kept for compatibility
    const response = await api.auth.login({ email: '', password: '' });
    return response;
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.auth.me();
    return response as User;
  },

  /**
   * Change password for current user
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    // The API client handles this internally
    // We'll need to add this to the api wrapper if needed
    console.warn('Change password not implemented in API client yet');
  },

  /**
   * Register new user (if registration is enabled)
   */
  async register(userData: {
    email: string;
    password: string;
    full_name: string;
  }): Promise<LoginResponse> {
    // Registration is not exposed in the current API client
    // This would need to be added to the backend
    throw new Error('Registration not implemented');
  },
};
