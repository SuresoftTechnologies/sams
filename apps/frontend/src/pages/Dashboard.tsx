import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  LayoutGrid,
  MapPin,
  Activity,
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router';

/**
 * Dashboard Page
 *
 * Features:
 * - Real-time asset statistics (total, status distribution)
 * - Category distribution with percentages
 * - Top 10 locations by asset count
 * - Recent assets activity
 * - Loading and error states
 * - Responsive grid layout
 */
export default function Dashboard() {
  const { data: stats, isLoading, error } = useDashboardStats();

  // Statistics cards configuration
  const statsCards = stats
    ? [
        {
          label: '전체 자산',
          value: stats.totalAssets.toLocaleString(),
          icon: Package,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-950',
          description: `${stats.totalCategories}개 카테고리, ${stats.totalLocations}개 위치`,
        },
        {
          label: '사용 가능',
          value: stats.statusDistribution.available.toLocaleString(),
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-950',
          description: '배포 준비 완료',
          percentage: stats.totalAssets > 0
            ? Math.round((stats.statusDistribution.available / stats.totalAssets) * 100)
            : 0,
        },
        {
          label: '사용 중',
          value: stats.statusDistribution.in_use.toLocaleString(),
          icon: Clock,
          color: 'text-amber-500',
          bgColor: 'bg-amber-50 dark:bg-amber-950',
          description: '현재 배포됨',
          percentage: stats.totalAssets > 0
            ? Math.round((stats.statusDistribution.in_use / stats.totalAssets) * 100)
            : 0,
        },
        {
          label: '유지보수',
          value: stats.statusDistribution.maintenance.toLocaleString(),
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-950',
          description: '유지보수 중',
          percentage: stats.totalAssets > 0
            ? Math.round((stats.statusDistribution.maintenance / stats.totalAssets) * 100)
            : 0,
        },
      ]
    : [];

  // Format status for display
  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get badge variant for status
  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'available':
        return 'default';
      case 'in_use':
        return 'secondary';
      case 'maintenance':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground">SureSoft 자산 관리 시스템에 오신 것을 환영합니다</p>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <p className="text-destructive font-semibold">대시보드 데이터 로딩 실패</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {error instanceof Error ? error.message : '나중에 다시 시도해주세요.'}
                </p>
              </div>
              <Button variant="outline" onClick={() => window.location.reload()}>
                다시 시도
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          SureSoft 자산 관리 시스템에 오신 것을 환영합니다
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-10 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    {stat.percentage !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        ({stat.percentage}%)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Category Distribution */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-muted-foreground" />
              <CardTitle>카테고리 분포</CardTitle>
            </div>
            <CardDescription>카테고리별 자산 분류</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : stats && stats.categoryDistribution.length > 0 ? (
              <div className="space-y-3">
                {stats.categoryDistribution.slice(0, 8).map((category) => (
                  <div key={category.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-muted-foreground">
                        {category.count.toLocaleString()} ({category.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
                {stats.categoryDistribution.length > 8 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{stats.categoryDistribution.length - 8}개 추가 카테고리
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                카테고리 데이터가 없습니다
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <CardTitle>주요 위치</CardTitle>
            </div>
            <CardDescription>위치별 자산 현황</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                ))}
              </div>
            ) : stats && stats.locationDistribution.length > 0 ? (
              <div className="space-y-3">
                {stats.locationDistribution.map((location, index) => (
                  <div
                    key={location.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-5">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium truncate">{location.name}</span>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {location.count.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                위치 데이터가 없습니다
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <CardTitle>최근 자산</CardTitle>
              </div>
              <CardDescription>시스템에 추가된 최신 자산</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/assets">전체 보기</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats && stats.recentAssets.length > 0 ? (
            <div className="space-y-4">
              {stats.recentAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <Link
                      to={`/assets/${asset.id}`}
                      className="text-sm font-medium leading-none hover:underline block truncate"
                    >
                      {asset.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {asset.asset_tag}
                      {asset.category_name && ` • ${asset.category_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <Badge variant={getStatusVariant(asset.status)}>
                      {formatStatus(asset.status)}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(asset.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                자산을 찾을 수 없습니다. 첫 번째 자산을 생성하세요.
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link to="/assets/new">자산 생성</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
