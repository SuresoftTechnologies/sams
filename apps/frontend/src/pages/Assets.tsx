import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';

/**
 * Assets List Page (Placeholder)
 *
 * TODO Phase 7:
 * - Fetch assets using useGetAssets hook
 * - Implement AssetTable component with @tanstack/react-table
 * - Add search/filter functionality
 * - Implement pagination
 * - Add sorting by columns
 */
export default function Assets() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">Manage all your company assets</p>
        </div>
        <Button onClick={() => navigate('/assets/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search assets..." className="pl-8" />
            </div>
            {/* TODO: Add filter dropdowns (category, location, status) */}
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Assets</CardTitle>
          <CardDescription>A list of all registered assets in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No assets found</p>
            <p className="text-sm">Connect to backend API or create your first asset</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Import icon for placeholder
import { Package } from 'lucide-react';
