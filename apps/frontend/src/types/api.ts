/**
 * API Type Definitions
 *
 * Type definitions for API requests/responses.
 * TODO: Generate from OpenAPI schema once backend is ready.
 */

/**
 * Component schemas (temporary - will be replaced with OpenAPI generated types)
 */
export interface Asset {
  id: string;
  asset_tag: string;
  status?: 'issued' | 'loaned' | 'general' | 'stock' | 'server_room' | 'disposed';
  category_id: string;
  location_id?: string | null;
  assigned_to?: string | null;  // Updated field name to match backend
  assignee_id?: string | null;   // Kept for backward compatibility
  model?: string | null;
  serial_number?: string | null;
  manufacturer?: string | null;
  purchase_date?: string | null;
  purchase_price?: number | null;
  warranty_expiry?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Additional fields from backend
  category_name?: string;
  location_name?: string;
  assigned_user_name?: string;
  // User history fields (stored as strings in DB)
  previous_user_1?: string | null;
  previous_user_2?: string | null;
  first_user?: string | null;
}

export interface AssetCreate {
  asset_tag?: string;
  category_id: string;
  location_id?: string;
  status?: string;
  model?: string;
  serial_number?: string;
  manufacturer?: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_expiry?: string;
  notes?: string;
}

export type AssetUpdate = Partial<AssetCreate>;
export type AssetRead = Asset;

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  department?: string | null;
  employee_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type UserCreate = Omit<User, 'id' | 'created_at' | 'updated_at'> & { password: string };
export type UserUpdate = Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
export type UserRead = User;

/**
 * Asset Event/History Action Types
 * Matches backend HistoryAction enum
 */
export type HistoryAction =
  | 'created'
  | 'updated'
  | 'assigned'
  | 'unassigned'
  | 'transferred'
  | 'location_changed'
  | 'status_changed'
  | 'maintenance_start'
  | 'maintenance_end'
  | 'disposed'
  | 'deleted'
  | 'restored';

/**
 * Asset Event/History Action Labels (Korean)
 */
export const HistoryActionLabels: Record<HistoryAction, string> = {
  created: '생성됨',
  updated: '수정됨',
  assigned: '할당됨',
  unassigned: '반납됨',
  transferred: '이전됨',
  location_changed: '위치 변경',
  status_changed: '상태 변경',
  maintenance_start: '유지보수 시작',
  maintenance_end: '유지보수 완료',
  disposed: '폐기됨',
  deleted: '삭제됨',
  restored: '복원됨',
};

/**
 * Asset Event/History Entry
 */
export interface AssetHistory {
  id: string;
  asset_id: string;
  action: HistoryAction;
  description?: string | null;
  performed_by: string;
  user_name?: string | null;
  user_email?: string | null;
  from_user_id?: string | null;
  to_user_id?: string | null;
  from_location_id?: string | null;
  to_location_id?: string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  workflow_id?: string | null;
  created_at: string;
}

/**
 * Asset History List Response
 */
export interface AssetHistoryListResponse {
  items: AssetHistory[];
  total: number;
}

export type AssetHistoryCreate = Omit<AssetHistory, 'id' | 'created_at' | 'user_name' | 'user_email'>;

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
}

export type CategoryCreate = Omit<Category, 'id' | 'created_at'>;

export interface Location {
  id: string;
  name: string;
  code: string;
  site?: string | null;
  building?: string | null;
  floor?: string | null;
  room?: string | null;
  is_active: boolean;
  created_at: string;
}

export type LocationCreate = Omit<Location, 'id' | 'created_at'>;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

/**
 * API Response Types
 */
export interface ApiResponse<T = unknown> {
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
  status?: 'issued' | 'loaned' | 'general' | 'stock' | 'server_room' | 'disposed';
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
export const AssetStatus = {
  ISSUED: 'issued',
  LOANED: 'loaned',
  GENERAL: 'general',
  STOCK: 'stock',
  SERVER_ROOM: 'server_room',
  DISPOSED: 'disposed',
} as const;

export type AssetStatusType = (typeof AssetStatus)[keyof typeof AssetStatus];

/**
 * User Role Enum
 */
export const UserRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];
