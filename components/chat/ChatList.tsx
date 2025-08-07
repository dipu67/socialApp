"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RealtimeBadge } from "@/components/ui/realtime-badge";
import { Users, MessageCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  currentUserId?: string;
}

export default function ChatList({ chats, selectedChat, onSelectChat, currentUserId }: ChatListProps) {
  const getChatDisplayName = (chat: Chat) => {
    if (chat.isGroupChat) {
      return chat.groupName || "Group Chat";
    }
    
    // For direct messages, show the other participant's name
    const otherParticipant = chat.participants.find(p => p.email !== currentUserId);
    return otherParticipant?.name || "Unknown User";
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.isGroupChat) {
      return chat.groupAvatar || null; // Return group avatar or null for group icon
    }
    
    const otherParticipant = chat.participants.find(p => p.email !== currentUserId);
    return otherParticipant?.avatar;
  };

  const formatLastMessageTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "";
    }
  };

  const truncateMessage = (message: string | undefined | null, maxLength: number = 50) => {
    if (!message || typeof message !== 'string') return "";
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  const getLastMessageDisplay = (chat: Chat) => {
    if (!chat.lastMessage) {
      return "No messages yet";
    }

    const { content, senderId, messageType } = chat.lastMessage;
    
    // Handle different message types
    let messagePreview = "";
    if (messageType === "image") {
      messagePreview = "📷 Photo";
    } else if (messageType === "video") {
      messagePreview = "🎥 Video";
    } else if (messageType === "file") {
      messagePreview = "📎 File";
    } else {
      messagePreview = content || "";
    }
    
    if (chat.isGroupChat) {
      // For group chats, show sender name
      const sender = chat.participants.find(p => p._id === senderId);
      const senderName = sender?.name || "Someone";
      const isCurrentUser = sender?.email === currentUserId;
      
      if (isCurrentUser) {
        return `You: ${truncateMessage(messagePreview, 35)}`;
      } else {
        return `${senderName}: ${truncateMessage(messagePreview, 30)}`;
      }
    } else {
      // For direct chats, just show the message content
      return truncateMessage(messagePreview);
    }
  };

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
          No conversations yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Start a new conversation to get started
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => {
          const isSelected = selectedChat?._id === chat._id;
          const displayName = getChatDisplayName(chat);
          const avatarUrl = getChatAvatar(chat);
          
          return (
            <div
              key={chat._id}
              onClick={() => onSelectChat(chat)}
              className={`flex items-center p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                isSelected 
                  ? "bg-blue-50 dark:bg-blue-900/30 border-r-4 border-r-blue-500" 
                  : ""
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0 mr-3">
                {chat.isGroupChat ? (
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                    {chat.groupAvatar ? (
                      <img
                        src={chat.groupAvatar}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="h-6 w-6 text-white" />
                    )}
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-lg">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Online indicator (you can implement this based on your online status logic) */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-semibold truncate ${
                    isSelected 
                      ? "text-blue-700 dark:text-blue-300" 
                      : "text-gray-900 dark:text-gray-100"
                  }`}>
                    {displayName}
                  </h3>
                  
                  {chat.lastMessage && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center ml-2">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatLastMessageTime(chat.lastMessage.createdAt)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate ${
                    isSelected 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-gray-600 dark:text-gray-400"
                  }`}>
                    {getLastMessageDisplay(chat)}
                  </p>
                  
                  {/* Enhanced real-time unread indicator */}
                  {chat.unreadCount && chat.unreadCount > 0 && (
                    <RealtimeBadge
                      count={chat.unreadCount}
                      variant="destructive"
                      size="sm"
                      animate={true}
                      pulse={true}
                      className="ml-2"
                    />
                  )}
                </div>

                {/* Group chat participants preview */}
                {chat.isGroupChat && (
                  <div className="flex items-center mt-1">
                    <Users className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-400 truncate">
                      {chat.participants.length} members
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
