'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Hash, 
  TrendingUp,
  Users,
  MapPin,
  Calendar
} from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface TrendingTopic {
  id: string;
  hashtag: string;
  posts: string;
  trend: 'up' | 'down' | 'stable';
}

interface SuggestedUser {
  _id: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string;
  followersCount?: number;
  postsCount?: number;
  isFollowing: boolean;
}

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  attendees: number;
  image?: string;
  description?: string;
}

interface Post {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  likes: number;
  comments: number;
  createdAt: string;
  imageUrl?: string;
}

function ExplorePageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('trending');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    '#WebDevelopment', 'NextJS tutorials', '@techexpert', 'React tips'
  ]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Static trending topics (can be moved to API later)
  const [trendingTopics] = useState<TrendingTopic[]>([
    { id: '1', hashtag: '#WebDevelopment', posts: '125K', trend: 'up' },
    { id: '2', hashtag: '#NextJS', posts: '89K', trend: 'up' },
    { id: '3', hashtag: '#TechTrends', posts: '67K', trend: 'stable' },
    { id: '4', hashtag: '#DigitalArt', posts: '45K', trend: 'up' },
    { id: '5', hashtag: '#Productivity', posts: '34K', trend: 'down' },
    { id: '6', hashtag: '#StartupLife', posts: '28K', trend: 'up' },
    { id: '7', hashtag: '#AITechnology', posts: '156K', trend: 'up' },
    { id: '8', hashtag: '#RemoteWork', posts: '98K', trend: 'up' },
    { id: '9', hashtag: '#Blockchain', posts: '76K', trend: 'stable' },
    { id: '10', hashtag: '#UXDesign', posts: '54K', trend: 'up' }
  ]);

  // Static events data
  const [events] = useState<Event[]>([
    {
      id: '1',
      title: 'Web Dev Conference 2024',
      date: '2024-03-15',
      location: 'San Francisco, CA',
      attendees: 2500,
      image: 'https://via.placeholder.com/400x200?text=Conference',
      description: 'Join industry leaders for the latest in web development trends and technologies.'
    },
    {
      id: '2',
      title: 'React Meetup',
      date: '2024-02-20',
      location: 'Online',
      attendees: 850,
      image: 'https://via.placeholder.com/400x200?text=React+Meetup',
      description: 'Monthly React.js meetup with talks on hooks, performance, and best practices.'
    },
    {
      id: '3',
      title: 'Design Workshop',
      date: '2024-03-01',
      location: 'New York, NY',
      attendees: 150,
      image: 'https://via.placeholder.com/400x200?text=Design+Workshop',
      description: 'Hands-on workshop covering modern UI/UX design principles and tools.'
    },
    {
      id: '4',
      title: 'Tech Startup Pitch Day',
      date: '2024-02-28',
      location: 'Austin, TX',
      attendees: 300,
      image: 'https://via.placeholder.com/400x200?text=Pitch+Day',
      description: 'Emerging startups pitch their innovative solutions to investors and industry experts.'
    }
  ]);

  // Fetch real users data
  const fetchSuggestedUsers = async () => {
    try {
      const response = await fetch('/api/users/search?limit=6');
      if (response.ok) {
        const data = await response.json();
        const usersWithFollowState = data.users.map((user: any) => ({
          ...user,
          isFollowing: false,
          followersCount: user.followersCount || 0,
          postsCount: user.postsCount || 0,
          username: user.username || `@${user.name.toLowerCase().replace(/\s+/g, '')}`
        }));
        setSuggestedUsers(usersWithFollowState);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to mock data
      setSuggestedUsers([]);
    }
  };

  // Fetch real posts data
  const fetchRecentPosts = async () => {
    try {
      const response = await fetch('/api/posts?limit=10');
      if (response.ok) {
        const data = await response.json();
        setRecentPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setRecentPosts([]);
    }
  };

  // Enhanced search functionality with real data
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search users
      const usersResponse = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=5`);
      const usersData = usersResponse.ok ? await usersResponse.json() : { users: [] };

      // Search posts
      const postsResponse = await fetch(`/api/posts/search?q=${encodeURIComponent(query)}&limit=5`);
      const postsData = postsResponse.ok ? await postsResponse.json() : { posts: [] };

      const results: any[] = [];

      // Add hashtag result
      if (query.startsWith('#') || !query.startsWith('@')) {
        results.push({
          type: 'hashtag',
          content: query.startsWith('#') ? query : `#${query}`,
          posts: Math.floor(Math.random() * 100) + 10 + 'K',
          description: 'Trending topic'
        });
      }

      // Add user results
      usersData.users?.forEach((user: any) => {
        results.push({
          type: 'user',
          _id: user._id,
          name: user.name,
          username: user.username || `@${user.name.toLowerCase().replace(/\s+/g, '')}`,
          avatar: user.avatar,
          followers: user.followersCount || 0
        });
      });

      // Add post results
      postsData.posts?.forEach((post: any) => {
        results.push({
          type: 'post',
          _id: post._id,
          content: post.content,
          author: post.author.name,
          likes: post.likes || 0,
          comments: post.comments || 0,
          createdAt: post.createdAt
        });
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to mock results
      setSearchResults([
        {
          type: 'hashtag',
          content: query.startsWith('#') ? query : `#${query}`,
          posts: Math.floor(Math.random() * 100) + 10 + 'K',
          description: 'Trending topic'
        }
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add to recent searches
  const addToRecentSearches = (query: string) => {
    if (query.trim() && !recentSearches.includes(query)) {
      setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      // Fetch real data when authenticated
      fetchSuggestedUsers();
      fetchRecentPosts();
      setLoading(false);
    }
  }, [status, router]);

  // Debounced search effect
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleFollow = async (userId: string) => {
    setSuggestedUsers(prev => 
      prev.map(user => 
        user._id === userId 
          ? { ...user, isFollowing: !user.isFollowing }
          : user
      )
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      default:
        return '➖';
    }
  };

  const filteredTopics = trendingTopics.filter(topic =>
    topic.hashtag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = suggestedUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 min-h-full">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Explore
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search posts, people, hashtags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  addToRecentSearches(searchQuery);
                }
              }}
              className="pl-10 text-lg h-12"
            />
            {isSearching && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          
          {/* Recent Searches */}
          {!searchQuery && recentSearches.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Recent searches:</p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(search);
                      handleSearch(search);
                    }}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-sm rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchQuery && searchResults.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-500">Search results for "{searchQuery}":</p>
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  {result.type === 'hashtag' && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-blue-600 dark:text-blue-400">{result.content}</p>
                        <p className="text-sm text-gray-500">{result.posts} posts • {result.description}</p>
                      </div>
                      <Hash className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  {result.type === 'user' && (
                    <div 
                      className="flex items-center space-x-3 cursor-pointer"
                      onClick={() => router.push(`/user/${result._id}`)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={result.avatar} />
                        <AvatarFallback>{getInitials(result.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold hover:text-blue-600 transition-colors">{result.name}</p>
                        <p className="text-sm text-gray-500">{result.username} • {result.followers} followers</p>
                      </div>
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  {result.type === 'post' && (
                    <div>
                      <p className="text-sm">{result.content}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>by {result.author}</span>
                        <span>❤️ {result.likes}</span>
                        <span>💬 {result.comments}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg overflow-x-auto">
        <button
          onClick={() => setActiveTab('trending')}
          className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'trending'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <TrendingUp className="h-4 w-4 inline mr-2" />
          Trending
        </button>
        <button
          onClick={() => setActiveTab('people')}
          className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'people'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          People
        </button>
        <button
          onClick={() => setActiveTab('topics')}
          className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'topics'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Hash className="h-4 w-4 inline mr-2" />
          Topics
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'events'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Calendar className="h-4 w-4 inline mr-2" />
          Events
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'trending' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trending Hashtags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center">
                  <Hash className="h-5 w-5 mr-2" />
                  Trending Hashtags
                </span>
                <Button variant="outline" size="sm">View All</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTopics.slice(0, 6).map((topic, index) => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                    onClick={() => {
                      setSearchQuery(topic.hashtag);
                      handleSearch(topic.hashtag);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <div>
                        <p className="font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700">{topic.hashtag}</p>
                        <p className="text-sm text-gray-500">{topic.posts} posts</p>
                      </div>
                    </div>
                    <span className="text-lg">{getTrendIcon(topic.trend)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Popular Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Popular Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                  <p className="font-medium text-blue-800 dark:text-blue-200">Technology</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">234K posts</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                  <p className="font-medium text-green-800 dark:text-green-200">Design</p>
                  <p className="text-sm text-green-600 dark:text-green-400">189K posts</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                  <p className="font-medium text-purple-800 dark:text-purple-200">Business</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">156K posts</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                  <p className="font-medium text-orange-800 dark:text-orange-200">Lifestyle</p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">134K posts</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                  <p className="font-medium text-red-800 dark:text-red-200">Entertainment</p>
                  <p className="text-sm text-red-600 dark:text-red-400">198K posts</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                  <p className="font-medium text-indigo-800 dark:text-indigo-200">Education</p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400">112K posts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'people' && (
        <div className="space-y-6">
          {/* Suggested Users Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Suggested for you</h2>
            <Button variant="outline" size="sm">Refresh</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.map((user) => (
              <Card 
                key={user._id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/user/${user._id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={`https://avatar.vercel.sh/${user.name}`} />
                      <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">{user.name}</h3>
                      <p className="text-gray-500">{user.username ? `@${user.username}` : ''}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {user.followersCount} followers
                        </span>
                      </div>
                    </div>
                    <Button
                      variant={user.isFollowing ? "outline" : "default"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click when clicking follow button
                        handleFollow(user._id);
                      }}
                      className={user.isFollowing ? "border-blue-300 text-blue-600 hover:bg-blue-50" : ""}
                    >
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'topics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Topics</h2>
            <Button variant="outline" size="sm">See Trending</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingTopics.map((topic, index) => (
              <Card key={topic.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSearchQuery(topic.hashtag);
                      handleSearch(topic.hashtag);
                    }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Hash className="h-6 w-6 text-blue-500" />
                    <span className="text-lg">{getTrendIcon(topic.trend)}</span>
                  </div>
                  <h3 className="font-semibold text-lg text-blue-600 dark:text-blue-400 mb-1">{topic.hashtag}</h3>
                  <p className="text-sm text-gray-500 mb-2">{topic.posts} posts</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Rank #{index + 1}</span>
                    <span className={`px-2 py-1 rounded-full ${
                      topic.trend === 'up' ? 'bg-green-100 text-green-800' :
                      topic.trend === 'down' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {topic.trend === 'up' ? 'Rising' : topic.trend === 'down' ? 'Falling' : 'Stable'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upcoming Events</h2>
            <Button variant="outline" size="sm">Create Event</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Tech Conference 2025</h4>
                      <p className="text-sm text-gray-500">Technology • Conference</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Interested</Button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Join leading tech professionals for a day of innovation, networking, and insights into the future of technology.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    August 15, 2025 • 9:00 AM - 6:00 PM
                  </p>
                  <p className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    San Francisco Convention Center
                  </p>
                  <p className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    1,250 attending
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Design Workshop</h4>
                      <p className="text-sm text-gray-500">Design • Workshop</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Interested</Button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Hands-on workshop covering modern design principles, tools, and techniques for digital products.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    August 20, 2025 • 2:00 PM - 5:00 PM
                  </p>
                  <p className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Online Event
                  </p>
                  <p className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    487 attending
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Startup Pitch Night</h4>
                      <p className="text-sm text-gray-500">Business • Networking</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Interested</Button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Watch innovative startups pitch their ideas to investors and industry experts.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    August 25, 2025 • 7:00 PM - 10:00 PM
                  </p>
                  <p className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Innovation Hub, Austin TX
                  </p>
                  <p className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    329 attending
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">AI & Machine Learning Summit</h4>
                      <p className="text-sm text-gray-500">AI • Conference</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Interested</Button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Explore the latest developments in artificial intelligence and machine learning technologies.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    September 5, 2025 • 9:00 AM - 7:00 PM
                  </p>
                  <p className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    MIT Campus, Boston MA
                  </p>
                  <p className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    892 attending
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

    </div>
  );
}

// Loading component for Suspense fallback
function ExplorePageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4 max-w-md"></div>
        <div className="h-12 bg-gray-200 rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function ExplorePage() {
  return (
    <Suspense fallback={<ExplorePageLoading />}>
      <ExplorePageContent />
    </Suspense>
  );
}
