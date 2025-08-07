import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface ChatUnreadCount {
  chatId: string;
  unreadCount: number;
  chat: any;
}

interface UseUnreadMessagesResult {
  totalUnreadCount: number;
  chatUnreadCounts: ChatUnreadCount[];
  chatsWithUnread: any[];
  isLoading: boolean;
  error: string | null;
  refreshUnreadCounts: () => Promise<void>;
  markChatAsRead: (chatId: string) => Promise<void>;
}

export const useUnreadMessages = (): UseUnreadMessagesResult => {
  const { data: session } = useSession();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [chatUnreadCounts, setChatUnreadCounts] = useState<ChatUnreadCount[]>([]);
  const [chatsWithUnread, setChatsWithUnread] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCounts = useCallback(async () => {
    if (!session?.user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chats/unread');
      
      if (!response.ok) {
        throw new Error('Failed to fetch unread counts');
      }

      const data = await response.json();
      
      setTotalUnreadCount(data.totalUnreadCount || 0);
      setChatUnreadCounts(data.chatUnreadCounts || []);
      setChatsWithUnread(data.chats || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch unread counts';
      setError(errorMessage);
      console.error('Error fetching unread counts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const markChatAsRead = useCallback(async (chatId: string) => {
    if (!session?.user) return;

    try {
      const response = await fetch(`/api/chats/${chatId}/read`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to mark chat as read');
      }

      // Update local state immediately for better UX
      setChatUnreadCounts(prev => 
        prev.map(chat => 
          chat.chatId === chatId 
            ? { ...chat, unreadCount: 0 }
            : chat
        )
      );

      setChatsWithUnread(prev =>
        prev.map(chat =>
          chat._id === chatId
            ? { ...chat, unreadCount: 0 }
            : chat
        )
      );

      // Recalculate total unread count
      setTotalUnreadCount(prev => {
        const chatUnread = chatUnreadCounts.find(c => c.chatId === chatId);
        return Math.max(0, prev - (chatUnread?.unreadCount || 0));
      });

      console.log(`✅ Marked chat ${chatId} as read`);
    } catch (err) {
      console.error('Error marking chat as read:', err);
      throw err;
    }
  }, [session, chatUnreadCounts]);

  const refreshUnreadCounts = useCallback(async () => {
    await fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  // Fetch unread counts on mount and when session changes
  useEffect(() => {
    if (session?.user) {
      fetchUnreadCounts();
    }
  }, [session, fetchUnreadCounts]);

  // Set up enhanced real-time polling for notifications
  useEffect(() => {
    if (!session?.user) return;

    let pollInterval: NodeJS.Timeout;
    let fastPollInterval: NodeJS.Timeout;
    let lastActivity = Date.now();
    let isPollingActive = true;

    // Track user activity for adaptive polling
    const updateActivity = () => {
      lastActivity = Date.now();
    };

    // Enhanced adaptive polling strategy
    const getPollingInterval = () => {
      const timeSinceActivity = Date.now() - lastActivity;
      
      if (timeSinceActivity < 60000) { // 1 minute
        return 5000; // 5 seconds for very active users
      } else if (timeSinceActivity < 300000) { // 5 minutes
        return 15000; // 15 seconds for recently active users
      } else if (timeSinceActivity < 1800000) { // 30 minutes
        return 30000; // 30 seconds for idle users
      } else {
        return 60000; // 1 minute for very idle users
      }
    };

    const startAdaptivePolling = () => {
      if (!isPollingActive) return;

      const scheduleNextPoll = () => {
        if (!isPollingActive) return;
        
        const interval = getPollingInterval();
        pollInterval = setTimeout(async () => {
          try {
            // Only poll if tab is visible and user is active
            if (!document.hidden && isPollingActive) {
              console.log(`🔔 Polling unread counts (interval: ${interval/1000}s)`);
              await fetchUnreadCounts();
            }
          } catch (error) {
            console.error('❌ Error in unread polling:', error);
          }
          
          scheduleNextPoll(); // Schedule next poll
        }, interval);
      };

      scheduleNextPoll();
    };

    // Start fast polling when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden - stop all polling
        if (pollInterval) clearTimeout(pollInterval);
        if (fastPollInterval) clearTimeout(fastPollInterval);
        console.log('🔕 Tab hidden - stopping unread polling');
      } else if (session?.user && isPollingActive) {
        // Tab visible - start immediate fetch and resume polling
        console.log('👁️ Tab visible - fetching unread counts immediately');
        updateActivity();
        fetchUnreadCounts();
        
        // Fast polling for first 30 seconds after becoming visible
        let fastPollCount = 0;
        const maxFastPolls = 6; // 6 x 5s = 30 seconds
        
        fastPollInterval = setInterval(() => {
          if (fastPollCount >= maxFastPolls || document.hidden) {
            clearInterval(fastPollInterval);
            startAdaptivePolling(); // Switch to adaptive polling
            return;
          }
          
          console.log('⚡ Fast polling unread counts');
          fetchUnreadCounts();
          fastPollCount++;
        }, 5000); // Fast poll every 5 seconds initially
      }
    };

    // Track user activity events
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Start initial polling if tab is visible
    if (!document.hidden) {
      updateActivity();
      fetchUnreadCounts();
      startAdaptivePolling();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isPollingActive = false;
      if (pollInterval) clearTimeout(pollInterval);
      if (fastPollInterval) clearTimeout(fastPollInterval);
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      console.log('🧹 Unread messages polling cleanup completed');
    };
  }, [session, fetchUnreadCounts]);

  return {
    totalUnreadCount,
    chatUnreadCounts,
    chatsWithUnread,
    isLoading,
    error,
    refreshUnreadCounts,
    markChatAsRead,
  };
};
