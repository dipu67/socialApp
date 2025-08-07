"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatList, ChatWindow, CreateChatModal } from "@/components/chat";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { RealtimeToast, useRealtimeToast } from "@/components/ui/realtime-toast";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Search, Plus, ArrowLeft, Wifi, WifiOff } from "lucide-react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface Chat {
  _id: string;
  groupName?: string;
  groupDescription?: string;
  groupAvatar?: string;
  isGroupChat: boolean;
  participants: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
  admin?: {
    _id: string;
    name: string;
    email: string;
  };
  moderators?: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  lastMessage?: {
    content?: string;
    senderId: string;
    createdAt: string;
    messageType?: "text" | "image" | "video" | "file";
  };
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

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

function ChatPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Use real-time chat hook for selected chat
  const {
    messages,
    sendMessage: realtimeSendMessage,
    addReaction: realtimeAddReaction,
    startTyping,
    stopTyping,
    typingUsers,
    isConnected: chatConnected,
    error: chatError,
    refreshMessages
  } = useRealtimeChat(selectedChat?._id || null);
  
  // Use unread messages hook
  const { 
    totalUnreadCount, 
    chatsWithUnread, 
    markChatAsRead, 
    refreshUnreadCounts 
  } = useUnreadMessages();

  // Use real-time notifications for enhanced updates (disabled since we're using Socket.IO now)
  const {
    isConnected: notificationsConnected,
    connectionStatus,
    addNotification
  } = useRealtimeNotifications();

  // Use real-time toast notifications
  const { 
    toasts, 
    removeToast, 
    showSuccess, 
    showError, 
    showInfo, 
    showMessage 
  } = useRealtimeToast();

  // Monitor connection status changes (silent monitoring)
  useEffect(() => {
    let previousConnectionStatus = connectionStatus;
    
    if (previousConnectionStatus !== connectionStatus) {
      // Log connection changes for debugging
      console.log(`🔄 Connection status changed: ${previousConnectionStatus} → ${connectionStatus}`);
    }
  }, [connectionStatus]);

  // Display chat connection status
  useEffect(() => {
    if (chatError) {
      console.error('Chat error:', chatError);
    }
  }, [chatError]);

  // Check if we're on mobile and have a selected chat
  const isMobileWithChat = selectedChat !== null;

  // Handle chat selection
  const handleSelectChat = async (chat: Chat | null) => {
    setSelectedChat(chat);
    
    if (chat) {
      // Mark chat as read when selected
      try {
        await markChatAsRead(chat._id);
      } catch (error) {
        console.error('Error marking chat as read:', error);
      }
      
      // On mobile, we want to show the chat window and hide the sidebar
      const params = new URLSearchParams(searchParams.toString());
      params.set("chatId", chat._id);
      router.push(`/chat?${params.toString()}`);
    } else {
      // Show the sidebar again - use push to ensure proper back navigation
      router.push('/chat');
    }
  };

  // Fetch chats
  useEffect(() => {
    if (session?.user) {
      fetchChats();
    }
  }, [session]);

  // Merge chats with unread counts when available
  useEffect(() => {
    if (chatsWithUnread.length > 0) {
      setChats(chatsWithUnread);
    }
  }, [chatsWithUnread]);

  // Handle URL parameters
  useEffect(() => {
    const chatId = searchParams.get("chatId");
    if (chatId && chats.length > 0) {
      const chat = chats.find((c) => c._id === chatId);
      if (chat && chat._id !== selectedChat?._id) {
        setSelectedChat(chat);
      }
    } else if (!chatId && selectedChat) {
      setSelectedChat(null);
    }
  }, [searchParams, chats, selectedChat]);

  // Initial fetch of messages when chat is selected (real-time chat hook handles this)
  // The useRealtimeChat hook automatically handles message fetching

  // Handle browser back button for mobile
  useEffect(() => {
    const handlePopstate = (event: PopStateEvent) => {
      // Check if we're navigating back from a chat to the chat list
      const currentPath = window.location.pathname;
      const hasChat = window.location.search.includes('chatId=');
      
      if (currentPath === '/chat' && !hasChat && selectedChat) {
        // User pressed back from a chat to the chat list
        setSelectedChat(null);
      }
    };

    window.addEventListener('popstate', handlePopstate);
    
    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      const response = await fetch("/api/chats");
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    // This function is now handled by the useRealtimeChat hook
    // Keeping for backwards compatibility but not used
    console.log("fetchMessages called but now handled by useRealtimeChat hook");
  };

  const handleSendMessage = async (content: string, file?: File) => {
    if (!selectedChat) return;

    try {
      const success = await realtimeSendMessage(content, file);
      
      if (success) {
        // Update the chat list with the new message
        setChats((prev) =>
          prev.map((chat) =>
            chat._id === selectedChat._id
              ? {
                  ...chat,
                  lastMessage: {
                    content: content || "",
                    senderId: session?.user?.email || "",
                    createdAt: new Date().toISOString(),
                    messageType: file
                      ? file.type.startsWith("image/")
                        ? "image"
                        : file.type.startsWith("video/")
                        ? "video"
                        : "file"
                      : "text",
                  },
                }
              : chat
          )
        );
        
        // Refresh unread counts after sending a message
        refreshUnreadCounts();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await realtimeAddReaction(messageId, emoji);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (isTyping) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleCreateChat = async (chatData: any) => {
    setLoading(true);
    try {
      if (chatData.isGroupChat && !chatData.name?.trim()) {
        throw new Error("Group name is required");
      }

      if (!chatData.participants || chatData.participants.length === 0) {
        throw new Error("Please select at least one participant");
      }

      if (chatData.isGroupChat && chatData.participants.length < 2) {
        throw new Error("Group chat requires at least 2 participants");
      }

      if (!chatData.isGroupChat && chatData.participants.length !== 1) {
        throw new Error("Direct chat requires exactly one participant");
      }

      const requestData = {
        isGroupChat: chatData.isGroupChat,
        participantIds: chatData.participants,
        ...(chatData.isGroupChat && {
          groupName: chatData.name?.trim(),
          groupDescription: chatData.description?.trim(),
        }),
      };

      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create chat");
      }

      setChats((prev) => [data.chat, ...prev]);
      setSelectedChat(data.chat);
      setIsCreateModalOpen(false);

      console.log("Chat created successfully:", data.chat);
    } catch (error: any) {
      console.error("Error creating chat:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();

    // Search in chat name (for group chats)
    if (chat.groupName && chat.groupName.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Search in participant names
    return chat.participants.some(
      (participant) =>
        participant.name.toLowerCase().includes(searchLower) ||
        participant.email.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading conversations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      style={{ height: "100dvh" }}
    >
      {/* Mobile Layout */}
      <div className="flex w-full md:hidden mobile-fullscreen">
        {!isMobileWithChat ? (
          // Mobile Chat List View
          <div
            className="flex flex-col w-full bg-white dark:bg-gray-800 shadow-lg"
            style={{ height: "100dvh" }}
          >
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold">Messages</h1>
                  {/* Real-time status indicator */}
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    {chatConnected ? (
                      <>
                        <Wifi className="h-3 w-3" />
                        <span>Real-time</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3" />
                        <span>Polling</span>
                      </>
                    )}
                    <div 
                      className={`w-1.5 h-1.5 rounded-full ${
                        chatConnected 
                          ? 'bg-green-400' 
                          : 'bg-yellow-400 animate-pulse'
                      }`} 
                    />
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              <ChatList
                chats={filteredChats}
                selectedChat={selectedChat}
                onSelectChat={handleSelectChat}
                currentUserId={session?.user?.email || undefined}
              />
            </div>
          </div>
        ) : (
          // Mobile Chat Window View
          <div
            className="flex flex-col w-full chat-container"
            style={{ height: "100dvh" }}
          >
            <ChatWindow
              chat={selectedChat}
              messages={messages}
              onSendMessage={handleSendMessage}
              onReaction={handleReaction}
              onTyping={handleTyping}
              typingUsers={typingUsers}
              currentUserId={session?.user?.email || undefined}
              onBackClick={() => handleSelectChat(null)}
            />
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex w-full">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col m-0 p-0">
          {selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              messages={messages}
              onSendMessage={handleSendMessage}
              onReaction={handleReaction}
              onTyping={handleTyping}
              typingUsers={typingUsers}
              currentUserId={session?.user?.email || undefined}
              onBackClick={() => handleSelectChat(null)}
            />
          ) : (
            // Welcome Screen
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md space-y-8">
                <div className="relative mb-8">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-full flex items-center justify-center shadow-2xl">
                    <MessageCircle className="h-16 w-16 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Welcome to Chat
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                  Select a conversation to start messaging, or create a new chat
                  to connect with friends and colleagues.
                </p>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transform transition-all duration-200 hover:scale-105"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Start New Conversation
                </Button>
              </div>
            </div>
          )}
        </div>
        {/* Sidebar */}
        <div className="w-80 lg:w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-lg">
          {/* Desktop Header */}
          <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <MessageCircle className="h-7 w-7" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold">Messages</h1>
                  {/* Real-time stats */}
                  <div className="flex items-center gap-3 text-xs text-white/80">
                    <div className="flex items-center gap-1">
                      {chatConnected ? (
                        <Wifi className="h-3 w-3" />
                      ) : (
                        <WifiOff className="h-3 w-3" />
                      )}
                      <span>{chatConnected ? 'Real-time' : 'Polling'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>•</span>
                      <span>{totalUnreadCount} unread</span>
                    </div>
                    <div 
                      className={`w-1.5 h-1.5 rounded-full ${
                        chatConnected 
                          ? 'bg-green-400' 
                          : 'bg-yellow-400 animate-pulse'
                      }`} 
                    />
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0 transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Chat
              </Button>
            </div>

            {/* Desktop Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            <ChatList
              chats={filteredChats}
              selectedChat={selectedChat}
              onSelectChat={handleSelectChat}
              currentUserId={session?.user?.email || undefined}
            />
          </div>
        </div>
      </div>

      {/* Create Chat Modal */}
      <CreateChatModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateChat={handleCreateChat}
      />

      {/* Real-time Toast Notifications */}
      <RealtimeToast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

// Loading component for Suspense fallback
function ChatPageLoading() {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/3 bg-white border-r border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading chat...</div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ChatPageContent />
    </Suspense>
  );
}
