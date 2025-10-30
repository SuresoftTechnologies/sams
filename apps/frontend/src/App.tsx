import { RouterProvider } from 'react-router';
import { router } from './routes';

/**
 * Main App Component
 *
 * Provides React Router v7 integration with RouterProvider
 * All global providers (QueryClient, Toaster) are in root.tsx
 */
function App() {
  return <RouterProvider router={router} />;
}

export default App;
