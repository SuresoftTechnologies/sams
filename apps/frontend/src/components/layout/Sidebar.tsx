import { Link, useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  User,
  Settings,
  BarChart3,
  History,
} from 'lucide-react';

/**
 * Sidebar Component
 *
 * Side navigation menu with icon-based links to main app sections.
 * Shows active state based on current route.
 *
 * Usage: Can be hidden on mobile, shown on desktop.
 */

interface NavItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
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
    title: 'History',
    href: '/history',
    icon: History,
    disabled: true,
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
    disabled: true,
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
    disabled: true,
  },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-14 z-40">
      <div className="flex flex-col flex-grow border-r bg-background overflow-y-auto">
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href ||
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
          <p className="text-xs text-muted-foreground">
            Version 1.0.0
          </p>
          <p className="text-xs text-muted-foreground">
            SureSoft AMS
          </p>
        </div>
      </div>
    </aside>
  );
}
