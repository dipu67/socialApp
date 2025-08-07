"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from './useSocket';

interface Message {
  _id: string;
  content: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  chatId: string;
  messageType: "text" | "image" | "video" | "file";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyTo?: string;
  reactions: Array<{
    emoji: string;
    users: Array<{
      _id: string;
      name: string;
      email: string;
    }>;
  }>;
  readBy: Array<{
    userId: string;
    readAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface UseRealtimeChatResult {
  messages: Message[];
  sendMessage: (content: string, file?: File) => Promise<boolean>;
  addReaction: (messageId: string, emoji: string) => Promise<boolean>;
  startTyping: () => void;
  stopTyping: () => void;
  typingUsers: string[];
  isConnected: boolean;
  error: string | null;
  refreshMessages: () => Promise<void>;
}

export const useRealtimeChat = (chatId: string | null): UseRealtimeChatResult => {
  const { data: session } = useSession();
  const { socket, isConnected, joinChat, leaveChat, sendMessage: socketSendMessage, startTyping: socketStartTyping, stopTyping: socketStopTyping } = useSocket();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPollingFallback, setIsPollingFallback] = useState(false);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentChatRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Join/leave chat rooms when chatId changes
  useEffect(() => {
    if (!chatId || !session?.user) return;

    // Only join if we're not already in this chat
    if (currentChatRef.current !== chatId) {
      // Leave previous chat
      if (currentChatRef.current) {
        leaveChat(currentChatRef.current);
      }

      // Join new chat
      joinChat(chatId);
      currentChatRef.current = chatId;

      // Initial fetch of messages (only once per chat)
      fetchMessages(chatId);
    }

    return () => {
      if (currentChatRef.current) {
        leaveChat(currentChatRef.current);
        currentChatRef.current = null;
      }
    };
  }, [chatId, session?.user]); // Removed joinChat, leaveChat from dependencies to prevent re-runs

  // Setup real-time listeners
  useEffect(() => {
    if (!socket || !chatId) return;

    console.log('🎧 Setting up real-time listeners for chat:', chatId);

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      console.log('📨 Received new message via socket:', data);
      // Only refresh if it's not from the current user
      if (data.userEmail !== session?.user?.email) {
        // Debounce message fetching to avoid rapid API calls
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        fetchTimeoutRef.current = setTimeout(() => {
          fetchMessages(chatId);
        }, 500); // Wait 500ms before fetching
      }
    };

    // Listen for typing indicators
    const handleUserTyping = (data: any) => {
      if (data.userEmail !== session?.user?.email) {
        setTypingUsers(prev => {
          if (!prev.includes(data.userEmail)) {
            return [...prev, data.userEmail];
          }
          return prev;
        });
      }
    };

    const handleUserStoppedTyping = (data: any) => {
      setTypingUsers(prev => prev.filter(email => email !== data.userEmail));
    };

    // Listen for reactions
    const handleReactionAdded = (data: any) => {
      console.log('😀 Received reaction via socket:', data);
      // Refresh messages to get updated reactions
      fetchMessages(chatId);
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('userTyping', handleUserTyping);
    socket.on('userStoppedTyping', handleUserStoppedTyping);
    socket.on('reactionAdded', handleReactionAdded);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('userTyping', handleUserTyping);
      socket.off('userStoppedTyping', handleUserStoppedTyping);
      socket.off('reactionAdded', handleReactionAdded);
    };
  }, [socket, chatId, session?.user?.email]);

  // Fallback polling when socket is not connected
  useEffect(() => {
    if (!chatId || !session?.user) return;

    if (!isConnected) {
      console.log('🔄 Socket not connected, starting fallback polling');
      setIsPollingFallback(true);
      
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(chatId);
      }, 5000); // Poll every 5 seconds
    } else {
      console.log('✅ Socket connected, stopping fallback polling');
      setIsPollingFallback(false);
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isConnected, chatId, session?.user]);

  const fetchMessages = useCallback(async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setError(null);
      } else {
        throw new Error('Failed to fetch messages');
      }
    } catch (err) {
      console.error('❌ Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    }
  }, []);

  const sendMessage = useCallback(async (content: string, file?: File): Promise<boolean> => {
    if (!chatId || !session?.user) return false;

    try {
      const messageData: any = {
        content,
        messageType: file
          ? file.type.startsWith("image/")
            ? "image"
            : file.type.startsWith("video/")
            ? "video"
            : "file"
          : "text",
      };

      if (file) {
        // Send file message via API
        const formData = new FormData();
        formData.append("file", file);
        formData.append("content", content);
        formData.append("messageType", messageData.messageType);

        const response = await fetch(`/api/chats/${chatId}/messages`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          
          // Add message locally immediately
          setMessages((prev) => [...prev, data.message]);
          
          // Send via socket to notify others
          if (socket && isConnected) {
            socketSendMessage(chatId, {
              content: data.message.content,
              messageType: data.message.messageType,
              messageId: data.message._id
            });
          }
          
          return true;
        }
      } else {
        // Send text message via API
        const response = await fetch(`/api/chats/${chatId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messageData),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Add message locally immediately
          setMessages((prev) => [...prev, data.message]);
          
          // Send via socket to notify others
          if (socket && isConnected) {
            socketSendMessage(chatId, {
              content: data.message.content,
              messageType: data.message.messageType,
              messageId: data.message._id
            });
          }
          
          return true;
        }
      }
      
      return false;
    } catch (err) {
      console.error('❌ Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  }, [chatId, session?.user, socket, isConnected, socketSendMessage]);

  const addReaction = useCallback(async (messageId: string, emoji: string): Promise<boolean> => {
    if (!chatId) return false;

    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emoji }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update message reactions locally
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId
              ? { ...msg, reactions: data.message.reactions }
              : msg
          )
        );

        // Send via socket to notify others
        if (socket && isConnected) {
          socket.emit('addReaction', {
            chatId,
            messageId,
            emoji
          });
        }

        return true;
      }
      return false;
    } catch (err) {
      console.error('❌ Error adding reaction:', err);
      return false;
    }
  }, [chatId, socket, isConnected]);

  const stopTyping = useCallback(() => {
    if (!chatId || !socket || !isConnected) return;

    socketStopTyping(chatId);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [chatId, socket, isConnected, socketStopTyping]);

  const startTyping = useCallback(() => {
    if (!chatId || !socket || !isConnected) return;

    socketStartTyping(chatId);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [chatId, socket, isConnected, socketStartTyping, stopTyping]);

  const refreshMessages = useCallback(async () => {
    if (chatId) {
      await fetchMessages(chatId);
    }
  }, [chatId, fetchMessages]);

  return {
    messages,
    sendMessage,
    addReaction,
    startTyping,
    stopTyping,
    typingUsers,
    isConnected: isConnected && !isPollingFallback,
    error,
    refreshMessages
  };
};
