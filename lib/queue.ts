import { Queue, QueueEvents, ConnectionOptions } from 'bullmq';
import type { VideoProcessingJob, VideoDownloadJob, PostScheduleJob } from '@/types';

// Queue names
export const QUEUE_NAMES = {
  VIDEO_DOWNLOAD: 'video-download',
  VIDEO_PROCESSING: 'video-processing',
  POST_SCHEDULE: 'post-schedule',
} as const;

// Check if Redis is enabled (for graceful degradation)
const REDIS_ENABLED = !!process.env.REDIS_URL;
let redisConnectionWarned = false;

// Lazy initialization of Redis connection options
function getConnectionOptions(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    if (!redisConnectionWarned) {
      console.warn('[Queue] REDIS_URL not set - queues disabled. Background jobs will not work.');
      redisConnectionWarned = true;
    }
    // Return minimal config that won't try to connect
    return {
      host: '127.0.0.1', // Unreachable but won't spam DNS
      port: 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy: () => null, // Never retry
    };
  }

  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port || '6379'),
      password: url.password || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
      lazyConnect: true,
      family: 4, // Force IPv4 to avoid DNS issues on Railway
      connectTimeout: 5000, // 5 second timeout
      retryStrategy: (times: number) => {
        if (times > 2) {
          console.error(`[Queue] Redis connection failed after ${times} attempts, stopping retries`);
          return null; // Stop retrying after 2 attempts
        }
        return Math.min(times * 2000, 5000); // 2s, 4s delays
      },
    };
  } catch (error) {
    console.error('[Queue] Invalid REDIS_URL format:', error);
    return {
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy: () => null,
    };
  }
}

// Lazy singleton pattern - queues are only created when first accessed
let _videoDownloadQueue: Queue<VideoDownloadJob> | null = null;
let _videoProcessingQueue: Queue<VideoProcessingJob> | null = null;
let _postScheduleQueue: Queue<PostScheduleJob> | null = null;
let _videoDownloadEvents: QueueEvents | null = null;
let _videoProcessingEvents: QueueEvents | null = null;
let _postScheduleEvents: QueueEvents | null = null;

// Export object with getters for lazy initialization
export const queues = {
  get videoDownload(): Queue<VideoDownloadJob> {
    if (!_videoDownloadQueue) {
      _videoDownloadQueue = new Queue<VideoDownloadJob>(
        QUEUE_NAMES.VIDEO_DOWNLOAD,
        {
          connection: getConnectionOptions(),
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: { count: 100, age: 24 * 3600 },
            removeOnFail: { count: 500 },
          },
        }
      );
    }
    return _videoDownloadQueue;
  },

  get videoProcessing(): Queue<VideoProcessingJob> {
    if (!_videoProcessingQueue) {
      _videoProcessingQueue = new Queue<VideoProcessingJob>(
        QUEUE_NAMES.VIDEO_PROCESSING,
        {
          connection: getConnectionOptions(),
          defaultJobOptions: {
            attempts: 2,
            backoff: { type: 'exponential', delay: 10000 },
            removeOnComplete: { count: 100, age: 24 * 3600 },
            removeOnFail: { count: 500 },
          },
        }
      );
    }
    return _videoProcessingQueue;
  },

  get postSchedule(): Queue<PostScheduleJob> {
    if (!_postScheduleQueue) {
      _postScheduleQueue = new Queue<PostScheduleJob>(
        QUEUE_NAMES.POST_SCHEDULE,
        {
          connection: getConnectionOptions(),
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 30000 },
            removeOnComplete: { count: 1000, age: 7 * 24 * 3600 },
            removeOnFail: { count: 1000 },
          },
        }
      );
    }
    return _postScheduleQueue;
  },
};

// For backwards compatibility - these are getters that return the queue instance
export const videoDownloadQueue = {
  add: (...args: Parameters<Queue<VideoDownloadJob>['add']>) => queues.videoDownload.add(...args),
  getJobCounts: () => queues.videoDownload.getJobCounts(),
  close: () => queues.videoDownload.close(),
};

export const videoProcessingQueue = {
  add: (...args: Parameters<Queue<VideoProcessingJob>['add']>) => queues.videoProcessing.add(...args),
  getJobCounts: () => queues.videoProcessing.getJobCounts(),
  close: () => queues.videoProcessing.close(),
};

