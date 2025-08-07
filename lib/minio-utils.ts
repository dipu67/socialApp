import { 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { minioClient, BUCKETS, FILE_CONFIG } from './minio';
import { v4 as uuidv4 } from 'uuid';

// Get the public URL for MinIO files
function getMinioPublicUrl(): string {
  // In production, use public domain or IP for file access
  if (process.env.NODE_ENV === 'production') {
    return process.env.MINIO_PUBLIC_URL || 
           process.env.MINIO_PUBLIC_ENDPOINT ||
           `https://${process.env.DOMAIN}:9000` ||
           `http://${process.env.VPS_IP || process.env.DOMAIN || 'localhost'}:9000`;
  }
  
  // Development environment
  return process.env.MINIO_ENDPOINT || 'http://localhost:9000';
}

// Check if bucket exists, create if not
export async function ensureBucketExists(bucketName: string) {
  try {
    await minioClient.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (error) {
    if ((error as any).name === 'NotFound') {
      await minioClient.send(new CreateBucketCommand({ Bucket: bucketName }));
      console.log(`Created bucket: ${bucketName}`);
    } else {
      throw error;
    }
  }
}

// Initialize all required buckets
export async function initializeMinIOBuckets() {
  try {
    for (const bucketName of Object.values(BUCKETS)) {
      await ensureBucketExists(bucketName);
    }
    console.log('All MinIO buckets initialized successfully');
  } catch (error) {
    console.error('Error initializing MinIO buckets:', error);
    throw error;
  }
}

// Get file type from MIME type
export function getFileType(mimeType: string): 'image' | 'video' | 'document' | 'other' {
  const imageTypes = FILE_CONFIG.allowedTypes.image as readonly string[];
  const videoTypes = FILE_CONFIG.allowedTypes.video as readonly string[];
  const documentTypes = FILE_CONFIG.allowedTypes.document as readonly string[];
  
  if (imageTypes.includes(mimeType as any)) return 'image';
  if (videoTypes.includes(mimeType as any)) return 'video';
  if (documentTypes.includes(mimeType as any)) return 'document';
  return 'other';
}

// Validate file
export function validateFile(file: File, type: 'profile' | 'cover' | 'post' | 'chat'): { valid: boolean; error?: string } {
  const fileType = getFileType(file.type);
  
  // Check file size
  let maxSize: number;
  if (fileType === 'image') {
    maxSize = FILE_CONFIG.maxSize.image;
  } else if (fileType === 'video') {
    maxSize = FILE_CONFIG.maxSize.video;
  } else if (fileType === 'document') {
    maxSize = FILE_CONFIG.maxSize.document;
  } else {
    maxSize = FILE_CONFIG.maxSize.file;
  }
  
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit` 
    };
  }

  // Check file type for specific contexts
  if (type === 'profile' || type === 'cover') {
    if (fileType !== 'image') {
      return { valid: false, error: 'Only images are allowed for profile/cover photos' };
    }
  }

  return { valid: true };
}

// Generate unique file key
export function generateFileKey(originalName: string, folder: string, userId?: string): string {
  const ext = originalName.split('.').pop();
  const timestamp = Date.now();
  const uuid = uuidv4().split('-')[0];
  const userPrefix = userId ? `${userId}/` : '';
  return `${folder}/${userPrefix}${timestamp}-${uuid}.${ext}`;
}

// Upload file to MinIO
export async function uploadToMinio(
  file: Buffer | Uint8Array | File,
  bucketName: string,
  key: string,
  contentType: string
): Promise<string> {
  try {
    await ensureBucketExists(bucketName);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await minioClient.send(command);
    
    // Return the public file URL using the dynamic public URL
    const publicUrl = getMinioPublicUrl();
    return `${publicUrl}/${bucketName}/${key}`;
  } catch (error) {
    console.error('Error uploading to MinIO:', error);
    throw new Error('Failed to upload file to storage');
  }
}

// Delete file from MinIO
export async function deleteFromMinio(bucketName: string, key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await minioClient.send(command);
    console.log(`Successfully deleted ${key} from ${bucketName}`);
  } catch (error) {
    console.error('Error deleting from MinIO:', error);
    throw new Error('Failed to delete file from storage');
  }
}

// Extract key from MinIO URL
export function extractKeyFromUrl(url: string): string | null {
  try {
    // URL format: http://domain:9000/bucket-name/key or https://domain:9000/bucket-name/key
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // Remove empty first element and bucket name, join the rest as key
    return pathParts.slice(2).join('/');
  } catch (error) {
    console.error('Error extracting key from URL:', error);
    return null;
  }
}

// Check if URL is a MinIO URL (local or VPS)
export function isMinioUrl(url: string): boolean {
  if (!url) return false;
  
  // Check for localhost (development)
  if (url.includes('localhost:9000')) return true;
  
  // Check for VPS domain or IP
  const vpsIp = process.env.VPS_IP;
  const domain = process.env.DOMAIN;
  
  if (vpsIp && url.includes(`${vpsIp}:9000`)) return true;
  if (domain && url.includes(`${domain}:9000`)) return true;
  
  // Check for MinIO public endpoint
  const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_PUBLIC_URL;
  if (publicEndpoint && url.includes(publicEndpoint)) return true;
  
  return false;
}

// Delete image by URL
export async function deleteImageByUrl(imageUrl: string, bucketName: string): Promise<void> {
  // Only delete if it's a MinIO URL
  if (!isMinioUrl(imageUrl)) {
    console.log('Skipping deletion - not a MinIO URL:', imageUrl);
    return;
  }

  const key = extractKeyFromUrl(imageUrl);
  if (!key) {
    throw new Error('Invalid image URL');
  }
  await deleteFromMinio(bucketName, key);
}

// Get signed URL for private files (if needed)
export async function getSignedDownloadUrl(
  bucketName: string, 
  key: string, 
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    return await getSignedUrl(minioClient, command, { expiresIn });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate download URL');
  }
}

// Upload profile image
export async function uploadProfileImage(file: File, userId: string): Promise<string> {
  const validation = validateFile(file, 'profile');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateFileKey(file.name, 'profiles', userId);
  
  return uploadToMinio(buffer, BUCKETS.PROFILES, key, file.type);
}

// Upload cover image
export async function uploadCoverImage(file: File, userId: string): Promise<string> {
  const validation = validateFile(file, 'cover');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateFileKey(file.name, 'covers', userId);
  
  return uploadToMinio(buffer, BUCKETS.COVERS, key, file.type);
}

// Upload post media
export async function uploadPostMedia(file: File, userId: string): Promise<string> {
  const validation = validateFile(file, 'post');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateFileKey(file.name, 'posts', userId);
  
  return uploadToMinio(buffer, BUCKETS.POSTS, key, file.type);
}

// Upload chat media
export async function uploadChatMedia(file: File, chatId: string, userId: string): Promise<string> {
  const validation = validateFile(file, 'chat');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateFileKey(file.name, `chats/${chatId}`, userId);
  
  return uploadToMinio(buffer, BUCKETS.CHATS, key, file.type);
}

// Upload group media (avatars, etc.)
export async function uploadGroupMedia(file: File, groupId: string): Promise<string> {
  const validation = validateFile(file, 'profile'); // Use profile validation for group avatars
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateFileKey(file.name, 'groups', groupId);
  
  return uploadToMinio(buffer, BUCKETS.GROUPS, key, file.type);
}
