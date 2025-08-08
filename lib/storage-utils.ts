import { 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { minioClient, BUCKETS, FILE_CONFIG } from './storage';
import { v4 as uuidv4 } from 'uuid';

// Get the public URL for R2 files
function getR2PublicUrl(): string {
  return process.env.R2_PUBLIC_URL || 
         `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
}

// Check if bucket exists, create if not
export async function ensureBucketExists(bucketName: string) {
  try {
    await minioClient.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (error) {
    if ((error as any).name === 'NotFound' || (error as any).name === 'NoSuchBucket') {
      await minioClient.send(new CreateBucketCommand({ Bucket: bucketName }));
      console.log(`Created R2 bucket: ${bucketName}`);
    } else {
      throw error;
    }
  }
}

// Initialize storage bucket (single bucket for all file types)
export async function initializeStorageBuckets() {
  try {
    const bucketName = process.env.R2_BUCKET_NAME || 'social-app-storage';
    await ensureBucketExists(bucketName);
    console.log('Storage bucket initialized successfully');
  } catch (error) {
    console.error('Error initializing storage bucket:', error);
    throw error;
  }
}

// For backward compatibility
export const initializeMinIOBuckets = initializeStorageBuckets;

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

// Upload file to storage (R2/S3 compatible)
export async function uploadToStorage(
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
    
    // Use the R2 public development URL for direct access
    const publicUrl = getR2PublicUrl();
    return `${publicUrl}/${key}`;
  } catch (error) {
    console.error('Error uploading to storage:', error);
    throw new Error('Failed to upload file to storage');
  }
}

// For backward compatibility
export const uploadToMinio = uploadToStorage;

// Delete file from storage
export async function deleteFromStorage(bucketName: string, key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await minioClient.send(command);
    console.log(`Successfully deleted ${key} from ${bucketName}`);
  } catch (error) {
    console.error('Error deleting from storage:', error);
    throw new Error('Failed to delete file from storage');
  }
}

// For backward compatibility
export const deleteFromMinio = deleteFromStorage;

// Extract key from R2/MinIO URL
export function extractKeyFromUrl(url: string): string | null {
  try {
    // Handle our custom storage API URLs
    if (url.startsWith('/api/storage/')) {
      const parts = url.split('/');
      // Format: /api/storage/bucket/key/parts
      return parts.slice(3).join('/');
    }
    
    // Handle R2 public development URLs (https://pub-xxx.r2.dev/key)
    if (url.includes('.r2.dev')) {
      const urlObj = new URL(url);
      // Remove the leading slash from pathname
      return urlObj.pathname.substring(1);
    }
    
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // For R2 URLs: https://account-id.r2.cloudflarestorage.com/bucket-name/key
    // For MinIO URLs: http://domain:9000/bucket-name/key
    // Remove empty first element and bucket name, join the rest as key
    return pathParts.slice(2).join('/');
  } catch (error) {
    console.error('Error extracting key from URL:', error);
    return null;
  }
}

// Check if URL is a storage URL (R2/MinIO/S3)
export function isStorageUrl(url: string): boolean {
  if (!url) return false;
  
  // Check for R2 public development URLs
  if (url.includes('.r2.dev')) return true;
  
  // Check for our custom storage API URLs (fallback)
  if (url.startsWith('/api/storage/')) return true;
  
  // Check for R2 URLs
  if (url.includes('.r2.cloudflarestorage.com')) return true;
  
  // Check for custom R2 public URL
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (publicUrl && url.includes(publicUrl)) return true;
  
  // Backward compatibility - check for old MinIO URLs
  if (url.includes('localhost:9000')) return true;
  
  const vpsIp = process.env.VPS_IP;
  const domain = process.env.DOMAIN;
  
  if (vpsIp && url.includes(`${vpsIp}:9000`)) return true;
  if (domain && url.includes(`${domain}:9000`)) return true;
  
  return false;
}

// For backward compatibility
export const isMinioUrl = isStorageUrl;

// Delete image by URL
export async function deleteImageByUrl(imageUrl: string, bucketName: string): Promise<void> {
  // Only delete if it's a storage URL (R2/MinIO/S3)
  if (!isStorageUrl(imageUrl)) {
    console.log('Skipping deletion - not a storage URL:', imageUrl);
    return;
  }

  const key = extractKeyFromUrl(imageUrl);
  if (!key) {
    throw new Error('Invalid image URL');
  }
  await deleteFromStorage(bucketName, key);
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
  
  return uploadToStorage(buffer, BUCKETS.PROFILES, key, file.type);
}

// Upload cover image
export async function uploadCoverImage(file: File, userId: string): Promise<string> {
  const validation = validateFile(file, 'cover');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateFileKey(file.name, 'covers', userId);
  
  return uploadToStorage(buffer, BUCKETS.COVERS, key, file.type);
}

// Upload post media
export async function uploadPostMedia(file: File, userId: string): Promise<string> {
  const validation = validateFile(file, 'post');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateFileKey(file.name, 'posts', userId);
  
  return uploadToStorage(buffer, BUCKETS.POSTS, key, file.type);
}

// Upload chat media
export async function uploadChatMedia(file: File, chatId: string, userId: string): Promise<string> {
  const validation = validateFile(file, 'chat');
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateFileKey(file.name, `chats/${chatId}`, userId);
  
  return uploadToStorage(buffer, BUCKETS.CHATS, key, file.type);
}

// Upload group media (avatars, etc.)
export async function uploadGroupMedia(file: File, groupId: string): Promise<string> {
  const validation = validateFile(file, 'profile'); // Use profile validation for group avatars
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateFileKey(file.name, 'groups', groupId);
  
  return uploadToStorage(buffer, BUCKETS.GROUPS, key, file.type);
}
