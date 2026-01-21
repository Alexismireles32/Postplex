import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helper';
import { prisma } from '@/lib/db';

/**
 * Get batch of videos by IDs
 * GET /api/videos/batch?ids=id1,id2,id3
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { error: 'No IDs provided' },
        { status: 400 }
      );
    }

    const ids = idsParam.split(',');

    const videos = await prisma.sourceVideo.findMany({
      where: {
        id: { in: ids },
        campaign: {
          userId
        }
      },
      select: {
        id: true,
        thumbnailUrl: true,
        caption: true,
        duration: true,
        viewCount: true,
        downloadedUrl: true
      }
    });

    return NextResponse.json({
      videos
    });

  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
