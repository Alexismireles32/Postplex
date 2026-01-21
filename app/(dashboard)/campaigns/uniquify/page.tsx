'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PresetCard } from '@/components/uniquify/PresetCard';
import { PRESETS, PresetName, estimateProcessedStorage, estimateProcessingTime } from '@/lib/uniquify';
import Image from 'next/image';

export default function UniquifySetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get selected video IDs from URL or state
  const videoIdsParam = searchParams.get('videoIds');
  const selectedVideoIds = videoIdsParam ? videoIdsParam.split(',') : [];
  
  // State
  const [selectedPreset, setSelectedPreset] = useState<PresetName>('smart');
  const [versionsPerVideo, setVersionsPerVideo] = useState(3);
  const [targetPlatform, setTargetPlatform] = useState<'tiktok' | 'instagram' | 'facebook'>('tiktok');
  const [videos, setVideos] = useState<{id: string; thumbnailUrl: string; caption: string | null; duration: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Load video details
  useEffect(() => {
    if (selectedVideoIds.length > 0) {
      fetch(`/api/videos/batch?ids=${selectedVideoIds.join(',')}`)
        .then(res => res.json())
        .then(data => {
          setVideos(data.videos || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load videos:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [selectedVideoIds.join(',')]);

  // Calculate estimates
  const totalVideos = selectedVideoIds.length * versionsPerVideo;
  const storageEstimate = estimateProcessedStorage(selectedVideoIds.length, versionsPerVideo);
  const timeEstimate = estimateProcessingTime(selectedVideoIds.length, versionsPerVideo);

  // Handle start processing
  const handleStartProcessing = async () => {
    if (selectedVideoIds.length === 0) return;

    setProcessing(true);
    
    try {
      const campaignId = searchParams.get('campaignId');
      
      const response = await fetch('/api/videos/uniquify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          videoIds: selectedVideoIds,
          preset: selectedPreset,
          versionsPerVideo,
          targetPlatform
        })
      });

      if (!response.ok) throw new Error('Failed to start processing');

      await response.json();
      
      // Navigate to processing page
      router.push(`/campaigns/uniquify/processing?campaignId=${campaignId || ''}`);
    } catch (error) {
      console.error('Error starting processing:', error);
      alert('Failed to start processing. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (selectedVideoIds.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">No Videos Selected</h1>
          <p className="text-gray-600 mb-6">
            Please select videos from your library to make them unique.
          </p>
          <Button onClick={() => router.push('/library')}>
            Go to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Video Selection Summary */}
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to library
        </Button>

        <h1 className="text-4xl font-bold mb-4">
          Making {selectedVideoIds.length} video{selectedVideoIds.length !== 1 ? 's' : ''} unique ✨
        </h1>

        {/* Thumbnail Preview Strip */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {videos.slice(0, 8).map((video) => (
            <div
              key={video.id}
              className="flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden bg-gray-100 relative"
            >
              <Image
                src={video.thumbnailUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ))}
          {videos.length > 8 && (
            <div className="flex-shrink-0 w-16 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                +{videos.length - 8}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Preset Selection Cards */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Choose your protection level 🛡️</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(PRESETS).map((preset) => (
            <PresetCard
              key={preset.name}
              preset={preset}
              selected={selectedPreset === preset.name}
              onSelect={() => setSelectedPreset(preset.name)}
              onPreview={() => {
                // TODO: Open preview modal
                alert('Preview modal coming soon!');
              }}
            />
          ))}
        </div>
      </div>

      {/* Processing Options */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-24">
        <h3 className="text-xl font-bold mb-6">Processing Options</h3>

        {/* Number of Versions */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How many versions of each video?
          </label>
          <div className="grid grid-cols-3 gap-4">
            <button
              className={`p-4 rounded-xl border-2 transition-all ${
                versionsPerVideo === 1
                  ? 'border-cyan-500 bg-cyan-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setVersionsPerVideo(1)}
            >
              <div className="text-3xl font-bold mb-1">1</div>
              <div className="text-sm font-medium mb-1">Single version</div>
              <div className="text-xs text-gray-500">{selectedVideoIds.length} total</div>
            </button>

            <button
              className={`relative p-4 rounded-xl border-2 transition-all ${
                versionsPerVideo === 3
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setVersionsPerVideo(3)}
            >
              {versionsPerVideo === 3 && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                  ⭐ Recommended
                </div>
              )}
              <div className="text-3xl font-bold mb-1">3</div>
              <div className="text-sm font-medium mb-1">Triple versions</div>
              <div className="text-xs text-gray-500">{selectedVideoIds.length * 3} total</div>
            </button>

            <button
              className={`p-4 rounded-xl border-2 transition-all ${
                versionsPerVideo === 5
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setVersionsPerVideo(5)}
            >
              <div className="text-3xl font-bold mb-1">5</div>
              <div className="text-sm font-medium mb-1">Maximum versions</div>
              <div className="text-xs text-gray-500">{selectedVideoIds.length * 5} total</div>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-3 flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            Multiple versions are perfect for posting to different accounts or reposting later 💡
          </p>
        </div>

        {/* Platform Optimization */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Optimize for platform
          </label>
          <div className="flex gap-3">
            <button
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                targetPlatform === 'tiktok'
                  ? 'bg-gray-900 text-white'
                  : 'border-2 border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setTargetPlatform('tiktok')}
            >
              TikTok
            </button>
            <button
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                targetPlatform === 'instagram'
                  ? 'bg-gray-900 text-white'
                  : 'border-2 border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setTargetPlatform('instagram')}
            >
              Instagram
            </button>
            <button
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                targetPlatform === 'facebook'
                  ? 'bg-gray-900 text-white'
                  : 'border-2 border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setTargetPlatform('facebook')}
            >
              Facebook
            </button>
          </div>
        </div>

        {/* Storage Estimate */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">Storage needed</div>
              <div className="text-xs text-gray-500">
                Current: 0GB → After: {storageEstimate.totalGB}
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              +{storageEstimate.totalGB}
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div>
          <button
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span>Advanced options (for power users)</span>
            <span className="transform transition-transform" style={{ transform: showAdvanced ? 'rotate(180deg)' : '' }}>
              ▼
            </span>
          </button>
          
          {showAdvanced && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">
                Advanced customization coming soon! For now, the AI automatically optimizes based on your preset selection.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {selectedVideoIds.length} videos × {versionsPerVideo} versions = {totalVideos} unique videos
            </div>
            <div className="text-gray-500">
              Estimated time: ~{timeEstimate.displayTime}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8"
              onClick={handleStartProcessing}
              disabled={processing}
            >
              {processing ? 'Starting...' : 'Start Processing ✨'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
