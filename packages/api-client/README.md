# @ams/api-client

Auto-generated TypeScript API client from FastAPI OpenAPI specification.

## 📦 Overview

This package provides type-safe access to the SureSoft AMS backend API. Types are automatically generated from the FastAPI OpenAPI spec, ensuring frontend and backend stay in sync.

## 🔄 Type Generation Flow

```
FastAPI Backend
  ↓ generates
openapi.json
  ↓ openapi-typescript
src/generated/types.ts
  ↓ imports
Frontend App
```

## 🚀 Usage

### Import Types

```typescript
import { components, operations, paths } from '@ams/api-client';

// Component schemas (DTOs, models)
type Asset = components['schemas']['Asset'];
type CreateAssetDto = components['schemas']['CreateAssetDto'];

// Operation types
type CreateAssetOperation = operations['create_asset'];
type GetAssetsOperation = operations['get_assets'];

// Path types (for advanced usage)
type AssetPaths = paths['/api/assets'];
```

### API Calls

```typescript
import { apiFetch, setAuthToken } from '@ams/api-client';
import type { components } from '@ams/api-client';

type Asset = components['schemas']['Asset'];
type CreateAssetDto = components['schemas']['CreateAssetDto'];

// Set auth token (persists across requests)
setAuthToken('your-jwt-token');

// Create asset
const newAsset = await apiFetch<Asset>('/api/assets', {
  method: 'POST',
  body: JSON.stringify({
    asset_tag: 'SRS-11-2024-0001',
    name: 'Dell Latitude 5420',
    category_id: 'uuid-here',
  } as CreateAssetDto),
});

// Get assets
const assets = await apiFetch<Asset[]>('/api/assets');
```

## 🛠️ Development

### Generate Types

```bash
# Generate types from openapi.json
pnpm generate

# Watch mode (re-generate on OpenAPI changes)
pnpm dev
```

### Build

```bash
# Build package
pnpm build

# Clean generated files
pnpm clean
```

## ⚙️ Configuration

### API Base URL

Set via environment variable:

```bash
# .env
VITE_API_URL=http://localhost:8000
```

Or programmatically:

```typescript
import { setApiConfig } from '@ams/api-client';

setApiConfig({
  baseUrl: 'https://api.production.com',
});
```

### Custom Headers

```typescript
import { setApiConfig } from '@ams/api-client';

setApiConfig({
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

## 📝 Type Examples

### Asset Types

```typescript
import type { components } from '@ams/api-client';

type Asset = components['schemas']['Asset'];
// {
//   id: string;
//   asset_tag: string;
//   name: string;
//   status: 'available' | 'assigned' | 'in_transit' | 'maintenance' | 'disposed';
//   category_id: string;
//   location_id?: string;
//   assigned_to?: string;
//   purchase_date?: string;
//   purchase_price?: number;
//   warranty_end?: string;
//   grade?: 'A' | 'B' | 'C';
//   created_at: string;
//   updated_at: string;
// }

type CreateAssetDto = components['schemas']['CreateAssetDto'];
// {
//   asset_tag: string;
//   name: string;
//   category_id: string;
//   status?: 'available' | 'assigned' | 'in_transit' | 'maintenance' | 'disposed';
//   location_id?: string;
//   purchase_date?: string;
//   purchase_price?: number;
//   warranty_end?: string;
//   notes?: string;
// }
```

### User Types

```typescript
import type { components } from '@ams/api-client';

type User = components['schemas']['User'];
type LoginDto = components['schemas']['LoginDto'];
type LoginResponse = components['schemas']['LoginResponse'];
```

## 🔗 Dependencies

- `@ams/shared-types`: Manual shared types (enums, constants)
- `openapi-typescript`: OpenAPI → TypeScript converter

## 📚 Related

- [ADR-0005: Python Backend with Type Sync](../../docs/architecture/adr/0005-python-backend-with-type-sync.md)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [openapi-typescript](https://github.com/drwpow/openapi-typescript)
