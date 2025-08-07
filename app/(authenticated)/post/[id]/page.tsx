'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Heart, MessageCircle, Share, Bookmark, Eye, Send, MoreHorizontal, Trash2, Edit3 } from 'lucide-react';

interface Post {
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
  comments?: Comment[];
  views?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

interface Comment {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
}

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPost();
      fetchComments();
    }
  }, [params.id]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
      } else {
        router.push('/feed');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      router.push('/feed');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${params.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    
    try {
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setPost(prev => prev ? {
          ...prev,
          isLiked: data.isLiked,
          likes: Array(data.likesCount).fill('')
        } : null);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${params.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([data.comment, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/posts/${params.id}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments(comments.filter(comment => comment._id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  const renderFormattedContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/__(.*?)__/g, '<u class="underline">$1</u>')
      .replace(/\n/g, '<br />');
  };

  const goToUserProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Post not found</h2>
          <Button onClick={() => router.push('/dashboard/feed')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Post</h1>
        <div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Post */}
        <div className="lg:col-span-2">
          <Card className="mb-6 shadow-sm border-0 bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
            <CardContent className="p-6">
              {/* Author */}
              <div className="flex items-center space-x-4 mb-6">
                <Avatar 
                  className="h-12 w-12 ring-2 ring-blue-100 dark:ring-blue-900 cursor-pointer"
                  onClick={() => goToUserProfile(post.author._id)}
                >
                  <AvatarImage src={post.authorDetails?.avatar || `https://avatar.vercel.sh/${post.author.email}`} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {(post.authorDetails?.name || post.author.name).split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-semibold text-gray-900 dark:text-white text-base cursor-pointer hover:text-blue-600"
                    onClick={() => goToUserProfile(post.author._id)}
                  >
                    {post.authorDetails?.name || post.author.name}
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
                
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
                  <MoreHorizontal className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </Button>
              </div>

              {/* Content */}
              <div className="mb-6">
                <div 
                  className="prose prose-lg max-w-none text-gray-800 dark:text-gray-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: renderFormattedContent(post.content) 
                  }}
                />
              </div>

              {/* Image */}
              {post.image && (
                <div className="mb-6">
                  <img
                    src={post.image}
                    alt="Post content"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-6">
                    {(post.likes?.length || 0) > 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {post.likes?.length} {post.likes?.length === 1 ? 'like' : 'likes'}
                      </span>
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                      post.isLiked 
                        ? 'text-red-600 bg-red-50 dark:bg-red-900/20' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                    onClick={handleLike}
                  >
                    <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                    <span>Like</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2 px-4 py-2 rounded-full text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Comment</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2 px-4 py-2 rounded-full text-gray-600 dark:text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <Share className="h-4 w-4" />
                    <span>Share</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`px-3 py-2 rounded-full ${
                      post.isBookmarked 
                        ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }`}
                  >
                    <Bookmark className={`h-4 w-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Comment */}
          <Card className="mb-6 shadow-sm border-0 bg-white dark:bg-gray-800 rounded-xl">
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={session?.user?.image || `https://avatar.vercel.sh/${session?.user?.email}`} />
                  <AvatarFallback>
                    {session?.user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] resize-none"
                    disabled={submitting}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || submitting}
                      size="sm"
                      className="px-6"
                    >
                      {submitting ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Comment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment._id} className="shadow-sm border-0 bg-white dark:bg-gray-800 rounded-xl">
                <CardContent className="p-6">
                  <div className="flex space-x-4">
                    <Avatar 
                      className="h-10 w-10 cursor-pointer"
                      onClick={() => goToUserProfile(comment.user._id)}
                    >
                      <AvatarImage src={comment.user.avatar || `https://avatar.vercel.sh/${comment.user.email}`} />
                      <AvatarFallback>
                        {comment.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 
                          className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600"
                          onClick={() => goToUserProfile(comment.user._id)}
                        >
                          {comment.user.name}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                          {comment.user.email === session?.user?.email && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment._id)}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm border-0 bg-white dark:bg-gray-800 rounded-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Related Posts</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
