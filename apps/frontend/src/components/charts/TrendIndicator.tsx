import { memo, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Trend Indicator Component - Phase 3 Optimized
 *
 * Phase 3 Enhancements:
 * - React.memo for preventing unnecessary re-renders
 * - useMemo for calculation caching
 * - Enhanced ARIA labels for screen readers
 * - Dark mode optimized colors
 * - Better semantic HTML
 *
 * Features:
 * - Shows increase/decrease/no-change with icons
 * - Color-coded: green (up), red (down), gray (neutral)
 * - Percentage display
 * - Compact design for KPI cards
 * - WCAG 2.1 AA compliant
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

// Custom comparison function for memo
const arePropsEqual = (
  prevProps: TrendIndicatorProps,
  nextProps: TrendIndicatorProps
): boolean => {
  return (
    prevProps.current === nextProps.current &&
    prevProps.previous === nextProps.previous &&
    prevProps.label === nextProps.label &&
    prevProps.compact === nextProps.compact &&
    prevProps.className === nextProps.className
  );
};

export const TrendIndicator = memo(function TrendIndicator({
  current,
  previous,
  label = '전월 대비',
  compact = false,
  className,
}: TrendIndicatorProps) {
  // Memoized calculations
  const trendData = useMemo(() => {
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

    // Format percentage for display
    const formattedPercentage = Math.abs(percentageChange).toFixed(1);
    const sign = trend === 'up' ? '+' : trend === 'down' ? '-' : '';

    return {
      percentageChange,
      absoluteChange,
      trend,
      formattedPercentage,
      sign,
    };
  }, [current, previous]);

  // Trend configuration with dark mode support
  const trendConfig = useMemo(() => {
    return {
      up: {
        icon: TrendingUp,
        color: 'text-green-600 dark:text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950/50',
        label: '증가',
      },
      down: {
        icon: TrendingDown,
        color: 'text-red-600 dark:text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-950/50',
        label: '감소',
      },
      neutral: {
        icon: Minus,
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-950/50',
        label: '변화없음',
      },
    };
  }, []);

  const config = trendConfig[trendData.trend];
  const Icon = config.icon;

  // Accessibility label
  const ariaLabel = useMemo(() => {
    if (compact) {
      return `${label} ${trendData.sign}${trendData.formattedPercentage}% ${config.label}`;
    }
    return `${label} ${trendData.absoluteChange > 0 ? '+' : ''}${trendData.absoluteChange.toLocaleString()}개, ${trendData.sign}${trendData.formattedPercentage}% ${config.label}`;
  }, [label, trendData, config.label, compact]);

  if (compact) {
    return (
      <div
        className={cn('flex items-center gap-1', className)}
        role="status"
        aria-label={ariaLabel}
      >
        <Icon className={cn('h-3 w-3', config.color)} aria-hidden="true" />
        <span className={cn('text-xs font-medium', config.color)}>
          {trendData.sign}{trendData.formattedPercentage}%
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="status"
      aria-label={ariaLabel}
    >
      <div className={cn('p-1 rounded', config.bgColor)}>
        <Icon className={cn('h-3 w-3', config.color)} aria-hidden="true" />
      </div>
      <div className="flex flex-col">
        <span className={cn('text-xs font-medium', config.color)}>
          {trendData.sign}{trendData.formattedPercentage}%
        </span>
        <span className="text-xs text-muted-foreground">
          {trendData.absoluteChange > 0 ? '+' : ''}{trendData.absoluteChange.toLocaleString()}
        </span>
      </div>
    </div>
  );
}, arePropsEqual);
