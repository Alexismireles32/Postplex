'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboardIcon,
  FolderIcon,
  VideoIcon,
  CalendarIcon,
  SettingsIcon,
} from 'lucide-react';

const routes = [
  {
    label: 'Dashboard',
    icon: LayoutDashboardIcon,
    href: '/',
    color: 'text-sky-500',
  },
  {
    label: 'Campaigns',
    icon: FolderIcon,
    href: '/campaigns',
    color: 'text-violet-500',
  },
  {
    label: 'Library',
    icon: VideoIcon,
    href: '/library',
    color: 'text-pink-700',
  },
  {
    label: 'Schedule',
    icon: CalendarIcon,
    href: '/schedule',
    color: 'text-orange-700',
  },
  {
    label: 'Settings',
    icon: SettingsIcon,
    href: '/settings',
    color: 'text-gray-700',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-72 flex-col bg-white border-r">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <VideoIcon className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold">Postplex</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100 transition',
              pathname === route.href
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600'
            )}
          >
            <route.icon className={cn('h-5 w-5', route.color)} />
            {route.label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-4">
        <p className="text-xs text-gray-500 text-center">
          &copy; 2026 Postplex
        </p>
      </div>
    </div>
  );
}
