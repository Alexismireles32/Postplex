import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helper';
import { prisma } from '@/lib/db';

/**
 * Get processing status for a campaign
 * GET /api/campaigns/[id]/uniquify/status
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
        campaignId
      },
      include: {
        sourceVideo: {
          select: {
            thumbnailUrl: true,
            caption: true,
            duration: true
          }
        }
      }
    });

    // Count by status
    const statusCounts = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      reprocessing: 0
    };

    processedVideos.forEach(video => {
      const status = video.status as keyof typeof statusCounts;
      if (status in statusCounts) {
        statusCounts[status]++;
      }
    });

    // Get currently processing video
    const currentlyProcessing = processedVideos.find(v => v.status === 'processing');

    // Calculate progress percentage
    const total = processedVideos.length;
    const completed = statusCounts.completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return NextResponse.json({
      campaignId,
      total,
      completed: statusCounts.completed,
      processing: statusCounts.processing,
      pending: statusCounts.pending,
      failed: statusCounts.failed,
      progress,
      currentVideo: currentlyProcessing ? {
        id: currentlyProcessing.id,
        thumbnailUrl: currentlyProcessing.sourceVideo.thumbnailUrl,
        caption: currentlyProcessing.sourceVideo.caption,
        versionNumber: currentlyProcessing.versionNumber
      } : null
    });

  } catch (error) {
    console.error('Error fetching processing status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
