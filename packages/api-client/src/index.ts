/**
 * @sams/api-client
 *
 * TypeScript API client for SAMS backend
 */

// Export client functionality
export {
  ApiClient,
  apiClient,
  getApiClient,
  setApiClient,
  type PaginatedResponse,
  type ApiError,
} from './client';

// Re-export types from shared-types
export type {
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
  UserRole,
} from '@sams/shared-types';
