"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostItem from "@/components/post-item";
import ImageUploadModal from "@/components/image-upload-modal";
import { useUserProfile } from "@/hooks/useUserProfile";
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
  Settings,
  Edit,
  Save,
  X,
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

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { userProfile, loading, error, updating, updateProfile, refetchProfile } =
    useUserProfile();
  const [posts, setPosts] = useState<Post[]>([]);
  const [mediaPosts, setMediaPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [showProfileImageModal, setShowProfileImageModal] = useState(false);
  const [showCoverImageModal, setShowCoverImageModal] = useState(false);

  const isOwnProfile = userProfile?.email === session?.user?.email;

  // Initialize form data when userProfile loads
  useEffect(() => {
    if (userProfile) {
      setEditForm({
        name: userProfile.name,
        username: userProfile.username?.startsWith('@') ? userProfile.username.substring(1) : userProfile.username,
        bio: userProfile.bio,
        phone: userProfile.phone,
        address: userProfile.address,
        socialLinks: { ...userProfile.socialLinks },
      });
    }
  }, [userProfile]);

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
          if (likedPosts.length === 0) fetchLikedPosts();
          break;
      }
    }
  }, [activeTab, userProfile?._id]);

  const fetchUserPosts = async () => {
    try {
      setLoadingPosts(true);
      if (!userProfile?._id) return;
      
      const response = await fetch(`/api/user/${userProfile._id}/posts`);
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
      if (!userProfile?._id) return;
      
      const response = await fetch(`/api/user/${userProfile._id}/posts`);
      if (response.ok) {
        const data = await response.json();
        // Filter posts that have images
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
    try {
      setLoadingLikes(true);
      if (!userProfile?._id) return;
      
      // Fetch all posts and filter liked ones
      const allPostsResponse = await fetch(`/api/posts`);
      if (allPostsResponse.ok) {
        const allPostsData = await allPostsResponse.json();
        const currentUserId = userProfile._id;
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

  const handleSave = async () => {
    if (!userProfile) return;

    try {
      const updates = {
        name: editForm.name,
        username: editForm.username,
        bio: editForm.bio,
        phone: editForm.phone,
        address: editForm.address,
        socialLinks: editForm.socialLinks,
      };
      await updateProfile(updates);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setEditForm({
        name: userProfile.name,
        username: userProfile.username?.startsWith('@') ? userProfile.username.substring(1) : userProfile.username,
        bio: userProfile.bio,
        phone: userProfile.phone,
        address: userProfile.address,
        socialLinks: { ...userProfile.socialLinks },
      });
    }
    setIsEditing(false);
  };

  const handleFollow = async () => {
    if (!userProfile) return;

    try {
      const response = await fetch(`/api/user/${userProfile._id}/follow`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        // Note: Since we're using useUserProfile hook, we might need to refetch
        // or the hook should handle this automatically
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  const handleMessage = () => {
    router.push(`/messages?user=${userProfile?._id}`);
  };

  const handleProfileImageSuccess = (url: string) => {
    // Refetch the user profile to get the updated image
    refetchProfile();
  };

  const handleCoverImageSuccess = (url: string) => {
    // Refetch the user profile to get the updated image
    refetchProfile();
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
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Empty state component
  const EmptyState = ({ 
    title, 
    message, 
    icon 
  }: { 
    title: string; 
    message: string; 
    icon: React.ReactNode;
  }) => (
    <Card className="shadow-sm border-0 bg-white dark:bg-gray-800 rounded-xl">
      <CardContent className="p-12 text-center">
        <div className="text-gray-400 mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {message}
        </p>
      </CardContent>
    </Card>
  );

  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    } catch {
      return "";
    }
  };

  const formatUsername = (username?: string) => {
    if (!username) return "";
    // If username already starts with @, return as is, otherwise add @
    return username.startsWith('@') ? username : `@${username}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || "Profile not found"}
          </h2>
          <Button onClick={() => router.push("/feed")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6">
      {/* Profile Header */}
      <Card className="mb-6 shadow-sm border-0 bg-white dark:bg-gray-800 rounded-xl overflow-hidden pt-0">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative">
          {userProfile.coverImage && (
            <img
              src={userProfile.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          {isOwnProfile && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setShowCoverImageModal(true)}
            >
              <Camera className="h-4 w-4 mr-2" />
              Edit Cover
            </Button>
          )}
        </div>

        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start  sm:space-y-0 sm:space-x-6 -mt-16">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-32 w-32 ring-4 ring-white dark:ring-gray-800">
                <AvatarImage
                  src={
                    userProfile.avatar ||
                    `https://avatar.vercel.sh/${userProfile.email}`
                  }
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-semibold">
                  {userProfile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full h-10 w-10 p-0"
                  onClick={() => setShowProfileImageModal(true)}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 pt-6 sm:pt-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editForm.name || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      placeholder="Name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">@</span>
                      </div>
                      <Input
                        id="username"
                        value={editForm.username?.startsWith('@') ? editForm.username.substring(1) : editForm.username || ""}
                        onChange={(e) => {
                          let value = e.target.value;
                          // Remove @ if user types it since we show it as prefix
                          if (value.startsWith('@')) {
                            value = value.substring(1);
                          }
                          // Store username without @ in the form
                          setEditForm({ ...editForm, username: value });
                        }}
                        placeholder="username"
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editForm.bio || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, bio: e.target.value })
                      }
                      placeholder="Tell us about yourself..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editForm.phone || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={editForm.address || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address: e.target.value })
                      }
                      placeholder="Your location"
                    />
                  </div>

                  {/* Social Links */}
                  <div className="space-y-3">
                    <Label>Social Links</Label>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center space-x-2">
                        <Facebook className="h-4 w-4 text-blue-600" />
                        <Input
                          value={editForm.socialLinks?.facebook || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              socialLinks: {
                                facebook: e.target.value,
                                twitter: editForm.socialLinks?.twitter || "",
                                instagram:
                                  editForm.socialLinks?.instagram || "",
                                linkedin: editForm.socialLinks?.linkedin || "",
                                github: editForm.socialLinks?.github || "",
                              },
                            })
                          }
                          placeholder="Facebook URL"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Twitter className="h-4 w-4 text-blue-400" />
                        <Input
                          value={editForm.socialLinks?.twitter || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              socialLinks: {
                                facebook: editForm.socialLinks?.facebook || "",
                                twitter: e.target.value,
                                instagram:
                                  editForm.socialLinks?.instagram || "",
                                linkedin: editForm.socialLinks?.linkedin || "",
                                github: editForm.socialLinks?.github || "",
                              },
                            })
                          }
                          placeholder="Twitter URL"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Instagram className="h-4 w-4 text-pink-500" />
                        <Input
                          value={editForm.socialLinks?.instagram || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              socialLinks: {
                                facebook: editForm.socialLinks?.facebook || "",
                                twitter: editForm.socialLinks?.twitter || "",
                                instagram: e.target.value,
                                linkedin: editForm.socialLinks?.linkedin || "",
                                github: editForm.socialLinks?.github || "",
                              },
                            })
                          }
                          placeholder="Instagram URL"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Linkedin className="h-4 w-4 text-blue-700" />
                        <Input
                          value={editForm.socialLinks?.linkedin || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              socialLinks: {
                                facebook: editForm.socialLinks?.facebook || "",
                                twitter: editForm.socialLinks?.twitter || "",
                                instagram:
                                  editForm.socialLinks?.instagram || "",
                                linkedin: e.target.value,
                                github: editForm.socialLinks?.github || "",
                              },
                            })
                          }
                          placeholder="LinkedIn URL"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Github className="h-4 w-4 text-gray-800" />
                        <Input
                          value={editForm.socialLinks?.github || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              socialLinks: {
                                facebook: editForm.socialLinks?.facebook || "",
                                twitter: editForm.socialLinks?.twitter || "",
                                instagram:
                                  editForm.socialLinks?.instagram || "",
                                linkedin: editForm.socialLinks?.linkedin || "",
                                github: e.target.value,
                              },
                            })
                          }
                          placeholder="GitHub URL"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSave}
                      disabled={updating}
                      className="flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updating ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={updating}
                      className="flex items-center"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <h1 className="text-2xl font-bold">{userProfile.name}</h1>
                      <p className="text-gray-500">{formatUsername(userProfile.username)}</p>
                    </div>
                    <div className="flex space-x-2 mt-4 sm:mt-0">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300">
                    {userProfile.bio}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    {userProfile.address && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {userProfile.address}
                      </div>
                    )}
                    {userProfile.phone && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {userProfile.phone}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Joined{" "}
                      {new Date(userProfile.createdAt || "").toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                        }
                      )}
                    </div>
                  </div>

                  {/* Social Links */}
                  {userProfile.socialLinks && (
                    <div className="flex flex-wrap gap-3 text-sm">
                      {userProfile.socialLinks.facebook && (
                        <a
                          href={userProfile.socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:underline"
                        >
                          <Facebook className="h-4 w-4 mr-1" />
                          Facebook
                        </a>
                      )}
                      {userProfile.socialLinks.twitter && (
                        <a
                          href={userProfile.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-400 hover:underline"
                        >
                          <Twitter className="h-4 w-4 mr-1" />
                          Twitter
                        </a>
                      )}
                      {userProfile.socialLinks.instagram && (
                        <a
                          href={userProfile.socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-pink-500 hover:underline"
                        >
                          <Instagram className="h-4 w-4 mr-1" />
                          Instagram
                        </a>
                      )}
                      {userProfile.socialLinks.linkedin && (
                        <a
                          href={userProfile.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-700 hover:underline"
                        >
                          <Linkedin className="h-4 w-4 mr-1" />
                          LinkedIn
                        </a>
                      )}
                      {userProfile.socialLinks.github && (
                        <a
                          href={userProfile.socialLinks.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-gray-800 hover:underline"
                        >
                          <Github className="h-4 w-4 mr-1" />
                          GitHub
                        </a>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex space-x-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <p className="text-xl font-bold">{userProfile.posts}</p>
                      <p className="text-sm text-gray-500">Posts</p>
                    </div>
                    <div className="text-center cursor-pointer hover:underline">
                      <p className="text-xl font-bold">
                        {userProfile.followers}
                      </p>
                      <p className="text-sm text-gray-500">Followers</p>
                    </div>
                    <div className="text-center cursor-pointer hover:underline">
                      <p className="text-xl font-bold">
                        {userProfile.following}
                      </p>
                      <p className="text-sm text-gray-500">Following</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-6 mt-6">
          {loadingPosts ? (
            <LoadingPosts />
          ) : posts.length === 0 ? (
            <EmptyState
              title="No posts yet"
              message={isOwnProfile 
                ? "Start sharing your thoughts with the world!" 
                : `${userProfile?.name} hasn't posted anything yet.`}
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
                : `${userProfile?.name} hasn't shared any media yet.`}
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
          {loadingLikes ? (
            <LoadingPosts />
          ) : likedPosts.length === 0 ? (
            <EmptyState
              title="No liked posts yet"
              message={isOwnProfile 
                ? "Posts you like will appear here!" 
                : `${userProfile?.name} hasn't liked any posts yet.`}
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
          )}
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <Card className="shadow-sm border-0 bg-white dark:bg-gray-800 rounded-xl">
            <CardHeader>
              <CardTitle>About {userProfile.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userProfile.bio && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Bio
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    {userProfile.bio}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userProfile.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {userProfile.email}
                    </span>
                  </div>
                )}
                {userProfile.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {userProfile.address}
                    </span>
                  </div>
                )}
                {userProfile.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {userProfile.phone}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Joined{" "}
                    {new Date(userProfile.createdAt || "").toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                      }
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Upload Modals */}
      {userProfile?._id && (
        <>
          <ImageUploadModal
            isOpen={showProfileImageModal}
            onClose={() => setShowProfileImageModal(false)}
            type="profile"
            userId={userProfile._id}
            currentImage={userProfile.avatar}
            onSuccess={handleProfileImageSuccess}
          />
          
          <ImageUploadModal
            isOpen={showCoverImageModal}
            onClose={() => setShowCoverImageModal(false)}
            type="cover"
            userId={userProfile._id}
            currentImage={userProfile.coverImage}
            onSuccess={handleCoverImageSuccess}
          />
        </>
      )}
    </div>
  );
}
