import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface UseSimpleImageUploadOptions {
  type: 'profile' | 'cover';
  userId: string;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

export const useSimpleImageUpload = ({
  type,
  userId,
  onSuccess,
  onError
}: UseSimpleImageUploadOptions) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      console.log('Starting MinIO upload for file:', file.name, file.size);

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      // Determine upload endpoint based on type
      const endpoint = type === 'profile' 
        ? '/api/upload-profile-image' 
        : '/api/upload-cover-image';

      console.log('Uploading to MinIO via:', endpoint);

      // Upload to MinIO
      const uploadResponse = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      const downloadURL = uploadResult.url;
      console.log('MinIO upload successful:', downloadURL);

      // Update user profile in database
      console.log('Updating user profile...');
      const updatePayload = type === 'profile' 
        ? { avatar: downloadURL }
        : { coverImage: downloadURL };

      const updateResponse = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('Profile update failed:', errorData);
        throw new Error(errorData.error || 'Failed to update profile');
      }

      console.log('Profile updated successfully');
      
      // Success callback
      onSuccess?.(downloadURL);
      setPreview(downloadURL);

    } catch (error) {
      console.error('Simple upload error:', error);
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          onError?.('Unauthorized access. Please check authentication.');
        } else if (error.message.includes('invalid-format')) {
          onError?.('Invalid image format');
        } else if (error.message.includes('invalid-argument')) {
          onError?.('Invalid upload argument');
        } else {
          onError?.(error.message);
        }
      } else {
        onError?.('Upload failed');
      }
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        
        // Create preview
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
        
        // Upload file
        handleImageUpload(file);
      }
    },
    onDropRejected: (rejectedFiles) => {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0].code === 'file-too-large') {
        onError?.('File size must be less than 5MB');
      } else if (rejection.errors[0].code === 'file-invalid-type') {
        onError?.('Only image files are allowed');
      } else {
        onError?.('Invalid file');
      }
    }
  });

  return {
    getRootProps,
    getInputProps,
    isDragActive,
    uploading,
    preview,
    setPreview
  };
};
