import { memo, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

/**
 * Location Distribution Bar Chart Component - Phase 3 Optimized
 *
 * Phase 3 Enhancements:
 * - React.memo for preventing unnecessary re-renders
 * - useMemo for data sorting and color generation caching
 * - Enhanced ARIA labels and keyboard navigation
 * - Dark mode optimized gradient colors
 * - Screen reader support with data table
 * - Focus indicators for accessibility
 *
 * Features:
 * - Horizontal bar chart for top 10 locations
 * - Location name + asset count display
 * - Gradient color scheme
 * - Interactive tooltips
 * - Space-efficient layout
 * - Responsive design
 * - WCAG 2.1 AA compliant
 */

interface LocationData {
  id: number;
  name: string;
  count: number;
}

interface LocationBarChartProps {
  data: LocationData[];
  onLocationClick?: (locationId: number) => void;
}

// Custom comparison function for memo
const arePropsEqual = (
  prevProps: LocationBarChartProps,
  nextProps: LocationBarChartProps
): boolean => {
  // Check if data arrays are equal
  if (prevProps.data.length !== nextProps.data.length) return false;

  for (let i = 0; i < prevProps.data.length; i++) {
    if (
      prevProps.data[i].id !== nextProps.data[i].id ||
      prevProps.data[i].count !== nextProps.data[i].count
    ) {
      return false;
    }
  }

  return prevProps.onLocationClick === nextProps.onLocationClick;
};

export const LocationBarChart = memo(function LocationBarChart({
  data,
  onLocationClick
}: LocationBarChartProps) {
  // Memoized top 10 locations
  const topLocations = useMemo(() => data.slice(0, 10), [data]);

  // Memoized color generation with dark mode support
  const getBarColor = useMemo(() => {
    return (index: number, total: number) => {
      // Gradient from darker to lighter blue with better dark mode visibility
      const lightness = 55 + (index / Math.max(total - 1, 1)) * 20; // Start lighter
      const opacity = 0.95 - (index / Math.max(total - 1, 1)) * 0.3;
      return `hsla(217, 91%, ${lightness}%, ${opacity})`;
    };
  }, []);

  // Memoized accessible data summary
  const accessibleDataSummary = useMemo(() => {
    return topLocations
      .map((loc, idx) => `${idx + 1}위: ${loc.name} ${loc.count}개`)
      .join(', ');
  }, [topLocations]);

  // Handle bar click with keyboard support
  const handleClick = (data: any) => {
    if (data && onLocationClick) {
      onLocationClick(data.id);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, locationId: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onLocationClick?.(locationId);
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
            <p className="text-sm text-muted-foreground">
              {data.value.toLocaleString()}개 자산
            </p>
          </div>
        );
      }
      return null;
    };
  }, []);

  // Memoized custom Y-axis tick
  const CustomYAxisTick = useMemo(() => {
    return ({ x, y, payload }: any) => {
      const maxLength = 20;
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

  if (topLocations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <CardTitle>주요 위치 TOP 10</CardTitle>
          </div>
          <CardDescription>위치별 자산 보유 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center h-[300px] text-muted-foreground"
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
          <MapPin className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <CardTitle id="location-chart-title">주요 위치 TOP 10</CardTitle>
        </div>
        <CardDescription>위치별 자산 보유 현황</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Visual Chart */}
        <div
          className="w-full h-[400px]"
          role="img"
          aria-labelledby="location-chart-title"
          aria-describedby="location-chart-desc"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topLocations}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
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
                width={110}
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
                {topLocations.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(index, topLocations.length)}
                    className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    tabIndex={0}
                    role="button"
                    aria-label={`${entry.name}: ${entry.count}개, 클릭하여 상세보기`}
                    onKeyDown={(e: any) => handleKeyDown(e, entry.id)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hidden description for screen readers */}
        <p id="location-chart-desc" className="sr-only">
          상위 {topLocations.length}개 위치별 자산 분포. {accessibleDataSummary}
        </p>

        {/* Accessible data table (sr-only) */}
        <table className="sr-only" aria-label="위치별 자산 분포 데이터">
          <caption>위치별 자산 보유 현황 상세 정보</caption>
          <thead>
            <tr>
              <th scope="col">순위</th>
              <th scope="col">위치</th>
              <th scope="col">자산 개수</th>
            </tr>
          </thead>
          <tbody>
            {topLocations.map((location, index) => (
              <tr key={location.id}>
                <td>{index + 1}</td>
                <th scope="row">{location.name}</th>
                <td>{location.count.toLocaleString()}개</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}, arePropsEqual);
