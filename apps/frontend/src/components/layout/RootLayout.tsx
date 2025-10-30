import { Outlet, useLocation } from 'react-router';
import Header from './Header';
import Sidebar from './Sidebar';

/**
 * RootLayout Component
 *
 * Main layout wrapper that includes:
 * - Header (top navigation)
 * - Sidebar (left navigation)
 * - Main content area (with Outlet for child routes)
 *
 * Layout is responsive:
 * - Sidebar hidden on mobile, visible on desktop
 * - Content adjusts margin based on sidebar visibility
 *
 * Usage: Wrap protected routes with this layout
 */
export default function RootLayout() {
  const location = useLocation();

  // Hide layout on login page
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar />

      {/* Main content area - with left margin for sidebar on desktop */}
      <main className="md:pl-64 pt-14">
        <div className="container mx-auto py-6 px-4 max-w-screen-2xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
