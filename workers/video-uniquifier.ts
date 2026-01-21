/**
 * Video Uniquifier Worker
 * 
 * Processes videos from the queue and applies FFmpeg modifications
 * to make each video unique.
 */

import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { prisma } from '../lib/db';
import { uploadToR2, generateStorageKey } from '../lib/storage';
import { ModificationSettings, generateQualityFlags, QUALITY_THRESHOLDS } from '../lib/uniquify';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Connect to Redis (same config as queue.ts)
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

interface UniquifyJobData {
  processedVideoId: string;
  sourceVideoId: string;
  sourceVideoUrl: string;
  modificationSettings: ModificationSettings;
  targetPlatform: 'tiktok' | 'instagram' | 'facebook';
}

/**
 * Download video from R2 to temporary file
 */
async function downloadVideo(url: string): Promise<string> {
  const tempDir = os.tmpdir();
  const filename = `download-${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;
  const filepath = path.join(tempDir, filename);

  const response = await axios.get(url, {
    responseType: 'stream'
  });

  const writer = require('fs').createWriteStream(filepath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(filepath));
    writer.on('error', reject);
  });
}

/**
 * Apply FFmpeg modifications to video
 */
async function processVideoWithFFmpeg(
  inputPath: string,
  outputPath: string,
  settings: ModificationSettings
): Promise<void> {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath);

    // Video filters
    const videoFilters: string[] = [];

    // Speed adjustment (affects duration)
    if (settings.speed !== 1.0) {
      videoFilters.push(`setpts=${1 / settings.speed}*PTS`);
    }

    // Brightness adjustment (-1 to 1 range for FFmpeg)
    if (settings.brightness !== 0) {
      const brightnessValue = settings.brightness / 100; // Convert percentage to -1 to 1
      videoFilters.push(`eq=brightness=${brightnessValue}`);
    }

    // Saturation adjustment (0.5 to 1.5 range for FFmpeg)
    if (settings.saturation !== 0) {
      const saturationValue = 1 + (settings.saturation / 100);
      videoFilters.push(`eq=saturation=${saturationValue}`);
    }

    // Crop and scale (crop from edges, then scale back up)
    if (settings.crop > 0) {
      const cropPercent = settings.crop / 100;
      videoFilters.push(`crop=iw*(1-${cropPercent*2}):ih*(1-${cropPercent*2})`);
      videoFilters.push(`scale=iw/(1-${cropPercent*2}):ih/(1-${cropPercent*2})`);
    }

    // Horizontal flip
    if (settings.flipped) {
      videoFilters.push('hflip');
    }

    // Rotation (in radians for FFmpeg)
    if (settings.rotation !== 0) {
      const rotationRadians = (settings.rotation * Math.PI) / 180;
      videoFilters.push(`rotate=${rotationRadians}:fillcolor=black@0`);
    }

    // Noise/grain
    if (settings.noise > 0) {
      videoFilters.push(`noise=alls=${settings.noise}:allf=t+u`);
    }

    // Apply video filters if any
    if (videoFilters.length > 0) {
      command = command.videoFilters(videoFilters.join(','));
    }

    // Audio filters
    const audioFilters: string[] = [];

    // Audio speed (must match video speed)
    if (settings.speed !== 1.0) {
      audioFilters.push(`atempo=${settings.speed}`);
    }

    // Audio pitch shift (requires rubberband or similar, approximation)
    if (settings.audioPitch !== 0) {
      // FFmpeg doesn't have native pitch shift, use speed as approximation
      // In production, you'd want to use a better audio processing library
      const pitchFactor = 1 + (settings.audioPitch / 100);
      if (pitchFactor !== settings.speed) {
        // Only apply if different from speed adjustment
        audioFilters.push(`asetrate=44100*${pitchFactor},aresample=44100`);
      }
    }

    // Apply audio filters if any
    if (audioFilters.length > 0) {
      command = command.audioFilters(audioFilters.join(','));
    }

    // Output settings
    command
      .outputOptions([
        '-c:v libx264',           // H.264 codec
        '-preset medium',         // Balance between speed and quality
        '-crf 23',                // Constant Rate Factor (quality)
        '-c:a aac',               // AAC audio codec
        '-b:a 128k',              // Audio bitrate
        '-movflags +faststart'    // Enable streaming
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Analyze video quality
 */
async function analyzeVideoQuality(
  videoPath: string,
  originalDuration: number
): Promise<{
  averageBrightness: number;
  duration: number;
  width: number;
  height: number;
  audioClipping: boolean;
}> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const duration = metadata.format.duration || originalDuration;
      const width = videoStream?.width || 0;
      const height = videoStream?.height || 0;

      // Simple quality metrics (in production, you'd analyze frames)
      // For now, we'll do basic checks
      resolve({
        averageBrightness: 128, // Would need frame analysis
        duration,
        width,
        height,
        audioClipping: false // Would need audio analysis
      });
    });
  });
}

/**
 * Process a single uniquification job
 */
async function processUniquifyJob(jobData: UniquifyJobData) {
  const { processedVideoId, sourceVideoId, sourceVideoUrl, modificationSettings } = jobData;

  console.log(`[Uniquifier] Processing video ${processedVideoId}`);

  // Update status to processing
  await prisma.processedVideo.update({
    where: { id: processedVideoId },
    data: { status: 'processing' }
  });

  let inputPath: string | null = null;
  let outputPath: string | null = null;

  try {
    // Step 1: Download original video
    console.log(`[Uniquifier] Downloading video from ${sourceVideoUrl}`);
    inputPath = await downloadVideo(sourceVideoUrl);

    // Step 2: Apply FFmpeg modifications
    const tempDir = os.tmpdir();
    const outputFilename = `processed-${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;
    outputPath = path.join(tempDir, outputFilename);

    console.log(`[Uniquifier] Processing with FFmpeg...`);
    await processVideoWithFFmpeg(inputPath, outputPath, modificationSettings);

    // Step 3: Get source video info
    const sourceVideo = await prisma.sourceVideo.findUnique({
      where: { id: sourceVideoId },
      select: { duration: true }
    });

    // Step 4: Analyze quality
    console.log(`[Uniquifier] Analyzing quality...`);
    const qualityMetrics = await analyzeVideoQuality(
      outputPath,
      sourceVideo?.duration || 0
    );

    // Step 5: Run quality checks
    const durationDiff = Math.abs(qualityMetrics.duration - (sourceVideo?.duration || 0));
    const qualityFlags = generateQualityFlags(
      qualityMetrics.averageBrightness,
      durationDiff,
      0, // Resolution loss (would need original dimensions)
      qualityMetrics.audioClipping
    );

    // Step 6: Upload to R2
    console.log(`[Uniquifier] Uploading to R2...`);
    const videoBuffer = await fs.readFile(outputPath);
    
    // Get user ID from source video
    const video = await prisma.sourceVideo.findUnique({
      where: { id: sourceVideoId },
      include: { campaign: true }
    });
    
    if (!video) {
      throw new Error('Source video not found');
    }

    const storageKey = generateStorageKey(
      video.campaign.userId,
      video.campaignId,
      `${processedVideoId}.mp4`,
      'processed'
    );

    const uploadResult = await uploadToR2(videoBuffer, storageKey, 'video/mp4');

    // Step 7: Update database
    await prisma.processedVideo.update({
      where: { id: processedVideoId },
      data: {
        processedUrl: uploadResult.url,
        status: 'completed',
        qualityVerified: qualityFlags.length === 0,
        qualityFlags: qualityFlags.length > 0 ? JSON.parse(JSON.stringify(qualityFlags)) : null
      }
    });

    console.log(`[Uniquifier] Successfully processed ${processedVideoId}`);

    // Clean up temporary files
    if (inputPath) await fs.unlink(inputPath).catch(() => {});
    if (outputPath) await fs.unlink(outputPath).catch(() => {});

    return { success: true, processedVideoId };

  } catch (error) {
    console.error(`[Uniquifier] Error processing ${processedVideoId}:`, error);

    // Update status to failed
    await prisma.processedVideo.update({
      where: { id: processedVideoId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    // Clean up temporary files
    if (inputPath) await fs.unlink(inputPath).catch(() => {});
    if (outputPath) await fs.unlink(outputPath).catch(() => {});

    throw error;
  }
}

// Create worker
const worker = new Worker<UniquifyJobData>(
  'video-processing',
  async (job) => {
    console.log(`[Uniquifier Worker] Processing job ${job.id}`);
    return await processUniquifyJob(job.data);
  },
  {
    connection: connectionOptions as never,
    concurrency: 2, // Process 2 videos at a time
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 }
  }
);

worker.on('completed', (job) => {
  console.log(`[Uniquifier Worker] Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`[Uniquifier Worker] Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('[Uniquifier Worker] Worker error:', err);
});

console.log('[Uniquifier Worker] Started and waiting for jobs...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Uniquifier Worker] SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Uniquifier Worker] SIGINT received, closing worker...');
  await worker.close();
  process.exit(0);
});
