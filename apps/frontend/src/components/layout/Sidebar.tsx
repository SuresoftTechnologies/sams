import { Link, useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  User,
  Settings,
  BarChart3,
  History,
  Users,
  FolderTree,
  MapPin,
  GitPullRequest,
} from 'lucide-react';
import { useRole } from '@/hooks/useRole';

/**
 * Sidebar Component
 *
 * Side navigation menu with icon-based links to main app sections.
 * Shows active state based on current route.
 * Displays role-specific menu items.
 *
 * Menu structure:
 * - All users: Dashboard, Assets, Profile
 * - Manager/Admin: Workflows (approval)
 * - Admin only: Users, Categories, Locations, Settings
 */

interface NavItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
  requiredRoles?: Array<'admin' | 'manager' | 'employee'>;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Assets',
    href: '/assets',
    icon: Package,
  },
  {
    title: 'Workflows',
    href: '/workflows',
    icon: GitPullRequest,
    disabled: true, // TODO: Implement in Phase 10+
    requiredRoles: ['admin', 'manager'],
  },
  {
    title: 'History',
    href: '/history',
    icon: History,
    disabled: true, // TODO: Implement in Phase 10+
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
    disabled: true, // TODO: Implement in Phase 10+
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    disabled: true, // TODO: Implement in Phase 10+
    requiredRoles: ['admin'],
  },
  {
    title: 'Categories',
    href: '/categories',
    icon: FolderTree,
    disabled: true, // TODO: Implement in Phase 10+
    requiredRoles: ['admin'],
  },
  {
    title: 'Locations',
    href: '/locations',
    icon: MapPin,
    disabled: true, // TODO: Implement in Phase 10+
    requiredRoles: ['admin'],
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: User,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    disabled: true, // TODO: Implement in Phase 10+
    requiredRoles: ['admin'],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { hasRole } = useRole();

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter((item) => {
    // If no role requirement, show to all users
    if (!item.requiredRoles || item.requiredRoles.length === 0) {
      return true;
    }
    // Check if user has required role
    return hasRole(...item.requiredRoles);
  });

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-14 z-40">
      <div className="flex flex-col flex-grow border-r bg-background overflow-y-auto">
        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.href ||
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                  item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                )}
                aria-current={isActive ? 'page' : undefined}
                aria-disabled={item.disabled}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t">
          <p className="text-xs text-muted-foreground">Version 1.0.0</p>
          <p className="text-xs text-muted-foreground">SureSoft AMS</p>
        </div>
      </div>
    </aside>
  );
}
