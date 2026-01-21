'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { VideoCard } from '@/components/campaigns/VideoCard';
import { ArrowLeft, Search, Sparkles, Loader2 } from 'lucide-react';
import { extractUsername, estimateStorage } from '@/lib/social-media';

interface SourceVideo {
  id: string;
  originalUrl: string;
  caption: string;
  thumbnailUrl: string;
  duration: number;
  viewCount: number | null;
  uploadedAt: string;
}

interface Campaign {
  id: string;
  name: string;
  sourceProfileUrl: string;
  videosDiscovered: number;
  videosSelected: number;
}

export default function VideoSelectionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [campaignId, setCampaignId] = useState<string>('');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [videos, setVideos] = useState<SourceVideo[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [durationFilter, setDurationFilter] = useState<string>('all');
  const [viewsFilter, setViewsFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  // Initialize params
  useEffect(() => {
    async function initParams() {
      const { id } = await params;
      setCampaignId(id);
    }
    initParams();
  }, [params]);

  // Fetch campaign and videos
  useEffect(() => {
    if (!campaignId) return;
    
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}`);
        if (!response.ok) throw new Error('Failed to fetch campaign');

        const data = await response.json();
        setCampaign(data.campaign);
        setVideos(data.videos || []);

      // Select all videos by default
      const allVideoIds = new Set<string>(data.videos.map((v: SourceVideo) => v.id));
      setSelectedVideos(allVideoIds);

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching campaign:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [campaignId]);

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    let filtered = videos;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((v) =>
        v.caption.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Duration filter
    if (durationFilter !== 'all') {
      filtered = filtered.filter((v) => {
        if (durationFilter === 'short') return v.duration < 15;
        if (durationFilter === 'medium') return v.duration >= 15 && v.duration <= 60;
        if (durationFilter === 'long') return v.duration > 60 && v.duration <= 180;
        if (durationFilter === 'verylong') return v.duration > 180;
        return true;
      });
    }

    // Views filter
    if (viewsFilter !== 'all' && filtered.length > 0) {
      filtered = filtered.filter((v) => {
        if (!v.viewCount) return false;
        if (viewsFilter === 'viral') return v.viewCount >= 100000;
        if (viewsFilter === 'high') return v.viewCount >= 10000 && v.viewCount < 100000;
        return true;
      });
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
      if (sortBy === 'views') {
        return (b.viewCount || 0) - (a.viewCount || 0);
      }
      if (sortBy === 'longest') {
        return b.duration - a.duration;
      }
      if (sortBy === 'shortest') {
        return a.duration - b.duration;
      }
      return 0;
    });

    return filtered;
  }, [videos, searchQuery, durationFilter, viewsFilter, sortBy]);

  const toggleSelectAll = () => {
    if (selectedVideos.size === filteredVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(filteredVideos.map((v) => v.id)));
    }
  };

  const toggleSelectVideo = (videoId: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
  };

  const handleImport = async () => {
    if (selectedVideos.size === 0) {
      alert('Please select at least one video to import');
      return;
    }

    setIsImporting(true);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoIds: Array.from(selectedVideos),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import videos');
      }

      // Success! Redirect to campaigns page or show success message
      alert(data.message || 'Import started successfully! 🚀');
      router.push('/campaigns');
    } catch (error) {
      console.error('Error importing videos:', error);
      alert('Failed to start import. Please try again.');
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-xl text-gray-600">Campaign not found</p>
        <Link href="/campaigns">
          <Button className="mt-4">Back to campaigns</Button>
        </Link>
      </div>
    );
  }

  const storageEstimate = estimateStorage(selectedVideos.size);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/campaigns">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to campaigns
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
              <p className="text-gray-600">
                Found {campaign.videosDiscovered} videos from @{extractUsername(campaign.sourceProfileUrl)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search captions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl"
              />
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Duration filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setDurationFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  durationFilter === 'all'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Duration
              </button>
              <button
                onClick={() => setDurationFilter('short')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  durationFilter === 'short'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                &lt; 15s
              </button>
              <button
                onClick={() => setDurationFilter('medium')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  durationFilter === 'medium'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                15-60s
              </button>
              <button
                onClick={() => setDurationFilter('long')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  durationFilter === 'long'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                1-3min
              </button>
            </div>

            {/* Views filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewsFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  viewsFilter === 'all'
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Views
              </button>
              <button
                onClick={() => setViewsFilter('viral')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  viewsFilter === 'viral'
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Viral (100k+)
              </button>
              <button
                onClick={() => setViewsFilter('high')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  viewsFilter === 'high'
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                High (10k+)
              </button>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border-none outline-none cursor-pointer"
            >
              <option value="recent">Most Recent</option>
              <option value="views">Most Views</option>
              <option value="longest">Longest</option>
              <option value="shortest">Shortest</option>
            </select>
          </div>

          {/* Selection controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedVideos.size === filteredVideos.length && filteredVideos.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedVideos.size === filteredVideos.length && filteredVideos.length > 0
                    ? 'Deselect All'
                    : 'Select All'}
                </span>
              </label>
              <div className="text-sm text-gray-600">
                <span className="font-bold text-purple-600">{selectedVideos.size}</span> of{' '}
                {filteredVideos.length} selected
              </div>
              <div className="text-sm text-gray-500">
                Storage: <span className="font-medium">{storageEstimate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredVideos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">No videos match your filters</p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setDurationFilter('all');
                setViewsFilter('all');
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
              <VideoCard
                key={video.id}
                video={video}
                selected={selectedVideos.has(video.id)}
                onToggleSelect={toggleSelectVideo}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      {selectedVideos.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {selectedVideos.size} videos selected
                </p>
                <p className="text-sm text-gray-600">Will use {storageEstimate}</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setSelectedVideos(new Set())}
                  disabled={isImporting}
                >
                  Cancel
                </Button>
                <Button
                  size="lg"
                  onClick={handleImport}
                  disabled={isImporting}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Import Selected Videos
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
