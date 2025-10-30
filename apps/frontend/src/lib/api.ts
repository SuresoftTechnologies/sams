/**
 * API Client Configuration
 *
 * Centralized API client using @sams/api-client package.
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
  apiClient,
  getApiClient,
  type ApiError as ApiClientError,
} from '@sams/api-client';
import { authStorage } from './auth-storage';
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
  // Restore token from localStorage
  const token = authStorage.getAccessToken();
  if (token) {
    apiClient.setAuthToken(token);
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
    const data = await apiClient.auth.refresh(refreshToken);

    // Store new tokens
    authStorage.setTokens(data);
    apiClient.setAuthToken(data.access_token);

    return data.access_token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear invalid tokens
    authStorage.clearTokens();
    apiClient.setAuthToken(null);
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
 * Handle API errors with retry logic for token refresh
 */
async function handleApiError<T>(error: unknown, retryCallback?: () => Promise<T>): Promise<T> {
  // Check if it's an API error with status
  const apiError = error as ApiClientError;

  // Handle 401 Unauthorized - try token refresh
  if (apiError?.status === 401) {
    // Don't try to refresh if we're already refreshing
    if (!isRefreshing) {
      isRefreshing = true;

      const newToken = await refreshAccessToken();

      if (newToken) {
        isRefreshing = false;
        onTokenRefreshed(newToken);

        // Retry original request if callback provided
        if (retryCallback) {
          return retryCallback();
        }
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
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async () => {
          try {
            if (retryCallback) {
              const result = await retryCallback();
              resolve(result);
            } else {
              reject(new ApiError('No retry callback provided', 401));
            }
          } catch (retryError) {
            reject(retryError);
          }
        });
      });
    }
  }

  // Handle 403 Forbidden
  if (apiError?.status === 403) {
    toast.error('Access Denied', {
      description: 'You do not have permission to perform this action.',
    });
    throw new ApiError('Forbidden. You do not have permission.', 403);
  }

  // Handle 404 Not Found
  if (apiError?.status === 404) {
    throw new ApiError('Resource not found', 404);
  }

  // Handle 500+ Server Errors
  if (apiError?.status && apiError.status >= 500) {
    toast.error('Server Error', {
      description: 'Something went wrong on our end. Please try again later.',
    });
    throw new ApiError('Server error. Please try again later.', apiError.status);
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    toast.error('Connection Error', {
      description: 'Unable to connect to the server. Please check your internet connection.',
    });
    throw new ApiError('Network error. Please check your connection.');
  }

  // Handle other errors
  if (error instanceof Error) {
    throw new ApiError(error.message);
  }

  throw new ApiError('An unexpected error occurred');
}

/**
 * API client wrapper with error handling
 */
export const api = {
  /**
   * Authentication methods
   */
  auth: {
    async login(credentials: { email: string; password: string }) {
      try {
        const response = await apiClient.auth.login(credentials);
        // Store tokens
        authStorage.setTokens(response);
        apiClient.setAuthToken(response.access_token);
        return response;
      } catch (error) {
        return handleApiError(error);
      }
    },

    async me() {
      try {
        return await apiClient.auth.me();
      } catch (error) {
        return handleApiError(error, () => apiClient.auth.me());
      }
    },

    async logout() {
      try {
        await apiClient.auth.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        authStorage.clearTokens();
        apiClient.setAuthToken(null);
      }
    },
  },

  /**
   * Asset methods
   */
  assets: {
    async list(params?: Parameters<typeof apiClient.assets.list>[0]) {
      try {
        return await apiClient.assets.list(params);
      } catch (error) {
        return handleApiError(error, () => apiClient.assets.list(params));
      }
    },

    async get(id: string) {
      try {
        return await apiClient.assets.get(id);
      } catch (error) {
        return handleApiError(error, () => apiClient.assets.get(id));
      }
    },

    async create(data: Parameters<typeof apiClient.assets.create>[0]) {
      try {
        return await apiClient.assets.create(data);
      } catch (error) {
        return handleApiError(error, () => apiClient.assets.create(data));
      }
    },

    async update(id: string, data: Parameters<typeof apiClient.assets.update>[1]) {
      try {
        return await apiClient.assets.update(id, data);
      } catch (error) {
        return handleApiError(error, () => apiClient.assets.update(id, data));
      }
    },

    async delete(id: string) {
      try {
        return await apiClient.assets.delete(id);
      } catch (error) {
        return handleApiError(error, () => apiClient.assets.delete(id));
      }
    },

    async changeStatus(id: string, status: Parameters<typeof apiClient.assets.changeStatus>[1], reason?: string) {
      try {
        return await apiClient.assets.changeStatus(id, status, reason);
      } catch (error) {
        return handleApiError(error, () => apiClient.assets.changeStatus(id, status, reason));
      }
    },

    async history(id: string, params?: Parameters<typeof apiClient.assets.history>[1]) {
      try {
        return await apiClient.assets.history(id, params);
      } catch (error) {
        return handleApiError(error, () => apiClient.assets.history(id, params));
      }
    },
  },

  /**
   * Category methods
   */
  categories: {
    async list() {
      try {
        return await apiClient.categories.list();
      } catch (error) {
        return handleApiError(error, () => apiClient.categories.list());
      }
    },
  },

  /**
   * Location methods
   */
  locations: {
    async list() {
      try {
        return await apiClient.locations.list();
      } catch (error) {
        return handleApiError(error, () => apiClient.locations.list());
      }
    },
  },

  /**
   * User methods
   */
  users: {
    async list(params?: Parameters<typeof apiClient.users.list>[0]) {
      try {
        return await apiClient.users.list(params);
      } catch (error) {
        return handleApiError(error, () => apiClient.users.list(params));
      }
    },
  },

  /**
   * Statistics methods
   */
  statistics: {
    async dashboard() {
      try {
        return await apiClient.statistics.dashboard();
      } catch (error) {
        return handleApiError(error, () => apiClient.statistics.dashboard());
      }
    },
  },
};

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return authStorage.isAuthenticated();
}

/**
 * Re-export auth storage for convenience
 */
export { authStorage };

/**
 * Export API client for direct use if needed
 */
export { apiClient, getApiClient };

// Initialize on module load
initializeApiClient();
