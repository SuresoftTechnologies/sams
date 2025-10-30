// src/lib/api-client.ts
import type { components, paths } from '@sams/api-client';

// Type helpers
type Asset = components['schemas']['Asset'];
type AssetCreate = components['schemas']['AssetCreate'];
type AssetUpdate = components['schemas']['AssetUpdate'];
type PaginatedResponse<T> = components['schemas']['PaginatedResponse'] & { items: T[] };

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('access_token');

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// API Client
export const apiClient = {
  // Assets
  assets: {
    list: (params?: { skip?: number; limit?: number; category?: string }) =>
      fetchAPI<PaginatedResponse<Asset>>(
        `/api/v1/assets?${new URLSearchParams(params as any)}`
      ),

    get: (id: string) =>
      fetchAPI<Asset>(`/api/v1/assets/${id}`),

    create: (data: AssetCreate) =>
      fetchAPI<Asset>('/api/v1/assets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: AssetUpdate) =>
      fetchAPI<Asset>(`/api/v1/assets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      fetchAPI<void>(`/api/v1/assets/${id}`, {
        method: 'DELETE',
      }),
  },

  // Auth
  auth: {
    login: (username: string, password: string) =>
      fetchAPI<{ access_token: string; refresh_token: string }>(
        '/api/v1/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        }
      ),

    logout: () =>
      fetchAPI<void>('/api/v1/auth/logout', { method: 'POST' }),

    me: () =>
      fetchAPI<components['schemas']['User']>('/api/v1/auth/me'),
  },

  // Check-in/out
  checkin: {
    create: (assetId: string, userId: string) =>
      fetchAPI<components['schemas']['CheckIn']>('/api/v1/checkins', {
        method: 'POST',
        body: JSON.stringify({ asset_id: assetId, user_id: userId }),
      }),

    checkout: (checkinId: string) =>
      fetchAPI<components['schemas']['CheckIn']>(
        `/api/v1/checkins/${checkinId}/checkout`,
        { method: 'POST' }
      ),
  },
};

// Type exports for convenience
export type { Asset, AssetCreate, AssetUpdate, PaginatedResponse };
