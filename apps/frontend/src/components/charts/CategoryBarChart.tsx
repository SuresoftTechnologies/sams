import { memo, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid } from 'lucide-react';

/**
 * Category Distribution Bar Chart Component - Phase 3 Optimized
 *
 * Phase 3 Enhancements:
 * - React.memo for preventing unnecessary re-renders
 * - useMemo for data sorting and processing caching
 * - Enhanced ARIA labels and keyboard navigation
 * - Dark mode optimized gradient colors
 * - Screen reader support with data table
 * - Focus management for accessibility
 *
 * Features:
 * - Horizontal bar chart for all categories
 * - Shows top 10 categories (sorted by count)
 * - Gradient color scheme based on count
 * - Interactive tooltips with count and percentage
 * - Responsive design
 * - Click interaction for navigation
 * - WCAG 2.1 AA compliant
 */

interface CategoryData {
  id: string;
  name: string;
  count: number;
  percentage: number;
}

interface CategoryBarChartProps {
  data: CategoryData[];
  totalAssets: number;
  onCategoryClick?: (categoryId: string) => void;
}

// Custom comparison function for memo
const arePropsEqual = (
  prevProps: CategoryBarChartProps,
  nextProps: CategoryBarChartProps
): boolean => {
  // Check if data arrays are equal
  if (prevProps.data.length !== nextProps.data.length) return false;
  if (prevProps.totalAssets !== nextProps.totalAssets) return false;

  for (let i = 0; i < prevProps.data.length; i++) {
    if (
      prevProps.data[i].id !== nextProps.data[i].id ||
      prevProps.data[i].count !== nextProps.data[i].count
    ) {
      return false;
    }
  }

  return prevProps.onCategoryClick === nextProps.onCategoryClick;
};

export const CategoryBarChart = memo(function CategoryBarChart({
  data,
  totalAssets,
  onCategoryClick
}: CategoryBarChartProps) {
  // Memoized chart data - sort by count descending and take top 10
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [data]);

  // Memoized color generation with dark mode support
  const getBarColor = useMemo(() => {
    return (index: number, total: number) => {
      // Gradient from darker to lighter blue with better dark mode visibility
      const baseHue = 217; // Blue hue
      const saturation = 91;
      const lightness = 55 + (index / Math.max(total - 1, 1)) * 25; // Start lighter for dark mode
      const opacity = 0.95 - (index / Math.max(total - 1, 1)) * 0.35;
      return `hsla(${baseHue}, ${saturation}%, ${lightness}%, ${opacity})`;
    };
  }, []);

  // Memoized accessible data summary
  const accessibleDataSummary = useMemo(() => {
    return chartData
      .map((cat, idx) => `${idx + 1}위: ${cat.name} ${cat.count}개 (${cat.percentage}%)`)
      .join(', ');
  }, [chartData]);

  // Handle bar click with keyboard support
  const handleClick = (data: any) => {
    if (data && onCategoryClick) {
      onCategoryClick(data.id);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, categoryId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onCategoryClick?.(categoryId);
    }
  };

  // Memoized custom tooltip
  const CustomTooltip = useMemo(() => {
    return ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0];
        return (
          <div
            className="bg-popover border border-border rounded-lg shadow-lg p-3"
            role="tooltip"
          >
            <p className="font-semibold text-sm mb-1">{data.payload.name}</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{data.value.toLocaleString()}개 자산</p>
              <p className="text-xs">전체의 {data.payload.percentage}%</p>
            </div>
          </div>
        );
      }
      return null;
    };
  }, []);

  // Memoized custom Y-axis tick
  const CustomYAxisTick = useMemo(() => {
    return ({ x, y, payload }: any) => {
      const maxLength = 15;
      const text = payload.value.length > maxLength
        ? `${payload.value.substring(0, maxLength)}...`
        : payload.value;

      return (
        <g transform={`translate(${x},${y})`}>
          <text
            x={0}
            y={0}
            dy={4}
            textAnchor="end"
            fill="currentColor"
            className="fill-muted-foreground text-xs"
          >
            {text}
          </text>
        </g>
      );
    };
  }, []);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <CardTitle>카테고리 분포</CardTitle>
          </div>
          <CardDescription>카테고리별 자산 분류 (상위 10개)</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center h-[400px] text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm">표시할 데이터가 없습니다</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <CardTitle id="category-chart-title">카테고리 분포</CardTitle>
        </div>
        <CardDescription>카테고리별 자산 분류 (상위 10개)</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Visual Chart */}
        <div
          className="w-full h-[400px]"
          role="img"
          aria-labelledby="category-chart-title"
          aria-describedby="category-chart-desc"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={true}
                vertical={false}
                className="stroke-muted"
              />
              <XAxis
                type="number"
                className="text-xs"
                tick={{ fill: 'currentColor', className: 'fill-muted-foreground' }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={95}
                tick={<CustomYAxisTick />}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
                maxBarSize={30}
                onClick={handleClick}
                label={{
                  position: 'right',
                  className: 'fill-muted-foreground text-xs font-medium',
                  formatter: (value: number) => value.toLocaleString(),
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(index, chartData.length)}
                    className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    tabIndex={0}
                    role="button"
                    aria-label={`${entry.name}: ${entry.count}개 (${entry.percentage}%), 클릭하여 상세보기`}
                    onKeyDown={(e: any) => handleKeyDown(e, entry.id)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hidden description for screen readers */}
        <p id="category-chart-desc" className="sr-only">
          상위 {chartData.length}개 카테고리별 자산 분포. {accessibleDataSummary}
        </p>

        {/* Accessible data table (sr-only) */}
        <table className="sr-only" aria-label="카테고리별 자산 분포 데이터">
          <caption>카테고리별 자산 분류 상세 정보</caption>
          <thead>
            <tr>
              <th scope="col">순위</th>
              <th scope="col">카테고리</th>
              <th scope="col">자산 개수</th>
              <th scope="col">비율</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((category, index) => (
              <tr key={category.id}>
                <td>{index + 1}</td>
                <th scope="row">{category.name}</th>
                <td>{category.count.toLocaleString()}개</td>
                <td>{category.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.length > 10 && (
          <p
            className="text-xs text-muted-foreground text-center mt-2"
            role="status"
            aria-live="polite"
          >
            +{data.length - 10}개 추가 카테고리
          </p>
        )}
      </CardContent>
    </Card>
  );
}, arePropsEqual);