export const postScheduleQueue = {
  add: (...args: Parameters<Queue<PostScheduleJob>['add']>) => queues.postSchedule.add(...args),
  getJobCounts: () => queues.postSchedule.getJobCounts(),
  close: () => queues.postSchedule.close(),
};

// Queue events (lazy)
export const events = {
  get videoDownload(): QueueEvents {
    if (!_videoDownloadEvents) {
      _videoDownloadEvents = new QueueEvents(QUEUE_NAMES.VIDEO_DOWNLOAD, {
        connection: getConnectionOptions(),
      });
    }
    return _videoDownloadEvents;
  },

  get videoProcessing(): QueueEvents {
    if (!_videoProcessingEvents) {
      _videoProcessingEvents = new QueueEvents(QUEUE_NAMES.VIDEO_PROCESSING, {
        connection: getConnectionOptions(),
      });
    }
    return _videoProcessingEvents;
  },

  get postSchedule(): QueueEvents {
    if (!_postScheduleEvents) {
      _postScheduleEvents = new QueueEvents(QUEUE_NAMES.POST_SCHEDULE, {
        connection: getConnectionOptions(),
      });
    }
    return _postScheduleEvents;
  },
};

// For backwards compatibility
export const videoDownloadEvents = events;
export const videoProcessingEvents = events;
export const postScheduleEvents = events;

// Helper functions to add jobs (these create queues on first use)
export async function addVideoDownloadJob(data: VideoDownloadJob) {
  if (!REDIS_ENABLED) {
    console.warn('[Queue] Redis not configured - video download job not queued');
    return null;
  }
  try {
    return await queues.videoDownload.add('download', data, {
      jobId: `download-${data.sourceVideoId}`,
    });
  } catch (error) {
    console.error('[Queue] Failed to add video download job:', error);
    throw error;
  }
}

export async function addVideoProcessingJob(data: VideoProcessingJob) {
  if (!REDIS_ENABLED) {
    console.warn('[Queue] Redis not configured - video processing job not queued');
    return null;
  }
  try {
    return await queues.videoProcessing.add('process', data, {
      jobId: `process-${data.sourceVideoId}-${Date.now()}`,
    });
  } catch (error) {
    console.error('[Queue] Failed to add video processing job:', error);
    throw error;
  }
}

export async function addPostScheduleJob(data: PostScheduleJob, scheduleDate: Date) {
  if (!REDIS_ENABLED) {
    console.warn('[Queue] Redis not configured - post schedule job not queued');
    return null;
  }
  try {
    return await queues.postSchedule.add('schedule', data, {
      jobId: `post-${data.scheduledPostId}`,
      delay: scheduleDate.getTime() - Date.now(),
    });
  } catch (error) {
    console.error('[Queue] Failed to add post schedule job:', error);
    throw error;
  }
}

// Helper to get queue health
export async function getQueueHealth() {
  if (!REDIS_ENABLED) {
    return {
      videoDownload: null,
      videoProcessing: null,
      postSchedule: null,
      error: 'Redis not configured',
    };
  }
  
  try {
    const [downloadCounts, processingCounts, postCounts] = await Promise.all([
      queues.videoDownload.getJobCounts(),
      queues.videoProcessing.getJobCounts(),
      queues.postSchedule.getJobCounts(),
    ]);

    return {
      videoDownload: downloadCounts,
      videoProcessing: processingCounts,
      postSchedule: postCounts,
    };
  } catch (error) {
    console.error('[Queue] Failed to get queue health:', error);
    return {
      videoDownload: null,
      videoProcessing: null,
      postSchedule: null,
      error: 'Redis connection failed',
    };
  }
}

// Graceful shutdown
export async function closeQueues() {
  const closePromises = [];

  if (_videoDownloadQueue) closePromises.push(_videoDownloadQueue.close());
  if (_videoProcessingQueue) closePromises.push(_videoProcessingQueue.close());
  if (_postScheduleQueue) closePromises.push(_postScheduleQueue.close());
  if (_videoDownloadEvents) closePromises.push(_videoDownloadEvents.close());
  if (_videoProcessingEvents) closePromises.push(_videoProcessingEvents.close());
  if (_postScheduleEvents) closePromises.push(_postScheduleEvents.close());

  await Promise.all(closePromises);
}
