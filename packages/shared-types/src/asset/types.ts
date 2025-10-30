/**
 * Asset-related types and enums
 */

/**
 * Asset status enum
 */
export enum AssetStatus {
  AVAILABLE = 'available',
  ASSIGNED = 'assigned',
  IN_TRANSIT = 'in_transit',
  MAINTENANCE = 'maintenance',
  DISPOSED = 'disposed',
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
 */
export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  categoryId: string;
  model?: string;
  serialNumber?: string;
  macAddress?: string;
  status: AssetStatus;
  grade?: AssetGrade;
  currentUserId?: string | null;
  locationId: string;
  purchasePrice?: number;
  purchaseDate?: Date;
  purchaseOrder?: string;
  invoiceNumber?: string;
  supplier?: string;
  warrantyUntil?: Date;
  notes?: string;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
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
 */
export interface CreateAssetDto {
  assetTag: string;
  name: string;
  categoryId: string;
  model?: string;
  serialNumber?: string;
  macAddress?: string;
  status?: AssetStatus;
  locationId: string;
  purchasePrice?: number;
  purchaseDate?: Date;
  purchaseOrder?: string;
  supplier?: string;
  notes?: string;
}

/**
 * Update asset DTO
 */
export interface UpdateAssetDto {
  name?: string;
  model?: string;
  serialNumber?: string;
  macAddress?: string;
  status?: AssetStatus;
  locationId?: string;
  purchasePrice?: number;
  purchaseDate?: Date;
  notes?: string;
}

/**
 * Asset filter params
 */
export interface AssetFilterParams {
  status?: AssetStatus;
  grade?: AssetGrade;
  categoryId?: string;
  locationId?: string;
  currentUserId?: string;
  search?: string;
}

/**
 * Asset history entry
 */
export interface AssetHistory {
  id: string;
  assetId: string;
  action: AssetHistoryAction;
  fromUserId?: string | null;
  toUserId?: string | null;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  createdBy: string;
  createdAt: Date;
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
