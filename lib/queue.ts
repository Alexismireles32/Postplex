import { Queue, QueueEvents, ConnectionOptions } from 'bullmq';
import type { VideoProcessingJob, VideoDownloadJob, PostScheduleJob } from '@/types';

// Queue names
export const QUEUE_NAMES = {
  VIDEO_DOWNLOAD: 'video-download',
  VIDEO_PROCESSING: 'video-processing',
  POST_SCHEDULE: 'post-schedule',
} as const;

// Lazy initialization of Redis connection options
// This allows the module to be imported during build time without throwing errors
function getConnectionOptions(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL;
  
  // Only validate in production at runtime (not during build)
  if (!redisUrl && process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    console.warn('REDIS_URL environment variable is not set. Queues will not function properly.');
  }

  return redisUrl
    ? {
        host: new URL(redisUrl).hostname,
        port: parseInt(new URL(redisUrl).port || '6379'),
        password: new URL(redisUrl).password,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        tls: redisUrl.startsWith('rediss://') ? {} : undefined,
        family: 6,
      }
    : {
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      };
}

// Create queues with lazy connection
export const videoDownloadQueue = new Queue<VideoDownloadJob>(
  QUEUE_NAMES.VIDEO_DOWNLOAD,
  {
    connection: getConnectionOptions(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5 seconds
      },
      removeOnComplete: {
        count: 100, // Keep last 100 completed jobs
        age: 24 * 3600, // 24 hours
      },
      removeOnFail: {
        count: 500, // Keep last 500 failed jobs
      },
    },
  }
);

export const videoProcessingQueue = new Queue<VideoProcessingJob>(
  QUEUE_NAMES.VIDEO_PROCESSING,
  {
    connection: getConnectionOptions(),
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 10000, // 10 seconds
      },
      removeOnComplete: {
        count: 100,
        age: 24 * 3600,
      },
      removeOnFail: {
        count: 500,
      },
    },
  }
);

export const postScheduleQueue = new Queue<PostScheduleJob>(
  QUEUE_NAMES.POST_SCHEDULE,
  {
    connection: getConnectionOptions(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 30000, // 30 seconds
      },
      removeOnComplete: {
        count: 1000,
        age: 7 * 24 * 3600, // 7 days
      },
      removeOnFail: {
        count: 1000,
      },
    },
  }
);

// Queue events for monitoring (lazy initialization)
export const videoDownloadEvents = new QueueEvents(QUEUE_NAMES.VIDEO_DOWNLOAD, {
  connection: getConnectionOptions(),
});

export const videoProcessingEvents = new QueueEvents(QUEUE_NAMES.VIDEO_PROCESSING, {
  connection: getConnectionOptions(),
});

export const postScheduleEvents = new QueueEvents(QUEUE_NAMES.POST_SCHEDULE, {
  connection: getConnectionOptions(),
});

// Helper functions to add jobs
export async function addVideoDownloadJob(data: VideoDownloadJob) {
  return videoDownloadQueue.add('download', data, {
    jobId: `download-${data.sourceVideoId}`,
  });
}

export async function addVideoProcessingJob(data: VideoProcessingJob) {
  return videoProcessingQueue.add('process', data, {
    jobId: `process-${data.sourceVideoId}-${Date.now()}`,
  });
}

export async function addPostScheduleJob(data: PostScheduleJob, scheduleDate: Date) {
  return postScheduleQueue.add('schedule', data, {
    jobId: `post-${data.scheduledPostId}`,
    delay: scheduleDate.getTime() - Date.now(),
  });
}

// Helper to get queue health
export async function getQueueHealth() {
  const [downloadCounts, processingCounts, postCounts] = await Promise.all([
    videoDownloadQueue.getJobCounts(),
    videoProcessingQueue.getJobCounts(),
    postScheduleQueue.getJobCounts(),
  ]);

  return {
    videoDownload: downloadCounts,
    videoProcessing: processingCounts,
    postSchedule: postCounts,
  };
}

// Graceful shutdown
export async function closeQueues() {
  await Promise.all([
    videoDownloadQueue.close(),
    videoProcessingQueue.close(),
    postScheduleQueue.close(),
    videoDownloadEvents.close(),
    videoProcessingEvents.close(),
    postScheduleEvents.close(),
  ]);
}
