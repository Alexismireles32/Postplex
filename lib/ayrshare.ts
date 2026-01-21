import axios, { AxiosInstance } from 'axios';
import type { AyrsharePostRequest, AyrsharePostResponse, AyrshareProfileResponse } from '@/types';

/**
 * Ayrshare API client for social media posting
 * Documentation: https://docs.ayrshare.com/
 */
export class AyrshareClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.AYRSHARE_API_KEY || '';
    
    if (!this.apiKey && process.env.NODE_ENV === 'production') {
      throw new Error('AYRSHARE_API_KEY is not configured');
    }

    this.client = axios.create({
      baseURL: 'https://app.ayrshare.com/api',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });
  }

  /**
   * Create a post on social media platforms
   */
  async createPost(data: AyrsharePostRequest): Promise<AyrsharePostResponse> {
    try {
      const response = await this.client.post<AyrsharePostResponse>('/post', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Ayrshare post failed: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Schedule a post for later
   */
  async schedulePost(
    data: Omit<AyrsharePostRequest, 'scheduleDate'> & { scheduleDate: Date }
  ): Promise<AyrsharePostResponse> {
    try {
      const response = await this.client.post<AyrsharePostResponse>('/post', {
        ...data,
        scheduleDate: data.scheduleDate.toISOString(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Ayrshare schedule failed: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Get post analytics/status
   */
  async getPost(postId: string): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.get(`/post/${postId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get post: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Delete a scheduled post
   */
  async deletePost(postId: string): Promise<void> {
    try {
      await this.client.delete(`/post/${postId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to delete post: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Get post history
   */
  async getHistory(params?: {
    lastRecords?: number;
    lastDays?: number;
    platform?: string;
  }): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.get('/history', { params });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get history: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Get analytics for posts
   */
  async getAnalytics(params: {
    platforms: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.post('/analytics', params);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get analytics: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Create a new profile for multi-account management
   */
  async createProfile(title: string): Promise<AyrshareProfileResponse> {
    try {
      const response = await this.client.post<AyrshareProfileResponse>('/profiles/profile', {
        title,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to create profile: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Get all profiles
   */
  async getProfiles(): Promise<AyrshareProfileResponse[]> {
    try {
      const response = await this.client.get<AyrshareProfileResponse[]>('/profiles');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get profiles: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Delete a profile
   */
  async deleteProfile(profileKey: string): Promise<void> {
    try {
      await this.client.delete(`/profiles/profile/${profileKey}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to delete profile: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Generate JWT for social account linking
   */
  async generateJWT(
    domain: string,
    privateKey: string,
    profileKey?: string
  ): Promise<{ jwt: string; url: string }> {
    try {
      const response = await this.client.post('/profiles/generateJWT', {
        domain,
        privateKey,
        profileKey,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to generate JWT: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Upload media for later use in posts
   */
  async uploadMedia(
    file: Buffer | string,
    fileName: string,
    contentType: string = 'video/mp4'
  ): Promise<{ id: string; url: string }> {
    try {
      const formData = new FormData();
      
      if (typeof file === 'string') {
        // If file is a URL
        formData.append('url', file);
      } else {
        // If file is a buffer
        const blob = new Blob([new Uint8Array(file)], { type: contentType });
        formData.append('file', blob, fileName);
      }

      const response = await this.client.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to upload media: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Get user info and API usage
   */
  async getUser(): Promise<Record<string, unknown>> {
    try {
      const response = await this.client.get('/user');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get user: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }
}

// Export a singleton instance
export const ayrshare = new AyrshareClient();
