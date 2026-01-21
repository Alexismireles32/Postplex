import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helper';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all source videos for user's campaigns
    const videos = await prisma.sourceVideo.findMany({
      where: {
        campaign: {
          userId: user.id,
        },
        selected: true, // Only show selected videos
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            sourcePlatform: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ videos });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error fetching library:', err);
    return NextResponse.json(
      { error: 'Failed to fetch library', details: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
