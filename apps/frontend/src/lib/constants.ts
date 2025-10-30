/**
 * Application Constants
 *
 * Centralized constants for the application
 * - Asset statuses and categories
 * - User roles and permissions
 * - Locations and departments
 * - Configuration values
 */

import { AssetStatus, AssetGrade, LocationSite } from '@sams/shared-types';

/**
 * Asset Status Options
 */
export const ASSET_STATUSES = [
  { value: AssetStatus.AVAILABLE, label: 'Available', color: 'green' },
  { value: AssetStatus.ASSIGNED, label: 'Assigned', color: 'blue' },
  { value: AssetStatus.IN_TRANSIT, label: 'In Transit', color: 'yellow' },
  { value: AssetStatus.MAINTENANCE, label: 'Maintenance', color: 'orange' },
  { value: AssetStatus.DISPOSED, label: 'Disposed', color: 'red' },
] as const;

/**
 * Asset Grade Options
 */
export const ASSET_GRADES = [
  { value: AssetGrade.A, label: 'Grade A (2022-2025)', description: 'Latest generation' },
  { value: AssetGrade.B, label: 'Grade B (2018-2021)', description: 'Mid-range' },
  { value: AssetGrade.C, label: 'Grade C (~2017)', description: 'Legacy' },
] as const;

/**
 * Asset Categories (Mock data)
 * In real app, this would be fetched from API
 */
export const ASSET_CATEGORIES = [
  { id: 'cat-desktop', name: 'Desktop', code: 'DESKTOP', description: 'Desktop computers' },
  { id: 'cat-laptop', name: 'Laptop', code: 'LAPTOP', description: 'Laptop computers' },
  { id: 'cat-tablet', name: 'Tablet', code: 'TABLET', description: 'Tablets and iPads' },
  { id: 'cat-monitor', name: 'Monitor', code: 'MONITOR', description: 'Display monitors' },
  { id: 'cat-peripheral', name: 'Peripheral', code: 'PERIPHERAL', description: 'Keyboards, mice, etc.' },
  { id: 'cat-network', name: 'Network Device', code: 'NETWORK', description: 'Routers, switches, etc.' },
  { id: 'cat-printer', name: 'Printer', code: 'PRINTER', description: 'Printers and scanners' },
  { id: 'cat-phone', name: 'Phone', code: 'PHONE', description: 'Mobile phones' },
] as const;

/**
 * Locations (Mock data)
 * In real app, this would be fetched from API
 */
export const ASSET_LOCATIONS = [
  {
    id: 'loc-pangyo-1f',
    name: 'Pangyo Office 1F',
    code: 'PY-1F',
    site: LocationSite.PANGYO,
    building: 'Main',
    floor: '1F',
  },
  {
    id: 'loc-pangyo-2f',
    name: 'Pangyo Office 2F',
    code: 'PY-2F',
    site: LocationSite.PANGYO,
    building: 'Main',
    floor: '2F',
  },
  {
    id: 'loc-pangyo-3f',
    name: 'Pangyo Office 3F',
    code: 'PY-3F',
    site: LocationSite.PANGYO,
    building: 'Main',
    floor: '3F',
  },
  {
    id: 'loc-daejeon-1f',
    name: 'Daejeon Office 1F',
    code: 'DJ-1F',
    site: LocationSite.DAEJEON,
    building: 'Main',
    floor: '1F',
  },
  {
    id: 'loc-daejeon-2f',
    name: 'Daejeon Office 2F',
    code: 'DJ-2F',
    site: LocationSite.DAEJEON,
    building: 'Main',
    floor: '2F',
  },
] as const;

/**
 * Departments (Mock data)
 */
export const DEPARTMENTS = [
  { id: 'dept-dev', name: 'Development', code: 'DEV' },
  { id: 'dept-qa', name: 'Quality Assurance', code: 'QA' },
  { id: 'dept-design', name: 'Design', code: 'DESIGN' },
  { id: 'dept-pm', name: 'Product Management', code: 'PM' },
  { id: 'dept-sales', name: 'Sales', code: 'SALES' },
  { id: 'dept-marketing', name: 'Marketing', code: 'MKT' },
  { id: 'dept-hr', name: 'Human Resources', code: 'HR' },
  { id: 'dept-finance', name: 'Finance', code: 'FIN' },
  { id: 'dept-it', name: 'IT Support', code: 'IT' },
] as const;

