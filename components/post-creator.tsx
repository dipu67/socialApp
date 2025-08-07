'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Bold, 
  Italic, 
  Underline,
  Image as ImageIcon,
  X,
  Loader2,
  Type,
  AlignLeft,
  AlignCenter,
  Link as LinkIcon
} from 'lucide-react';
import Image from 'next/image';

interface PostCreatorProps {
  onPostCreated: () => void;
  userProfile?: any;
}

export default function PostCreator({ onPostCreated, userProfile }: PostCreatorProps) {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const insertTextFormat = (format: 'bold' | 'italic' | 'underline') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText || 'underlined text'}__`;
        break;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);

    // Set cursor position after the inserted text
    setTimeout(() => {
      const newPosition = start + formattedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedImage) return;

    try {
      setPosting(true);
      
      let imageUrl = '';
      
      // Upload image first if selected
      if (selectedImage) {
        setUploadingImage(true);
        
        // Use the dedicated post image upload API
        const formData = new FormData();
        formData.append('image', selectedImage);
        
        const uploadResponse = await fetch('/api/upload-post-image', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.imageUrl;
        } else {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload image');
        }
        setUploadingImage(false);
      }

      // Create post
      const postData = {
        content: content.trim(),
        image: imageUrl,
      };

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        setContent('');
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onPostCreated();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setPosting(false);
      setUploadingImage(false);
    }
  };

  const renderFormattedText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>');
  };

  return (
    <Card className="mb-6 shadow-sm border-0 bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <div className="flex-shrink-0">
            <Avatar className="w-12 h-12 ring-2 ring-blue-100 dark:ring-blue-900">
              <AvatarImage 
                src={userProfile?.avatar || undefined} 
                alt="User Avatar" 
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {userProfile?.name?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex-1 space-y-4">
            {/* Text Formatting Toolbar */}
            <div className="flex items-center space-x-1 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertTextFormat('bold')}
                className="h-9 w-9 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Bold"
              >
                <Bold className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertTextFormat('italic')}
                className="h-9 w-9 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Italic"
              >
                <Italic className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertTextFormat('underline')}
                className="h-9 w-9 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Underline"
              >
                <Underline className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-2" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 w-9 p-0 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition-all"
                title="Add Image"
              >
                <ImageIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>

            {/* Content Input */}
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[120px] resize-none border-0 p-4 focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-xl focus:bg-white dark:focus:bg-gray-600 transition-colors"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {content.length}/1000
                </div>
              </div>

              {/* Preview of formatted text */}
              {content && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Type className="h-4 w-4 mr-1" />
                    Preview:
                  </p>
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: renderFormattedText(content) }}
                  />
                </div>
              )}

              {/* Image Preview */}
              {imagePreview && (
                <div className="relative inline-block group">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-auto max-h-64 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    {!content.trim() && !selectedImage 
                      ? 'Share something with your community' 
                      : `${content.length}/1000 characters`
                    }
                  </span>
                </div>
                
                <Button
                  onClick={handleSubmit}
                  disabled={(!content.trim() && !selectedImage) || posting || uploadingImage}
                  className="px-8 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {posting || uploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {uploadingImage ? 'Uploading...' : 'Posting...'}
                    </>
                  ) : (
                    'Share Post'
                  )}
                </Button>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
