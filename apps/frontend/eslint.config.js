import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      prettier, // Disables ESLint formatting rules that conflict with Prettier
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Allow exporting constants/types with components in UI library files
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true, allowExportNames: ['loader', 'action'] },
      ],
      // Allow unused variables that start with underscore
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  // Disable react-refresh rules for shadcn/ui components and error boundary
  {
    files: ['src/components/ui/**/*.tsx', 'src/components/layout/ErrorBoundary.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
