#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const openApiPath = resolve(rootDir, 'openapi.json');
const outputDir = resolve(rootDir, 'src/generated');
const outputPath = resolve(outputDir, 'types.ts');

console.log('🔄 Generating TypeScript types from OpenAPI spec...');

// Check if openapi.json exists
if (!existsSync(openApiPath)) {
  console.warn('⚠️  openapi.json not found. Backend needs to generate it first.');
  console.warn('   Run: pnpm --filter=@sams/backend generate:openapi');
  process.exit(1);
}

// Create output directory if it doesn't exist
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

try {
  // Run openapi-typescript
  execSync(
    `npx openapi-typescript ${openApiPath} -o ${outputPath} --empty-objects-unknown`,
    { stdio: 'inherit', cwd: rootDir }
  );

  console.log('✅ TypeScript types generated successfully!');
  console.log(`   Output: ${outputPath}`);
} catch (error) {
  console.error('❌ Failed to generate types:', error.message);
  process.exit(1);
}
