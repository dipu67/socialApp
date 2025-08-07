import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Google Analytics 4 integration
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// Page view tracking
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Event tracking
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Custom hook for analytics tracking
export const useAnalytics = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (GA_TRACKING_ID) {
      const url = pathname + searchParams.toString();
      pageview(url);
    }
  }, [pathname, searchParams]);

  return {
    trackEvent: event,
    trackPageView: pageview,
  };
};

// Chat-specific analytics events
export const trackChatEvents = {
  messagesSent: (chatId: string) => {
    event({
      action: 'message_sent',
      category: 'chat',
      label: chatId,
    });
  },
  
  chatJoined: (chatId: string) => {
    event({
      action: 'chat_joined',
      category: 'chat',
      label: chatId,
    });
  },
  
  chatCreated: () => {
    event({
      action: 'chat_created',
      category: 'chat',
    });
  },
  
  reactionAdded: (reactionType: string) => {
    event({
      action: 'reaction_added',
      category: 'engagement',
      label: reactionType,
    });
  },
};

// Social features analytics
export const trackSocialEvents = {
  postCreated: () => {
    event({
      action: 'post_created',
      category: 'content',
    });
  },
  
  postLiked: (postId: string) => {
    event({
      action: 'post_liked',
      category: 'engagement',
      label: postId,
    });
  },
  
  postShared: (postId: string) => {
    event({
      action: 'post_shared',
      category: 'sharing',
      label: postId,
    });
  },
  
  userFollowed: (userId: string) => {
    event({
      action: 'user_followed',
      category: 'social',
      label: userId,
    });
  },
  
  profileViewed: (userId: string) => {
    event({
      action: 'profile_viewed',
      category: 'engagement',
      label: userId,
    });
  },
};

// Performance tracking
export const trackPerformance = {
  connectionTime: (duration: number) => {
    event({
      action: 'connection_time',
      category: 'performance',
      value: duration,
    });
  },
  
  messageLatency: (duration: number) => {
    event({
      action: 'message_latency',
      category: 'performance',
      value: duration,
    });
  },
  
  pageLoadTime: (duration: number) => {
    event({
      action: 'page_load_time',
      category: 'performance',
      value: duration,
    });
  },
};

// Error tracking
export const trackErrors = {
  socketError: (error: string) => {
    event({
      action: 'socket_error',
      category: 'error',
      label: error,
    });
  },
  
  apiError: (endpoint: string, status: number) => {
    event({
      action: 'api_error',
      category: 'error',
      label: `${endpoint}_${status}`,
    });
  },
  
  authError: (error: string) => {
    event({
      action: 'auth_error',
      category: 'error',
      label: error,
    });
  },
};

// User engagement tracking
export const trackEngagement = {
  sessionStart: () => {
    event({
      action: 'session_start',
      category: 'engagement',
    });
  },
  
  sessionEnd: (duration: number) => {
    event({
      action: 'session_end',
      category: 'engagement',
      value: duration,
    });
  },
  
  featureUsed: (feature: string) => {
    event({
      action: 'feature_used',
      category: 'engagement',
      label: feature,
    });
  },
  
  searchPerformed: (query: string) => {
    event({
      action: 'search_performed',
      category: 'engagement',
      label: query.length > 0 ? 'with_query' : 'empty_query',
    });
  },
};
