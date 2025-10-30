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
  { value: AssetStatus.ISSUED, label: '지급장비', color: 'blue' },
  { value: AssetStatus.LOANED, label: '대여용', color: 'purple' },
  { value: AssetStatus.GENERAL, label: '일반장비', color: 'green' },
  { value: AssetStatus.STOCK, label: '재고', color: 'gray' },
  { value: AssetStatus.SERVER_ROOM, label: '서버실', color: 'cyan' },
  { value: AssetStatus.DISPOSED, label: '불용', color: 'red' },
] as const;

/**
 * Asset Grade Options
 */
export const ASSET_GRADES = [
  { value: AssetGrade.A, label: '등급 A (2022-2025)', description: '최신 세대' },
  { value: AssetGrade.B, label: '등급 B (2018-2021)', description: '중급' },
  { value: AssetGrade.C, label: '등급 C (~2017)', description: '레거시' },
] as const;

/**
 * Asset Categories (Mock data)
 * In real app, this would be fetched from API
 */
export const ASSET_CATEGORIES = [
  { id: 'cat-desktop', name: '데스크톱', code: 'DESKTOP', description: '데스크톱 컴퓨터' },
  { id: 'cat-laptop', name: '노트북', code: 'LAPTOP', description: '노트북 컴퓨터' },
  { id: 'cat-tablet', name: '태블릿', code: 'TABLET', description: '태블릿 및 iPad' },
  { id: 'cat-monitor', name: '모니터', code: 'MONITOR', description: '디스플레이 모니터' },
  { id: 'cat-peripheral', name: '주변기기', code: 'PERIPHERAL', description: '키보드, 마우스 등' },
  { id: 'cat-network', name: '네트워크 장비', code: 'NETWORK', description: '라우터, 스위치 등' },
  { id: 'cat-printer', name: '프린터', code: 'PRINTER', description: '프린터 및 스캐너' },
  { id: 'cat-phone', name: '전화기', code: 'PHONE', description: '휴대전화' },
] as const;

/**
 * Locations (Mock data)
 * In real app, this would be fetched from API
 */
export const ASSET_LOCATIONS = [
  {
    id: 'loc-pangyo-1f',
    name: '판교 사무실 1층',
    code: 'PY-1F',
    site: LocationSite.PANGYO,
    building: '본관',
    floor: '1층',
  },
  {
    id: 'loc-pangyo-2f',
    name: '판교 사무실 2층',
    code: 'PY-2F',
    site: LocationSite.PANGYO,
    building: '본관',
    floor: '2층',
  },
  {
    id: 'loc-pangyo-3f',
    name: '판교 사무실 3층',
    code: 'PY-3F',
    site: LocationSite.PANGYO,
    building: '본관',
    floor: '3층',
  },
  {
    id: 'loc-daejeon-1f',
    name: '대전 사무실 1층',
    code: 'DJ-1F',
    site: LocationSite.DAEJEON,
    building: '본관',
    floor: '1층',
  },
  {
    id: 'loc-daejeon-2f',
    name: '대전 사무실 2층',
    code: 'DJ-2F',
    site: LocationSite.DAEJEON,
    building: '본관',
    floor: '2층',
  },
] as const;

/**
 * Departments (Mock data)
 */
export const DEPARTMENTS = [
  { id: 'dept-dev', name: '개발팀', code: 'DEV' },
  { id: 'dept-qa', name: '품질보증팀', code: 'QA' },
  { id: 'dept-design', name: '디자인팀', code: 'DESIGN' },
  { id: 'dept-pm', name: '상품기획팀', code: 'PM' },
  { id: 'dept-sales', name: '영업팀', code: 'SALES' },
  { id: 'dept-marketing', name: '마케팅팀', code: 'MKT' },
  { id: 'dept-hr', name: '인사팀', code: 'HR' },
  { id: 'dept-finance', name: '재무팀', code: 'FIN' },
  { id: 'dept-it', name: 'IT 지원팀', code: 'IT' },
] as const;

/**
 * User Roles
 */
export const USER_ROLES = [
  { value: 'admin', label: '관리자', description: '전체 시스템 접근' },
  { value: 'manager', label: '매니저', description: '부서 관리' },
  { value: 'user', label: '사용자', description: '기본 사용자 접근' },
] as const;

/**
 * Workflow Status
 */
export const WORKFLOW_STATUSES = [
  { value: 'pending', label: '대기 중', color: 'yellow' },
  { value: 'approved', label: '승인됨', color: 'green' },
  { value: 'rejected', label: '거부됨', color: 'red' },
  { value: 'cancelled', label: '취소됨', color: 'gray' },
] as const;

/**
 * Workflow Types
 */
export const WORKFLOW_TYPES = [
  { value: 'assignment', label: '자산 할당', icon: 'user-plus' },
  { value: 'return', label: '자산 반환', icon: 'user-minus' },
  { value: 'transfer', label: '자산 이전', icon: 'arrows-right-left' },
  { value: 'maintenance', label: '유지보수 요청', icon: 'wrench' },
  { value: 'disposal', label: '폐기 요청', icon: 'trash' },
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
 * Receipt upload constraints
 */
export const RECEIPT_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
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