/**
 * User Roles
 */
export const USER_ROLES = [
  { value: 'admin', label: 'Administrator', description: 'Full system access' },
  { value: 'manager', label: 'Manager', description: 'Department management' },
  { value: 'user', label: 'User', description: 'Basic user access' },
] as const;

/**
 * Workflow Status
 */
export const WORKFLOW_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'cancelled', label: 'Cancelled', color: 'gray' },
] as const;

/**
 * Workflow Types
 */
export const WORKFLOW_TYPES = [
  { value: 'assignment', label: 'Asset Assignment', icon: 'user-plus' },
  { value: 'return', label: 'Asset Return', icon: 'user-minus' },
  { value: 'transfer', label: 'Asset Transfer', icon: 'arrows-right-left' },
  { value: 'maintenance', label: 'Maintenance Request', icon: 'wrench' },
  { value: 'disposal', label: 'Disposal Request', icon: 'trash' },
] as const;

/**
 * Pagination Constants
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Date Format Constants
 */
export const DATE_FORMATS = {
  DATE: 'yyyy-MM-dd',
  DATE_TIME: 'yyyy-MM-dd HH:mm',
  DATE_TIME_FULL: 'yyyy-MM-dd HH:mm:ss',
  DATE_KO: 'yyyy년 MM월 dd일',
  DATE_TIME_KO: 'yyyy년 MM월 dd일 HH:mm',
  MONTH_YEAR: 'yyyy-MM',
  TIME: 'HH:mm',
} as const;

/**
 * File Upload Constants
 */
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

/**
 * API Constants
 */
export const API = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

/**
 * Query Keys for TanStack Query
 */
export const QUERY_KEYS = {
  // Auth
  CURRENT_USER: ['currentUser'] as const,

  // Assets
  ASSETS: ['assets'] as const,
  ASSET: (id: string) => ['asset', id] as const,
  ASSET_HISTORY: (id: string) => ['asset', id, 'history'] as const,

  // Categories
  CATEGORIES: ['categories'] as const,
  CATEGORY: (id: string) => ['category', id] as const,

  // Locations
  LOCATIONS: ['locations'] as const,
  LOCATION: (id: string) => ['location', id] as const,

  // Users
  USERS: ['users'] as const,
  USER: (id: string) => ['user', id] as const,

  // Workflows
  WORKFLOWS: ['workflows'] as const,
  WORKFLOW: (id: string) => ['workflow', id] as const,

  // Departments
  DEPARTMENTS: ['departments'] as const,
  DEPARTMENT: (id: string) => ['department', id] as const,
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

/**
 * Route Paths
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ASSETS: '/assets',
  ASSET_DETAIL: (id: string) => `/assets/${id}`,
  ASSET_NEW: '/assets/new',
  ASSET_EDIT: (id: string) => `/assets/${id}/edit`,
  WORKFLOWS: '/workflows',
  WORKFLOW_DETAIL: (id: string) => `/workflows/${id}`,
  USERS: '/users',
  USER_DETAIL: (id: string) => `/users/${id}`,
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

/**
 * Toast Duration (milliseconds)
 */
export const TOAST_DURATION = {
  SHORT: 2000,
  DEFAULT: 4000,
  LONG: 6000,
} as const;

/**
 * Validation Constants
 */
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 100,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  SERIAL_NUMBER_MAX_LENGTH: 50,
} as const;

/**
 * Helper function to get status label
 */
export function getAssetStatusLabel(status: AssetStatus): string {
  return ASSET_STATUSES.find((s) => s.value === status)?.label || status;
}

/**
 * Helper function to get category name
 */
export function getCategoryName(categoryId: string): string | undefined {
  return ASSET_CATEGORIES.find((c) => c.id === categoryId)?.name;
}

/**
 * Helper function to get location name
 */
export function getLocationName(locationId: string): string | undefined {
  return ASSET_LOCATIONS.find((l) => l.id === locationId)?.name;
}

/**
 * Helper function to get department name
 */
export function getDepartmentName(departmentId: string): string | undefined {
  return DEPARTMENTS.find((d) => d.id === departmentId)?.name;
}
