/**
 * API Client Configuration
 *
 * Centralized API client using @ams/api-client package.
 * Handles authentication, error handling, and request/response interceptors.
 * Supports automatic token refresh on 401 errors.
 *
 * @example
 * ```typescript
 * import { api } from '@/lib/api';
 *
 * // Make authenticated API calls
 * const assets = await api.get('/api/v1/assets');
 * ```
 */

import {
  apiFetch,
  setApiConfig,
  setAuthToken as setApiAuthToken,
  getApiConfig,
} from '@ams/api-client';
import { authStorage, type TokenResponse } from './auth-storage';
import { toast } from 'sonner';

/**
 * Flag to prevent infinite token refresh loop
 */
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Subscribe to token refresh completion
 */
function subscribeTokenRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

/**
 * Notify all subscribers when token is refreshed
 */
function onTokenRefreshed(token: string): void {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
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
  const token = authStorage.getAccessToken();
  if (token) {
    setApiAuthToken(token);
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const config = getApiConfig();
    const response = await fetch(`${config.baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data: TokenResponse = await response.json();

    // Store new tokens
    authStorage.setTokens(data);
    setApiAuthToken(data.access_token);

    return data.access_token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear invalid tokens
    authStorage.clearTokens();
    setApiAuthToken(null);
    return null;
  }
}

/**
 * API Error class
 */
export class ApiError extends Error {
  public status?: number;
  public data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Enhanced API fetch with error handling and automatic token refresh
 */
async function fetchWithErrorHandling<TResponse>(
  path: string,
  options?: RequestInit
): Promise<TResponse> {
  try {
    return await apiFetch<TResponse>(path, options);
  } catch (error) {
    // Handle 401 Unauthorized - try token refresh
    if (error instanceof Response && error.status === 401) {
      // Don't try to refresh if this is already a refresh request or login request
      if (path.includes('/auth/refresh') || path.includes('/auth/login')) {
        authStorage.clearTokens();
        setApiAuthToken(null);
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        throw new ApiError('Unauthorized. Please login again.', 401);
      }

      // Try to refresh token
      if (!isRefreshing) {
        isRefreshing = true;

        const newToken = await refreshAccessToken();

        if (newToken) {
          isRefreshing = false;
          onTokenRefreshed(newToken);

          // Retry original request with new token
          return await apiFetch<TResponse>(path, options);
        } else {
          // Refresh failed, redirect to login
          isRefreshing = false;
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          throw new ApiError('Session expired. Please login again.', 401);
        }
      } else {
        // Wait for token refresh to complete
        return new Promise<TResponse>((resolve, reject) => {
          subscribeTokenRefresh(async () => {
            try {
              const result = await apiFetch<TResponse>(path, options);
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
          });
        });
      }
    }

    // Handle 403 Forbidden
    if (error instanceof Response && error.status === 403) {
      const apiError = new ApiError('Forbidden. You do not have permission.', 403);
      toast.error('Access Denied', {
        description: 'You do not have permission to perform this action.',
      });
      throw apiError;
    }

    // Handle 404 Not Found
    if (error instanceof Response && error.status === 404) {
      const apiError = new ApiError('Resource not found', 404);
      throw apiError;
    }

    // Handle 500+ Server Errors
    if (error instanceof Response && error.status >= 500) {
      const apiError = new ApiError('Server error. Please try again later.', error.status);
      toast.error('Server Error', {
        description: 'Something went wrong on our end. Please try again later.',
      });
      throw apiError;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const apiError = new ApiError('Network error. Please check your connection.');
      toast.error('Connection Error', {
        description: 'Unable to connect to the server. Please check your internet connection.',
      });
      throw apiError;
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
  async get<TResponse>(
    path: string,
    params?: Record<string, string | number | boolean>
  ): Promise<TResponse> {
    let url = path;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url = `${path}?${searchParams.toString()}`;
    }
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

    const token = authStorage.getAccessToken();
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
  return authStorage.isAuthenticated();
}

/**
 * Get current API configuration
 */
export { getApiConfig };

/**
 * Re-export auth storage for convenience
 */
export { authStorage };

// Initialize on module load
initializeApiClient();
