import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helper';
import { prisma } from '@/lib/db';
import { videoProcessingQueue } from '@/lib/queue';
import { generateModificationSettings, PresetName } from '@/lib/uniquify';

/**
 * Reprocess a single processed video
 * POST /api/videos/uniquify/[id]/reprocess
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: processedVideoId } = await params;
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;
    const body = await request.json();
    
    const { preset, customSettings }: {
      preset?: PresetName;
      customSettings?: Record<string, unknown>;
    } = body;

    // Get processed video and verify ownership
    const processedVideo = await prisma.processedVideo.findFirst({
      where: {
        id: processedVideoId,
        campaign: {
          userId
        }
      },
      include: {
        sourceVideo: true
      }
    });

    if (!processedVideo) {
      return NextResponse.json(
        { error: 'Processed video not found' },
        { status: 404 }
      );
    }

    // Generate new modification settings
    const modificationSettings = customSettings || 
      generateModificationSettings(preset || 'smart');

    // Update status to reprocessing
    await prisma.processedVideo.update({
      where: { id: processedVideoId },
      data: {
        status: 'reprocessing',
        modificationSettings: JSON.parse(JSON.stringify(modificationSettings))
      }
    });

    // Add job to queue
    await videoProcessingQueue.add(
      'uniquify' as never,
      {
        processedVideoId: processedVideo.id,
        sourceVideoId: processedVideo.sourceVideoId,
        sourceVideoUrl: processedVideo.sourceVideo.downloadedUrl,
        modificationSettings,
        targetPlatform: 'tiktok' // Default to TikTok
      } as never,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    );

    return NextResponse.json({
      success: true,
      processedVideoId,
      message: 'Reprocessing started'
    });

  } catch (error) {
    console.error('Error reprocessing video:', error);
    return NextResponse.json(
      { error: 'Failed to start reprocessing' },
      { status: 500 }
    );
  }
}
