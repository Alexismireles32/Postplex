'use client';

import { CheckCircle, AlertTriangle } from 'lucide-react';

interface QualityBadgeProps {
  passed: boolean;
  compact?: boolean;
}

export function QualityBadge({ passed, compact = false }: QualityBadgeProps) {
  if (passed) {
    return (
      <div className={`inline-flex items-center gap-1 bg-green-100 text-green-700 rounded-full ${compact ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
        <CheckCircle className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
        {!compact && <span className="text-xs font-medium">Passed</span>}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 bg-amber-100 text-amber-700 rounded-full ${compact ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
      <AlertTriangle className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
      {!compact && <span className="text-xs font-medium">Review</span>}
    </div>
  );
}
