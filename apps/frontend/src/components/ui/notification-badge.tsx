import * as React from 'react';
import { cn } from '@/lib/utils';

export interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  className?: string;
  ariaLabel?: string;
  variant?: 'default' | 'compact';
}

/**
 * NotificationBadge Component
 *
 * Displays a notification count badge, typically used for pending items
 * Features:
 * - Auto-hides when count is 0
 * - Shows "99+" when count exceeds maxCount
 * - Accessible with aria-label
 * - Animated appearance
 * - Two variants: default (desktop) and compact (mobile)
 */
export function NotificationBadge({
  count,
  maxCount = 99,
  className,
  ariaLabel,
  variant = 'default',
}: NotificationBadgeProps) {
  // Don't render if count is 0
  if (count <= 0) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-red-500 text-white font-semibold text-xs leading-none transition-all duration-200 animate-in fade-in zoom-in',
        variant === 'default' && 'min-w-[18px] h-[18px] px-1.5',
        variant === 'compact' && 'min-w-[16px] h-[16px] px-1',
        className
      )}
      aria-label={ariaLabel || `${count} pending items`}
      role="status"
    >
      {displayCount}
    </span>
  );
}
