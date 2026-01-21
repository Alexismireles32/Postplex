import axios, { AxiosInstance } from 'axios';
import type { ScrapeCreatorRequest, ScrapeCreatorResponse } from '@/types';

/**
 * ScrapeCreator API client for video discovery
 * API Key: QI7CjLkt2CVKn9jLHGDCQQrELHY2
 * 
 * Note: This implementation follows a standard REST API pattern.
 * Verify endpoints and request format with actual ScrapeCreator documentation.
 */
export class ScrapeCreatorClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SCRAPE_CREATOR_API_KEY || 'QI7CjLkt2CVKn9jLHGDCQQrELHY2';
    
    if (!this.apiKey && process.env.NODE_ENV === 'production') {
      throw new Error('SCRAPE_CREATOR_API_KEY is not configured');
    }

    this.client = axios.create({
      baseURL: 'https://api.scrapecreator.com', // Update base URL based on actual API docs
      headers: {
        'X-API-Key': this.apiKey, // Common pattern, verify with docs
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds for scraping operations
    });
  }

  /**
   * Scrape videos from a social media profile
   */
  async scrapeProfile(request: ScrapeCreatorRequest): Promise<ScrapeCreatorResponse> {
    try {
      const response = await this.client.post<ScrapeCreatorResponse>('/scrape', {
        url: request.profileUrl,
        platform: request.platform,
        limit: request.limit || 50,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `ScrapeCreator failed: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Scrape videos from TikTok profile
   */
  async scrapeTikTok(profileUrl: string, limit: number = 50): Promise<ScrapeCreatorResponse> {
    return this.scrapeProfile({
      profileUrl,
      platform: 'tiktok',
      limit,
    });
  }

  /**
   * Scrape videos from Instagram profile
   */
  async scrapeInstagram(profileUrl: string, limit: number = 50): Promise<ScrapeCreatorResponse> {
    return this.scrapeProfile({
      profileUrl,
      platform: 'instagram',
      limit,
    });
  }

  /**
   * Scrape videos from Facebook profile/page
   */
  async scrapeFacebook(profileUrl: string, limit: number = 50): Promise<ScrapeCreatorResponse> {
    return this.scrapeProfile({
      profileUrl,
      platform: 'facebook',
      limit,
    });
  }

  /**
   * Get scraping job status (if API supports async operations)
   */
  async getJobStatus(jobId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    result?: ScrapeCreatorResponse;
    error?: string;
  }> {
    try {
      const response = await this.client.get(`/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get job status: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Get profile information without videos
   */
  async getProfileInfo(profileUrl: string, platform: 'tiktok' | 'instagram' | 'facebook'): Promise<{
    username: string;
    displayName?: string;
    bio?: string;
    followerCount?: number;
    followingCount?: number;
    videoCount?: number;
    avatarUrl?: string;
    verified?: boolean;
  }> {
    try {
      const response = await this.client.post('/profile', {
        url: profileUrl,
        platform,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get profile info: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Download a video from a direct URL
   */
  async downloadVideo(videoUrl: string): Promise<Buffer> {
    try {
      const response = await this.client.get<ArrayBuffer>('/download', {
        params: { url: videoUrl },
        responseType: 'arraybuffer',
      });
      return Buffer.from(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to download video: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Validate if a profile URL is accessible
   */
  async validateProfile(profileUrl: string, platform: 'tiktok' | 'instagram' | 'facebook'): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    try {
      const response = await this.client.post('/validate', {
        url: profileUrl,
        platform,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          valid: false,
          reason: error.response?.data?.message || error.message,
        };
      }
      throw error;
    }
  }

  /**
   * Get API usage statistics
   */
  async getUsageStats(): Promise<{
    requestsUsed: number;
    requestsLimit: number;
    resetDate: string;
  }> {
    try {
      const response = await this.client.get('/usage');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get usage stats: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }
}

// Export a singleton instance
export const scrapeCreator = new ScrapeCreatorClient();
