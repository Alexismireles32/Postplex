import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helper';
import { prisma } from '@/lib/db';

/**
 * Get processed videos results for review
 * GET /api/campaigns/[id]/uniquify/results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    // Verify campaign belongs to user
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Get all processed videos for this campaign
    const processedVideos = await prisma.processedVideo.findMany({
      where: {
        campaignId,
        status: 'completed'
      },
      include: {
        sourceVideo: {
          select: {
            thumbnailUrl: true,
            caption: true,
            duration: true
          }
        }
      },
      orderBy: [
        { sourceVideoId: 'asc' },
        { versionNumber: 'asc' }
      ]
    });

    // Format videos for frontend
    const videos = processedVideos.map(pv => ({
      id: pv.id,
      thumbnailUrl: pv.sourceVideo.thumbnailUrl,
      caption: pv.sourceVideo.caption,
      versionNumber: pv.versionNumber,
      qualityVerified: pv.qualityVerified,
      processedUrl: pv.processedUrl,
      qualityFlags: pv.qualityFlags || [],
      sourceVideoId: pv.sourceVideoId
    }));

    return NextResponse.json({
      videos
    });

  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
