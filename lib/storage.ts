import { S3Client } from '@aws-sdk/client-s3';

// Get the R2 endpoint based on account ID
function getR2Endpoint(): string {
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) {
    throw new Error('R2_ACCOUNT_ID environment variable is required');
  }
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

// Get the public URL for file access
function getR2PublicUrl(): string {
  return process.env.R2_PUBLIC_URL || getR2Endpoint();
}

// R2 configuration
const r2Config = {
  endpoint: getR2Endpoint(),
  publicUrl: getR2PublicUrl(),
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  region: 'auto', // R2 uses 'auto' as region
  forcePathStyle: false, // R2 doesn't require path style
};

// Create S3 client for Cloudflare R2
export const r2Client = new S3Client({
  endpoint: r2Config.endpoint,
  region: r2Config.region,
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
  },
  forcePathStyle: r2Config.forcePathStyle,
});

// Keep backward compatibility
export const minioClient = r2Client;

// R2 bucket configuration - using single bucket with folder structure
export const BUCKETS = {
  PROFILES: process.env.R2_BUCKET_NAME || 'social-app-storage',
  POSTS: process.env.R2_BUCKET_NAME || 'social-app-storage', 
  CHATS: process.env.R2_BUCKET_NAME || 'social-app-storage',
  COVERS: process.env.R2_BUCKET_NAME || 'social-app-storage',
  GROUPS: process.env.R2_BUCKET_NAME || 'social-app-storage',
} as const;

// File type configurations
export const FILE_CONFIG = {
  maxSize: {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    document: 50 * 1024 * 1024, // 50MB
    file: 50 * 1024 * 1024, // 50MB
  },
  allowedTypes: {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'] as const,
    video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'] as const,
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] as const,
  },
} as const;

// Export R2 config for backward compatibility
export default r2Config;
