import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Trend Indicator Component
 *
 * Features:
 * - Shows increase/decrease/no-change with icons
 * - Color-coded: green (up), red (down), gray (neutral)
 * - Percentage display
 * - Compact design for KPI cards
 * - Accessibility support
 */

interface TrendIndicatorProps {
  /** Current value */
  current: number;
  /** Previous value for comparison */
  previous: number;
  /** Optional custom label (default: "전월 대비") */
  label?: string;
  /** Show as compact variant (icon + percentage only) */
  compact?: boolean;
  /** Optional className for styling */
  className?: string;
}

export function TrendIndicator({
  current,
  previous,
  label = '전월 대비',
  compact = false,
  className,
}: TrendIndicatorProps) {
  // Calculate percentage change
  const calculateChange = () => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  };

  const percentageChange = calculateChange();
  const absoluteChange = current - previous;

  // Determine trend
  const trend = percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'neutral';

  // Icon and color based on trend
  const trendConfig = {
    up: {
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950',
      label: '증가',
    },
    down: {
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950',
      label: '감소',
    },
    neutral: {
      icon: Minus,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-950',
      label: '변화없음',
    },
  };

  const config = trendConfig[trend];
  const Icon = config.icon;

  // Format percentage for display
  const formattedPercentage = Math.abs(percentageChange).toFixed(1);
  const sign = trend === 'up' ? '+' : trend === 'down' ? '-' : '';

  if (compact) {
    return (
      <div
        className={cn('flex items-center gap-1', className)}
        role="status"
        aria-label={`${label} ${sign}${formattedPercentage}% ${config.label}`}
      >
        <Icon className={cn('h-3 w-3', config.color)} aria-hidden="true" />
        <span className={cn('text-xs font-medium', config.color)}>
          {sign}{formattedPercentage}%
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="status"
      aria-label={`${label} ${absoluteChange > 0 ? '+' : ''}${absoluteChange.toLocaleString()}개, ${sign}${formattedPercentage}% ${config.label}`}
    >
      <div className={cn('p-1 rounded', config.bgColor)}>
        <Icon className={cn('h-3 w-3', config.color)} aria-hidden="true" />
      </div>
      <div className="flex flex-col">
        <span className={cn('text-xs font-medium', config.color)}>
          {sign}{formattedPercentage}%
        </span>
        <span className="text-xs text-muted-foreground">
          {absoluteChange > 0 ? '+' : ''}{absoluteChange.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
