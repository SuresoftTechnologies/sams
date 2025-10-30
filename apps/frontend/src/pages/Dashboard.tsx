import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { useGetAssets } from '@/hooks/useAssets';
import { format } from 'date-fns';

/**
 * Dashboard Page
 *
 * Features:
 * - Asset statistics cards (total, available, in-use, maintenance)
 * - Recent activity list
 * - Loading and error states
 * - Real-time data from TanStack Query
 */
export default function Dashboard() {
  const { data, isLoading, error } = useGetAssets();

  // Calculate statistics from assets data
  const stats = data
    ? [
        {
          label: 'Total Assets',
          value: data.total,
          icon: Package,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          description: 'All registered assets',
        },
        {
          label: 'Available',
          value: data.items.filter((a) => a.status === 'available').length,
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          description: 'Ready to use',
        },
        {
          label: 'In Use',
          value: data.items.filter((a) => a.status === 'in_use').length,
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          description: 'Currently checked out',
        },
        {
          label: 'Maintenance',
          value: data.items.filter((a) => a.status === 'maintenance').length,
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          description: 'Under maintenance',
        },
      ]
    : [];

  // Get recent assets (latest 5)
  const recentAssets = data?.items.slice(0, 5) || [];

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to SureSoft Asset Management System</p>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">
              Failed to load dashboard data. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Welcome to SureSoft Asset Management System
          </p>
        </div>
        <Badge variant="secondary" className="gap-2 w-fit">
          <TrendingUp className="h-3 w-3" />
          Phase 10 Complete
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Assets</CardTitle>
          <CardDescription>Latest assets added to the system</CardDescription>
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
          ) : recentAssets.length > 0 ? (
            <div className="space-y-4">
              {recentAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{asset.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Asset Tag: {asset.asset_tag || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        asset.status === 'available'
                          ? 'default'
                          : asset.status === 'in_use'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {asset.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(asset.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No assets found. Create your first asset to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
