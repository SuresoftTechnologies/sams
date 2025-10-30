# Quick Reference - Enhanced Frontend Components

## New Components & Hooks

### 🔢 Pagination Component

```tsx
import { Pagination } from '@/components/ui/pagination';

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  pageSize={pageSize}
  onPageChange={setCurrentPage}
  onPageSizeChange={setPageSize}
  showPageSize={true}
  pageSizeOptions={[25, 50, 100, 200]}
/>
```

### 🔍 Search Input Component

```tsx
import { SearchInput } from '@/components/ui/search-input';

<SearchInput
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search assets..."
  isLoading={isSearching}
  enableShortcut={true}  // Press / to focus
/>
```

### 🎣 usePagination Hook

```tsx
import { usePagination } from '@/hooks/usePagination';

const {
  currentPage,          // Current page number (1-indexed)
  pageSize,             // Items per page
  setCurrentPage,       // Change page
  setPageSize,          // Change page size (resets to page 1)
  getPaginationParams,  // Returns { skip, limit } for API
  resetPage,            // Reset to page 1
  getPaginationMeta,    // Calculate totalPages, etc.
} = usePagination({
  defaultPageSize: 50,
  syncWithUrl: true,     // Sync with ?page=1&limit=50
});

// For API calls
const { skip, limit } = getPaginationParams();
const { data } = useGetAssets({ skip, limit });
```

### 🔎 useSearch Hook

```tsx
import { useSearch } from '@/hooks/useSearch';

const {
  searchQuery,           // Immediate value
  debouncedSearchQuery,  // Delayed 300ms
  setSearchQuery,        // Update search
  clearSearch,           // Clear search
  isDebouncing,          // Is currently debouncing
} = useSearch({
  debounceMs: 300,
  syncWithUrl: true,     // Sync with ?search=laptop
  minLength: 0,          // Min chars before search
});

// Use debounced value for API
const { data } = useGetAssets({ search: debouncedSearchQuery });
```

---

## Complete Example

```tsx
import { useState } from 'react';
import { usePagination } from '@/hooks/usePagination';
import { useSearch } from '@/hooks/useSearch';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { useGetAssets } from '@/hooks/useAssets';

export default function AssetList() {
  // Pagination
  const {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    getPaginationParams,
    resetPage,
  } = usePagination({ defaultPageSize: 50 });

  // Search
  const {
    searchQuery,
    debouncedSearchQuery,
    setSearchQuery,
    isDebouncing,
  } = useSearch({ debounceMs: 300 });

  // Filters
  const [filters, setFilters] = useState({});

  // Fetch data
  const { skip, limit } = getPaginationParams();
  const { data, isLoading } = useGetAssets({
    skip,
    limit,
    search: debouncedSearchQuery,
    ...filters,
  });

  // Reset page when filters change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    resetPage();
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    resetPage();
  };

  const assets = data?.items ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div>
      {/* Search */}
      <SearchInput
        value={searchQuery}
        onChange={handleSearchChange}
        isLoading={isDebouncing || isLoading}
      />

      {/* Filters */}
      <Filters filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Results */}
      <AssetTable assets={assets} isLoading={isLoading} />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search input |
| `Esc` | Clear search and blur |
| `Tab` | Navigate between controls |
| `Arrow Keys` | Navigate pagination |
| `Enter` | Activate button |
| `Space` | Activate button |

---

## URL Parameters

The hooks automatically sync with URL:

```
/assets?page=2&limit=100&search=laptop
         ↓         ↓           ↓
    currentPage  pageSize  searchQuery
```

**Benefits**:
- Shareable URLs
- Browser back/forward works
- Bookmarkable searches
- State preserved on reload

---

## Performance Tips

1. **Always use debounced search**:
   ```tsx
   // ❌ Don't use immediate value for API
   useGetAssets({ search: searchQuery })

   // ✅ Use debounced value
   useGetAssets({ search: debouncedSearchQuery })
   ```

2. **Reset page when filters change**:
   ```tsx
   const handleFiltersChange = (filters) => {
     setFilters(filters);
     resetPage(); // Important!
   };
   ```

3. **Show loading states**:
   ```tsx
   <SearchInput
     isLoading={isDebouncing || isLoading}
   />

   {isLoading ? (
     <Skeleton />
   ) : (
     <AssetTable assets={assets} />
   )}
   ```

4. **Match skeleton count to page size**:
   ```tsx
   {isLoading ? (
     Array.from({ length: pageSize }).map((_, i) => (
       <Skeleton key={i} />
     ))
   ) : (
     // Actual content
   )}
   ```

---

## Common Patterns

### Reset to Page 1

```tsx
// When search changes
const handleSearch = (query: string) => {
  setSearchQuery(query);
  resetPage();
};

