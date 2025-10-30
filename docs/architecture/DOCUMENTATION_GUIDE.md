# Documentation Automation & Maintenance Guide

## 📋 Overview

이 문서는 SureSoft SAMS 프로젝트의 문서화 자동화 및 유지보수 절차를 설명합니다.

## 🎯 Documentation Strategy

### Documentation Types

| Type | Format | Auto-Generated | Update Frequency |
|------|--------|----------------|------------------|
| **Architecture Docs** | Markdown | No | As needed |
| **API Docs** | OpenAPI/Swagger | Yes | On code change |
| **Code Docs** | JSDoc/TSDoc | Yes | On code change |
| **ADRs** | Markdown | No | On decision |
| **Diagrams** | Mermaid | No | As needed |
| **Database Schema** | SQL + Diagram | Partial | On migration |

## 🤖 Automation Tools

### 1. API Documentation (Swagger/OpenAPI)

**Setup (NestJS)**:

```typescript
// backend/src/main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('SureSoft SSAMS API')
    .setDescription('Asset Management System API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('assets', 'Asset management endpoints')
    .addTag('workflows', 'Workflow endpoints')
    .addTag('users', 'User management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Export OpenAPI spec to file
  const fs = require('fs');
  const yaml = require('yaml');
  fs.writeFileSync(
    './docs/architecture/api/openapi.yaml',
    yaml.stringify(document)
  );

  await app.listen(4000);
}
bootstrap();
```

**Usage in Controllers**:

```typescript
// backend/src/modules/assets/assets.controller.ts
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('assets')
@ApiBearerAuth()
@Controller('assets')
export class AssetsController {
  @Get()
  @ApiOperation({ summary: 'Get all assets' })
  @ApiResponse({ status: 200, description: 'Returns list of assets' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll() {
    // ...
  }

  @Post()
  @ApiOperation({ summary: 'Create a new asset' })
  @ApiResponse({ status: 201, description: 'Asset created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createAssetDto: CreateAssetDto) {
    // ...
  }
}
```

**DTO Documentation**:

```typescript
// backend/src/modules/assets/dto/create-asset.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, Min } from 'class-validator';

export class CreateAssetDto {
  @ApiProperty({
    description: 'Asset tag (unique identifier)',
    example: 'SRS-LAP-2024-0001',
  })
  @IsString()
  assetTag: string;

  @ApiProperty({
    description: 'Asset model name',
    example: 'MacBook Pro 16 M3',
  })
  @IsString()
  model: string;

  @ApiProperty({
    description: 'Asset status',
    enum: ['available', 'assigned', 'maintenance', 'disposed'],
    example: 'available',
  })
  @IsEnum(['available', 'assigned', 'maintenance', 'disposed'])
  status: string;

  @ApiProperty({
    description: 'Purchase price in KRW',
    example: 3200000,
    minimum: 0,
  })
  @Min(0)
  @IsOptional()
  purchasePrice?: number;
}
```

### 2. Code Documentation (TypeDoc)

**Installation**:

```bash
npm install --save-dev typedoc
```

**Configuration**:

```json
// typedoc.json
{
  "entryPoints": ["src"],
  "out": "docs/code",
  "exclude": ["**/*.spec.ts", "**/*.e2e-spec.ts"],
  "excludePrivate": true,
  "excludeProtected": true,
  "excludeExternals": true,
  "readme": "none",
  "plugin": ["typedoc-plugin-markdown"],
  "theme": "markdown"
}
```

**NPM Script**:

```json
// package.json
{
  "scripts": {
    "docs:generate": "typedoc",
    "docs:serve": "npx http-server docs/code"
  }
}
```

**Usage**:

```typescript
/**
 * Service for managing assets
 *
 * @remarks
 * This service handles all CRUD operations for assets,
 * including lifecycle management and history tracking.
 *
 * @example
 * ```typescript
 * const asset = await assetsService.create({
 *   assetTag: 'SRS-LAP-2024-0001',
 *   model: 'MacBook Pro 16',
 *   status: 'available'
 * });
 * ```
 */
@Injectable()
export class AssetsService {
  /**
   * Find an asset by ID
   *
   * @param id - Asset UUID
   * @returns Promise containing the asset
   * @throws {NotFoundException} If asset not found
   */
  async findOne(id: string): Promise<Asset> {
    const asset = await this.assetRepository.findOne({ where: { id } });
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }
    return asset;
  }
}
```

