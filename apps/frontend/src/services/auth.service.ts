/**
 * Authentication Service
 *
 * Handles login, registration, logout, and token management.
 */

import { api, storeTokens, clearTokens } from '@/lib/api';
import type { LoginRequest, RegisterRequest, TokenResponse, User } from '@/types/api';

export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/api/v1/auth/login', credentials);

    // Store tokens
    if (response.access_token && response.refresh_token) {
      storeTokens(response.access_token, response.refresh_token);
    }

    return response;
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/api/v1/auth/register', data);

    // Store tokens
    if (response.access_token && response.refresh_token) {
      storeTokens(response.access_token, response.refresh_token);
    }

    return response;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await api.post<void>('/api/v1/auth/logout');
    } finally {
      // Clear tokens even if API call fails
      clearTokens();
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    });

    // Update stored tokens
    if (response.access_token && response.refresh_token) {
      storeTokens(response.access_token, response.refresh_token);
    }

    return response;
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    return api.get<User>('/api/v1/users/me');
  },
};
