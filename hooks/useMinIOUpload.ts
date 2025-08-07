import { useState } from 'react';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseMinIOUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

interface UseMinIOUploadReturn {
  uploadFile: (file: File, endpoint: string, additionalData?: Record<string, string>) => Promise<string>;
  uploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
  reset: () => void;
}

export function useMinIOUpload(options: UseMinIOUploadOptions = {}): UseMinIOUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setUploading(false);
    setProgress(null);
    setError(null);
  };

  const uploadFile = async (
    file: File, 
    endpoint: string, 
    additionalData: Record<string, string> = {}
  ): Promise<string> => {
    try {
      setUploading(true);
      setError(null);
      setProgress({ loaded: 0, total: file.size, percentage: 0 });

      const formData = new FormData();
      formData.append('file', file);
      
      // Add any additional data
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      const url = result.url;

      setProgress({ loaded: file.size, total: file.size, percentage: 100 });
      options.onSuccess?.(url);
      
      return url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      setError(error.message);
      options.onError?.(error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadFile,
    uploading,
    progress,
    error,
    reset,
  };
}

// Specific hooks for different upload types
export function useProfileImageUpload(userId: string, options: UseMinIOUploadOptions = {}) {
  const upload = useMinIOUpload(options);
  
  const uploadProfileImage = (file: File) => {
    return upload.uploadFile(file, '/api/upload-profile-image', { userId });
  };

  return {
    ...upload,
    uploadProfileImage,
  };
}

export function useCoverImageUpload(userId: string, options: UseMinIOUploadOptions = {}) {
  const upload = useMinIOUpload(options);
  
  const uploadCoverImage = (file: File) => {
    return upload.uploadFile(file, '/api/upload-cover-image', { userId });
  };

  return {
    ...upload,
    uploadCoverImage,
  };
}

export function usePostMediaUpload(options: UseMinIOUploadOptions = {}) {
  const upload = useMinIOUpload(options);
  
  const uploadPostMedia = (file: File) => {
    return upload.uploadFile(file, '/api/upload-post-image');
  };

  return {
    ...upload,
    uploadPostMedia,
  };
}

export function useGroupMediaUpload(groupId: string, options: UseMinIOUploadOptions = {}) {
  const upload = useMinIOUpload(options);
  
  const uploadGroupMedia = (file: File) => {
    return upload.uploadFile(file, '/api/upload-group-media', { groupId });
  };

  return {
    ...upload,
    uploadGroupMedia,
  };
}
