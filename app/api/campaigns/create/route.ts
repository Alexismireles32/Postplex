import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helper';
import { prisma } from '@/lib/db';
import { parseSocialMediaUrl } from '@/lib/social-media';
import axios from 'axios';

const SCRAPE_CREATOR_API_URL = process.env.SCRAPE_CREATOR_API_URL || 'https://api.scrapecreators.com/v1';
const SCRAPE_CREATOR_API_KEY = process.env.SCRAPE_CREATOR_API_KEY;

interface ScrapeCreatorVideo {
  id: string;
  video_url: string;
  cover_image_url: string;
  description: string;
  created_at: string;
  duration: number;
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
}

interface ScrapeCreatorResponse {
  user: {
    username: string;
    followerCount?: number;
  };
  videos: ScrapeCreatorVideo[];
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { profileUrl } = body;

    if (!profileUrl) {
      return NextResponse.json({ error: 'Profile URL is required' }, { status: 400 });
    }

    // Parse and validate URL
    const parsed = parseSocialMediaUrl(profileUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Hmm, that doesn't look like a valid profile URL 🤔" },
        { status: 400 }
      );
    }

    const { platform, username } = parsed;

    // Create campaign with "discovering" status
    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        name: `${platform} - @${username}`,
        sourceProfileUrl: profileUrl,
        sourcePlatform: platform,
        status: 'discovering',
      },
    });

    try {
      // Call ScrapeCreator API to discover videos
      const videos = await discoverVideos(platform, username);

      if (videos.length === 0) {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: 'failed',
            videosDiscovered: 0,
          },
        });

        return NextResponse.json(
          {
            error: 'No videos found for this profile. Make sure the account is public!',
            campaignId: campaign.id,
          },
          { status: 404 }
        );
      }

      // Bulk insert discovered videos
      await prisma.sourceVideo.createMany({
        data: videos.map((video) => ({
          campaignId: campaign.id,
          originalUrl: video.video_url,
          caption: video.description || '',
          thumbnailUrl: video.cover_image_url,
          duration: video.duration,
          viewCount: video.stats.views,
          uploadedAt: new Date(video.created_at),
          selected: true, // Default to selected
          downloaded: false,
          status: 'pending',
        })),
      });

      // Update campaign with discovered count
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: 'discovered',
          videosDiscovered: videos.length,
          videosSelected: videos.length, // All selected by default
        },
      });

      return NextResponse.json({
        success: true,
        message: `Awesome! Found ${videos.length} videos 🎉`,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          videosDiscovered: videos.length,
        },
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Error discovering videos:', err);

      // Update campaign status to failed
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: 'failed',
        },
      });

      return NextResponse.json(
        {
          error: 'Failed to discover videos. Try again in a moment! ⏱️',
          details: err.message || 'Unknown error',
          campaignId: campaign.id,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error creating campaign:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Discover videos from a social media profile using ScrapeCreator API
 */
async function discoverVideos(platform: string, username: string): Promise<ScrapeCreatorVideo[]> {
  if (!SCRAPE_CREATOR_API_KEY) {
    throw new Error('ScrapeCreator API key not configured');
  }

  try {
    // Call appropriate endpoint based on platform
    const endpoint = `${SCRAPE_CREATOR_API_URL}/${platform}/profile`;

    const response = await axios.post<ScrapeCreatorResponse>(
      endpoint,
      {
        handle: username,
      },
      {
        headers: {
          'x-api-key': SCRAPE_CREATOR_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    return response.data.videos || [];
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown }; message?: string };
    console.error('ScrapeCreator API error:', err);

    if (err.response?.status === 429) {
      throw new Error('Rate limit reached. Please try again in a moment.');
    }

    if (err.response?.status === 404) {
      throw new Error('Profile not found or is private.');
    }

    throw new Error(err.message || 'Failed to discover videos');
  }
}
