/**
 * Asset Service
 *
 * Handles all asset-related API operations.
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

export const assetService = {
  /**
   * Get all assets with optional filters
   */
  async getAssets(params?: AssetQueryParams): Promise<PaginatedResponse<Asset>> {
    // Convert AssetQueryParams to Record<string, string | number | boolean>
    const queryParams: Record<string, string | number | boolean> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams[key] = value;
        }
      });
    }
    return api.get<PaginatedResponse<Asset>>('/api/v1/assets', queryParams);
  },

  /**
   * Get single asset by ID
   */
  async getAsset(assetId: string): Promise<Asset> {
    return api.get<Asset>(`/api/v1/assets/${assetId}`);
  },

  /**
   * Create new asset
   */
  async createAsset(data: AssetCreate): Promise<Asset> {
    return api.post<Asset>('/api/v1/assets', data);
  },

  /**
   * Update existing asset
   */
  async updateAsset(assetId: string, data: AssetUpdate): Promise<Asset> {
    return api.patch<Asset>(`/api/v1/assets/${assetId}`, data);
  },

  /**
   * Delete asset (soft delete)
   */
  async deleteAsset(assetId: string): Promise<void> {
    return api.delete<void>(`/api/v1/assets/${assetId}`);
  },

  /**
   * Get asset QR code
   */
  async getAssetQRCode(assetId: string): Promise<Blob> {
    const config = (await import('@/lib/api')).getApiConfig();
    const response = await fetch(`${config.baseUrl}/api/v1/assets/${assetId}/qr-code`);

    if (!response.ok) {
      throw new Error('Failed to fetch QR code');
    }

    return response.blob();
  },

  /**
   * Search assets
   */
  async searchAssets(query: string, params?: Omit<AssetQueryParams, 'search'>): Promise<PaginatedResponse<Asset>> {
    return api.get<PaginatedResponse<Asset>>('/api/v1/assets', {
      ...params,
      search: query,
    });
  },

  /**
   * Get assets by category
   */
  async getAssetsByCategory(categoryId: string, params?: Omit<AssetQueryParams, 'category_id'>): Promise<PaginatedResponse<Asset>> {
    return api.get<PaginatedResponse<Asset>>('/api/v1/assets', {
      ...params,
      category_id: categoryId,
    });
  },

  /**
   * Get assets by location
   */
  async getAssetsByLocation(locationId: string, params?: Omit<AssetQueryParams, 'location_id'>): Promise<PaginatedResponse<Asset>> {
    return api.get<PaginatedResponse<Asset>>('/api/v1/assets', {
      ...params,
      location_id: locationId,
    });
  },

  /**
   * Get asset history
   */
  async getAssetHistory(assetId: string): Promise<AssetHistory[]> {
    return api.get<AssetHistory[]>(`/api/v1/assets/${assetId}/history`);
  },

  /**
   * Check-in asset
   */
  async checkInAsset(assetId: string, data?: { notes?: string }): Promise<Asset> {
    return api.post<Asset>(`/api/v1/assets/${assetId}/check-in`, data);
  },

  /**
   * Check-out asset
   */
  async checkOutAsset(assetId: string, data: { user_id: string; notes?: string }): Promise<Asset> {
    return api.post<Asset>(`/api/v1/assets/${assetId}/check-out`, data);
  },
};
