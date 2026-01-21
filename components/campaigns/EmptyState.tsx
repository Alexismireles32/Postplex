'use client';

import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  emoji?: string;
}

export function EmptyState({ title, description, actionLabel, onAction, emoji = '📁' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-8xl mb-6">{emoji}</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-center mb-8 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
