import { z } from 'zod';

// Campaign validation schemas
export const createCampaignSchema = z.object({
  name: z
    .string()
    .min(1, 'Campaign name is required')
    .max(100, 'Campaign name must be less than 100 characters'),
  sourceProfileUrl: z
    .string()
    .url('Please enter a valid URL')
    .min(1, 'Profile URL is required'),
  sourcePlatform: z.enum(['tiktok', 'instagram', 'facebook'], {
    errorMap: () => ({ message: 'Please select a valid platform' }),
  }),
});

export const updateCampaignSchema = z.object({
  name: z
    .string()
    .min(1, 'Campaign name is required')
    .max(100, 'Campaign name must be less than 100 characters')
    .optional(),
  status: z
    .enum(['discovering', 'discovered', 'processing', 'ready', 'failed'])
    .optional(),
});

// Video validation schemas
export const selectVideosSchema = z.object({
  videoIds: z.array(z.string()).min(1, 'Select at least one video'),
});

export const updateVideoSelectionSchema = z.object({
  videoId: z.string(),
  selected: z.boolean(),
});

// Scheduled post validation schemas
export const schedulePostSchema = z.object({
  processedVideoId: z.string().optional(),
  sourceVideoId: z.string().optional(),
  connectedAccountId: z.string().min(1, 'Please select an account'),
  caption: z
    .string()
    .min(1, 'Caption is required')
    .max(2200, 'Caption must be less than 2200 characters'),
  scheduledAt: z.coerce.date().refine(
    (date) => date > new Date(),
    'Scheduled time must be in the future'
  ),
});

export const updateScheduledPostSchema = z.object({
  caption: z
    .string()
    .min(1, 'Caption is required')
    .max(2200, 'Caption must be less than 2200 characters')
    .optional(),
  scheduledAt: z.coerce.date().optional(),
  status: z
    .enum(['scheduled', 'processing', 'posted', 'failed', 'paused'])
    .optional(),
});

export const bulkScheduleSchema = z.object({
  videoIds: z.array(z.string()).min(1, 'Select at least one video'),
  connectedAccountId: z.string().min(1, 'Please select an account'),
  startDate: z.coerce.date().refine(
    (date) => date > new Date(),
    'Start date must be in the future'
  ),
  frequency: z.enum(['daily', 'twice-daily', 'three-times-daily', 'custom']),
  customInterval: z.number().min(1).max(168).optional(), // Hours between posts
  caption: z
    .string()
    .max(2200, 'Caption must be less than 2200 characters')
    .optional(),
});

// Connected account validation schemas
export const connectAccountSchema = z.object({
  platform: z.enum(['tiktok', 'instagram', 'facebook']),
  platformAccountId: z.string().min(1, 'Account ID is required'),
  platformAccountName: z.string().min(1, 'Account name is required'),
  ayrshareProfileKey: z.string().min(1, 'Ayrshare profile key is required'),
  followerCount: z.number().optional(),
});

export const updateConnectedAccountSchema = z.object({
  platformAccountName: z.string().min(1).optional(),
  followerCount: z.number().optional(),
  isActive: z.boolean().optional(),
});

// User settings validation schemas
export const updateUserSettingsSchema = z.object({
  notificationEmail: z.boolean().optional(),
  notificationPush: z.boolean().optional(),
  autoRetryFailed: z.boolean().optional(),
  maxRetries: z.number().min(0).max(10).optional(),
  timezone: z.string().optional(),
});

// Webhook validation schemas
export const ayrshareWebhookSchema = z.object({
  event: z.string(),
  postId: z.string(),
  status: z.string(),
  platform: z.string().optional(),
  platformPostId: z.string().optional(),
  platformPostUrl: z.string().optional(),
  error: z.string().optional(),
});

// API query schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export const campaignFilterSchema = z.object({
  status: z.enum(['discovering', 'discovered', 'processing', 'ready', 'failed']).optional(),
  platform: z.enum(['tiktok', 'instagram', 'facebook']).optional(),
});

export const videoFilterSchema = z.object({
  campaignId: z.string().optional(),
  status: z.enum(['pending', 'downloading', 'downloaded', 'failed']).optional(),
  selected: z.coerce.boolean().optional(),
});

export const postFilterSchema = z.object({
  campaignId: z.string().optional(),
  status: z
    .enum(['scheduled', 'processing', 'posted', 'failed', 'paused'])
    .optional(),
  connectedAccountId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// Video processing validation schemas
export const videoModificationSchema = z.object({
  speedMultiplier: z.number().min(0.8).max(1.2).optional(),
  flipHorizontal: z.boolean().optional(),
  flipVertical: z.boolean().optional(),
  brightness: z.number().min(-10).max(10).optional(),
  contrast: z.number().min(-10).max(10).optional(),
  saturation: z.number().min(-10).max(10).optional(),
  cropPercentage: z.number().min(1).max(5).optional(),
  scalePercentage: z.number().min(98).max(102).optional(),
  volumeAdjustment: z.number().min(-10).max(10).optional(),
  audioPitchShift: z.number().min(-2).max(2).optional(),
  removeMetadata: z.boolean().default(true),
  randomizeTimestamps: z.boolean().default(true),
});

export const processVideoSchema = z.object({
  sourceVideoId: z.string().min(1, 'Source video ID is required'),
  versionCount: z.number().min(1).max(10).default(3),
  modifications: videoModificationSchema.optional(),
});

// Export type inference helpers
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type SchedulePostInput = z.infer<typeof schedulePostSchema>;
export type UpdateScheduledPostInput = z.infer<typeof updateScheduledPostSchema>;
export type BulkScheduleInput = z.infer<typeof bulkScheduleSchema>;
export type ConnectAccountInput = z.infer<typeof connectAccountSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
export type ProcessVideoInput = z.infer<typeof processVideoSchema>;
export type VideoModificationInput = z.infer<typeof videoModificationSchema>;
