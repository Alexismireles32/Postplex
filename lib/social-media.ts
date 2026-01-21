/**
 * Social Media URL Parsing and Utilities
 */

export interface ParsedSocialMediaUrl {
  platform: 'tiktok' | 'instagram' | 'facebook';
  username: string;
}

/**
 * Parse a social media profile URL and extract platform and username
 */
export function parseSocialMediaUrl(url: string): ParsedSocialMediaUrl | null {
  try {
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname;

    // TikTok
    if (hostname.includes('tiktok.com')) {
      // Handle @username format
      const match = pathname.match(/@([a-zA-Z0-9._]+)/);
      if (match) {
        return {
          platform: 'tiktok',
          username: match[1] || '',
        };
      }
    }

    // Instagram
    if (hostname.includes('instagram.com')) {
      // Handle /username format
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length > 0 && parts[0] !== 'reel' && parts[0] !== 'p') {
        return {
          platform: 'instagram',
          username: parts[0] || '',
        };
      }
    }

    // Facebook
    if (hostname.includes('facebook.com')) {
      // Handle /username format
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        return {
          platform: 'facebook',
          username: parts[0] || '',
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Estimate storage size based on video count and average duration
 */
export function estimateStorage(videoCount: number, avgDuration: number = 45): string {
  // Assume ~1MB per second of video
  const totalMB = videoCount * avgDuration * 1;
  return formatBytes(totalMB * 1024 * 1024);
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Extract username from social media URL for display
 */
export function extractUsername(url: string): string {
  const parsed = parseSocialMediaUrl(url);
  return parsed ? parsed.username : 'Unknown';
}

/**
 * Get platform icon emoji
 */
export function getPlatformEmoji(platform: string): string {
  const emojis: Record<string, string> = {
    tiktok: '🎵',
    instagram: '📸',
    facebook: '👥',
  };
  return emojis[platform.toLowerCase()] || '📱';
}

/**
 * Get status emoji
 */
export function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    discovering: '🔍',
    discovered: '✅',
    processing: '⚙️',
    ready: '🚀',
    failed: '❌',
    downloading: '⏳',
    downloaded: '✓',
    pending: '⏱️',
  };
  return emojis[status.toLowerCase()] || '📋';
}

/**
 * Format view count to readable format
 */
export function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
