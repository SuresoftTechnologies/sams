import { Outlet, useLocation } from 'react-router';
import Header from './Header';
import { useCurrentUser } from '@/hooks/useAuth';

/**
 * RootLayout Component
 *
 * Main layout wrapper that includes:
 * - Header (GNB - Global Navigation Bar with full navigation menu)
 * - Main content area (with Outlet for child routes)
 *
 * Layout is fully responsive:
 * - Full-width content area (no sidebar)
 * - Header contains all navigation (horizontal on desktop, hamburger on mobile)
 * - Optimized spacing and padding for all screen sizes
 *
 * Usage: Wrap protected routes with this layout
 */
export default function RootLayout() {
  const location = useLocation();

  // Restore user info on page load (if authenticated)
  useCurrentUser();

  // Hide layout on login page
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen">
      <Header />

      {/* Main content area - Full width, no sidebar */}
      <main className="pt-16">
        <div className="container mx-auto px-4 max-w-screen-2xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
