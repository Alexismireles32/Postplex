import axios, { AxiosInstance } from 'axios';
import type { ScrapeCreatorRequest, ScrapeCreatorResponse } from '@/types';

// V3 API Response interfaces (matching the actual TikTok API structure)
interface V3Author {
  nickname: string;
  unique_id: string;
  uid: string;
  follower_count: number;
  following_count: number;
  aweme_count: number;
  avatar_thumb: {
    url_list: string[];
  };
}

interface V3VideoStatistics {
  play_count: number;
  digg_count: number; // likes
  comment_count: number;
  share_count: number;
}

interface V3VideoInfo {
  duration: number; // in milliseconds
  cover: {
    url_list: string[];
  };
  play_addr: {
    url_list: string[];
  };
  download_addr?: {
    url_list: string[];
  };
}

interface V3AwemeItem {
  aweme_id: string;
  desc: string; // caption
  create_time: number; // unix timestamp in seconds
  author: V3Author;
  statistics: V3VideoStatistics;
  video: V3VideoInfo;
  share_url?: string;
}

interface V3TikTokResponse {
  aweme_list: V3AwemeItem[];
  has_more: number;
  max_cursor: number | string;
  min_cursor: number | string;
  status_code: number;
  status_msg: string;
  extra?: {
    logid: string;
    now: number;
  };
}

/**
 * ScrapeCreator API V3 client for video discovery
 */
export class ScrapeCreatorClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SCRAPE_CREATOR_API_KEY || 'QI7CjLkt2CVKn9jLHGDCQQrELHY2';
    
    if (!this.apiKey) {
      console.warn('[ScrapeCreator] API key not configured - video scraping will not work');
    }

    this.client = axios.create({
      baseURL: process.env.SCRAPE_CREATOR_API_URL || 'https://api.scrapecreators.com',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });
  }
  
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Scrape videos from a social media profile
   */
  async scrapeProfile(request: ScrapeCreatorRequest): Promise<ScrapeCreatorResponse> {
    try {
      const platform = request.platform.toLowerCase();
      const handle = this.extractHandle(request.profileUrl);

      // V3 Implementation for TikTok
      if (platform === 'tiktok') {
        return this.scrapeTikTokV3(handle);
      } 
      // For Instagram and Facebook, you may need to check if V3 endpoints exist
      // or use a different approach. For now, focusing on TikTok.
      else {
        throw new Error(`Platform ${platform} not fully supported in V3 client yet. Only TikTok is implemented.`);
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('[ScrapeCreator] API Error:', error.response?.data);
        throw new Error(
          `ScrapeCreator failed: ${error.response?.data?.status_msg || error.message}`
        );
      }
      throw error;
    }
  }

  private async scrapeTikTokV3(handle: string): Promise<ScrapeCreatorResponse> {
    const endpoint = '/v3/tiktok/profile/videos';
    
    console.log(`[ScrapeCreator] Fetching TikTok videos for handle: ${handle}`);
    
    const response = await this.client.get<V3TikTokResponse>(endpoint, {
      params: {
        handle: handle,
        sort_by: 'latest', // or 'popular'
      }
    });

    const data = response.data;

    if (data.status_code !== 0) {
      throw new Error(`TikTok API returned status ${data.status_code}: ${data.status_msg}`);
    }

    if (!data.aweme_list || data.aweme_list.length === 0) {
      console.log('[ScrapeCreator] No videos found for handle:', handle);
      return {
        success: true,
        videos: [],
        profileInfo: {
          username: handle,
          followerCount: 0,
          videoCount: 0
        }
      };
    }

    // Extract profile info from the first video's author data
    const firstAuthor = data.aweme_list[0]!.author;
    const profileInfo = {
      username: firstAuthor.unique_id || handle,
      followerCount: firstAuthor.follower_count,
      videoCount: firstAuthor.aweme_count
    };

    console.log(`[ScrapeCreator] Found ${data.aweme_list.length} videos for @${profileInfo.username}`);

    // Map videos from aweme_list to our normalized format
    const videos = data.aweme_list.map(v => {
      // Get the best video URL (prefer play_addr)
      const videoUrl = v.video.play_addr?.url_list?.[0] || 
                       v.video.download_addr?.url_list?.[0] || 
                       v.share_url || 
                       `https://www.tiktok.com/@${v.author.unique_id}/video/${v.aweme_id}`;

      // Get thumbnail from cover
      const thumbnailUrl = v.video.cover?.url_list?.[0] || '';

      return {
        url: videoUrl,
        caption: v.desc || '',
        thumbnailUrl: thumbnailUrl,
        duration: Math.round(v.video.duration / 1000), // Convert ms to seconds
        viewCount: v.statistics.play_count,
        likeCount: v.statistics.digg_count,
        commentCount: v.statistics.comment_count,
        uploadedAt: new Date(v.create_time * 1000).toISOString() // Unix timestamp to ISO
      };
    });

    return {
      success: true,
      profileInfo,
      videos
    };
  }

  private extractHandle(url: string): string {
    try {
      const u = new URL(url);
      const pathParts = u.pathname.split('/').filter(Boolean);
      // TikTok: /@username -> extract "username"
      if (u.hostname.includes('tiktok')) {
        return pathParts[0]?.replace(/^@/, '') || '';
      }
      // Instagram: /username
      return pathParts[0] || '';
    } catch {
      // If not a valid URL, assume it's already a handle
      return url.replace(/^@/, '');
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
   * Download a video from a direct URL
   */
  async downloadVideo(videoUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get<ArrayBuffer>(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
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
}

// Export a lazily-initialized singleton instance
let _scrapeCreatorClient: ScrapeCreatorClient | null = null;

export const scrapeCreator = {
  get client(): ScrapeCreatorClient {
    if (!_scrapeCreatorClient) {
      _scrapeCreatorClient = new ScrapeCreatorClient();
    }
    return _scrapeCreatorClient;
  },
  
  isConfigured(): boolean {
    return this.client.isConfigured();
  },
  
  scrapeProfile: (...args: Parameters<ScrapeCreatorClient['scrapeProfile']>) => 
    scrapeCreator.client.scrapeProfile(...args),
  scrapeTikTok: (...args: Parameters<ScrapeCreatorClient['scrapeTikTok']>) => 
    scrapeCreator.client.scrapeTikTok(...args),
  downloadVideo: (...args: Parameters<ScrapeCreatorClient['downloadVideo']>) => 
    scrapeCreator.client.downloadVideo(...args),
};
