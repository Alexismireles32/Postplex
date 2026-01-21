/**
 * Video Download and Upload Utilities
 */

import axios from 'axios';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize R2 client
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Download video from a public URL
 */
export async function downloadVideo(url: string): Promise<Buffer> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000, // 60 second timeout
      maxContentLength: 500 * 1024 * 1024, // 500MB max
    });

    return Buffer.from(response.data);
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error downloading video:', err.message || error);
    throw new Error(`Failed to download video: ${err.message || 'Unknown error'}`);
  }
}

/**
 * Upload video buffer to Cloudflare R2
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string = 'video/mp4'
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'postplex-videos',
      Key: `videos/originals/${key}`,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Return public URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/videos/originals/${key}`;
    return publicUrl;
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error uploading to R2:', err.message || error);
    throw new Error(`Failed to upload to R2: ${err.message || 'Unknown error'}`);
  }
}

/**
 * Generate a safe filename from video ID
 */
export function generateVideoFilename(videoId: string, originalId?: string): string {
  const timestamp = Date.now();
  const safe = (originalId || videoId).replace(/[^a-zA-Z0-9]/g, '_');
  return `${safe}_${timestamp}.mp4`;
}
