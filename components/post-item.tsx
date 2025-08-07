'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePostView } from '@/hooks/usePostView';
import CommentsModal from '@/components/comments-modal';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  MoreHorizontal,
  Bookmark,
  Eye
} from 'lucide-react';

interface PostProps {
  post: {
    _id: string;
    content: string;
    author: {
      _id: string;
      name: string;
      email: string;
    };
    authorDetails?: {
      id: string;
      name: string;
      avatar: string;
    };
    image?: string;
    createdAt: string;
    likes?: string[];
    comments?: any[];
    reactions?: {
      like: string[];
      love: string[];
      wow: string[];
      sad: string[];
      angry: string[];
    };
    isLiked?: boolean;
    isBookmarked?: boolean;
    views?: number;
  };
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
}

export default function PostItem({ post, onLike, onComment, onShare, onBookmark }: PostProps) {
  const router = useRouter();
  const [showFullContent, setShowFullContent] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  // Track post views
  const { ref: postRef } = usePostView({
    postId: post._id,
    enabled: true,
    threshold: 0.5, // 50% of post must be visible
    delay: 3000 // Count view after 3 seconds of visibility
  });

  const goToPost = () => {
    router.push(`/post/${post._id}`);
  };

  const goToUserProfile = () => {
    router.push(`/user/${post.author._id}`);
  };

  const renderFormattedContent = (content: string) => {
    const formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/__(.*?)__/g, '<u class="underline">$1</u>')
      .replace(/\n/g, '<br />');

    return formattedContent;
  };

  const truncatedContent = post.content.length > 300 
    ? post.content.substring(0, 300) + '...'
    : post.content;

  const displayContent = showFullContent ? post.content : truncatedContent;

  const getAuthorName = () => {
    return post.authorDetails?.name || post.author?.name || 'Unknown User';
  };

  const getAuthorAvatar = () => {
    return post.authorDetails?.avatar || `https://avatar.vercel.sh/${post.author?.email}`;
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      const diffInWeeks = Math.floor(diffInDays / 7);
      if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
      
      const diffInMonths = Math.floor(diffInDays / 30);
      if (diffInMonths < 12) return `${diffInMonths}mo ago`;
      
      const diffInYears = Math.floor(diffInDays / 365);
      return `${diffInYears}y ago`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Recently';
    }
  };

  return (
    <Card 
      ref={postRef}
      className="mb-6 hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white dark:bg-gray-800 rounded-xl overflow-hidden"
    >
      <CardContent className="p-0">
        {/* Post Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center space-x-4">
            <Avatar 
              className="h-12 w-12 ring-2 ring-blue-100 dark:ring-blue-900 cursor-pointer"
              onClick={goToUserProfile}
            >
              <AvatarImage src={getAuthorAvatar()} alt={getAuthorName()} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {getAuthorName().split(' ').map(n => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 
                className="font-semibold text-gray-900 dark:text-white text-base truncate cursor-pointer hover:underline"
                onClick={goToUserProfile}
              >
                {getAuthorName()}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                <span>{formatTimeAgo(post.createdAt)}</span>
                {post.views !== undefined && post.views !== null && (
                  <>
                    <span className="text-xs">•</span>
                    <span className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {post.views.toLocaleString()} views
                    </span>
                  </>
                )}
              </p>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 w-9 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreHorizontal className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Post Content */}
        <div className="px-6 pb-4">
          <div 
            className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200 leading-relaxed prose-strong:text-gray-900 dark:prose-strong:text-white prose-em:text-gray-700 dark:prose-em:text-gray-300 cursor-pointer"
            dangerouslySetInnerHTML={{ 
              __html: renderFormattedContent(displayContent) 
            }}
            onClick={goToPost}
          />
          
          {post.content.length > 300 && (
            <Button
              variant="link"
              className="p-0 h-auto font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-2 transition-colors"
              onClick={() => setShowFullContent(!showFullContent)}
            >
              {showFullContent ? 'Show less' : 'Read more'}
            </Button>
          )}
        </div>

        {/* Post Image */}
        {post.image && (
          <div className="relative mx-6 mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
            <img
              src={post.image}
              alt="Post content"
              className={`w-full max-h-96 object-cover transition-all duration-500 hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse flex items-center justify-center">
                <div className="text-gray-400 dark:text-gray-500 font-medium">Loading image...</div>
              </div>
            )}
          </div>
        )}

        {/* Post Actions */}
        <div className="p-6 pt-4">
          {/* Reaction Counts */}
          <div className="flex items-center justify-between mb-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-6">
              {(post.likes?.length || 0) > 0 && (
                <span className="flex items-center bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
                  <Heart className="h-4 w-4 mr-1.5 text-red-500 fill-current" />
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {post.likes?.length} {post.likes?.length === 1 ? 'like' : 'likes'}
                  </span>
                </span>
              )}
              {(post.comments?.length || 0) > 0 && (
                <span className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                  <MessageCircle className="h-4 w-4 mr-1.5 text-blue-500" />
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {post.comments?.length} {post.comments?.length === 1 ? 'comment' : 'comments'}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  post.isLiked 
                    ? 'text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
                onClick={() => onLike?.(post._id)}
              >
                <Heart className={`h-4 w-4 transition-transform hover:scale-110 ${post.isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">Like</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 px-4 py-2 rounded-full text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                onClick={() => setShowComments(true)}
              >
                <MessageCircle className="h-4 w-4 transition-transform hover:scale-110" />
                <span className="font-medium">Comment</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 px-4 py-2 rounded-full text-gray-600 dark:text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
                onClick={() => onShare?.(post._id)}
              >
                <Share className="h-4 w-4 transition-transform hover:scale-110" />
                <span className="font-medium">Share</span>
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className={`px-3 py-2 rounded-full transition-all duration-200 ${
                post.isBookmarked 
                  ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
              onClick={() => onBookmark?.(post._id)}
            >
              <Bookmark className={`h-4 w-4 transition-transform hover:scale-110 ${post.isBookmarked ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Comments Modal */}
      <CommentsModal
        postId={post._id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        onCommentAdded={() => {
          // Optionally refresh the post data to update comment count
          // This could trigger a callback to the parent component
        }}
      />
    </Card>
  );
}
