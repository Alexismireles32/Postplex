import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { R2UploadResult } from '@/types';

// Validate environment variables
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const endpoint = process.env.R2_ENDPOINT;
const bucketName = process.env.R2_BUCKET_NAME || 'postplex-videos';
const publicUrl = process.env.R2_PUBLIC_URL;

if (!accessKeyId || !secretAccessKey || !endpoint || !bucketName) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('R2 storage configuration is incomplete. Check environment variables.');
  }
  console.warn('R2 storage not configured. Some features will not work.');
}

// Create S3 client configured for Cloudflare R2
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: endpoint || '',
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
});

/**
 * Upload a file to R2 storage
 */
export async function uploadToR2(
  file: Buffer | Uint8Array | Blob,
  key: string,
  contentType: string = 'video/mp4'
): Promise<R2UploadResult> {
  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }

  const buffer = file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : Buffer.from(file);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await r2Client.send(command);

  // Construct the public URL
  const url = publicUrl ? `${publicUrl}/${key}` : `${endpoint}/${bucketName}/${key}`;

  return {
    url,
    key,
    bucket: bucketName,
    size: buffer.length,
  };
}

/**
 * Download a file from R2 storage
 */
export async function downloadFromR2(key: string): Promise<Buffer> {
  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await r2Client.send(command);
  
  if (!response.Body) {
    throw new Error('No body in R2 response');
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
}

/**
 * Delete a file from R2 storage
 */
export async function deleteFromR2(key: string): Promise<void> {
  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * Delete multiple files from R2 storage
 */
export async function deleteMultipleFromR2(keys: string[]): Promise<void> {
  await Promise.all(keys.map((key) => deleteFromR2(key)));
}

/**
 * Check if a file exists in R2 storage
 */
export async function fileExistsInR2(key: string): Promise<boolean> {
  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file metadata from R2 storage
 */
export async function getR2FileMetadata(key: string) {
  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }

  const command = new HeadObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await r2Client.send(command);
  
  return {
    size: response.ContentLength,
    contentType: response.ContentType,
    lastModified: response.LastModified,
    etag: response.ETag,
  };
}

/**
 * Generate a signed URL for temporary access to a file
 */
export async function getSignedR2Url(key: string, expiresIn: number = 3600): Promise<string> {
  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Generate a unique key for storing a file
 */
export function generateStorageKey(
  userId: string,
  campaignId: string,
  filename: string,
  prefix: 'source' | 'processed' = 'source'
): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${prefix}/${userId}/${campaignId}/${timestamp}-${randomSuffix}-${cleanFilename}`;
}