### 3. Database Schema Documentation

**Install Tools**:

```bash
npm install --save-dev @prisma/client prisma-erd-generator
```

**Prisma Schema Annotation**:

```prisma
// prisma/schema.prisma
/// Asset entity - represents IT hardware assets
model Asset {
  /// Unique identifier (UUID)
  id          String   @id @default(uuid())

  /// Unique asset tag (e.g., SRS-LAP-2024-0001)
  assetTag    String   @unique @map("asset_tag")

  /// Asset model name
  model       String

  /// Current asset status
  status      AssetStatus @default(AVAILABLE)

  /// Asset grade (A/B/C based on purchase year)
  grade       AssetGrade?

  /// Current user assignment
  currentUser User?   @relation("AssignedAssets", fields: [currentUserId], references: [id])
  currentUserId String? @map("current_user_id")

  /// Asset location
  location    Location @relation(fields: [locationId], references: [id])
  locationId  String   @map("location_id")

  /// Purchase price in KRW
  purchasePrice Decimal? @map("purchase_price") @db.Decimal(12, 2)

  /// Purchase date
  purchaseDate  DateTime? @map("purchase_date") @db.Date

  /// Asset history records
  history     AssetHistory[]

  /// Workflows involving this asset
  workflows   Workflow[]

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("assets")
}
```

**Generate ERD**:

```bash
# Add to prisma/schema.prisma
generator erd {
  provider = "prisma-erd-generator"
  output   = "../docs/architecture/diagrams/erd.svg"
}

# Generate diagram
npx prisma generate
```

### 4. Mermaid Diagram Automation

**Install Mermaid CLI**:

```bash
npm install --save-dev @mermaid-js/mermaid-cli
```

**Generate PNG/SVG from Mermaid**:

```bash
# Convert all .mmd files to SVG
npx mmdc -i docs/architecture/diagrams/c4-context.mmd \
         -o docs/architecture/diagrams/c4-context.svg

# Batch conversion
find docs/architecture/diagrams -name "*.mmd" -exec \
  npx mmdc -i {} -o {}.svg \;
```

**GitHub Actions Integration**:

```yaml
# .github/workflows/docs.yml
name: Generate Documentation

on:
  push:
    paths:
      - 'src/**'
      - 'prisma/**'
      - 'docs/**'

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Generate API docs
        run: npm run docs:api

      - name: Generate Code docs
        run: npm run docs:code

      - name: Generate ERD
        run: npx prisma generate

      - name: Generate Mermaid diagrams
        run: |
          npm install -g @mermaid-js/mermaid-cli
          find docs/architecture/diagrams -name "*.mmd" | while read file; do
            mmdc -i "$file" -o "${file%.mmd}.svg"
          done

      - name: Commit generated docs
        run: |
          git config --global user.name 'Documentation Bot'
          git config --global user.email 'bot@suresoft.com'
          git add docs/
          git diff --quiet && git diff --staged --quiet || \
            git commit -m "docs: auto-generate documentation [skip ci]"
          git push
```

## 📝 Manual Documentation Process

### 1. Architecture Documents

**When to Update**:
- Major architectural changes
- New patterns introduced
- Significant refactoring
- Technology stack changes

**Update Process**:
1. Edit Markdown files in `docs/architecture/`
2. Update diagrams if needed
3. Update version history at bottom of document
4. Create Pull Request
5. Request architecture review
6. Merge after approval

### 2. Architecture Decision Records (ADRs)

**When to Create**:
- Choosing between architectural alternatives
- Introducing new technology
- Changing design patterns
- Making security decisions

**Creation Process**:

```bash
# Use the template
cp docs/architecture/adr/template.md \
   docs/architecture/adr/0004-new-decision.md

# Edit the ADR with decision details
# ...

# Commit and push
git add docs/architecture/adr/0004-new-decision.md
git commit -m "docs: add ADR-0004 about XYZ decision"
git push
```

**ADR Numbering**:
- Use sequential numbering: 0001, 0002, 0003, ...
- Include leading zeros
- Use descriptive names

**ADR Lifecycle**:
```
Proposed → Accepted → [Deprecated] → [Superseded by ADR-XXXX]
         ↘ Rejected
```

### 3. Diagram Maintenance

**Diagram Types**:

