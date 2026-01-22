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
  dynamic_cover?: {
    url_list: string[];
  };
  origin_cover?: {
    url_list: string[];
  };
  ai_dynamic_cover?: {
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
    
    let allVideos: V3AwemeItem[] = [];
    let hasMore = true;
    let maxCursor: string | number | undefined = undefined;
    let pageCount = 0;
    const maxPages = 20; // Reasonable limit (20 pages * 20 videos = 400 videos max)
    
    // Paginate through all videos using max_cursor
    while (hasMore && pageCount < maxPages) {
      pageCount++;
      
      const params: { handle: string; sort_by: string; max_cursor?: string | number } = {
        handle: handle,
        sort_by: 'latest', // or 'popular'
      };
      
      if (maxCursor !== undefined) {
        params.max_cursor = maxCursor;
      }
      
      console.log(`[ScrapeCreator] Fetching page ${pageCount}${maxCursor ? ` (cursor: ${maxCursor})` : ''}`);
      
      try {
        const response = await this.client.get<V3TikTokResponse>(endpoint, { params });
        const data = response.data;

        if (data.status_code !== 0) {
          console.error(`[ScrapeCreator] API error on page ${pageCount}:`, data.status_msg);
          throw new Error(`TikTok API returned status ${data.status_code}: ${data.status_msg}`);
        }

        if (!data.aweme_list || data.aweme_list.length === 0) {
          console.log(`[ScrapeCreator] No more videos on page ${pageCount}`);
          break;
        }

        // Add videos from this page
        allVideos = allVideos.concat(data.aweme_list);
        console.log(`[ScrapeCreator] Page ${pageCount}: Found ${data.aweme_list.length} videos (total: ${allVideos.length})`);

        // Check if there are more pages
        hasMore = data.has_more === 1;
        maxCursor = data.max_cursor;
        
        if (!hasMore) {
          console.log('[ScrapeCreator] Reached last page');
          break;
        }

        // Add a small delay between requests to avoid rate limiting
        if (hasMore && pageCount < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        }
      } catch (error) {
        console.error(`[ScrapeCreator] Error fetching page ${pageCount}:`, error);
        
        // If we already have some videos, return what we have instead of failing completely
        if (allVideos.length > 0) {
          console.log(`[ScrapeCreator] Partial success: Returning ${allVideos.length} videos from ${pageCount - 1} pages`);
          break;
        }
        
        // If no videos yet, rethrow the error
        throw error;
      }
    }

    if (pageCount >= maxPages) {
      console.log(`[ScrapeCreator] Reached max page limit (${maxPages}), stopping pagination`);
    }

    if (allVideos.length === 0) {
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
    const firstAuthor = allVideos[0]!.author;
    const profileInfo = {
      username: firstAuthor.unique_id || handle,
      followerCount: firstAuthor.follower_count,
      videoCount: firstAuthor.aweme_count
    };

    console.log(`[ScrapeCreator] Total: ${allVideos.length} videos from ${pageCount} pages for @${profileInfo.username}`);

    // Map videos from aweme_list to our normalized format
    const videos = allVideos.map(v => {
      // Use share_url as the primary video URL (TikTok web link)
      // This is more reliable than direct play URLs which may have CORS issues
      const videoUrl = v.share_url || 
                       `https://www.tiktok.com/@${v.author.unique_id}/video/${v.aweme_id}`;

      // Get thumbnail - prefer JPEG format (3rd in list) over HEIC (1st in list)
      // HEIC is not widely supported in browsers, JPEG is the last URL
      const thumbnailUrl = v.video.cover?.url_list?.[2] || // JPEG version
                           v.video.dynamic_cover?.url_list?.[0] || 
                           v.video.origin_cover?.url_list?.[0] || 
                           v.video.cover?.url_list?.[0] || 
                           '';

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
