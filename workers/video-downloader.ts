/**
 * Background Worker: Video Downloader
 * Processes video download jobs from the queue
 */

import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../lib/db';
import { downloadVideo, uploadToR2, generateVideoFilename } from '../lib/video-download';
import { formatBytes } from '../lib/social-media';

// Redis connection options for BullMQ
const redisUrl = process.env.REDIS_URL;
const connectionOptions = redisUrl
  ? {
      host: new URL(redisUrl).hostname,
      port: parseInt(new URL(redisUrl).port) || 6379,
      password: new URL(redisUrl).password || undefined,
      tls: redisUrl.startsWith('rediss://') ? {} : undefined,
    }
  : {
      host: 'localhost',
      port: 6379,
    };

interface VideoDownloadJob {
  videoId: string;
  campaignId: string;
  videoUrl: string;
  thumbnailUrl: string;
}

/**
 * Update video status in database
 */
async function updateVideoStatus(
  videoId: string,
  status: string,
  error?: string,
  downloadedUrl?: string,
  fileSize?: number
) {
  await prisma.sourceVideo.update({
    where: { id: videoId },
    data: {
      status,
      downloaded: status === 'downloaded',
      downloadedUrl: downloadedUrl || undefined,
      errorMessage: error || undefined,
      updatedAt: new Date(),
    },
  });

  // If downloaded, update campaign stats
  if (status === 'downloaded' && fileSize) {
    const video = await prisma.sourceVideo.findUnique({
      where: { id: videoId },
      include: { campaign: true },
    });

    if (video) {
      const downloadedCount = await prisma.sourceVideo.count({
        where: {
          campaignId: video.campaignId,
          downloaded: true,
        },
      });

      // Calculate total storage used
      const totalVideos = await prisma.sourceVideo.findMany({
        where: {
          campaignId: video.campaignId,
          downloaded: true,
        },
        select: { id: true },
      });

      const storageUsed = formatBytes(fileSize * totalVideos.length);

      await prisma.campaign.update({
        where: { id: video.campaignId },
        data: {
          videosProcessed: downloadedCount,
          storageUsed,
          status: downloadedCount === video.campaign.videosSelected ? 'ready' : 'processing',
        },
      });
    }
  }
}

/**
 * Process video download job
 */
async function processVideoDownload(job: Job<VideoDownloadJob>) {
  const { videoId, videoUrl, thumbnailUrl } = job.data;

  console.log(`[Worker] Processing video download: ${videoId}`);

  try {
    // Update status to downloading
    await updateVideoStatus(videoId, 'downloading');

    // Download video from public URL
    console.log(`[Worker] Downloading video from: ${videoUrl}`);
    const videoBuffer = await downloadVideo(videoUrl);

    // Generate filename
    const filename = generateVideoFilename(videoId);

    // Upload to R2
    console.log(`[Worker] Uploading to R2: ${filename}`);
    const r2Url = await uploadToR2(videoBuffer, filename);

    // Update database with success
    await updateVideoStatus(videoId, 'downloaded', undefined, r2Url, videoBuffer.length);

    console.log(`[Worker] Successfully processed video: ${videoId}`);

    return {
      success: true,
      videoId,
      downloadedUrl: r2Url,
      fileSize: videoBuffer.length,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error(`[Worker] Error processing video ${videoId}:`, err);

    // Update database with failure
    await updateVideoStatus(videoId, 'failed', err.message || 'Download failed');

    // Rethrow so BullMQ can handle retries
    throw error;
  }
}

/**
 * Create and start the worker
 */
function startWorker() {
  const worker = new Worker('video-processing', processVideoDownload, {
    connection: connectionOptions as never,
    concurrency: 5, // Process up to 5 videos simultaneously
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000, // Per 1 second
    },
  });

  // Event handlers
  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Worker error:', err);
  });

  worker.on('active', (job) => {
    console.log(`[Worker] Job ${job.id} is now active`);
  });

  console.log('🚀 Video downloader worker started!');
  console.log('   Concurrency: 5 videos at a time');
  console.log('   Rate limit: 10 videos per second');
  console.log('   Listening for jobs on queue: video-processing');

  return worker;
}

// Start the worker if this file is run directly
if (require.main === module) {
  console.log('Starting video downloader worker...');
  startWorker();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    process.exit(0);
  });
}

export { startWorker };
