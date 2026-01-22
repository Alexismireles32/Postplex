'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { parseSocialMediaUrl, getPlatformEmoji } from '@/lib/social-media';

export default function NewCampaignPage() {
  const router = useRouter();
  const [profileUrl, setProfileUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDiscover = async () => {
    setError('');

    // Basic validation
    if (!profileUrl.trim()) {
      setError('Please enter a profile URL');
      return;
    }

    // Parse and validate URL
    const parsed = parseSocialMediaUrl(profileUrl);
    if (!parsed) {
      setError("Hmm, that doesn't look like a valid profile URL 🤔");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details 
          ? `${data.error}\n\nDetails: ${data.details}` 
          : data.error || 'Failed to discover videos';
        setError(errorMsg);
        console.error('API Error:', data);
        setIsLoading(false);
        return;
      }

      // Success! Redirect to video selection page
      router.push(`/campaigns/${data.campaign.id}/select`);
    } catch (err) {
      console.error('Error creating campaign:', err);
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong. Please try again!';
      setError(`Network Error: ${errorMsg}`);
      setIsLoading(false);
    }
  };

  // Detect platform from input
  const detectedPlatform = profileUrl ? parseSocialMediaUrl(profileUrl) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Back button */}
      <div className="max-w-4xl mx-auto pt-8 px-4">
        <Link href="/campaigns">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to campaigns
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-4xl mb-6 shadow-lg">
            🎬
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Let&apos;s import your videos!
          </h1>
          <p className="text-xl text-gray-600">
            Paste a TikTok, Instagram, or Facebook profile URL to get started
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Platform hints */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-purple-50 hover:to-pink-50 transition-all cursor-pointer border-2 border-transparent hover:border-purple-200">
              <div className="text-3xl mb-2">🎵</div>
              <div className="text-sm font-medium text-gray-700">TikTok</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-purple-50 hover:to-pink-50 transition-all cursor-pointer border-2 border-transparent hover:border-purple-200">
              <div className="text-3xl mb-2">📸</div>
              <div className="text-sm font-medium text-gray-700">Instagram</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-purple-50 hover:to-pink-50 transition-all cursor-pointer border-2 border-transparent hover:border-purple-200">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-sm font-medium text-gray-700">Facebook</div>
            </div>
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Profile URL</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="https://tiktok.com/@username or https://instagram.com/username"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleDiscover()}
                className="h-14 text-lg rounded-xl pr-12"
                disabled={isLoading}
              />
              {detectedPlatform && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">
                  {getPlatformEmoji(detectedPlatform.platform)}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">
              We&apos;ll discover all public videos from this profile
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Action button */}
          <Button
            onClick={handleDiscover}
            disabled={isLoading || !profileUrl.trim()}
            size="lg"
            className="w-full h-14 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl shadow-lg disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Discovering videos...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Discover Videos
              </>
            )}
          </Button>
        </div>

        {/* Helper text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            💡 Make sure the profile is public so we can discover the videos
          </p>
        </div>
      </div>
    </div>
  );
}
