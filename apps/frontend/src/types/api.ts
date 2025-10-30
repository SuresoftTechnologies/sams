/**
 * API Type Definitions
 *
 * Re-exports types from @ams/api-client for convenient access.
 * Defines common API response/error types.
 */

import type { components, operations } from '@ams/api-client';

/**
 * Component schemas from OpenAPI
 */
export type Asset = components['schemas']['Asset'];
export type AssetCreate = components['schemas']['AssetCreate'];
export type AssetUpdate = components['schemas']['AssetUpdate'];
export type AssetRead = components['schemas']['AssetRead'];

export type User = components['schemas']['User'];
export type UserCreate = components['schemas']['UserCreate'];
export type UserUpdate = components['schemas']['UserUpdate'];
export type UserRead = components['schemas']['UserRead'];

export type AssetHistory = components['schemas']['AssetHistory'];
export type AssetHistoryCreate = components['schemas']['AssetHistoryCreate'];

export type Category = components['schemas']['Category'];
export type CategoryCreate = components['schemas']['CategoryCreate'];

export type Location = components['schemas']['Location'];
export type LocationCreate = components['schemas']['LocationCreate'];

export type LoginRequest = components['schemas']['LoginRequest'];
export type RegisterRequest = components['schemas']['RegisterRequest'];
export type TokenResponse = components['schemas']['TokenResponse'];

/**
 * API Response Types
 */
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success: boolean;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
  detail: string;
  status?: number;
  errors?: Record<string, string[]>;
}

/**
 * Query Parameters
 */
export interface AssetQueryParams {
  skip?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  location_id?: string;
  status?: 'available' | 'in_use' | 'maintenance' | 'retired';
  sort_by?: string;
  order?: 'asc' | 'desc';
}

export interface UserQueryParams {
  skip?: number;
  limit?: number;
  search?: string;
  role?: string;
  is_active?: boolean;
}

/**
 * Asset Status Enum
 */
export enum AssetStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
}

/**
 * User Role Enum
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
}

/**
 * Operation types (for reference)
 */
export type LoginOperation = operations['login_api_v1_auth_login_post'];
export type RegisterOperation = operations['register_api_v1_auth_register_post'];
export type GetAssetsOperation = operations['get_assets_api_v1_assets_get'];
export type CreateAssetOperation = operations['create_asset_api_v1_assets_post'];
export type GetAssetOperation = operations['get_asset_api_v1_assets__asset_id__get'];
export type UpdateAssetOperation = operations['update_asset_api_v1_assets__asset_id__patch'];
export type DeleteAssetOperation = operations['delete_asset_api_v1_assets__asset_id__delete'];