| Type | Tool | Location | Auto-Generated |
|------|------|----------|----------------|
| C4 Diagrams | Mermaid | `diagrams/` | No |
| ERD | Prisma ERD | `diagrams/erd.svg` | Yes |
| Sequence | Mermaid | In docs | No |
| Flowcharts | Mermaid | In docs | No |

**Mermaid Best Practices**:

```markdown
<!-- Keep diagrams simple and focused -->
<!-- Use consistent styling -->

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#326ce5'}}}%%
graph TB
    A[Start] -->|Action| B[Process]
    B --> C{Decision}
    C -->|Yes| D[End]
    C -->|No| A

    classDef primary fill:#326ce5,stroke:#1a4d8f,color:#fff
    class A,D primary
```​

## 🔄 Continuous Documentation

### Documentation in Pull Requests

**PR Template**:

```markdown
## Changes
- [x] Code changes
- [ ] Documentation updated
- [ ] API docs updated (if applicable)
- [ ] ADR created (if architectural decision)
- [ ] Diagrams updated (if needed)

## Documentation Checklist
- [ ] README updated
- [ ] Architecture docs updated
- [ ] Code comments added
- [ ] API endpoints documented
- [ ] Database migrations documented
```

### Documentation Review

**Review Checklist**:
- [ ] Documentation is clear and concise
- [ ] Diagrams are up-to-date
- [ ] Code examples work
- [ ] Links are valid
- [ ] Version history updated
- [ ] No sensitive information exposed

## 📊 Documentation Metrics

### Key Metrics to Track

```typescript
// scripts/docs-metrics.ts
import * as fs from 'fs';
import * as path from 'path';

interface DocsMetrics {
  totalFiles: number;
  totalLines: number;
  lastUpdated: Date;
  brokenLinks: string[];
  coverage: {
    api: number;      // % of endpoints documented
    code: number;     // % of functions documented
    database: number; // % of tables documented
  };
}

// Calculate metrics
function calculateMetrics(): DocsMetrics {
  // Implementation...
}

// Run weekly and report
const metrics = calculateMetrics();
console.log(JSON.stringify(metrics, null, 2));
```

### Documentation Health Dashboard

**Grafana Dashboard**:
- Documentation freshness (days since last update)
- API coverage percentage
- Code documentation percentage
- Number of ADRs
- Broken links count

## 🛠️ Tools & Resources

### Recommended Tools

1. **Markdown Editors**:
   - VS Code with Markdown extensions
   - Typora (WYSIWYG)
   - Obsidian (linking)

2. **Diagram Tools**:
   - Mermaid Live Editor
   - Draw.io
   - PlantUML

3. **API Documentation**:
   - Swagger UI
   - Redoc
   - Postman

4. **Validation**:
   - markdownlint
   - markdown-link-check
   - vale (prose linter)

### NPM Scripts

```json
// package.json
{
  "scripts": {
    "docs:api": "node scripts/generate-openapi.js",
    "docs:code": "typedoc",
    "docs:db": "prisma generate && prisma-erd-generator",
    "docs:diagrams": "find docs -name '*.mmd' -exec mmdc -i {} -o {}.svg \\;",
    "docs:validate": "npm run docs:lint && npm run docs:links",
    "docs:lint": "markdownlint 'docs/**/*.md'",
    "docs:links": "markdown-link-check docs/**/*.md",
    "docs:all": "npm run docs:api && npm run docs:code && npm run docs:db && npm run docs:diagrams"
  }
}
```

## 📅 Documentation Schedule

### Daily
- Auto-generate API docs on merge

### Weekly
- Review documentation metrics
- Check for broken links
- Update changelog

### Monthly
- Review and update architecture docs
- Archive old ADRs (if superseded)
- Conduct documentation retrospective

### Quarterly
- Major documentation audit
- Update roadmap
- Review and refine documentation strategy

## 🔗 Related Resources

- [Markdown Guide](https://www.markdownguide.org/)
- [Mermaid Documentation](https://mermaid.js.org/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [C4 Model](https://c4model.com/)
- [ADR Best Practices](https://adr.github.io/)

## 📝 Version History

| Version | Date       | Author            | Changes                     |
|---------|------------|-------------------|-----------------------------|
| 1.0.0   | 2025-10-29 | Architecture Team | Initial documentation guide |

---

**Maintained By**: Architecture Team & Documentation Guild
