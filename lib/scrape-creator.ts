import axios, { AxiosInstance } from 'axios';
import type { ScrapeCreatorRequest, ScrapeCreatorResponse } from '@/types';

// V3 API Response interfaces
interface V3Author {
  nickname: string;
  follower_count: number;
  following_count: number;
  aweme_count: number;
  uid: string;
  unique_id: string;
  avatar_medium: {
    url_list: string[];
  };
}

interface V3VideoStats {
  play_count: number;
  digg_count: number; // likes
  comment_count: number;
  share_count: number;
}

interface V3Video {
  aweme_id: string;
  desc: string; // caption
  create_time: number; // unix timestamp
  author: V3Author;
  statistics: V3VideoStats;
  video: {
    duration: number; // in ms? No, docs say seconds usually but let's check. Example says 89131 which is ms.
    cover: {
      url_list: string[];
    };
    play_addr: {
      url_list: string[];
    };
  };
}

interface V3Response {
  aweme_list: V3Video[];
  has_more: number;
  max_cursor: number | string;
  status_code: number;
}

/**
 * ScrapeCreator API client for video discovery
 * API Key: QI7CjLkt2CVKn9jLHGDCQQrELHY2
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
      // Fallback or other platforms (implement as needed if API supports them differently)
      else {
        // For now throw for unsupported platforms or stick to TikTok V3 as primary
        throw new Error(`Platform ${platform} not fully supported in V3 client yet.`);
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
    
    const response = await this.client.get<V3Response>(endpoint, {
      params: {
        handle: handle,
        sort_by: 'latest', // or 'popular'
      }
    });

    const data = response.data;

    if (!data.aweme_list || data.aweme_list.length === 0) {
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
    const firstAuthor = data.aweme_list[0].author;
    const profileInfo = {
      username: firstAuthor.unique_id || firstAuthor.nickname,
      followerCount: firstAuthor.follower_count,
      videoCount: firstAuthor.aweme_count
    };

    // Map videos
    const videos = data.aweme_list.map(v => ({
      url: `https://www.tiktok.com/@${v.author.unique_id}/video/${v.aweme_id}`,
      caption: v.desc,
      thumbnailUrl: v.video.cover.url_list[0],
      duration: Math.round(v.video.duration / 1000), // Convert ms to seconds if needed. Example: 89131 -> 89s
      viewCount: v.statistics.play_count,
      likeCount: v.statistics.digg_count,
      commentCount: v.statistics.comment_count,
      uploadedAt: new Date(v.create_time * 1000).toISOString() // create_time is unix seconds usually? Example: 1739470692 -> seconds
    }));

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
      if (u.hostname.includes('tiktok')) {
        return pathParts[0]?.replace(/^@/, '') || '';
      }
      return pathParts[0] || '';
    } catch {
      return url.replace(/^@/, ''); 
    }
  }

  // ... rest of the helper methods (downloadVideo, etc.) ...
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
  downloadVideo: (...args: Parameters<ScrapeCreatorClient['downloadVideo']>) => 
    scrapeCreator.client.downloadVideo(...args),
};
