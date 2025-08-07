'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Users, TrendingUp, RefreshCw } from 'lucide-react';

interface ViewAnalyticsProps {
  postId: string;
}

interface AnalyticsData {
  postId: string;
  totalViews: number;
  uniqueViewers: number;
  recentViews: number;
  postViews: number;
}

export default function PostViewAnalytics({ postId }: ViewAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${postId}/view`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchAnalytics();
    }
  }, [postId]);

  if (!analytics) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold">View Analytics</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnalytics}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total Views</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{analytics.totalViews}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Unique Viewers</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{analytics.uniqueViewers}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Recent Views</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{analytics.recentViews}</p>
            <p className="text-xs text-gray-500">Last 7 days</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Post Views</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{analytics.postViews}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
