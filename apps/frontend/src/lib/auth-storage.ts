/**
 * Authentication Token Storage
 *
 * Type-safe interface for managing JWT tokens in localStorage.
 * Handles access tokens (15min expiry) and refresh tokens (7 days expiry).
 *
 * @example
 * ```typescript
 * import { authStorage } from '@/lib/auth-storage';
 *
 * // Store tokens after login
 * authStorage.setTokens({
 *   access_token: 'jwt-token',
 *   refresh_token: 'refresh-token',
 *   token_type: 'Bearer'
 * });
 *
 * // Get access token
 * const token = authStorage.getAccessToken();
 *
 * // Check if authenticated
 * if (authStorage.isAuthenticated()) {
 *   // User is logged in
 * }
 *
 * // Clear tokens on logout
 * authStorage.clearTokens();
 * ```
 */

/**
 * Token response from backend API
 */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string; // 'Bearer'
}

/**
 * Storage keys for tokens
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ams_access_token',
  REFRESH_TOKEN: 'ams_refresh_token',
  TOKEN_TYPE: 'ams_token_type',
} as const;

/**
 * Auth Storage Service
 */
export const authStorage = {
  /**
   * Get access token from localStorage
   */
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  },

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  },

  /**
   * Get token type from localStorage
   */
  getTokenType(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN_TYPE) || 'Bearer';
    } catch (error) {
      console.error('Failed to get token type:', error);
      return 'Bearer';
    }
  },

  /**
   * Store authentication tokens
   */
  setTokens(tokens: TokenResponse): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
      localStorage.setItem(STORAGE_KEYS.TOKEN_TYPE, tokens.token_type);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  },

  /**
   * Store only access token (used after token refresh)
   */
  setAccessToken(accessToken: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    } catch (error) {
      console.error('Failed to store access token:', error);
      throw new Error('Failed to store access token');
    }
  },

  /**
   * Clear all authentication tokens
   */
  clearTokens(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_TYPE);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  },

  /**
   * Check if user is authenticated (has valid access token)
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token;
  },

  /**
   * Get full authorization header value
   * @returns Authorization header value like "Bearer <token>"
   */
  getAuthorizationHeader(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;

    const tokenType = this.getTokenType();
    return `${tokenType} ${token}`;
  },

  /**
   * Check if refresh token exists
   */
  hasRefreshToken(): boolean {
    const refreshToken = this.getRefreshToken();
    return !!refreshToken;
  },
};

/**
 * Type guard for token response
 */
export function isTokenResponse(data: unknown): data is TokenResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'access_token' in data &&
    'refresh_token' in data &&
    'token_type' in data &&
    typeof (data as TokenResponse).access_token === 'string' &&
    typeof (data as TokenResponse).refresh_token === 'string' &&
    typeof (data as TokenResponse).token_type === 'string'
  );
}
