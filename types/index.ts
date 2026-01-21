// Type definitions for ContentFlow

import { Prisma } from '@prisma/client';

// Campaign types
export type CampaignWithVideos = Prisma.CampaignGetPayload<{
  include: {
    sourceVideos: true;
    processedVideos: true;
  };
}>;

export type CampaignStatus = 'discovering' | 'discovered' | 'processing' | 'ready' | 'failed';
export type SourcePlatform = 'tiktok' | 'instagram' | 'facebook';

// Video types
export type SourceVideoWithProcessed = Prisma.SourceVideoGetPayload<{
  include: {
    processedVideos: true;
  };
}>;

export type VideoStatus = 'pending' | 'downloading' | 'downloaded' | 'failed';
export type ProcessedVideoStatus = 'processing' | 'completed' | 'failed';

// Post types
export type ScheduledPostWithRelations = Prisma.ScheduledPostGetPayload<{
  include: {
    processedVideo: true;
    sourceVideo: true;
    connectedAccount: true;
    campaign: true;
  };
}>;

export type PostStatus = 'scheduled' | 'processing' | 'posted' | 'failed' | 'paused';

// Account types
export type ConnectedAccountWithPosts = Prisma.ConnectedAccountGetPayload<{
  include: {
    scheduledPosts: true;
  };
}>;

export type SocialPlatform = 'tiktok' | 'instagram' | 'facebook';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Ayrshare API types
export interface AyrsharePostRequest {
  post: string;
  platforms: string[];
  mediaUrls?: string[];
  scheduleDate?: string;
  profileKey?: string;
}

export interface AyrsharePostResponse {
  status: string;
  id: string;
  postIds: Array<{
    platform: string;
    id: string;
    postUrl?: string;
  }>;
}

export interface AyrshareProfileResponse {
  status: string;
  profileKey: string;
  title: string;
  activeSocialAccounts: string[];
}

// ScrapeCreator API types
export interface ScrapeCreatorRequest {
  profileUrl: string;
  platform: 'tiktok' | 'instagram' | 'facebook';
  limit?: number;
}

export interface ScrapeCreatorVideo {
  url: string;
  caption: string;
  thumbnailUrl: string;
  duration: number;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  uploadedAt: string;
}

export interface ScrapeCreatorResponse {
  success: boolean;
  videos: ScrapeCreatorVideo[];
  profileInfo: {
    username: string;
    followerCount?: number;
    videoCount?: number;
  };
}

// Video processing types
export interface VideoModificationSettings {
  // Speed adjustments
  speedMultiplier?: number; // 0.9, 1.0, 1.1
  
  // Visual modifications
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  brightness?: number; // -10 to 10
  contrast?: number; // -10 to 10
  saturation?: number; // -10 to 10
  
  // Cropping/scaling
  cropPercentage?: number; // 1-5% crop from edges
  scalePercentage?: number; // 98-102% scale
  
  // Audio
  volumeAdjustment?: number; // -10 to 10 dB
  audioPitchShift?: number; // -2 to 2 semitones
  
  // Metadata
  removeMetadata?: boolean; // Always true
  randomizeTimestamps?: boolean; // Always true
}

export interface VideoQualityFlags {
  hasArtifacts?: boolean;
  lowBitrate?: boolean;
  audioIssues?: boolean;
  visualDistortion?: boolean;
  notes?: string;
}

// Queue job types
export interface VideoProcessingJob {
  processedVideoId: string;
  sourceVideoId: string;
  sourceVideoUrl: string | null;
  modificationSettings: {
    speed: number;
    brightness: number;
    saturation: number;
    crop: number;
    audioPitch: number;
    flipped: boolean;
    rotation: number;
    noise: number;
  };
  targetPlatform: string;
}

export interface VideoDownloadJob {
  sourceVideoId: string;
  videoUrl: string;
  campaignId: string;
  thumbnailUrl: string;
}

export interface PostScheduleJob {
  scheduledPostId: string;
  videoUrl: string;
  caption: string;
  platform: string;
  profileKey: string;
}

// Storage types
export interface R2UploadResult {
  url: string;
  key: string;
  bucket: string;
  size: number;
}

// Form validation types
export interface CreateCampaignInput {
  name: string;
  sourceProfileUrl: string;
  sourcePlatform: SourcePlatform;
}

export interface SchedulePostInput {
  processedVideoId: string;
  connectedAccountId: string;
  caption: string;
  scheduledAt: Date;
}

export interface ConnectAccountInput {
  platform: SocialPlatform;
  profileKey: string;
}

// User types
export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    campaigns: true;
    connectedAccounts: true;
    settings: true;
  };
}>;

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}
