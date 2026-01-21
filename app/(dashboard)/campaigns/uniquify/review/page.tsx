'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProcessedVideoCard } from '@/components/uniquify/ProcessedVideoCard';

interface ProcessedVideo {
  id: string;
  thumbnailUrl: string;
  caption: string | null;
  versionNumber: number;
  qualityVerified: boolean;
  processedUrl: string | null;
  qualityFlags: { message?: string }[];
  sourceVideoId: string;
}

export default function ReviewResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');

  const [videos, setVideos] = useState<ProcessedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'needs-review' | 'by-original'>('all');

  // Load processed videos
  useEffect(() => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    fetch(`/api/videos/uniquify/${campaignId}/results`)
      .then(res => res.json())
      .then(data => {
        setVideos(data.videos || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load videos:', err);
        setLoading(false);
      });
  }, [campaignId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const passedVideos = videos.filter(v => v.qualityVerified);
  const flaggedVideos = videos.filter(v => !v.qualityVerified);

  const filteredVideos = 
    activeTab === 'needs-review' ? flaggedVideos :
    activeTab === 'all' ? videos :
    videos; // TODO: Group by original for 'by-original' tab

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 pb-32">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-4xl font-bold mb-2">
          Processing complete! 🎉
        </h1>
        <p className="text-xl text-gray-600">
          {videos.length} unique video{videos.length !== 1 ? 's are' : ' is'} ready for review
        </p>
      </div>

      {/* Quality Summary */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
          <div className="text-5xl font-bold text-green-600 mb-2">
            {passedVideos.length}
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Passed all checks</span>
          </div>
        </div>

        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
          <div className="text-5xl font-bold text-amber-600 mb-2">
            {flaggedVideos.length}
          </div>
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Need review</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('all')}
        >
          All Videos ({videos.length})
        </button>
        <button
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'needs-review'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('needs-review')}
        >
          Needs Review ⚠️ ({flaggedVideos.length})
        </button>
        <button
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'by-original'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('by-original')}
        >
          By Original
        </button>
      </div>

      {/* Flagged Videos Section */}
      {flaggedVideos.length > 0 && activeTab !== 'needs-review' && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            These videos need your attention ⚠️
          </h3>
          
          <div className="space-y-4">
            {flaggedVideos.slice(0, 3).map((video) => (
              <div key={video.id} className="bg-white rounded-xl p-4 flex items-center gap-4">
                <div className="w-16 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.caption || ''}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                
                <div className="flex-1">
                  <div className="font-medium mb-1">
                    Version {video.versionNumber}
                  </div>
                  <div className="text-sm text-amber-700">
                    {video.qualityFlags?.[0]?.message || 'Quality issue detected'}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Quick Fix ⚡
                  </Button>
                  <Button size="sm" variant="outline">
                    Reprocess
                  </Button>
                  <Button size="sm" variant="ghost">
                    Use Anyway
                  </Button>
                </div>
              </div>
            ))}
            
            {flaggedVideos.length > 3 && (
              <button
                className="text-sm text-amber-700 hover:text-amber-900 font-medium"
                onClick={() => setActiveTab('needs-review')}
              >
                View all {flaggedVideos.length} flagged videos →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Video Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredVideos.map((video) => (
          <ProcessedVideoCard
            key={video.id}
            video={video}
            onClick={() => {
              // TODO: Open comparison modal
              alert('Video comparison modal coming soon!');
            }}
            onReprocess={() => {
              // TODO: Reprocess video
              alert('Reprocess coming soon!');
            }}
          />
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No videos found</p>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {videos.length} unique video{videos.length !== 1 ? 's' : ''} ready
            </div>
            <div className="text-gray-500">
              {passedVideos.length} passed, {flaggedVideos.length} need review
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push('/library')}
            >
              Process More Videos
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8"
              onClick={() => {
                // TODO: Navigate to scheduling (Stage 3)
                alert('Scheduling coming in Stage 3!');
              }}
            >
              Continue to Scheduling 📅
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
