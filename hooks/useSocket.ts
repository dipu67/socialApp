"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import io, { Socket } from 'socket.io-client';

interface UseSocketResult {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (chatId: string, message: any) => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
}

export const useSocket = (): UseSocketResult => {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!session?.user) {
      console.log('🔌 No session, skipping socket connection');
      return;
    }

    console.log('🔌 Initializing socket connection...');

    // Create socket connection
    const socketInstance = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000', {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: session.user.email // We'll use email as auth for now
      }
    });

    socketRef.current = socketInstance;

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
      setIsConnected(true);
      setError(null);
      setSocket(socketInstance);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      setSocket(null);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, need to reconnect manually
        socketInstance.connect();
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔥 Socket connection error:', error);
      setError(error.message);
      setIsConnected(false);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setError(null);
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('🔥 Socket reconnection error:', error);
      setError(error.message);
    });

    return () => {
      console.log('🧹 Cleaning up socket connection');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [session?.user]);

  const joinChat = useCallback((chatId: string) => {
    if (socket && isConnected) {
      console.log('🏠 Joining chat:', chatId);
      socket.emit('joinChat', chatId);
    }
  }, [socket, isConnected]);

  const leaveChat = useCallback((chatId: string) => {
    if (socket && isConnected) {
      console.log('🚪 Leaving chat:', chatId);
      socket.emit('leaveChat', chatId);
    }
  }, [socket, isConnected]);

  const sendMessage = useCallback((chatId: string, message: any) => {
    if (socket && isConnected) {
      console.log('📤 Sending message via socket:', { chatId, message });
      socket.emit('sendMessage', {
        chatId,
        ...message,
        timestamp: new Date().toISOString()
      });
    }
  }, [socket, isConnected]);

  const startTyping = useCallback((chatId: string) => {
    if (socket && isConnected) {
      socket.emit('startTyping', chatId);
    }
  }, [socket, isConnected]);

  const stopTyping = useCallback((chatId: string) => {
    if (socket && isConnected) {
      socket.emit('stopTyping', chatId);
    }
  }, [socket, isConnected]);

  return {
    socket,
    isConnected,
    error,
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping
  };
};
