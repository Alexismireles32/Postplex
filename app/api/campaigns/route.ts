import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helper';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaigns = await prisma.campaign.findMany({
      where: { userId: user.id },
      include: {
        sourceVideos: {
          take: 3,
          orderBy: {
            viewCount: 'desc',
          },
          select: {
            thumbnailUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const campaignsWithThumbnails = campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      sourceProfileUrl: campaign.sourceProfileUrl,
      sourcePlatform: campaign.sourcePlatform,
      status: campaign.status,
      videosDiscovered: campaign.videosDiscovered,
      videosSelected: campaign.videosSelected,
      storageUsed: campaign.storageUsed,
      createdAt: campaign.createdAt,
      thumbnails: campaign.sourceVideos.map((v) => v.thumbnailUrl),
    }));

    return NextResponse.json({ campaigns: campaignsWithThumbnails });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error fetching campaigns:', err);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns', details: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
