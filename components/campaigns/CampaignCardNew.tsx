'use client';

import Image from 'next/image';
import { extractUsername, getStatusEmoji, getPlatformEmoji } from '@/lib/social-media';
import { Calendar, Video } from 'lucide-react';
import { format } from 'date-fns';

interface CampaignCardNewProps {
  campaign: {
    id: string;
    name: string;
    sourceProfileUrl: string;
    sourcePlatform: string;
    status: string;
    videosDiscovered: number;
    videosSelected: number;
    storageUsed: string;
    createdAt: Date;
  };
  onClick?: () => void;
  thumbnails?: string[];
}

export function CampaignCardNew({ campaign, onClick, thumbnails = [] }: CampaignCardNewProps) {
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-orange-500 to-red-500',
    'from-green-500 to-emerald-500',
    'from-indigo-500 to-purple-500',
  ];

  // Use campaign ID to consistently pick a gradient
  const gradientIndex = Math.abs(campaign.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % gradients.length;
  const gradient = gradients[gradientIndex];

  return (
    <div
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{getPlatformEmoji(campaign.sourcePlatform)}</span>
            <h3 className="text-xl font-bold line-clamp-1">{campaign.name}</h3>
          </div>
          <p className="text-white/80 text-sm">
            From: @{extractUsername(campaign.sourceProfileUrl)}
          </p>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-sm font-medium">
          {getStatusEmoji(campaign.status)} {campaign.status}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-2xl font-bold">{campaign.videosDiscovered}</div>
          <div className="text-xs text-white/70">discovered</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-2xl font-bold">{campaign.videosSelected}</div>
          <div className="text-xs text-white/70">selected</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-lg font-bold">{campaign.storageUsed}</div>
          <div className="text-xs text-white/70">storage</div>
        </div>
      </div>

      {/* Thumbnails preview */}
      {thumbnails.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {thumbnails.slice(0, 3).map((thumb, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden bg-white/10 relative">
              <Image 
                src={thumb} 
                alt={`Campaign thumbnail ${i + 1}`}
                fill 
                className="object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-white/70">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{format(new Date(campaign.createdAt), 'MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Video className="w-3 h-3" />
          <span>{campaign.sourcePlatform}</span>
        </div>
      </div>
    </div>
  );
}
