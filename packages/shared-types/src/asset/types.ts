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
 * Total 23+ core fields matching database schema
 */
export interface Asset {
  // Identity fields
  id: string;
  asset_tag: string;  // 자산번호 (e.g., SRS-11-2024-0001)

  // Basic Info
  name: string;  // 자산명
  category_id: string;
  category_name?: string;
  model?: string;  // 규격/모델명
  serial_number?: string;  // MAC 또는 시리얼넘버
  manufacturer?: string;
  mac_address?: string;
  status: AssetStatus;  // 상태 (issued/loaned/general/stock/server_room/disposed)
  grade?: AssetGrade;  // 등급 (A/B/C, auto-calculated from purchase year)
  assigned_to?: string | null;  // 현 사용자
  location_id?: string | null;  // 위치
  location_name?: string;

  // Purchase Info
  purchase_price?: number;  // 구매가
  purchase_date?: string;  // 구매일
  purchase_order?: string;
  purchase_request?: string;  // 구매 품의
  tax_invoice_date?: string;  // 세금계산서 발행일
  invoice_number?: string;
  supplier?: string;  // 공급업체
  warranty_end?: string;  // 보증기간

  // Category Details
  furniture_category?: string;  // 집기품목
  detailed_category?: string;  // 상세품목

  // Checkout/Return Info
  checkout_date?: string;  // 반출날짜
  return_date?: string;  // 반납날짜

  // User History
  previous_user_1?: string;  // 이전 사용자 1
  previous_user_2?: string;  // 이전 사용자 2
  first_user?: string;  // 최초 사용자

  // Other Info
  old_asset_number?: string;  // 기존번호
  qr_code?: string;
  qr_code_exists?: string;  // QR코드 유무
  notes?: string;  // 비고
  description?: string;
  special_notes?: string;  // 특이사항
  specifications?: string;

  // Timestamps
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
  // Basic Info
  asset_tag?: string;  // Auto-generated if not provided
  name: string;
  category_id: string;
  model?: string;
  serial_number?: string;
  manufacturer?: string;
  mac_address?: string;
  status?: AssetStatus;
  assigned_to?: string;  // 현 사용자
  location_id?: string;

  // Purchase Info
  purchase_price?: number;
  purchase_date?: string;
  purchase_order?: string;
  purchase_request?: string;  // 구매 품의
  tax_invoice_date?: string;  // 세금계산서 발행일
  supplier?: string;
  warranty_end?: string;

  // Category Details
  furniture_category?: string;  // 집기품목
  detailed_category?: string;  // 상세품목

  // Checkout/Return Info
  checkout_date?: string;  // 반출날짜
  return_date?: string;  // 반납날짜

  // User History
  previous_user_1?: string;  // 이전 사용자 1
  previous_user_2?: string;  // 이전 사용자 2
  first_user?: string;  // 최초 사용자

  // Other Info
  old_asset_number?: string;  // 기존번호
  qr_code_exists?: string;  // QR코드 유무
  notes?: string;
  special_notes?: string;  // 특이사항
}

/**
 * Update asset DTO
 * Note: Using snake_case to match Python backend API
 */
export interface UpdateAssetDto {
  // Basic Info
  name?: string;
  model?: string;
  serial_number?: string;
  manufacturer?: string;
  mac_address?: string;
  status?: AssetStatus;
  assigned_to?: string | null;  // 현 사용자
  category_id?: string;
  location_id?: string;

  // Purchase Info
  purchase_price?: number;
  purchase_date?: string;
  purchase_order?: string;
  purchase_request?: string;  // 구매 품의
  tax_invoice_date?: string;  // 세금계산서 발행일
  supplier?: string;
  warranty_end?: string;

  // Category Details
  furniture_category?: string;  // 집기품목
  detailed_category?: string;  // 상세품목

  // Checkout/Return Info
  checkout_date?: string;  // 반출날짜
  return_date?: string;  // 반납날짜

  // User History
  previous_user_1?: string;  // 이전 사용자 1
  previous_user_2?: string;  // 이전 사용자 2
  first_user?: string;  // 최초 사용자

  // Other Info
  old_asset_number?: string;  // 기존번호
  qr_code_exists?: string;  // QR코드 유무
  notes?: string;
  special_notes?: string;  // 특이사항
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
