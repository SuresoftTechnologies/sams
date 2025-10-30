import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { assetSchema, type AssetFormData } from '@/lib/validators';
import { useCreateAsset, useUpdateAsset, useGetAsset } from '@/hooks/useAssets';

/**
 * Asset Form Page
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Handles both create and edit modes
 * - Category and location selects (mock data)
 * - Purchase information fields
 * - Loading states for edit mode
 */

// Mock categories and locations (TODO: fetch from API in Phase 12)
const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'Computer' },
  { id: 'cat-2', name: 'Monitor' },
  { id: 'cat-3', name: 'Keyboard' },
  { id: 'cat-4', name: 'Mouse' },
  { id: 'cat-5', name: 'Furniture' },
];

const MOCK_LOCATIONS = [
  { id: 'loc-1', name: 'Office 1F' },
  { id: 'loc-2', name: 'Office 2F' },
  { id: 'loc-3', name: 'Office 3F' },
  { id: 'loc-4', name: 'Storage' },
  { id: 'loc-5', name: 'Meeting Room A' },
];

export default function AssetForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const { data: asset, isLoading: isLoadingAsset } = useGetAsset(id || '');
  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset(id!);

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: '',
      serialNumber: '',
      description: '',
      categoryId: '',
      locationId: '',
      purchaseDate: '',
      purchasePrice: null,
      warrantyUntil: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && asset) {
      form.reset({
        name: asset.name,
        serialNumber: asset.serialNumber || '',
        description: asset.description || '',
        categoryId: asset.categoryId,
        locationId: asset.locationId,
        purchaseDate: asset.purchaseDate || '',
        purchasePrice: asset.purchasePrice ?? null,
        warrantyUntil: asset.warrantyUntil || '',
      });
    }
  }, [asset, isEditMode, form]);

  const onSubmit = (data: AssetFormData) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoadingAsset) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            {isEditMode ? `Editing: ${asset?.name}` : 'Add a new asset to the system'}
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., MacBook Pro 16-inch" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., ABC123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MOCK_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="locationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MOCK_LOCATIONS.map((loc) => (
                              <SelectItem key={loc.id} value={loc.id}>
                                {loc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Purchase Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Purchase Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price (KRW)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === '' ? null : Number(value));
                            }}
                          />
                        </FormControl>
                        <FormDescription>Enter amount in Korean Won</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warrantyUntil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warranty Until</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <textarea
                        className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-transparent focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Additional notes about this asset..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Optional details about the asset</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/assets')}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" className="gap-2" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {isEditMode ? 'Update Asset' : 'Create Asset'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
