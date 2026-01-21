import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helper';
import { prisma } from '@/lib/db';
import { videoProcessingQueue } from '@/lib/queue';
import { ModificationSettings, QualityFlagType } from '@/lib/uniquify';

/**
 * Quick fix for common quality issues
 * POST /api/videos/uniquify/[id]/quick-fix
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
    
    const { issueType }: { issueType: QualityFlagType } = body;

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

    // Get current settings
    const currentSettings = processedVideo.modificationSettings as unknown as ModificationSettings;

    // Apply fix based on issue type
    const fixedSettings = { ...currentSettings };

    switch (issueType) {
      case 'too_dark':
        // Increase brightness
        fixedSettings.brightness = Math.min(12, currentSettings.brightness + 5);
        break;

      case 'overexposed':
        // Decrease brightness
        fixedSettings.brightness = Math.max(-8, currentSettings.brightness - 5);
        break;

      case 'audio_distorted':
        // Reduce audio pitch adjustment
        fixedSettings.audioPitch = currentSettings.audioPitch * 0.5;
        break;

      case 'duration_change':
        // Adjust speed closer to 1.0
        fixedSettings.speed = 1.0 + (currentSettings.speed - 1.0) * 0.5;
        break;

      case 'resolution_reduced':
        // Reduce crop amount
        fixedSettings.crop = currentSettings.crop * 0.5;
        break;

      default:
        return NextResponse.json(
          { error: 'Unknown issue type' },
          { status: 400 }
        );
    }

    // Update status to reprocessing
    await prisma.processedVideo.update({
      where: { id: processedVideoId },
      data: {
        status: 'reprocessing',
        modificationSettings: JSON.parse(JSON.stringify(fixedSettings))
      }
    });

    // Add job to queue
    await videoProcessingQueue.add(
      'uniquify' as never,
      {
        processedVideoId: processedVideo.id,
        sourceVideoId: processedVideo.sourceVideoId,
        sourceVideoUrl: processedVideo.sourceVideo.downloadedUrl,
        modificationSettings: fixedSettings,
        targetPlatform: 'tiktok'
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
      fixedSettings,
      message: 'Quick fix applied, reprocessing started'
    });

  } catch (error) {
    console.error('Error applying quick fix:', error);
    return NextResponse.json(
      { error: 'Failed to apply quick fix' },
      { status: 500 }
    );
  }
}