// When filters change
const handleFilters = (filters) => {
  setFilters(filters);
  resetPage();
};

// When sorting changes
const handleSort = (field, order) => {
  setSortField(field);
  setSortOrder(order);
  resetPage();
};
```

### Calculate Metadata

```tsx
const { getPaginationMeta } = usePagination();
const meta = getPaginationMeta(totalItems);

console.log(meta);
// {
//   totalPages: 45,
//   startItem: 51,
//   endItem: 100,
//   hasNextPage: true,
//   hasPrevPage: true,
// }
```

### Disable Controls

```tsx
<Button
  onClick={() => setCurrentPage(currentPage - 1)}
  disabled={currentPage === 1}
>
  Previous
</Button>

<Button
  onClick={() => setCurrentPage(currentPage + 1)}
  disabled={currentPage === totalPages}
>
  Next
</Button>
```

---

## Backend Integration

### Expected API Response

```typescript
interface AssetListResponse {
  items: Asset[];
  total: number;
  skip?: number;
  limit?: number;
}
```

### Example API Call

```typescript
// Frontend sends
GET /api/v1/assets?skip=50&limit=50&search=laptop&status=available

// Backend returns
{
  "items": [...],  // 50 assets
  "total": 2213,   // Total count
  "skip": 50,
  "limit": 50
}
```

### Backend Implementation (FastAPI)

```python
@router.get("/assets")
async def list_assets(
    skip: int = 0,
    limit: int = 50,
    search: str | None = None,
):
    query = db.query(Asset)

    if search:
        query = query.filter(
            or_(
                Asset.asset_tag.ilike(f"%{search}%"),
                Asset.name.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    items = query.offset(skip).limit(limit).all()

    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
    }
```

---

## Troubleshooting

### Search not working?

```tsx
// ❌ Wrong - using immediate value
const { data } = useGetAssets({ search: searchQuery });

// ✅ Correct - using debounced value
const { data } = useGetAssets({ search: debouncedSearchQuery });
```

### Pagination stuck on wrong page?

```tsx
// Make sure to reset when filters change
const handleFiltersChange = (filters) => {
  setFilters(filters);
  resetPage(); // Add this!
};
```

### URL not updating?

```tsx
// Make sure syncWithUrl is true
usePagination({ syncWithUrl: true });
useSearch({ syncWithUrl: true });
```

### Keyboard shortcuts not working?

```tsx
// Make sure enableShortcut is true
<SearchInput enableShortcut={true} />

// Check for conflicting keyboard event handlers
```

---

## Testing

### Unit Tests

```tsx
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/usePagination';

test('usePagination hook', () => {
  const { result } = renderHook(() =>
    usePagination({ defaultPageSize: 50 })
  );

  expect(result.current.currentPage).toBe(1);
  expect(result.current.pageSize).toBe(50);

  act(() => {
    result.current.setCurrentPage(2);
  });

  expect(result.current.currentPage).toBe(2);
});
```

### Component Tests

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '@/components/ui/search-input';

test('SearchInput component', async () => {
  const handleChange = jest.fn();

  render(
    <SearchInput value="" onChange={handleChange} />
  );

  const input = screen.getByRole('searchbox');
  await userEvent.type(input, 'laptop');

  expect(handleChange).toHaveBeenCalled();
});
```

---

## Accessibility Checklist

- [ ] All controls have ARIA labels
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader announces changes
- [ ] Color contrast >4.5:1
- [ ] Touch targets ≥44px on mobile
- [ ] No keyboard traps
- [ ] Semantic HTML used

---

## Resources

- 📖 **Detailed Docs**: `/apps/frontend/PRIORITY_1_IMPLEMENTATION.md`
- 📋 **Summary**: `/FRONTEND_REFACTOR_SUMMARY.md`
- 🎨 **UX Spec**: `/apps/backend/UX_DESIGN_SPECIFICATION.md`
- 💡 **Component JSDoc**: Check component files for inline docs

---

**Version**: 1.0
**Last Updated**: 2025-10-30
