'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CampaignCardNew } from '@/components/campaigns/CampaignCardNew';
import { EmptyState } from '@/components/campaigns/EmptyState';
import { Sparkles, Loader2 } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  sourceProfileUrl: string;
  sourcePlatform: string;
  status: string;
  videosDiscovered: number;
  videosSelected: number;
  storageUsed: string;
  createdAt: Date;
  thumbnails?: string[];
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');

      const data = await response.json();
      setCampaigns(data.campaigns || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setIsLoading(false);
    }
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">📁 Your Campaigns</h1>
              <p className="text-gray-600">
                Import and manage your video content from social media
              </p>
            </div>
            <Button
              onClick={() => router.push('/campaigns/new')}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Create New Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {campaigns.length === 0 ? (
          <EmptyState
            title="No campaigns yet!"
            description="Ready to create your first campaign? Import videos from TikTok, Instagram, or Facebook to get started."
            actionLabel="Create Your First Campaign"
            onAction={() => router.push('/campaigns/new')}
            emoji="🎬"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCardNew
                key={campaign.id}
                campaign={campaign}
                onClick={() => {
                  // Navigate based on campaign status
                  if (campaign.status === 'discovered') {
                    router.push(`/campaigns/${campaign.id}/select`);
                  } else {
                    router.push(`/campaigns/${campaign.id}`);
                  }
                }}
                thumbnails={campaign.thumbnails}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
