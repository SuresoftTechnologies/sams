/**
 * API Client Usage Examples
 *
 * This file demonstrates how to use the API client in your application.
 * These are example patterns - delete this file before production.
 */

import { api, setAuthToken, clearTokens, isAuthenticated } from '@/lib/api';
import { authService } from '@/services/auth.service';
import { assetService } from '@/services/asset.service';
import type { Asset, LoginRequest } from '@/types/api';

/**
 * Example 1: Authentication Flow
 */
export async function loginExample() {
  try {
    // Login with credentials
    const credentials: LoginRequest = {
      email: 'user@example.com',
      password: 'password123',
    };

    const response = await authService.login(credentials);
    console.log('Login successful:', response);

    // Token is automatically stored in localStorage
    // and set in API client headers

    // Check if authenticated
    const authenticated = isAuthenticated();
    console.log('Is authenticated:', authenticated);
  } catch (error) {
    console.error('Login failed:', error);
  }
}

/**
 * Example 2: Logout Flow
 */
export async function logoutExample() {
  try {
    await authService.logout();
    console.log('Logout successful');

    // Tokens are automatically cleared
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

/**
 * Example 3: Fetch Assets (using service)
 */
export async function fetchAssetsExample() {
  try {
    // Get all assets with pagination
    const response = await assetService.getAssets({
      skip: 0,
      limit: 10,
      search: 'laptop',
      status: 'available',
    });

    console.log('Assets:', response.items);
    console.log('Total:', response.total);
  } catch (error) {
    console.error('Failed to fetch assets:', error);
  }
}

/**
 * Example 4: Create Asset
 */
export async function createAssetExample() {
  try {
    const newAsset = await assetService.createAsset({
      name: 'MacBook Pro 16"',
      description: 'M3 Max, 32GB RAM, 1TB SSD',
      serial_number: 'MBP202401234',
      category_id: 'category-uuid',
      location_id: 'location-uuid',
      purchase_date: '2024-01-15',
      purchase_cost: 3499.99,
      status: 'available',
    });

    console.log('Asset created:', newAsset);
  } catch (error) {
    console.error('Failed to create asset:', error);
  }
}

/**
 * Example 5: Update Asset
 */
export async function updateAssetExample(assetId: string) {
  try {
    const updated = await assetService.updateAsset(assetId, {
      status: 'in_use',
      notes: 'Assigned to John Doe',
    });

    console.log('Asset updated:', updated);
  } catch (error) {
    console.error('Failed to update asset:', error);
  }
}

/**
 * Example 6: Delete Asset
 */
export async function deleteAssetExample(assetId: string) {
  try {
    await assetService.deleteAsset(assetId);
    console.log('Asset deleted successfully');
  } catch (error) {
    console.error('Failed to delete asset:', error);
  }
}

/**
 * Example 7: Search Assets
 */
export async function searchAssetsExample(query: string) {
  try {
    const results = await assetService.searchAssets(query, {
      limit: 20,
    });

    console.log('Search results:', results.items);
  } catch (error) {
    console.error('Search failed:', error);
  }
}

/**
 * Example 8: Using API client directly (without service layer)
 */
export async function directApiCallExample() {
  try {
    // GET request
    const assets = await api.get<Asset[]>('/api/v1/assets', {
      limit: 10,
    });

    // POST request
    const newAsset = await api.post<Asset>('/api/v1/assets', {
      name: 'New Asset',
      category_id: 'category-uuid',
    });

    // PATCH request
    const updated = await api.patch<Asset>(`/api/v1/assets/${newAsset.id}`, {
      status: 'available',
    });

    // DELETE request
    await api.delete(`/api/v1/assets/${newAsset.id}`);

    console.log('Direct API calls completed');
  } catch (error) {
    console.error('API call failed:', error);
  }
}

/**
 * Example 9: File Upload
 */
export async function uploadFileExample(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.upload('/api/v1/assets/import', formData);
    console.log('File uploaded:', response);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

/**
 * Example 10: Handling Errors
 */
export async function errorHandlingExample() {
  try {
    const asset = await assetService.getAsset('non-existent-id');
    console.log(asset);
  } catch (error) {
    // ApiError will be thrown with proper status and message
    console.error('Error:', error);

    // Check error type
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        // User is not authenticated, redirect to login
        console.log('Redirecting to login...');
      } else if (error.message.includes('Forbidden')) {
        // User doesn't have permission
        console.log('Access denied');
      } else {
        // Generic error
        console.log('Something went wrong');
      }
    }
  }
}

/**
 * Example 11: Manual Token Management
 */
export function manualTokenExample() {
  // Set token manually (useful after external auth)
  setAuthToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

  // Clear tokens manually
  clearTokens();

  // Check authentication status
  const authenticated = isAuthenticated();
  console.log('Authenticated:', authenticated);
}

/**
 * Example 12: Using with React Query
 */
export const useAssetsQuery = () => {
  // This would be in a custom hook file
  // import { useQuery } from '@tanstack/react-query';
  //
  // return useQuery({
  //   queryKey: ['assets'],
  //   queryFn: () => assetService.getAssets(),
  // });
};

/**
 * Example 13: Using with React Query Mutation
 */
export const useCreateAssetMutation = () => {
  // This would be in a custom hook file
  // import { useMutation, useQueryClient } from '@tanstack/react-query';
  //
  // const queryClient = useQueryClient();
  //
  // return useMutation({
  //   mutationFn: (data: AssetCreate) => assetService.createAsset(data),
  //   onSuccess: () => {
  //     // Invalidate assets query to refetch
  //     queryClient.invalidateQueries({ queryKey: ['assets'] });
  //   },
  // });
};
