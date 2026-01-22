import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { R2UploadResult } from '@/types';

// Lazy initialization to avoid build-time errors
let _r2Client: S3Client | null = null;

function getR2Config() {
  return {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    endpoint: process.env.R2_ENDPOINT || '',
    bucketName: process.env.R2_BUCKET_NAME || 'postplex-videos',
    publicUrl: process.env.R2_PUBLIC_URL || '',
  };
}

function getR2Client(): S3Client {
  if (!_r2Client) {
    const config = getR2Config();
    
    if (!config.accessKeyId || !config.secretAccessKey || !config.endpoint) {
      console.warn('[R2 Storage] Configuration incomplete - video storage features will not work');
    }
    
    _r2Client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return _r2Client;
}

// Export the client getter for backward compatibility
export const r2Client = new Proxy({} as S3Client, {
  get(_, prop) {
    return getR2Client()[prop as keyof S3Client];
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
  const config = getR2Config();
  
  if (!config.bucketName) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }

  const buffer = file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : Buffer.from(file);

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await getR2Client().send(command);

  // Construct the public URL
  const url = config.publicUrl ? `${config.publicUrl}/${key}` : `${config.endpoint}/${config.bucketName}/${key}`;

  return {
    url,
    key,
    bucket: config.bucketName,
    size: buffer.length,
  };
}

/**
 * Download a file from R2 storage
 */
export async function downloadFromR2(key: string): Promise<Buffer> {
  const config = getR2Config();
  
  if (!config.bucketName) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }

  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });

  const response = await getR2Client().send(command);
  
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
  const config = getR2Config();
  
  if (!config.bucketName) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }

  const command = new DeleteObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });

  await getR2Client().send(command);
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
  const config = getR2Config();
  
  if (!config.bucketName) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }

  try {
    const command = new HeadObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    await getR2Client().send(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file metadata from R2 storage
 */
export async function getR2FileMetadata(key: string) {
  const config = getR2Config();
  
  if (!config.bucketName) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }

  const command = new HeadObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });

  const response = await getR2Client().send(command);
  
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
  const config = getR2Config();
  
  if (!config.bucketName) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }

  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });

  return getSignedUrl(getR2Client(), command, { expiresIn });
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
