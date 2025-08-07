import { S3Client } from '@aws-sdk/client-s3';

// Get the MinIO endpoint based on environment
function getMinioEndpoint(): string {
  // If running in production or VPS
  if (process.env.NODE_ENV === 'production') {
    // Use VPS domain or public IP
    return process.env.MINIO_ENDPOINT || 
           process.env.MINIO_PUBLIC_ENDPOINT || 
           `http://${process.env.DOMAIN || process.env.VPS_IP || 'localhost'}:9000`;
  }
  
  // Development environment
  return process.env.MINIO_ENDPOINT || 'http://localhost:9000';
}

// Get the public URL for file access
function getMinioPublicUrl(): string {
  // In production, use public domain or IP for file access
  if (process.env.NODE_ENV === 'production') {
    return process.env.MINIO_PUBLIC_URL || 
           process.env.MINIO_PUBLIC_ENDPOINT ||
           `http://${process.env.DOMAIN || process.env.VPS_IP || 'localhost'}:9000`;
  }
  
  // Development environment
  return process.env.MINIO_ENDPOINT || 'http://localhost:9000';
}

// MinIO configuration
const minioConfig = {
  endpoint: getMinioEndpoint(),
  publicUrl: getMinioPublicUrl(),
  accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
  region: process.env.MINIO_REGION || 'us-east-1',
  forcePathStyle: true, // Required for MinIO
};

// Create S3 client for MinIO
export const minioClient = new S3Client({
  endpoint: minioConfig.endpoint,
  region: minioConfig.region,
  credentials: {
    accessKeyId: minioConfig.accessKeyId,
    secretAccessKey: minioConfig.secretAccessKey,
  },
  forcePathStyle: minioConfig.forcePathStyle,
});

// Bucket names for different file types
export const BUCKETS = {
  PROFILES: 'profile-images',
  COVERS: 'cover-images', 
  POSTS: 'post-media',
  CHATS: 'chat-media',
  GROUPS: 'group-media',
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

export default minioConfig;
