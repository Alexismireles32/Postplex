import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helper';
import { prisma } from '@/lib/db';
import { videoProcessingQueue } from '@/lib/queue';
import { generateModificationSettings, PresetName } from '@/lib/uniquify';

/**
 * Start uniquification process
 * POST /api/videos/uniquify
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;
    const body = await request.json();

    const {
      campaignId,
      videoIds,
      preset,
      versionsPerVideo,
      targetPlatform
    }: {
      campaignId?: string;
      videoIds: string[];
      preset: PresetName;
      versionsPerVideo: number;
      targetPlatform: 'tiktok' | 'instagram' | 'facebook';
    } = body;

    // Validation
    if (!videoIds || videoIds.length === 0) {
      return NextResponse.json(
        { error: 'No videos provided' },
        { status: 400 }
      );
    }

    if (!['safe', 'smart', 'maximum'].includes(preset)) {
      return NextResponse.json(
        { error: 'Invalid preset' },
        { status: 400 }
      );
    }

    if (!versionsPerVideo || versionsPerVideo < 1 || versionsPerVideo > 10) {
      return NextResponse.json(
        { error: 'Invalid versions count' },
        { status: 400 }
      );
    }

    // Verify videos exist and belong to user
    const videos = await prisma.sourceVideo.findMany({
      where: {
        id: { in: videoIds },
        campaign: {
          userId
        },
        downloaded: true
      },
      include: {
        campaign: true
      }
    });

    if (videos.length !== videoIds.length) {
      return NextResponse.json(
        { error: 'Some videos not found or not downloaded' },
        { status: 404 }
      );
    }

    // Update campaign status if provided
    if (campaignId) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'processing' }
      });
    }

    // Create processed video records and add jobs to queue
    const jobPromises = [];
    const createdVideos = [];

    for (const video of videos) {
      for (let versionNumber = 1; versionNumber <= versionsPerVideo; versionNumber++) {
        // Generate random modification settings for this version
        const modificationSettings = generateModificationSettings(preset);

        // Create ProcessedVideo record
        const processedVideo = await prisma.processedVideo.create({
          data: {
            sourceVideoId: video.id,
            campaignId: video.campaignId,
            versionNumber,
            modificationSettings: JSON.parse(JSON.stringify(modificationSettings)),
            status: 'pending'
          }
        });

        createdVideos.push(processedVideo);

        // Add job to queue
        const jobPromise = videoProcessingQueue.add(
          'uniquify' as never,
          {
            processedVideoId: processedVideo.id,
            sourceVideoId: video.id,
            sourceVideoUrl: video.downloadedUrl,
            modificationSettings,
            targetPlatform
          } as never,
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000
            },
            removeOnComplete: {
              count: 100,
              age: 24 * 3600
            },
            removeOnFail: {
              count: 500
            }
          }
        );

        jobPromises.push(jobPromise);
      }
    }

    // Wait for all jobs to be added
    await Promise.all(jobPromises);

    return NextResponse.json({
      success: true,
      totalJobs: createdVideos.length,
      videoCount: videos.length,
      versionsPerVideo,
      preset,
      message: `Started processing ${createdVideos.length} videos`
    });

  } catch (error) {
    console.error('Error starting uniquification:', error);
    return NextResponse.json(
      { error: 'Failed to start uniquification' },
      { status: 500 }
    );
  }
}
