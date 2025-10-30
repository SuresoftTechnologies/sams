/**
 * Service Layer Index
 *
 * Central export point for all service modules.
 * Makes imports cleaner throughout the application.
 *
 * @example
 * ```typescript
 * import { authService, assetService } from '@/services';
 *
 * const assets = await assetService.getAssets();
 * ```
 */

export { authService } from './auth.service';
export { assetService } from './asset.service';

// Export common types
export type {
  Asset,
  AssetCreate,
  AssetUpdate,
  User,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
} from '@/types/api';
