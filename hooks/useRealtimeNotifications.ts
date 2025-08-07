import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface RealtimeNotification {
  id: string;
  type: 'message' | 'reaction' | 'chat_update' | 'user_status';
  chatId?: string;
  userId?: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface UseRealtimeNotificationsResult {
  notifications: RealtimeNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<RealtimeNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export const useRealtimeNotifications = (): UseRealtimeNotificationsResult => {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPollRef = useRef<number>(0);

  // Enhanced real-time polling with exponential backoff (DISABLED - using Socket.IO instead)
  const startRealtimePolling = useCallback(() => {
    // Disabled polling since we're using Socket.IO for real-time functionality
    console.log('🔌 Real-time notifications disabled - using Socket.IO instead');
    setConnectionStatus('connected');
    setIsConnected(true);
    return;
    
    if (!session?.user || pollingIntervalRef.current) return;

    let pollInterval = 3000; // Start with 3 second polling
    let consecutiveErrors = 0;
    const maxInterval = 30000; // Max 30 seconds
    const baseInterval = 3000;

    const poll = async () => {
      try {
        setConnectionStatus('connecting');
        
        // Poll for new messages/updates
        const response = await fetch('/api/notifications/poll', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Reset polling interval on success
          pollInterval = baseInterval;
          consecutiveErrors = 0;
          setIsConnected(true);
          setConnectionStatus('connected');
          lastPollRef.current = Date.now();

          // Process any new notifications
          if (data.notifications && data.notifications.length > 0) {
            setNotifications(prev => {
              const existingIds = new Set(prev.map(n => n.id));
              const newNotifications = data.notifications.filter((n: RealtimeNotification) => !existingIds.has(n.id));
              
              if (newNotifications.length > 0) {
                console.log('🔔 New real-time notifications:', newNotifications.length);
              }
              
              return [...prev, ...newNotifications];
            });
          }
        } else {
          throw new Error(`Polling failed: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Real-time polling error:', error);
        consecutiveErrors++;
        setIsConnected(false);
        setConnectionStatus('error');
        
        // Exponential backoff
        pollInterval = Math.min(baseInterval * Math.pow(2, consecutiveErrors), maxInterval);
        console.log(`⏰ Retrying in ${pollInterval/1000}s (attempt ${consecutiveErrors})`);
      }

      // Schedule next poll
      pollingIntervalRef.current = setTimeout(poll, pollInterval);
    };

    // Start polling
    poll();
  }, [session]);

  // Stop polling
  const stopRealtimePolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  // Add notification manually
  const addNotification = useCallback((notification: Omit<RealtimeNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: RealtimeNotification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 100)); // Keep last 100 notifications
    console.log('➕ Added real-time notification:', newNotification.type);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle visibility changes (DISABLED - using Socket.IO)
  useEffect(() => {
    // Disabled since we're using Socket.IO for real-time functionality
    return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('🔕 Tab hidden - pausing real-time notifications');
        stopRealtimePolling();
      } else if (session?.user) {
        console.log('👁️ Tab visible - resuming real-time notifications');
        startRealtimePolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, startRealtimePolling, stopRealtimePolling]);

  // Start/stop polling based on session (DISABLED - using Socket.IO)
  useEffect(() => {
    // Disabled polling since we're using Socket.IO for real-time functionality
    console.log('🔌 Real-time notifications polling disabled - using Socket.IO');
    setConnectionStatus('connected');
    setIsConnected(true);
    return;
    
    if (session?.user && !document.hidden) {
      startRealtimePolling();
    } else {
      stopRealtimePolling();
    }

    return () => {
      stopRealtimePolling();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [session, startRealtimePolling, stopRealtimePolling]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    isConnected,
    connectionStatus,
  };
};
