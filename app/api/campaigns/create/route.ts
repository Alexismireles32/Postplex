import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helper';
import { prisma } from '@/lib/db';
import { parseSocialMediaUrl } from '@/lib/social-media';
import { scrapeCreator } from '@/lib/scrape-creator';

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
      const response = await scrapeCreator.scrapeProfile({
        profileUrl: profileUrl,
        platform: platform as 'tiktok' | 'instagram' | 'facebook',
      });

      const videos = response.videos;

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
          originalUrl: video.url,
          caption: video.caption || '',
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          viewCount: video.viewCount || 0,
          uploadedAt: new Date(video.uploadedAt),
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
