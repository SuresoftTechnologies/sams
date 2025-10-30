/**
 * Asset Service
 *
 * Handles all asset-related API operations using the new API client.
 * @deprecated This service is largely replaced by direct use of api.assets.* methods.
 * Consider using the api client directly instead of this wrapper.
 */

import { api } from '@/lib/api';
import type {
  Asset,
  AssetCreate,
  AssetUpdate,
  AssetQueryParams,
  PaginatedResponse,
  AssetHistory,
} from '@/types/api';

/**
 * Convert API client PaginatedResponse to frontend format
 */
function convertPaginatedResponse<T>(apiResponse: {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}): PaginatedResponse<T> {
  const page = Math.floor(apiResponse.skip / apiResponse.limit) + 1;
  const pages = Math.ceil(apiResponse.total / apiResponse.limit);

  return {
    items: apiResponse.items,
    total: apiResponse.total,
    page,
    size: apiResponse.limit,
    pages,
  };
}

export const assetService = {
  /**
   * Get all assets with optional filters
   */
  async getAssets(params?: AssetQueryParams): Promise<PaginatedResponse<Asset>> {
    // Convert frontend AssetQueryParams to API client params
    const apiResponse = await api.assets.list({
      skip: params?.skip,
      limit: params?.limit,
      search: params?.search,
      status: params?.status as any,
      category_id: params?.category_id,
      location_id: params?.location_id,
    });

    return convertPaginatedResponse(apiResponse);
  },

  /**
   * Get single asset by ID
   */
  async getAsset(assetId: string): Promise<Asset> {
    return api.assets.get(assetId);
  },

  /**
   * Create new asset
   */
  async createAsset(data: AssetCreate): Promise<Asset> {
    return api.assets.create(data as any); // Type conversion needed for AssetCreate
  },

  /**
   * Update existing asset
   */
  async updateAsset(assetId: string, data: AssetUpdate): Promise<Asset> {
    return api.assets.update(assetId, data as any); // Type conversion needed for AssetUpdate
  },

  /**
   * Delete asset (soft delete)
   */
  async deleteAsset(assetId: string): Promise<void> {
    return api.assets.delete(assetId);
  },

  /**
   * Get asset QR code
   * Note: QR code endpoint not yet available in API client
   */
  async getAssetQRCode(assetId: string): Promise<Blob> {
    // Direct fetch since QR endpoint isn't in api client yet
    const response = await fetch(`http://localhost:8000/api/v1/assets/${assetId}/qr-code`);

    if (!response.ok) {
      throw new Error('Failed to fetch QR code');
    }

    return response.blob();
  },

  /**
   * Search assets
   */
  async searchAssets(query: string, params?: Omit<AssetQueryParams, 'search'>): Promise<PaginatedResponse<Asset>> {
    const apiResponse = await api.assets.list({
      search: query,
      skip: params?.skip,
      limit: params?.limit,
      status: params?.status as any,
      category_id: params?.category_id,
      location_id: params?.location_id,
    });

    return convertPaginatedResponse(apiResponse);
  },

  /**
   * Get assets by category
   */
  async getAssetsByCategory(categoryId: string, params?: Omit<AssetQueryParams, 'category_id'>): Promise<PaginatedResponse<Asset>> {
    const apiResponse = await api.assets.list({
      category_id: categoryId,
      skip: params?.skip,
      limit: params?.limit,
      search: params?.search,
      status: params?.status as any,
      location_id: params?.location_id,
    });

    return convertPaginatedResponse(apiResponse);
  },

  /**
   * Get assets by location
   */
  async getAssetsByLocation(locationId: string, params?: Omit<AssetQueryParams, 'location_id'>): Promise<PaginatedResponse<Asset>> {
    const apiResponse = await api.assets.list({
      location_id: locationId,
      skip: params?.skip,
      limit: params?.limit,
      search: params?.search,
      status: params?.status as any,
      category_id: params?.category_id,
    });

    return convertPaginatedResponse(apiResponse);
  },

  /**
   * Get asset history
   */
  async getAssetHistory(assetId: string): Promise<AssetHistory[]> {
    return api.assets.history(assetId);
  },

  /**
   * Check-in asset
   * Note: These endpoints may not exist in the backend yet
   */
  async checkInAsset(_assetId: string, _data?: { notes?: string }): Promise<Asset> {
    // These endpoints aren't in the API client yet
    throw new Error('Check-in endpoint not yet implemented');
  },

  /**
   * Check-out asset
   * Note: These endpoints may not exist in the backend yet
   */
  async checkOutAsset(_assetId: string, _data: { user_id: string; notes?: string }): Promise<Asset> {
    // These endpoints aren't in the API client yet
    throw new Error('Check-out endpoint not yet implemented');
  },
};
