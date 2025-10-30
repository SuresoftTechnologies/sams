/**
 * @sams/api-client
 *
 * Auto-generated TypeScript API client from FastAPI OpenAPI specification.
 *
 * This package exports:
 * - Type definitions from OpenAPI schema (components, operations, paths)
 * - Utility functions for type-safe API calls
 *
 * @example
 * ```typescript
 * import { components } from '@sams/api-client';
 *
 * type Asset = components['schemas']['Asset'];
 * type CreateAssetDto = components['schemas']['CreateAssetDto'];
 * ```
 */

// Re-export generated types
// Note: This file will be auto-generated after running 'pnpm generate'
export type * from './generated/types';

/**
 * API Configuration
 */
export interface ApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

/**
 * Default API configuration
 */
const defaultConfig: ApiConfig = {
  baseUrl: import.meta.env?.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Get current API configuration
 */
export function getApiConfig(): ApiConfig {
  return { ...defaultConfig };
}

/**
 * Update API configuration
 */
export function setApiConfig(config: Partial<ApiConfig>): void {
  Object.assign(defaultConfig, config);
}

/**
 * Set authorization token
 */
export function setAuthToken(token: string | null): void {
  if (token) {
    defaultConfig.headers = {
      ...defaultConfig.headers,
      Authorization: `Bearer ${token}`,
    };
  } else {
    const { Authorization, ...rest } = defaultConfig.headers || {};
    defaultConfig.headers = rest;
  }
}

/**
 * Type-safe API fetch wrapper
 */
export async function apiFetch<TResponse>(
  path: string,
  options?: RequestInit
): Promise<TResponse> {
  const config = getApiConfig();
  const url = `${config.baseUrl}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...config.headers,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: response.statusText,
    }));
    throw new Error(error.detail || 'API request failed');
  }

  return response.json();
}
