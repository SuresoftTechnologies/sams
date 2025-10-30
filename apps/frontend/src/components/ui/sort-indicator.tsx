import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortIndicatorProps {
  active: boolean;
  direction?: 'asc' | 'desc';
  className?: string;
}

/**
 * SortIndicator Component
 *
 * Visual indicator for table column sorting state
 * - Shows inactive state when column is not sorted
 * - Shows up/down arrow when column is sorted
 * - Provides clear visual feedback for sorting direction
 *
 * Usage:
 * <SortIndicator active={sortField === 'name'} direction={sortOrder} />
 */
export function SortIndicator({ active, direction, className }: SortIndicatorProps) {
  if (!active) {
    return (
      <ArrowUpDown
        className={cn('inline-block ml-1 h-3.5 w-3.5 opacity-40', className)}
        aria-hidden="true"
      />
    );
  }

  return direction === 'asc' ? (
    <ArrowUp
      className={cn('inline-block ml-1 h-3.5 w-3.5', className)}
      aria-hidden="true"
    />
  ) : (
    <ArrowDown
      className={cn('inline-block ml-1 h-3.5 w-3.5', className)}
      aria-hidden="true"
    />
  );
}
