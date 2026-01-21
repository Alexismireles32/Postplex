'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, RotateCcw } from 'lucide-react';
import { QualityBadge } from './QualityBadge';

interface ProcessedVideoCardProps {
  video: {
    id: string;
    thumbnailUrl: string;
    caption: string | null;
    versionNumber: number;
    qualityVerified: boolean;
    processedUrl: string | null;
  };
  onClick: () => void;
  onReprocess?: () => void;
}

export function ProcessedVideoCard({ video, onClick, onReprocess }: ProcessedVideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-[9/16] relative bg-gray-100">
        <Image
          src={video.thumbnailUrl}
          alt={video.caption || 'Video thumbnail'}
          fill
          className="object-cover"
          unoptimized
        />

        {/* Version Badge */}
        <div className="absolute top-3 left-3 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          V{video.versionNumber}
        </div>

        {/* Quality Badge */}
        <div className="absolute top-3 right-3">
          <QualityBadge passed={video.qualityVerified} compact />
        </div>

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4">
            <button
              className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <Play className="w-6 h-6 text-gray-900" fill="currentColor" />
            </button>
            {onReprocess && (
              <button
                className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onReprocess();
                }}
              >
                <RotateCcw className="w-6 h-6 text-gray-900" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="p-4">
        <p className="text-sm text-gray-700 line-clamp-2">
          {video.caption || 'No caption'}
        </p>
      </div>
    </div>
  );
}
