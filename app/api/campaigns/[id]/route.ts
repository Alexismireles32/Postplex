import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helper';
import { prisma } from '@/lib/db';

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
          orderBy: {
            uploadedAt: 'desc',
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

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        sourceProfileUrl: campaign.sourceProfileUrl,
        sourcePlatform: campaign.sourcePlatform,
        status: campaign.status,
        videosDiscovered: campaign.videosDiscovered,
        videosSelected: campaign.videosSelected,
        storageUsed: campaign.storageUsed,
        createdAt: campaign.createdAt,
      },
      videos: campaign.sourceVideos,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error fetching campaign:', err);
    return NextResponse.json(
      { error: 'Failed to fetch campaign', details: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
