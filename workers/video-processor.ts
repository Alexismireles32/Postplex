import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { prisma } from '@/lib/db';
import { downloadFromR2, uploadToR2 } from '@/lib/storage';
import type { VideoProcessingJob, VideoDownloadJob, PostScheduleJob } from '@/types';
import { QUEUE_NAMES } from '@/lib/queue';

// Validate Redis URL
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL environment variable is not set');
}

// Create Redis connection options for BullMQ
const connectionOptions = {
  host: new URL(redisUrl).hostname,
  port: parseInt(new URL(redisUrl).port) || 6379,
  password: new URL(redisUrl).password || undefined,
  tls: redisUrl.startsWith('rediss://') ? {} : undefined,
};

// Video Download Worker
export const videoDownloadWorker = new Worker<VideoDownloadJob>(
  QUEUE_NAMES.VIDEO_DOWNLOAD,
  async (job) => {
    const { sourceVideoId, videoUrl, campaignId } = job.data;

    console.log(`[VideoDownload] Processing job ${job.id} for video ${sourceVideoId}`);

    try {
      // Update status to downloading
      await prisma.sourceVideo.update({
        where: { id: sourceVideoId },
        data: { status: 'downloading' },
      });

      // Download video from URL
      // In production, use axios or fetch to download
      // For now, this is a placeholder
      console.log(`[VideoDownload] Downloading from ${videoUrl}`);

      // Simulate download (replace with actual download logic)
      // const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
      // const buffer = Buffer.from(response.data);

      // For placeholder, create a mock buffer
      const buffer = Buffer.from('mock video data');

      // Upload to R2
      const key = `source/${campaignId}/${sourceVideoId}-${Date.now()}.mp4`;
      const result = await uploadToR2(buffer, key, 'video/mp4');

      // Update database
      await prisma.sourceVideo.update({
        where: { id: sourceVideoId },
        data: {
          status: 'downloaded',
          downloaded: true,
          downloadedUrl: result.url,
        },
      });

      // Update campaign stats
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          videosDiscovered: { increment: 0 }, // Already counted
        },
      });

      console.log(`[VideoDownload] Successfully downloaded video ${sourceVideoId}`);

      return { success: true, url: result.url };
    } catch (error) {
      console.error(`[VideoDownload] Error processing video ${sourceVideoId}:`, error);

      // Update status to failed
      await prisma.sourceVideo.update({
        where: { id: sourceVideoId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  },
  {
    connection: connectionOptions as never,
    concurrency: 5, // Process 5 downloads at once
  }
);

// Video Processing Worker
export const videoProcessingWorker = new Worker<VideoProcessingJob>(
  QUEUE_NAMES.VIDEO_PROCESSING,
  async (job) => {
    const { processedVideoId, sourceVideoId, sourceVideoUrl, modificationSettings, targetPlatform } = job.data;

    console.log(`[VideoProcessing] Processing job ${job.id} for processed video ${processedVideoId}`);

    try {
      // Update status to processing
      await prisma.processedVideo.update({
        where: { id: processedVideoId },
        data: { status: 'processing' },
      });

      // Process video (placeholder - implement actual video processing)
      console.log(`[VideoProcessing] Processing with settings:`, modificationSettings);
      console.log(`[VideoProcessing] Target platform: ${targetPlatform}`);

      // In production:
      // 1. Download video from R2 using sourceVideoUrl
      // 2. Apply modifications using FFmpeg
      // 3. Upload processed version back to R2

      if (sourceVideoUrl) {
        console.log(`[VideoProcessing] Would download from ${sourceVideoUrl}`);
        // const key = sourceVideoUrl.split('/').pop() || '';
        // const videoBuffer = await downloadFromR2(key);
        // Apply FFmpeg modifications here
        // const result = await uploadToR2(processedBuffer, processedKey, 'video/mp4');
      }

      // Update processed video with result
      await prisma.processedVideo.update({
        where: { id: processedVideoId },
        data: {
          status: 'completed',
          processedUrl: `https://r2.example.com/processed/${processedVideoId}.mp4`,
        },
      });

      console.log(`[VideoProcessing] Successfully processed video ${processedVideoId}`);

      return { success: true };
    } catch (error) {
      console.error(`[VideoProcessing] Error processing video ${processedVideoId}:`, error);
      
      // Update status to failed
      await prisma.processedVideo.update({
        where: { id: processedVideoId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      }).catch(() => {});
      
      throw error;
    }
  },
  {
    connection: connectionOptions as never,
    concurrency: 3, // Process 3 videos at once (CPU intensive)
  }
);

// Post Schedule Worker
export const postScheduleWorker = new Worker<PostScheduleJob>(
  QUEUE_NAMES.POST_SCHEDULE,
  async (job) => {
    const { scheduledPostId, videoUrl, caption, platform, profileKey } = job.data;

    console.log(`[PostSchedule] Processing job ${job.id} for post ${scheduledPostId}`);

    try {
      // Update status to processing
      await prisma.scheduledPost.update({
        where: { id: scheduledPostId },
        data: { status: 'processing' },
      });

      // Post to social media via Ayrshare (placeholder)
      console.log(`[PostSchedule] Posting to ${platform} via profile ${profileKey}`);
      console.log(`[PostSchedule] Video: ${videoUrl}`);
      console.log(`[PostSchedule] Caption: ${caption}`);

      // In production, use ayrshare.createPost()
      // const result = await ayrshare.createPost({
      //   post: caption,
      //   platforms: [platform],
      //   mediaUrls: [videoUrl],
      //   profileKey,
      // });

      // Update status to posted
      await prisma.scheduledPost.update({
        where: { id: scheduledPostId },
        data: {
          status: 'posted',
          postedAt: new Date(),
          // ayrsharePostId: result.id,
          // platformPostUrl: result.postIds[0]?.postUrl,
        },
      });

      console.log(`[PostSchedule] Successfully posted ${scheduledPostId}`);

      return { success: true };
    } catch (error) {
      console.error(`[PostSchedule] Error posting ${scheduledPostId}:`, error);

      // Update status to failed and increment retry count
      await prisma.scheduledPost.update({
        where: { id: scheduledPostId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  },
  {
    connection: connectionOptions as never,
    concurrency: 10, // Process 10 posts at once
  }
);

// Worker event handlers
[videoDownloadWorker, videoProcessingWorker, postScheduleWorker].forEach((worker) => {
  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Worker error:', err);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing workers...');
  await Promise.all([
    videoDownloadWorker.close(),
    videoProcessingWorker.close(),
    postScheduleWorker.close(),
  ]);
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing workers...');
  await Promise.all([
    videoDownloadWorker.close(),
    videoProcessingWorker.close(),
    postScheduleWorker.close(),
  ]);
  process.exit(0);
});

console.log('Workers started and ready to process jobs');
