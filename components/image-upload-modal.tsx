'use client';

import { useState } from 'react';
import { useSimpleImageUpload } from '@/hooks/useSimpleImageUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, X, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'profile' | 'cover';
  userId: string;
  currentImage?: string;
  onSuccess: (url: string) => void;
}

export default function ImageUploadModal({
  isOpen,
  onClose,
  type,
  userId,
  currentImage,
  onSuccess
}: ImageUploadModalProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    uploading,
    preview,
    setPreview
  } = useSimpleImageUpload({
    type,
    userId,
    onSuccess: (url: string) => {
      onSuccess(url);
      onClose();
      setError(null);
    },
    onError: (errorMessage: string) => {
      setError(errorMessage);
    }
  });

  const handleClose = () => {
    if (!uploading) {
      setPreview(null);
      setError(null);
      onClose();
    }
  };

  const displayImage = preview || currentImage;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Update {type === 'profile' ? 'Profile' : 'Cover'} Picture
          </DialogTitle>
          <DialogDescription>
            Upload a new {type === 'profile' ? 'profile' : 'cover'} image.
            {type === 'profile' 
              ? ' Recommended: Square image, at least 400x400px.' 
              : ' Recommended: 3:1 ratio, at least 1200x400px.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current/Preview Image */}
          {displayImage && (
            <div className="relative">
              <img
                src={displayImage}
                alt={`${type} preview`}
                className={cn(
                  "w-full object-cover rounded-lg border",
                  type === 'profile' ? "aspect-square max-w-48 mx-auto" : "aspect-[3/1]"
                )}
              />
              {!uploading && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 rounded-full p-1 h-8 w-8"
                  onClick={() => setPreview(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Upload Area */}
          <Card>
            <CardContent className="p-6">
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
                  uploading && "pointer-events-none opacity-50"
                )}
              >
                <input {...getInputProps()} disabled={uploading} />
                
                <div className="space-y-3">
                  {uploading ? (
                    <Loader2 className="h-12 w-12 mx-auto text-blue-500 animate-spin" />
                  ) : (
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                  )}
                  
                  <div>
                    <p className="text-lg font-medium">
                      {uploading
                        ? 'Uploading...'
                        : isDragActive
                        ? 'Drop your image here'
                        : 'Click to upload or drag and drop'
                      }
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      PNG, JPG, WEBP up to 5MB
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            {displayImage && !uploading && (
              <Button
                onClick={() => {
                  if (preview) {
                    // If there's a preview, the image is already uploaded
                    onClose();
                  }
                }}
                className="flex-1"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Confirm
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
