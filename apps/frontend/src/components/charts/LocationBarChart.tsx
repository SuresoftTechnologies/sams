import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

/**
 * Location Distribution Bar Chart Component
 *
 * Features:
 * - Horizontal bar chart for top 10 locations
 * - Location name + asset count display
 * - Gradient color scheme
 * - Interactive tooltips
 * - Space-efficient layout
 * - Responsive design
 * - Accessibility support
 */

interface LocationData {
  id: number;
  name: string;
  count: number;
}

interface LocationBarChartProps {
  data: LocationData[];
}

export function LocationBarChart({ data }: LocationBarChartProps) {
  // Take top 10 locations
  const topLocations = data.slice(0, 10);

  // Generate color gradient based on value
  const getBarColor = (index: number, total: number) => {
    // Gradient from darker to lighter blue
    const opacity = 0.9 - (index / total) * 0.5;
    return `hsl(217, 91%, ${45 + (index / total) * 20}%, ${opacity})`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-1">{data.payload.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value.toLocaleString()}개 자산
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Y-axis tick (location name with truncation)
  const CustomYAxisTick = ({ x, y, payload }: any) => {
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

  if (topLocations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <CardTitle>주요 위치 TOP 10</CardTitle>
          </div>
          <CardDescription>위치별 자산 보유 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
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
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <CardTitle>주요 위치 TOP 10</CardTitle>
        </div>
        <CardDescription>위치별 자산 보유 현황</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="w-full h-[400px]"
          role="img"
          aria-label={`상위 ${topLocations.length}개 위치별 자산 분포`}
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
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
