import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';

/**
 * Asset Form Page (Placeholder)
 *
 * Handles both create and edit operations based on route
 *
 * TODO Phase 7:
 * - Implement React Hook Form + Zod validation
 * - Add category/location select dropdowns
 * - Add purchase info fields (date, price, warranty)
 * - Connect to useCreateAsset / useUpdateAsset mutations
 * - Handle form submission and navigation
 */
export default function AssetForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    // TODO: Implement form submission logic
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/assets')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? 'Edit Asset' : 'Create New Asset'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? `Editing asset ID: ${id}` : 'Add a new asset to the system'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Details</CardTitle>
          <CardDescription>
            Enter the information for this asset. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Asset Name *</Label>
                  <Input id="name" placeholder="e.g., MacBook Pro 16-inch" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input id="serialNumber" placeholder="e.g., ABC123456" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  {/* TODO: Replace with Select component */}
                  <Input id="category" placeholder="e.g., Computer" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  {/* TODO: Replace with Select component */}
                  <Input id="location" placeholder="e.g., Office 1F" required />
                </div>
              </div>
            </div>

            {/* Purchase Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Purchase Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input id="purchaseDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input id="purchasePrice" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warrantyUntil">Warranty Until</Label>
                  <Input id="warrantyUntil" type="date" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Additional notes about this asset..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/assets')}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2">
                <Save className="h-4 w-4" />
                {isEditMode ? 'Update Asset' : 'Create Asset'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
