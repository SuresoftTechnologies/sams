/**
 * API Client - Type-safe API functions for SAMS
 */

import type {
  Asset,
  CreateAssetDto,
  UpdateAssetDto,
  User,
  LoginDto,
  LoginResponse,
  Category,
  Location,
  AssetStatus,
  AssetGrade,
} from '@sams/shared-types';

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * API Error response
 */
export interface ApiError {
  detail: string;
  status?: number;
}

/**
 * API Client configuration
 */
export class ApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(baseUrl = 'http://localhost:8000', token?: string) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      this.setAuthToken(token);
    }
  }

  /**
   * Set authorization token
   */
  setAuthToken(token: string | null) {
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.headers['Authorization'];
    }
  }

  /**
   * Make API request
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: response.statusText,
      }));
      throw {
        detail: error.detail || 'API request failed',
        status: response.status,
      } as ApiError;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  /**
   * Authentication endpoints
   */
  auth = {
    /**
     * Login user
     */
    login: (credentials: LoginDto): Promise<LoginResponse> => {
      return this.request<LoginResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    /**
     * Get current user
     */
    me: (): Promise<User> => {
      return this.request<User>('/api/v1/auth/me');
    },

    /**
     * Logout user
     */
    logout: (): Promise<void> => {
      return this.request<void>('/api/v1/auth/logout', {
        method: 'POST',
      });
    },

    /**
     * Refresh token
     */
    refresh: (refreshToken: string): Promise<LoginResponse> => {
      return this.request<LoginResponse>('/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    },

    /**
     * Change password
     */
    changePassword: (oldPassword: string, newPassword: string): Promise<User> => {
      return this.request<User>('/api/v1/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });
    },
  };

  /**
   * Assets endpoints
   */
  assets = {
    /**
     * Get paginated assets list
     */
    list: (params?: {
      skip?: number;
      limit?: number;
      search?: string;
      status?: AssetStatus;
      category_id?: string;
      location_id?: string;
      assigned_to?: string;
      grade?: AssetGrade;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    }): Promise<PaginatedResponse<Asset>> => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
      }
      return this.request<PaginatedResponse<Asset>>(
        `/api/v1/assets?${searchParams}`
      );
    },

    /**
     * Get single asset by ID
     */
    get: (id: string): Promise<Asset> => {
      return this.request<Asset>(`/api/v1/assets/${id}`);
    },

    /**
     * Get asset by asset number (for QR code)
     */
    getByNumber: (assetNumber: string): Promise<Asset> => {
      return this.request<Asset>(`/api/v1/assets/by-number/${assetNumber}`);
    },

    /**
     * Create new asset
     */
    create: (data: CreateAssetDto): Promise<Asset> => {
      return this.request<Asset>('/api/v1/assets', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    /**
     * Update asset
     */
    update: (id: string, data: UpdateAssetDto): Promise<Asset> => {
      return this.request<Asset>(`/api/v1/assets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    /**
     * Delete asset (soft delete)
     */
    delete: (id: string): Promise<void> => {
      return this.request<void>(`/api/v1/assets/${id}`, {
        method: 'DELETE',
      });
    },

    /**
     * Change asset status
     */
    changeStatus: (
      id: string,
      status: AssetStatus,
      reason?: string
    ): Promise<Asset> => {
      const params = new URLSearchParams({ new_status: status });
      if (reason) params.append('reason', reason);
      return this.request<Asset>(`/api/v1/assets/${id}/status?${params}`, {
        method: 'PATCH',
      });
    },

    /**
     * Change asset location
     */
    changeLocation: (
      id: string,
      locationId: string,
      reason?: string
    ): Promise<Asset> => {
      const params = new URLSearchParams({ new_location_id: locationId });
      if (reason) params.append('reason', reason);
      return this.request<Asset>(`/api/v1/assets/${id}/location?${params}`, {
        method: 'PATCH',
      });
    },

    /**
     * Assign/unassign asset to user
     */
    assignUser: (
      id: string,
      userId: string | null,
      reason?: string
    ): Promise<Asset> => {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (reason) params.append('reason', reason);
      return this.request<Asset>(`/api/v1/assets/${id}/user?${params}`, {
        method: 'PATCH',
      });
    },

    /**
     * Get asset history
     */
    history: (
      id: string,
      params?: { skip?: number; limit?: number }
    ): Promise<any[]> => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
      }
      return this.request<any[]>(
        `/api/v1/assets/${id}/history?${searchParams}`
      );
    },
  };

  /**
   * Categories endpoints
   */
  categories = {
    /**
     * Get all categories
     */
    list: async (): Promise<Category[]> => {
      const response = await this.request<PaginatedResponse<Category>>('/api/v1/categories?limit=100');
      return response.items;
    },

    /**
     * Get single category
     */
    get: (id: string): Promise<Category> => {
      return this.request<Category>(`/api/v1/categories/${id}`);
    },

    /**
     * Create category
     */
    create: (data: Partial<Category>): Promise<Category> => {
      return this.request<Category>('/api/v1/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    /**
     * Update category
     */
    update: (id: string, data: Partial<Category>): Promise<Category> => {
      return this.request<Category>(`/api/v1/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    /**
     * Delete category
     */
    delete: (id: string): Promise<void> => {
      return this.request<void>(`/api/v1/categories/${id}`, {
        method: 'DELETE',
      });
    },
  };

  /**
   * Locations endpoints
   */
  locations = {
    /**
     * Get all locations
     */
    list: async (): Promise<Location[]> => {
      const response = await this.request<PaginatedResponse<Location>>('/api/v1/locations?limit=100');
      return response.items;
    },

    /**
     * Get single location
     */
    get: (id: string): Promise<Location> => {
      return this.request<Location>(`/api/v1/locations/${id}`);
    },

    /**
     * Create location
     */
    create: (data: Partial<Location>): Promise<Location> => {
      return this.request<Location>('/api/v1/locations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    /**
     * Update location
     */
    update: (id: string, data: Partial<Location>): Promise<Location> => {
      return this.request<Location>(`/api/v1/locations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    /**
     * Delete location
     */
    delete: (id: string): Promise<void> => {
      return this.request<void>(`/api/v1/locations/${id}`, {
        method: 'DELETE',
      });
    },
  };

  /**
   * Users endpoints
   */
  users = {
    /**
     * Get users list
     */
    list: (params?: {
      skip?: number;
      limit?: number;
      search?: string;
    }): Promise<PaginatedResponse<User>> => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
      }
      return this.request<PaginatedResponse<User>>(
        `/api/v1/users?${searchParams}`
      );
    },

    /**
     * Get single user
     */
    get: (id: string): Promise<User> => {
      return this.request<User>(`/api/v1/users/${id}`);
    },

    /**
     * Update user
     */
    update: (id: string, data: Partial<User>): Promise<User> => {
      return this.request<User>(`/api/v1/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  };

  /**
   * Statistics endpoints
   */
  statistics = {
    /**
     * Get dashboard overview statistics
     */
    overview: (): Promise<{
      total_assets: number;
      assets_by_status: Record<string, number>;
      pending_workflows: number;
      total_users: number;
      total_categories: number;
      total_locations: number;
    }> => {
      return this.request('/api/v1/statistics/overview');
    },

    /**
     * Get dashboard overview statistics (alias for overview)
     */
    dashboard: (): Promise<{
      total_assets: number;
      assets_by_status: Record<string, number>;
      pending_workflows: number;
      total_users: number;
      total_categories: number;
      total_locations: number;
    }> => {
      return this.request('/api/v1/statistics/overview');
    },

    /**
     * Get assets by category
     */
    assetsByCategory: (): Promise<Array<{
      category_id: string;
      category_name: string;
      category_code: string;
      asset_count: number;
    }>> => {
      return this.request('/api/v1/statistics/assets-by-category');
    },

    /**
     * Get assets by location
     */
    assetsByLocation: (): Promise<Array<{
      location_id: string;
      location_name: string;
      location_code: string;
      site: string;
      asset_count: number;
    }>> => {
      return this.request('/api/v1/statistics/assets-by-location');
    },

    /**
     * Get assets by status
     */
    assetsByStatus: (): Promise<Array<{
      status: string;
      asset_count: number;
    }>> => {
      return this.request('/api/v1/statistics/assets-by-status');
    },

    /**
     * Get assets by grade
     */
    assetsByGrade: (): Promise<Array<{
      grade: string;
      asset_count: number;
    }>> => {
      return this.request('/api/v1/statistics/assets-by-grade');
    },
  };

  /**
   * QR Code endpoints
   */
  qrcode = {
    /**
     * Generate QR code for asset
     */
    generate: (assetId: string): Promise<Blob> => {
      return fetch(`${this.baseUrl}/api/v1/qrcode/generate/${assetId}`, {
        headers: this.headers,
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to generate QR code');
        return res.blob();
      });
    },
  };
}

// Create default instance
let defaultClient: ApiClient | null = null;

/**
 * Get or create default API client instance
 */
export function getApiClient(): ApiClient {
  if (!defaultClient) {
    const baseUrl = typeof window !== 'undefined'
      ? (window as any).__VITE_API_URL__ || import.meta.env?.VITE_API_URL || 'http://localhost:8000'
      : 'http://localhost:8000';

    defaultClient = new ApiClient(baseUrl);
  }
  return defaultClient;
}

/**
 * Set default API client instance
 */
export function setApiClient(client: ApiClient): void {
  defaultClient = client;
}

// Export default client methods for convenience
export const apiClient = {
  get auth() {
    return getApiClient().auth;
  },
  get assets() {
    return getApiClient().assets;
  },
  get categories() {
    return getApiClient().categories;
  },
  get locations() {
    return getApiClient().locations;
  },
  get users() {
    return getApiClient().users;
  },
  get statistics() {
    return getApiClient().statistics;
  },
  get qrcode() {
    return getApiClient().qrcode;
  },
  setAuthToken(token: string | null) {
    getApiClient().setAuthToken(token);
  },
};