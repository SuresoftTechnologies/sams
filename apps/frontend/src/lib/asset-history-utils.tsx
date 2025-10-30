import {
  FileText,
  Edit,
  UserPlus,
  UserMinus,
  ArrowRightLeft,
  MapPin,
  AlertCircle,
  Wrench,
  CheckCircle,
  Trash2,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import type { HistoryAction } from '@/types/api';

/**
 * Asset History Utilities
 *
 * Helper functions for displaying asset history events
 */

/**
 * Get icon component for history action
 */
export function getHistoryActionIcon(action: HistoryAction): LucideIcon {
  const iconMap: Record<HistoryAction, LucideIcon> = {
    created: FileText,
    updated: Edit,
    assigned: UserPlus,
    unassigned: UserMinus,
    transferred: ArrowRightLeft,
    location_changed: MapPin,
    status_changed: AlertCircle,
    maintenance_start: Wrench,
    maintenance_end: CheckCircle,
    disposed: Trash2,
    deleted: Trash2,
    restored: RotateCcw,
  };

  return iconMap[action] || FileText;
}

/**
 * Get color class for history action
 */
export function getHistoryActionColor(action: HistoryAction): string {
  const colorMap: Record<HistoryAction, string> = {
    created: 'text-green-600 bg-green-50',
    updated: 'text-blue-600 bg-blue-50',
    assigned: 'text-purple-600 bg-purple-50',
    unassigned: 'text-orange-600 bg-orange-50',
    transferred: 'text-indigo-600 bg-indigo-50',
    location_changed: 'text-cyan-600 bg-cyan-50',
    status_changed: 'text-yellow-600 bg-yellow-50',
    maintenance_start: 'text-amber-600 bg-amber-50',
    maintenance_end: 'text-emerald-600 bg-emerald-50',
    disposed: 'text-red-600 bg-red-50',
    deleted: 'text-red-600 bg-red-50',
    restored: 'text-teal-600 bg-teal-50',
  };

  return colorMap[action] || 'text-gray-600 bg-gray-50';
}

/**
 * Get Korean label for history action
 */
export function getHistoryActionLabel(action: HistoryAction): string {
  const labelMap: Record<HistoryAction, string> = {
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

  return labelMap[action] || action;
}

/**
 * Format change values for display
 */
export function formatChangeValue(key: string, value: unknown): string {
  if (value === null || value === undefined) {
    return '없음';
  }

  // Handle status changes
  if (key === 'status') {
    const statusMap: Record<string, string> = {
      issued: '지급됨',
      loaned: '대여용',
      general: '일반',
      stock: '재고',
      server_room: '서버실',
      disposed: '폐기',
    };
    return statusMap[String(value)] || String(value);
  }

  // Handle boolean values
  if (typeof value === 'boolean') {
    return value ? '예' : '아니오';
  }

  // Handle dates
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      return new Date(value).toLocaleDateString('ko-KR');
    } catch {
      return String(value);
    }
  }

  return String(value);
}

/**
 * Get field label in Korean
 */
export function getFieldLabel(key: string): string {
  const labelMap: Record<string, string> = {
    status: '상태',
    assigned_to: '담당자',
    location_id: '위치',
    category_id: '카테고리',
    model: '모델',
    serial_number: '일련번호',
    purchase_date: '구매일',
    purchase_price: '구매가',
    grade: '등급',
    notes: '메모',
    deleted_at: '삭제 시간',
  };

  return labelMap[key] || key;
}
