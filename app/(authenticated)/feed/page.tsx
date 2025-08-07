"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import PostCreator from "@/components/post-creator";
import PostItem from "@/components/post-item";
import { TrendingUp, Users, RefreshCw, MessageCircle } from "lucide-react";

interface Post {
  _id: string;
  title?: string;
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
  tags?: string[];
}

function FeedPageContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { userProfile } = useUserProfile();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "following" | "trending">("all");

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      setLoading(true);

      const postsResponse = await fetch("/api/posts");
      const postsData = await postsResponse.json();

      if (postsResponse.ok && postsData.posts) {
        // Process posts to add isLiked and isBookmarked flags
        const processedPosts = postsData.posts.map((post: any) => ({
          ...post,
          isLiked: false, // Will be updated after user profile loads
          isBookmarked: false,
        }));
        setPosts(processedPosts);
      } else {
        console.error("Failed to fetch posts:", postsData);
        setPosts([]);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh posts
  const refreshPosts = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  // Update posts with user-specific data when userProfile loads
  useEffect(() => {
    if (userProfile?._id && posts.length > 0) {
      const updatedPosts = posts.map((post) => ({
        ...post,
        isLiked: post.likes?.some((likeId: string) => likeId === userProfile._id) || false,
      }));
      setPosts(updatedPosts);
    }
  }, [userProfile?._id]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchPosts();
    }
  }, [status, router]);

  // Handle liking a post
  const handleLike = async (postId: string) => {
    try {
      // Optimistically update UI
      setPosts(
        posts.map((post) =>
          post._id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked
                  ? (post.likes || []).slice(0, -1) // Remove one like
                  : [...(post.likes || []), "temp"], // Add one like
              }
            : post
        )
      );

      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        // Update with actual server response
        setPosts(
          posts.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  isLiked: data.isLiked,
                  likes: Array(data.likesCount).fill(""),
                }
              : post
          )
        );
      } else {
        // Revert optimistic update on error
        setPosts(
          posts.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  isLiked: !post.isLiked,
                  likes: post.isLiked
                    ? [...(post.likes || []), "temp"]
                    : (post.likes || []).slice(0, -1),
                }
              : post
          )
        );
        console.error("Failed to toggle like:", data.error);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Handle commenting on a post
  const handleComment = (postId: string) => {
    // Navigate to post detail or open comment modal
    console.log("Comment on post:", postId);
  };

  // Handle sharing a post
  const handleShare = (postId: string) => {
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: "Check out this post",
        url: `${window.location.origin}/post/${postId}`,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
      alert("Link copied to clipboard!");
    }
  };

  // Handle bookmarking a post
  const handleBookmark = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post._id === postId
          ? { ...post, isBookmarked: !post.isBookmarked }
          : post
      )
    );
  };

  // Loading state is handled by the layout
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-8">
            {/* Feed Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white dark:bg-gray-900 p-6 rounded-2xl shadow border border-gray-200 dark:border-gray-800 mb-2">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4 md:mb-0">
                    Your Feed
                </h1>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={filter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("all")}
                        className="rounded-full font-semibold"
                    >
                        All
                    </Button>
                    <Button
                        variant={filter === "following" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("following")}
                        className="rounded-full font-semibold"
                    >
                        Following
                    </Button>
                    <Button
                        variant={filter === "trending" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter("trending")}
                        className="rounded-full font-semibold flex items-center"
                    >
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Trending
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshPosts}
                        disabled={refreshing}
                        className="rounded-full font-semibold"
                        aria-label="Refresh feed"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                        />
                    </Button>
                </div>
            </div>

            {/* Post Creator */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-200 dark:border-gray-800 p-6">
              
                <PostCreator onPostCreated={fetchPosts} userProfile={userProfile} />
                
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <Card key={i} className="animate-pulse rounded-2xl border border-gray-200 dark:border-gray-800">
                                <CardContent className="p-6">
                                    <div className="flex space-x-4">
                                        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                                        <div className="flex-1 space-y-4">
                                            <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                                            <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                                            <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <Card className="rounded-2xl border border-gray-200 dark:border-gray-800">
                        <CardContent className="p-12 text-center">
                            <div className="flex flex-col items-center space-y-6">
                                <MessageCircle className="h-14 w-14 text-gray-400" />
                                <div>
                                    <h3 className="text-xl font-semibold">No posts yet</h3>
                                    <p className="text-gray-500">
                                        Be the first to share something!
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    posts.map((post) => (
                        <PostItem
                            key={post._id}
                            post={post}
                            onLike={handleLike}
                            onComment={handleComment}
                            onShare={handleShare}
                            onBookmark={handleBookmark}
                        />
                    ))
                )}
            </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Who to follow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://avatar.vercel.sh/user${i}`} />
                      <AvatarFallback>U{i}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Developer {i}</p>
                      <p className="text-xs text-gray-500">@dev{i}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Follow
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Your Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Posts</span>
                <span className="font-medium">{userProfile?.posts || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Followers</span>
                <span className="font-medium">
                  {userProfile?.followers || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Following</span>
                <span className="font-medium">
                  {userProfile?.following || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function FeedPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="animate-pulse">
              <div className="bg-white rounded-lg p-6 mb-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function FeedPage() {
  return (
    <Suspense fallback={<FeedPageLoading />}>
      <FeedPageContent />
    </Suspense>
  );
}
