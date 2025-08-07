import { useState } from 'react';

interface UseGroupImageUploadResult {
  uploadImage: (chatId: string, file: File) => Promise<string>;
  removeImage: (chatId: string) => Promise<void>;
  isUploading: boolean;
  error: string | null;
}

export const useGroupImageUpload = (): UseGroupImageUploadResult => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (chatId: string, file: File): Promise<string> => {
    setIsUploading(true);
    setError(null);
    
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB');
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`/api/chats/${chatId}/image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = async (chatId: string): Promise<void> => {
    setIsUploading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/chats/${chatId}/image`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove image');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove image';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadImage,
    removeImage,
    isUploading,
    error,
  };
};
