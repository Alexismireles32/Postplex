'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, CheckCircle, Loader2, Clock } from 'lucide-react';
import { ProgressBar } from '@/components/uniquify/ProgressBar';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface ProcessingStatus {
  campaignId: string;
  total: number;
  completed: number;
  processing: number;
  pending: number;
  failed: number;
  progress: number;
  currentVideo: {
    id: string;
    thumbnailUrl: string;
    caption: string | null;
    versionNumber: number;
  } | null;
}

export default function ProcessingProgressPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');

  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setMinimized] = useState(false);

  // Poll for status updates
  useEffect(() => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/videos/uniquify/${campaignId}/status`);
        if (!response.ok) throw new Error('Failed to fetch status');
        
        const data = await response.json();
        setStatus(data);
        setLoading(false);

        // If all done, redirect to review page
        if (data.total > 0 && data.completed + data.failed >= data.total) {
          setTimeout(() => {
            router.push(`/campaigns/uniquify/review?campaignId=${campaignId}`);
          }, 2000);
        }
      } catch (error) {
        console.error('Error fetching status:', error);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 3 seconds
    const interval = setInterval(fetchStatus, 3000);

    return () => clearInterval(interval);
  }, [campaignId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!campaignId || !status) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Processing Status Not Found</h1>
          <Button onClick={() => router.push('/library')}>
            Go to Library
          </Button>
        </div>
      </div>
    );
  }

  const estimatedMinutesRemaining = Math.ceil((status.total - status.completed) * 0.5);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-4xl font-bold mb-2">
          Making your videos unique ✨
        </h1>
        <p className="text-xl text-gray-600">
          This usually takes about {estimatedMinutesRemaining} minute{estimatedMinutesRemaining !== 1 ? 's' : ''}. Feel free to grab a coffee ☕
        </p>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-2xl p-8 shadow-lg mb-6">
        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-2xl font-bold text-gray-900">{status.progress}%</span>
          </div>
          <ProgressBar value={status.progress} showPercentage={false} />
        </div>

        {/* Current Video */}
        {status.currentVideo && (
          <div className="bg-purple-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                <Image
                  src={status.currentVideo.thumbnailUrl}
                  alt="Current video"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Processing video {status.completed + 1} of {status.total}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Creating version {status.currentVideo.versionNumber}
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Applying modifications...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {status.completed}
            </div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
          
          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-1">
              {status.processing}
            </div>
            <div className="text-sm text-yellow-700">Processing</div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-gray-600 mb-1">
              {status.pending}
            </div>
            <div className="text-sm text-gray-700">In Queue</div>
          </div>
        </div>

        {/* Time Estimate */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>About {estimatedMinutesRemaining} minute{estimatedMinutesRemaining !== 1 ? 's' : ''} remaining</span>
          </div>
        </div>
      </div>

      {/* What's Happening */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
        <h3 className="text-lg font-bold mb-4">What&apos;s happening</h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Downloading original videos</div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Applying modifications</div>
              <div className="text-sm text-gray-500">In progress...</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Running quality checks</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Uploading to your library</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Minimize Option */}
      <div className="text-center">
        <button
          className="text-sm text-gray-600 hover:text-gray-900 underline"
          onClick={() => {
            setMinimized(true);
            router.push('/library');
          }}
        >
          Minimize and continue browsing
        </button>
        <p className="text-xs text-gray-500 mt-1">
          We&apos;ll notify you when processing is complete
        </p>
      </div>
    </div>
  );
}
