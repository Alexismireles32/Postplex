'use client';

import { getStatusEmoji } from '@/lib/social-media';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colors: Record<string, string> = {
    discovering: 'bg-blue-100 text-blue-700',
    discovered: 'bg-green-100 text-green-700',
    processing: 'bg-yellow-100 text-yellow-700',
    ready: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
    downloading: 'bg-purple-100 text-purple-700',
    downloaded: 'bg-green-100 text-green-700',
    pending: 'bg-gray-100 text-gray-700',
  };

  const colorClass = colors[status.toLowerCase()] || 'bg-gray-100 text-gray-700';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
        colorClass,
        className
      )}
    >
      {getStatusEmoji(status)} {status}
    </span>
  );
}
