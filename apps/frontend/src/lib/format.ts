import { format, formatDistance, formatRelative, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * Formatting Utilities
 *
 * Centralized formatting functions for dates, numbers, currency, etc.
 * Uses date-fns for date formatting with Korean locale support
 */

/**
 * Format date to readable string
 * @param date - Date string or Date object
 * @param formatStr - Format string (default: 'yyyy-MM-dd')
 * @returns Formatted date string
 *
 * @example
 * formatDate('2024-01-15') // '2024-01-15'
 * formatDate('2024-01-15', 'PPP') // 'January 15, 2024'
 * formatDate(new Date(), 'yyyy년 MM월 dd일') // '2024년 01월 15일'
 */
export function formatDate(
  date: string | Date | undefined | null,
  formatStr: string = 'yyyy-MM-dd'
): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

/**
 * Format date with Korean locale
 * @param date - Date string or Date object
 * @param formatStr - Format string (default: 'PPP')
 * @returns Formatted date string in Korean
 *
 * @example
 * formatDateKo('2024-01-15') // '2024년 1월 15일'
 * formatDateKo('2024-01-15', 'PPPp') // '2024년 1월 15일 오전 12:00'
 */
export function formatDateKo(
  date: string | Date | undefined | null,
  formatStr: string = 'PPP'
): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: ko });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

/**
 * Format date to relative time (e.g., "2 days ago")
 * @param date - Date string or Date object
 * @param baseDate - Base date to compare against (default: now)
 * @returns Relative time string
 *
 * @example
 * formatDateRelative('2024-01-13') // '2 days ago'
 */
export function formatDateRelative(
  date: string | Date | undefined | null,
  baseDate: Date = new Date()
): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistance(dateObj, baseDate, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return '-';
  }
}

/**
 * Format date to relative time with context (e.g., "yesterday at 5:30 PM")
 * @param date - Date string or Date object
 * @param baseDate - Base date to compare against (default: now)
 * @returns Relative time string with context
 *
 * @example
 * formatDateRelativeContext('2024-01-14') // 'yesterday at 12:00 AM'
 */
export function formatDateRelativeContext(
  date: string | Date | undefined | null,
  baseDate: Date = new Date()
): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatRelative(dateObj, baseDate);
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return '-';
  }
}

/**
 * Format datetime to readable string
 * @param date - Date string or Date object
 * @returns Formatted datetime string
 *
 * @example
 * formatDateTime('2024-01-15T10:30:00Z') // '2024-01-15 10:30'
 */
export function formatDateTime(date: string | Date | undefined | null): string {
  return formatDate(date, 'yyyy-MM-dd HH:mm');
}

/**
 * Format currency (Korean Won)
 * @param amount - Number amount
 * @param options - Intl.NumberFormat options
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1000000) // '₩1,000,000'
 * formatCurrency(1500000.50) // '₩1,500,001' (rounded)
 */
export function formatCurrency(
  amount: number | undefined | null,
  options?: Intl.NumberFormatOptions
): string {
  if (amount === undefined || amount === null) return '-';

  try {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      ...options,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return '-';
  }
}

/**
 * Format number with thousand separators
 * @param value - Number value
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 *
 * @example
 * formatNumber(1000000) // '1,000,000'
 * formatNumber(1234.567, { maximumFractionDigits: 2 }) // '1,234.57'
 */
export function formatNumber(
  value: number | undefined | null,
  options?: Intl.NumberFormatOptions
): string {
  if (value === undefined || value === null) return '-';

  try {
    return new Intl.NumberFormat('ko-KR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options,
    }).format(value);
  } catch (error) {
    console.error('Error formatting number:', error);
    return '-';
  }
}

/**
 * Format percentage
 * @param value - Number value (0-1 or 0-100)
 * @param isDecimal - Whether the input is in decimal format (0-1)
 * @returns Formatted percentage string
 *
 * @example
 * formatPercent(0.85, true) // '85%'
 * formatPercent(85, false) // '85%'
 */
export function formatPercent(
  value: number | undefined | null,
  isDecimal: boolean = true
): string {
  if (value === undefined || value === null) return '-';

  try {
    const percentValue = isDecimal ? value * 100 : value;
    return `${percentValue.toFixed(1)}%`;
  } catch (error) {
    console.error('Error formatting percent:', error);
    return '-';
  }
}

/**
 * Format file size (bytes to human readable)
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 *
 * @example
 * formatFileSize(1024) // '1 KB'
 * formatFileSize(1536000) // '1.46 MB'
 */
export function formatFileSize(bytes: number | undefined | null): string {
  if (bytes === undefined || bytes === null || bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  return `${size.toFixed(2)} ${units[i]}`;
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 *
 * @example
 * truncateText('Long text here', 10) // 'Long te...'
 */
export function truncateText(
  text: string | undefined | null,
  maxLength: number
): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Format phone number
 * @param phone - Phone number string
 * @returns Formatted phone number
 *
 * @example
 * formatPhoneNumber('01012345678') // '010-1234-5678'
 * formatPhone('0212345678') // '02-1234-5678'
 */
export function formatPhoneNumber(phone: string | undefined | null): string {
  if (!phone) return '-';

  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');

  // Format based on length
  if (cleaned.length === 11) {
    // Mobile: 010-1234-5678
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    // Local: 02-1234-5678 or 031-123-4567
    if (cleaned.startsWith('02')) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
  }

  return phone; // Return original if format not recognized
}

/**
 * Format duration in milliseconds to human readable
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 *
 * @example
 * formatDuration(65000) // '1m 5s'
 * formatDuration(3665000) // '1h 1m 5s'
 */
export function formatDuration(ms: number | undefined | null): string {
  if (ms === undefined || ms === null || ms === 0) return '0s';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours % 24 > 0) parts.push(`${hours % 24}h`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
  if (seconds % 60 > 0) parts.push(`${seconds % 60}s`);

  return parts.join(' ');
}
