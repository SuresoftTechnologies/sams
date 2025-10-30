/// <reference types="vite/client" />

/**
 * Vite Environment Variables Type Definitions
 */
interface ImportMetaEnv {
  /** Backend API base URL */
  readonly VITE_API_URL: string;

  /** Application name */
  readonly VITE_APP_NAME: string;

  /** Application version */
  readonly VITE_APP_VERSION: string;

  /** Environment (development, staging, production) */
  readonly VITE_ENV: 'development' | 'staging' | 'production';

  /** Enable React Query DevTools */
  readonly VITE_ENABLE_DEVTOOLS: string;

  /** Enable mock data for development */
  readonly VITE_ENABLE_MOCK_DATA: string;

  // Optional features
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_ANALYTICS_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
