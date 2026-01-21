'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Eye, Clock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { formatViewCount, formatDuration } from '@/lib/social-media';

interface VideoCardProps {
  video: {
    id: string;
    thumbnailUrl: string;
    originalUrl: string;
    duration: number;
    viewCount?: number | null;
    caption: string;
  };
  selected: boolean;
  onToggleSelect: (videoId: string) => void;
  onClick?: () => void;
}

export function VideoCard({ video, selected, onToggleSelect, onClick }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group cursor-pointer rounded-xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Checkbox */}
      <div
        className="absolute top-3 left-3 z-10"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(video.id);
        }}
      >
        <div className="bg-white rounded-md shadow-lg">
          <Checkbox checked={selected} className="h-5 w-5" />
        </div>
      </div>

      {/* Thumbnail / Video Preview */}
      <div className="aspect-[9/16] relative bg-gray-100">
        <Image
          src={video.thumbnailUrl}
          alt={video.caption || 'Video thumbnail'}
          fill
          className="object-cover"
          unoptimized
        />

        {/* Video preview on hover (optional - can be enhanced later) */}
        {isHovered && video.originalUrl && (
          <div className="absolute inset-0 bg-black/20" />
        )}

        {/* Duration badge */}
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(video.duration)}
        </div>

        {/* Selection overlay */}
        {selected && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-4 border-purple-500 rounded-lg" />
        )}
      </div>

      {/* Metadata */}
      <div className="p-4">
        {video.viewCount && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Eye className="w-4 h-4" />
            <span>{formatViewCount(video.viewCount)} views</span>
          </div>
        )}
        <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
          {video.caption || 'No caption'}
        </p>
      </div>
    </div>
  );
}
