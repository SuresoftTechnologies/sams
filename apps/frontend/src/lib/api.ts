/**
 * API Client Configuration
 *
 * Centralized API client using @ams/api-client package.
 * Handles authentication, error handling, and request/response interceptors.
 *
 * @example
 * ```typescript
 * import { api, setAuthToken } from '@/lib/api';
 *
 * // Set token after login
 * setAuthToken(token);
 *
 * // Make API calls
 * const assets = await api.get('/api/v1/assets');
 * ```
 */

import {
  apiFetch,
  setApiConfig,
  setAuthToken as setApiAuthToken,
  getApiConfig,
} from '@ams/api-client';

/**
 * Token storage keys
 */
const TOKEN_KEY = 'ams_access_token';
const REFRESH_TOKEN_KEY = 'ams_refresh_token';

/**
 * Get stored access token
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored refresh token
 */
export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Store authentication tokens
 */
export function storeTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  setApiAuthToken(accessToken);
}

/**
 * Clear authentication tokens
 */
export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  setApiAuthToken(null);
}

/**
 * Set authorization token
 */
export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    setApiAuthToken(token);
  } else {
    clearTokens();
  }
}

/**
 * Initialize API client with stored token
 */
export function initializeApiClient(): void {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  setApiConfig({
    baseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Restore token from localStorage
  const token = getStoredToken();
  if (token) {
    setApiAuthToken(token);
  }
}

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Enhanced API fetch with error handling
 */
async function fetchWithErrorHandling<TResponse>(
  path: string,
  options?: RequestInit
): Promise<TResponse> {
  try {
    return await apiFetch<TResponse>(path, options);
  } catch (error) {
    // Handle 401 Unauthorized - redirect to login
    if (error instanceof Response && error.status === 401) {
      clearTokens();
      // Redirect to login page
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new ApiError('Unauthorized. Please login again.', 401);
    }

    // Handle 403 Forbidden
    if (error instanceof Response && error.status === 403) {
      throw new ApiError('Forbidden. You do not have permission.', 403);
    }

    // Handle other errors
    if (error instanceof Error) {
      throw new ApiError(error.message);
    }

    throw new ApiError('An unexpected error occurred');
  }
}

/**
 * API client interface
 */
export const api = {
  /**
   * GET request
   */
  async get<TResponse>(path: string, params?: Record<string, string | number | boolean>): Promise<TResponse> {
    const url = params ? `${path}?${new URLSearchParams(params).toString()}` : path;
    return fetchWithErrorHandling<TResponse>(url, {
      method: 'GET',
    });
  },

  /**
   * POST request
   */
  async post<TResponse, TBody = unknown>(path: string, body?: TBody): Promise<TResponse> {
    return fetchWithErrorHandling<TResponse>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  /**
   * PUT request
   */
  async put<TResponse, TBody = unknown>(path: string, body?: TBody): Promise<TResponse> {
    return fetchWithErrorHandling<TResponse>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  /**
   * PATCH request
   */
  async patch<TResponse, TBody = unknown>(path: string, body?: TBody): Promise<TResponse> {
    return fetchWithErrorHandling<TResponse>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  /**
   * DELETE request
   */
  async delete<TResponse>(path: string): Promise<TResponse> {
    return fetchWithErrorHandling<TResponse>(path, {
      method: 'DELETE',
    });
  },

  /**
   * Upload file with multipart/form-data
   */
  async upload<TResponse>(path: string, formData: FormData): Promise<TResponse> {
    const config = getApiConfig();
    const url = `${config.baseUrl}${path}`;

    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          detail: response.statusText,
        }));
        throw new ApiError(error.detail || 'Upload failed', response.status, error);
      }

      return response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ApiError(error.message);
      }
      throw new ApiError('Upload failed');
    }
  },
};

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

/**
 * Get current API configuration
 */
export { getApiConfig };

// Initialize on module load
initializeApiClient();
