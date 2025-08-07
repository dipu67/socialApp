"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostItem from "@/components/post-item";
import {
  ArrowLeft,
  MessageCircle,
  UserPlus,
  UserCheck,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Camera,
  Mail,
  Phone,
  Globe,
  User,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Github,
} from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  username?: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  chatId?: string;
  phone?: string;
  address?: string;
  socialLinks?: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    github: string;
  };
  followers?: number;
  following?: number;
  posts?: number;
  createdAt?: string;
  updatedAt?: string;
  website?: string;
  location?: string;
  joinedDate?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
}

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
  comments?: any[];
  views?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [mediaPosts, setMediaPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = params.id as string;
  const isOwnProfile = userProfile?.email === session?.user?.email;

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  useEffect(() => {
    if (userProfile?._id) {
      fetchUserPosts();
    }
  }, [userProfile?._id]);

  // Fetch data based on active tab
  useEffect(() => {
    if (userProfile?._id) {
      switch (activeTab) {
        case "posts":
          if (posts.length === 0) fetchUserPosts();
          break;
        case "media":
          if (mediaPosts.length === 0) fetchMediaPosts();
          break;
        case "likes":
          if (likedPosts.length === 0 && isOwnProfile) fetchLikedPosts();
          break;
        case "about":
          // About tab doesn't need data fetching
          break;
      }
    }
  }, [activeTab, userProfile?._id]);

  // Handle tab switching when profile ownership changes
  useEffect(() => {
    if (activeTab === "likes" && !isOwnProfile) {
      setActiveTab("about");
    } else if (activeTab === "about" && isOwnProfile) {
      setActiveTab("posts");
    }
  }, [isOwnProfile, activeTab]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        setIsFollowing(data.user.isFollowing || false);
        console.log('Profile loaded:', { userId, isFollowing: data.user.isFollowing }); // Debug log
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch user profile");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setLoadingPosts(true);
      const response = await fetch(`/api/user/${userId}/posts`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchMediaPosts = async () => {
    try {
      setLoadingMedia(true);
      const response = await fetch(`/api/user/${userId}/posts`);
      if (response.ok) {
        const data = await response.json();
        const mediaOnlyPosts = data.posts?.filter((post: Post) => post.image) || [];
        setMediaPosts(mediaOnlyPosts);
      }
    } catch (error) {
      console.error("Error fetching media posts:", error);
    } finally {
      setLoadingMedia(false);
    }
  };

  const fetchLikedPosts = async () => {
    if (!isOwnProfile) return; // Only show liked posts for own profile
    
    try {
      setLoadingLikes(true);
      const allPostsResponse = await fetch(`/api/posts`);
      if (allPostsResponse.ok) {
        const allPostsData = await allPostsResponse.json();
        const currentUserId = userProfile?._id;
        const userLikedPosts = allPostsData.posts?.filter((post: Post) => 
          currentUserId && (post.likes?.includes(currentUserId) || post.isLiked)
        ) || [];
        setLikedPosts(userLikedPosts);
      }
    } catch (error) {
      console.error("Error fetching liked posts:", error);
    } finally {
      setLoadingLikes(false);
    }
  };

  const handleFollow = async () => {
    try {
      console.log('Following user:', userId, 'Current status:', isFollowing); // Debug log
      const response = await fetch(`/api/user/${userId}/follow`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Follow response:', data); // Debug log
        setIsFollowing(data.isFollowing);
        
        // Update followers count based on the response
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            followersCount: data.followersCount || userProfile.followersCount
          });
        }
      } else {
        console.error("Failed to toggle follow");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  const handleMessage = async () => {
    try {
      if (!userProfile?._id) {
        console.error("No user profile available");
        return;
      }

      setIsMessaging(true);

      // First, try to find existing chat with this user
      const chatsResponse = await fetch("/api/chats");
      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json();
        
        // Look for a direct (non-group) chat that includes this user
        const existingChat = chatsData.chats?.find((chat: any) => 
          !chat.isGroupChat && 
          chat.participants.some((p: any) => p._id === userProfile._id)
        );

        if (existingChat) {
          // Navigate to existing chat
          router.push(`/chat?chatId=${existingChat._id}`);
          return;
        }
      }

      // If no existing chat, create a new one
      const createChatResponse = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isGroupChat: false,
          participantIds: [userProfile._id], // Array of participant IDs
        }),
      });

      if (createChatResponse.ok) {
        const newChatData = await createChatResponse.json();
        // Navigate to the newly created chat
        router.push(`/chat?chatId=${newChatData.chat._id}`);
      } else {
        console.error("Failed to create chat");
        // Fallback: navigate to chat page so user can manually start conversation
        router.push(`/chat`);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      // Fallback: navigate to chat page
      router.push(`/chat`);
    } finally {
      setIsMessaging(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
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
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Loading component
  const LoadingPosts = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="shadow-sm border-0 bg-white dark:bg-gray-800 rounded-xl">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/6"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Empty state component
  const EmptyState = ({ title, message, icon }: { title: string; message: string; icon: React.ReactNode }) => (
    <Card className="shadow-sm border-0 bg-white dark:bg-gray-800 rounded-xl">
      <CardContent className="p-12 text-center">
        <div className="text-gray-400 mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">{message}</p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error Loading Profile
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {error}
          </p>
          <div className="space-x-3">
            <Button onClick={() => fetchUserProfile()}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push("/feed")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Feed
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            User not found
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            The user you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/feed")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {userProfile.name}'s Profile
            </h1>
            <div className="w-16"></div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          {/* Cover Image */}
          <Card className="shadow-sm border-0 bg-white dark:bg-gray-800 rounded-xl overflow-hidden mb-6 pt-0">
            <div className="relative">
              <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600">
                {userProfile.coverImage && (
                  <img
                    src={userProfile.coverImage}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Profile Picture */}
              <div className="absolute -bottom-16 left-6">
                <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-800">
                  <AvatarImage 
                    src={userProfile.avatar || `https://avatar.vercel.sh/${userProfile.email}`} 
                    alt={userProfile.name} 
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                    {userProfile.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Profile Info */}
            <CardContent className="pt-20 p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-3 mb-2">
                    {userProfile.name}
                  </h1>
                  
                  {userProfile.username && (
                    <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
                      @{userProfile.username}
                    </p>
                  )}

                  {userProfile.bio && (
                    <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-2xl leading-relaxed">
                      {userProfile.bio}
                    </p>
                  )}

                  {/* User Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {userProfile.address && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-sm">{userProfile.address}</span>
                      </div>
                    )}

                    {userProfile.phone && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Phone className="h-4 w-4 mr-2" />
                        <span className="text-sm">{userProfile.phone}</span>
                      </div>
                    )}

                    {userProfile.email && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="text-sm">{userProfile.email}</span>
                      </div>
                    )}

                    {userProfile.createdAt && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          Joined {new Date(userProfile.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  {userProfile.socialLinks && (
                    <div className="flex flex-wrap gap-3 mb-6">
                      {userProfile.socialLinks.facebook && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={userProfile.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                            <Facebook className="h-4 w-4 mr-2" />
                            Facebook
                          </a>
                        </Button>
                      )}
                      {userProfile.socialLinks.twitter && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={userProfile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                            <Twitter className="h-4 w-4 mr-2" />
                            Twitter
                          </a>
                        </Button>
                      )}
                      {userProfile.socialLinks.instagram && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={userProfile.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                            <Instagram className="h-4 w-4 mr-2" />
                            Instagram
                          </a>
                        </Button>
                      )}
                      {userProfile.socialLinks.linkedin && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={userProfile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="h-4 w-4 mr-2" />
                            LinkedIn
                          </a>
                        </Button>
                      )}
                      {userProfile.socialLinks.github && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={userProfile.socialLinks.github} target="_blank" rel="noopener noreferrer">
                            <Github className="h-4 w-4 mr-2" />
                            GitHub
                          </a>
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex space-x-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-lg text-gray-900 dark:text-white">
                        {userProfile.postsCount || posts.length || 0}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg text-gray-900 dark:text-white">
                        {userProfile.followersCount || 0}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg text-gray-900 dark:text-white">
                        {userProfile.followingCount || 0}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">Following</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {!isOwnProfile && (
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-0">
                    <Button
                      onClick={handleFollow}
                      className="flex items-center"
                      variant={isFollowing ? "outline" : "default"}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleMessage}
                      variant="outline"
                      disabled={isMessaging}
                      className="flex items-center"
                    >
                      {isMessaging ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Starting...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full mb-6 ${isOwnProfile ? 'grid-cols-3' : 'grid-cols-3'}`}>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value={isOwnProfile ? "likes" : "about"}>
                {isOwnProfile ? "Liked" : "About"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-6 mt-6">
              {loadingPosts ? (
                <LoadingPosts />
              ) : posts.length === 0 ? (
                <EmptyState
                  title="No posts yet"
                  message={isOwnProfile 
                    ? "Start sharing your thoughts with the world!" 
                    : `${userProfile.name} hasn't posted anything yet.`}
                  icon={
                    <svg
                      className="h-16 w-16 mx-auto"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  }
                />
              ) : (
                posts.map((post) => (
                  <PostItem
                    key={post._id}
                    post={post}
                    onLike={handleLike}
                    onComment={() => router.push(`/post/${post._id}`)}
                    onShare={() => {}}
                    onBookmark={() => {}}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="media" className="space-y-6 mt-6">
              {loadingMedia ? (
                <LoadingPosts />
              ) : mediaPosts.length === 0 ? (
                <EmptyState
                  title="No media posts yet"
                  message={isOwnProfile 
                    ? "Share photos and videos to see them here!" 
                    : `${userProfile.name} hasn't shared any media yet.`}
                  icon={
                    <svg
                      className="h-16 w-16 mx-auto"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mediaPosts.map((post) => (
                    <Card key={post._id} className="shadow-sm border-0 bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
                      <div 
                        className="cursor-pointer" 
                        onClick={() => router.push(`/post/${post._id}`)}
                      >
                        {post.image && (
                          <img
                            src={post.image}
                            alt="Post media"
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <CardContent className="p-4">
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {post.content}
                          </p>
                          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            <div className="flex items-center space-x-3">
                              <span className="flex items-center">
                                ❤️ {post.likes?.length || 0}
                              </span>
                              <span className="flex items-center">
                                💬 {post.comments?.length || 0}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="likes" className="space-y-6 mt-6">
              {isOwnProfile ? (
                loadingLikes ? (
                  <LoadingPosts />
                ) : likedPosts.length === 0 ? (
                  <EmptyState
                    title="No liked posts yet"
                    message="Posts you like will appear here!"
                    icon={
                      <svg
                        className="h-16 w-16 mx-auto"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    }
                  />
                ) : (
                  likedPosts.map((post) => (
                    <PostItem
                      key={post._id}
                      post={post}
                      onLike={handleLike}
                      onComment={() => router.push(`/post/${post._id}`)}
                      onShare={() => {}}
                      onBookmark={() => {}}
                    />
                  ))
                )
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    Liked posts are private
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="about" className="mt-6">
              <Card className="shadow-sm border-0 bg-white dark:bg-gray-800 rounded-xl">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    About {userProfile.name}
                  </h3>
                  <div className="space-y-4">
                    {userProfile.bio && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Bio</h4>
                        <p className="text-gray-700 dark:text-gray-300">{userProfile.bio}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Joined</h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        {new Date(userProfile.createdAt || '').toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
