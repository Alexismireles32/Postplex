import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helper';
import { prisma } from '@/lib/db';
import { addVideoDownloadJob } from '@/lib/queue';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  try {
    // Check authentication
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify campaign ownership
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        sourceVideos: {
          where: {
            selected: true,
            downloaded: false,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get selected video IDs from request (optional - if not provided, use all selected videos)
    const body = await request.json();
    const { videoIds } = body;

    let videosToImport = campaign.sourceVideos;

    // If specific video IDs provided, filter to those
    if (videoIds && Array.isArray(videoIds)) {
      videosToImport = campaign.sourceVideos.filter((v) => videoIds.includes(v.id));

      // Update selected status for videos not in the list
      await prisma.sourceVideo.updateMany({
        where: {
          campaignId: campaignId,
          id: {
            notIn: videoIds,
          },
        },
        data: {
          selected: false,
        },
      });

      // Update campaign's selected count
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          videosSelected: videoIds.length,
        },
      });
    }

    if (videosToImport.length === 0) {
      return NextResponse.json(
        { error: 'No videos selected for import' },
        { status: 400 }
      );
    }

    // Add download jobs to queue
    const jobPromises = videosToImport.map((video) =>
      addVideoDownloadJob({
        sourceVideoId: video.id,
        campaignId: campaignId,
        videoUrl: video.originalUrl,
        thumbnailUrl: video.thumbnailUrl,
      })
    );

    await Promise.all(jobPromises);

    // Update campaign status
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'processing',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Import started! We're downloading ${videosToImport.length} videos 🚀`,
      queuedVideos: videosToImport.length,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error starting import:', err);
    return NextResponse.json(
      { error: 'Failed to start import', details: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check import status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  try {
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        sourceVideos: {
          select: {
            id: true,
            status: true,
            downloaded: true,
            selected: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const selectedVideos = campaign.sourceVideos.filter((v) => v.selected);
    const downloadedCount = selectedVideos.filter((v) => v.downloaded).length;
    const downloadingCount = selectedVideos.filter((v) => v.status === 'downloading').length;
    const failedCount = selectedVideos.filter((v) => v.status === 'failed').length;

    return NextResponse.json({
      campaignId: campaign.id,
      status: campaign.status,
      total: selectedVideos.length,
      downloaded: downloadedCount,
      downloading: downloadingCount,
      failed: failedCount,
      progress: selectedVideos.length > 0 ? (downloadedCount / selectedVideos.length) * 100 : 0,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error getting import status:', err);
    return NextResponse.json(
      { error: 'Failed to get status', details: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
