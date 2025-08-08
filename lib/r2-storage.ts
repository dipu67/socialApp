import { S3Client } from '@aws-sdk/client-s3';

// Cloudflare R2 configuration
export const r2Config = {
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: false,
};

// Create R2 client
export const r2Client = new S3Client(r2Config);

// Single bucket configuration for R2 (using folder structure)
export const R2_BUCKET = process.env.R2_BUCKET_NAME || 'social-app-storage';

// Folder structure for different file types
export const R2_FOLDERS = {
  PROFILES: 'profiles',
  COVERS: 'covers',
  POSTS: 'posts',
  CHATS: 'chats',
  GROUPS: 'groups',
} as const;

// Get public URL for R2 files
export function getR2PublicUrl(key: string): string {
  const baseUrl = process.env.R2_PUBLIC_URL || r2Config.endpoint;
  return `${baseUrl}/${R2_BUCKET}/${key}`;
}

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

export default r2Config;
