'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/campaigns/EmptyState';
import { Search, Loader2, Eye, Clock, Download, Sparkles } from 'lucide-react';
import { formatViewCount, formatDuration } from '@/lib/social-media';
import { useRouter } from 'next/navigation';

interface VideoLibraryItem {
  id: string;
  caption: string;
  thumbnailUrl: string;
  downloadedUrl: string | null;
  duration: number;
  viewCount: number | null;
  status: string;
  downloaded: boolean;
  campaign: {
    id: string;
    name: string;
    sourcePlatform: string;
  };
}

export default function LibraryPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCampaign, setFilterCampaign] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      const response = await fetch('/api/library');
      if (!response.ok) throw new Error('Failed to fetch library');

      const data = await response.json();
      setVideos(data.videos || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching library:', error);
      setIsLoading(false);
    }
  };

  const filteredVideos = videos.filter((video) => {
    if (searchQuery && !video.caption.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterCampaign !== 'all' && video.campaign.id !== filterCampaign) {
      return false;
    }
    if (filterStatus !== 'all' && video.status !== filterStatus) {
      return false;
    }
    return true;
  });

  const campaigns = Array.from(new Set(videos.map((v) => v.campaign.id))).map((id) => {
    const video = videos.find((v) => v.campaign.id === id);
    return video?.campaign;
  });

  const stats = {
    total: videos.length,
    downloaded: videos.filter((v) => v.downloaded).length,
    downloading: videos.filter((v) => v.status === 'downloading').length,
    failed: videos.filter((v) => v.status === 'failed').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">🎬 Your Video Library</h1>
              <p className="text-gray-600">All your imported videos in one place</p>
            </div>
          </div>

          {/* Stats cards */}
          {videos.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
                <div className="text-3xl font-bold text-purple-900">{stats.total}</div>
                <div className="text-sm text-purple-700">Total Videos</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                <div className="text-3xl font-bold text-green-900">{stats.downloaded}</div>
                <div className="text-sm text-green-700">Downloaded</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border-2 border-yellow-200">
                <div className="text-3xl font-bold text-yellow-900">{stats.downloading}</div>
                <div className="text-sm text-yellow-700">Downloading</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border-2 border-red-200">
                <div className="text-3xl font-bold text-red-900">{stats.failed}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      {videos.length > 0 && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>

              {/* Campaign filter */}
              <select
                value={filterCampaign}
                onChange={(e) => setFilterCampaign(e.target.value)}
                className="px-4 py-2 h-12 rounded-xl border border-gray-300 bg-white text-gray-700 outline-none cursor-pointer"
              >
                <option value="all">All Campaigns</option>
                {campaigns.map(
                  (campaign) =>
                    campaign && (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    )
                )}
              </select>

              {/* Status filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 h-12 rounded-xl border border-gray-300 bg-white text-gray-700 outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="downloaded">Downloaded</option>
                <option value="downloading">Downloading</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {videos.length === 0 ? (
          <EmptyState
            title="No videos yet!"
            description="Import videos from a campaign to see them here in your library."
            actionLabel="Create a Campaign"
            onAction={() => router.push('/campaigns/new')}
            emoji="📹"
          />
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">No videos match your filters</p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setFilterCampaign('all');
                setFilterStatus('all');
              }}
              className="mt-4"
              variant="outline"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group"
              >
                {/* Thumbnail */}
                <div className="aspect-[9/16] relative bg-gray-100">
                  {/* Selection Checkbox */}
                  {video.downloaded && (
                    <div className="absolute top-3 left-3 z-10">
                      <Checkbox
                        checked={selectedVideos.has(video.id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedVideos);
                          if (checked) {
                            newSelected.add(video.id);
                          } else {
                            newSelected.delete(video.id);
                          }
                          setSelectedVideos(newSelected);
                        }}
                        className="bg-white"
                      />
                    </div>
                  )}

                  <Image
                    src={video.thumbnailUrl}
                    alt={video.caption || 'Video thumbnail'}
                    fill
                    className="object-cover"
                    unoptimized
                  />

                  {/* Duration badge */}
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(video.duration)}
                  </div>

                  {/* Download indicator */}
                  {video.downloaded && video.downloadedUrl && (
                    <div className="absolute top-3 right-3">
                      <div className="bg-green-500 text-white rounded-full p-2">
                        <Download className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="p-4">
                  {/* Campaign name */}
                  <div className="text-xs text-purple-600 font-medium mb-2">
                    {video.campaign.name}
                  </div>

                  {/* Views */}
                  {video.viewCount && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Eye className="w-4 h-4" />
                      <span>{formatViewCount(video.viewCount)} views</span>
                    </div>
                  )}

                  {/* Caption */}
                  <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                    {video.caption || 'No caption'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Bar - Make Unique */}
      {selectedVideos.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium text-gray-900">
                {selectedVideos.size} video{selectedVideos.size !== 1 ? 's' : ''} selected
              </div>
              <div className="text-gray-500">
                Ready to make unique
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setSelectedVideos(new Set())}
              >
                Clear Selection
              </Button>
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8"
                onClick={() => {
                  const videoIds = Array.from(selectedVideos);
                  const firstVideo = filteredVideos.find(v => v.id === videoIds[0]);
                  router.push(`/campaigns/uniquify?videoIds=${videoIds.join(',')}&campaignId=${firstVideo?.campaign.id || ''}`);
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Make Unique
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
