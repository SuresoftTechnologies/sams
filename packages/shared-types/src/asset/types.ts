/**
 * Asset-related types and enums
 */

/**
 * Asset status enum
 */
export enum AssetStatus {
  ISSUED = 'issued',           // 지급장비
  LOANED = 'loaned',           // 대여용
  GENERAL = 'general',         // 일반장비
  STOCK = 'stock',             // 재고
  SERVER_ROOM = 'server_room', // 서버실
  DISPOSED = 'disposed',       // 불용
}

/**
 * Asset grade enum (based on purchase year)
 */
export enum AssetGrade {
  A = 'A', // 2022-2025
  B = 'B', // 2018-2021
  C = 'C', // ~2017
}

/**
 * Asset category enum
 */
export enum AssetCategory {
  DESKTOP = 'desktop',
  LAPTOP = 'laptop',
  TABLET = 'tablet',
  MONITOR = 'monitor',
  PERIPHERAL = 'peripheral',
}

/**
 * Asset entity interface
 * Note: Using snake_case to match Python backend API
 */
export interface Asset {
  id: string;
  asset_tag: string;
  name: string;
  category_id: string;
  category_name?: string;
  model?: string;
  serial_number?: string;
  manufacturer?: string;
  mac_address?: string;
  status: AssetStatus;
  grade?: AssetGrade;
  assigned_to?: string | null;
  location_id?: string | null;
  location_name?: string;
  purchase_price?: number;
  purchase_date?: string;
  purchase_order?: string;
  invoice_number?: string;
  supplier?: string;
  warranty_end?: string;
  notes?: string;
  description?: string;
  qr_code?: string;
  specifications?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Asset with relations
 */
export interface AssetWithRelations extends Asset {
  currentUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
  location: {
    id: string;
    name: string;
    site: string;
  };
  category: {
    id: string;
    name: string;
    code: string;
  };
}

/**
 * Create asset DTO
 * Note: Using snake_case to match Python backend API
 */
export interface CreateAssetDto {
  asset_tag?: string;
  name: string;
  category_id: string;
  model?: string;
  serial_number?: string;
  manufacturer?: string;
  mac_address?: string;
  status?: AssetStatus;
  location_id?: string;
  purchase_price?: number;
  purchase_date?: string;
  purchase_order?: string;
  supplier?: string;
  warranty_end?: string;
  notes?: string;
}

/**
 * Update asset DTO
 * Note: Using snake_case to match Python backend API
 */
export interface UpdateAssetDto {
  name?: string;
  model?: string;
  serial_number?: string;
  manufacturer?: string;
  mac_address?: string;
  status?: AssetStatus;
  category_id?: string;
  location_id?: string;
  purchase_price?: number;
  purchase_date?: string;
  warranty_end?: string;
  notes?: string;
}

/**
 * Asset filter params
 * Note: Using snake_case to match Python backend API
 */
export interface AssetFilterParams {
  status?: AssetStatus;
  grade?: AssetGrade;
  category_id?: string;
  location_id?: string;
  assigned_to?: string;
  search?: string;
}

/**
 * Asset history entry
 * Note: Using snake_case to match Python backend API
 */
export interface AssetHistory {
  id: string;
  asset_id: string;
  action: AssetHistoryAction;
  from_user_id?: string | null;
  to_user_id?: string | null;
  from_location_id?: string | null;
  to_location_id?: string | null;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  created_by: string;
  created_at: string;
}

/**
 * Asset history action enum
 */
export enum AssetHistoryAction {
  CREATE = 'create',
  UPDATE = 'update',
  ASSIGN = 'assign',
  UNASSIGN = 'unassign',
  RELOCATE = 'relocate',
  DISPOSE = 'dispose',
  RESTORE = 'restore',
}
