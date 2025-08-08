"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Paperclip, Smile, MoreVertical, Users, Phone, Video, Image, FileText, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EmojiPicker, MessageReactions, GroupInfoModal, PersonalChatInfoModal } from "@/components/chat";

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

interface ChatWindowProps {
  chat: Chat;
  messages: Message[];
  onSendMessage: (content: string, file?: File) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onTyping: (isTyping: boolean) => void;
  typingUsers: string[];
  currentUserId?: string;
  onBackClick?: () => void;
}

export default function ChatWindow({
  chat,
  messages,
  onSendMessage,
  onReaction,
  onTyping,
  typingUsers,
  currentUserId,
  onBackClick
}: ChatWindowProps) {
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showEmojiPicker]);

  const getChatDisplayName = () => {
    if (chat.isGroupChat) {
      return chat.groupName || "Group Chat";
    }
    
    const otherParticipant = chat.participants.find(p => p.email !== currentUserId);
    return otherParticipant?.name || "Unknown User";
  };

  const getChatAvatar = () => {
    if (chat.isGroupChat) {
      return chat.groupAvatar || null;
    }
    
    const otherParticipant = chat.participants.find(p => p.email !== currentUserId);
    return otherParticipant?.avatar;
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = useCallback(() => {
    if (messageText.trim() || selectedFile) {
      onSendMessage(messageText.trim(), selectedFile || undefined);
      setMessageText("");
      setSelectedFile(null);
      onTyping(false);
      // Focus back on input after sending
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    }
  }, [messageText, selectedFile, onSendMessage, onTyping]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === "Escape") {
      setShowEmojiPicker(false);
    }
  };

  const handleTyping = (value: string) => {
    setMessageText(value);
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    if (value.trim()) {
      onTyping(true);
      const timeout = setTimeout(() => {
        onTyping(false);
      }, 2000);
      setTypingTimeout(timeout);
    } else {
      onTyping(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  const isOwnMessage = (message: Message) => {
    return message.senderId.email === currentUserId;
  };

  const handleChatHeaderClick = () => {
    console.log('ChatWindow - Header clicked:', { 
      isGroupChat: chat.isGroupChat, 
      chatId: chat._id 
    });
    
    if (chat.isGroupChat) {
      setShowGroupInfo(true);
    } else {
      setShowPersonalInfo(true);
    }
  };

  const handleUpdateGroup = async (data: any) => {
    try {
      const response = await fetch(`/api/chats/${chat._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Group updated successfully:', result);
        // Force a page reload to ensure fresh data
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update group');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  };

  const handleLeaveGroup = async () => {
    try {
      const response = await fetch(`/api/chats/${chat._id}/leave`, {
        method: 'POST',
      });

      if (response.ok) {
        // Navigate back to chat list
        if (onBackClick) onBackClick();
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/chats/${chat._id}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the chat data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  };

  const handleClearChat = async () => {
    try {
      const response = await fetch(`/api/chats/${chat._id}/clear`, {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh messages
        window.location.reload();
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
      throw error;
    }
  };

  const handleBlockUser = async () => {
    try {
      const otherParticipant = chat.participants.find((p: any) => p.email !== currentUserId);
      if (!otherParticipant) return;

      const response = await fetch(`/api/users/${otherParticipant._id}/block`, {
        method: 'POST',
      });

      if (response.ok) {
        // Navigate back to chat list
        if (onBackClick) onBackClick();
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  };

  const displayName = getChatDisplayName();
  const avatarUrl = getChatAvatar();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 chat-container" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          {onBackClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackClick}
              className="md:hidden p-1.5 sm:p-2 mr-1"
              aria-label="Go back to chat list"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
          
          <div 
            className="relative cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-1.5 sm:p-2 -m-1.5 sm:-m-2 transition-colors"
            onClick={handleChatHeaderClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleChatHeaderClick();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={chat.isGroupChat ? "View group info" : "View contact info"}
          >
            {chat.isGroupChat ? (
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                {chat.groupAvatar ? (
                  <img
                    src={chat.groupAvatar}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                  
                ) : (
                  <Users className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
                )}
              </div>
            ) : (
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white  font-semibold text-xs sm:text-sm">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {/* Active indicator for personal chats only */}
                <div className="absolute bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>
            )}
          </div>

          <div 
            className="cursor-pointer  rounded-lg p-1.5 sm:p-2 -m-1.5 sm:-m-2 transition-colors flex-1 min-w-0"
            onClick={handleChatHeaderClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleChatHeaderClick();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={chat.isGroupChat ? "View group info" : "View contact info"}
          >
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate ml-1.5 text-sm sm:text-base">{displayName}</h2>
            {chat.isGroupChat ? (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-1.5 truncate">
                {chat.participants.length} members
                {chat.groupDescription && (
                  <span className="ml-2 text-xs hidden sm:inline">
                    • {chat.groupDescription.substring(0, 15)}
                    {chat.groupDescription.length > 15 ? '...' : ''}
                  </span>
                )}
              </p>
            ) : (
              <div className="flex items-center gap-1 ml-1.5 sm:gap-2">
                <p className="text-xs sm:text-sm text-green-500">Online</p>
                <span className="text-xs text-gray-400 hidden md:inline">
                  • Tap for contact info
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-0.5 sm:space-x-1">
          {!chat.isGroupChat && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1.5 sm:p-2 hidden sm:flex" 
                title="Voice call"
                aria-label="Start voice call"
              >
                <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1.5 sm:p-2 hidden sm:flex" 
                title="Video call"
                aria-label="Start video call"
              >
                <Video className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1.5 sm:p-2" 
            title="More options"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-4 p-2 sm:p-4 bg-gray-50 dark:bg-gray-900 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No messages yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Start the conversation with a message
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = isOwnMessage(message);
            const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.senderId._id !== message.senderId._id);
            
            return (
              <div
                key={message._id}
                className={`flex items-end space-x-1 sm:space-x-2 ${isOwn ? "justify-end" : "justify-start"}`}
              >
                {!isOwn && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                    {showAvatar && (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center overflow-hidden">
                        {message.senderId.avatar ? (
                          <img
                            src={message.senderId.avatar}
                            alt={message.senderId.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-xs font-semibold">
                            {message.senderId.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className={`max-w-[80%] sm:max-w-xs lg:max-w-md ${isOwn ? "ml-auto" : ""}`}>
                  {!isOwn && showAvatar && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1 sm:ml-2">
                      {message.senderId.name}
                    </p>
                  )}
                  
                  <div
                    className={`px-3 py-2 sm:px-4 sm:py-2 rounded-2xl relative ${
                      isOwn
                        ? "bg-blue-500 text-white rounded-br-sm"
                        : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-600"
                    }`}
                  >
                    {message.messageType === "text" ? (
                      <p className="text-sm break-words leading-relaxed">{message.content}</p>
                    ) : message.messageType === "image" ? (
                      <div className="space-y-2">
                        {message.fileUrl && (
                          <div className="relative group">
                            <img
                              src={message.fileUrl}
                              alt={message.fileName || "Image"}
                              className="max-w-[240px] max-h-64 sm:max-w-xs sm:max-h-64 rounded-lg object-contain cursor-pointer transition-transform hover:scale-105 shadow-md"
                              onClick={() => window.open(message.fileUrl, '_blank')}
                              onError={(e) => {
                                console.error('Failed to load image:', message.fileUrl);
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                              loading="lazy"
                            />
                            <div className="hidden p-3 sm:p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
                              <Image className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">Failed to load image</p>
                              <a 
                                href={message.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline"
                              >
                                Open in new tab
                              </a>
                            </div>
                          </div>
                        )}
                        {message.content && (
                          <p className="text-sm break-words leading-relaxed">{message.content}</p>
                        )}
                      </div>
                    ) : message.messageType === "video" ? (
                      <div className="space-y-2">
                        {message.fileUrl && (
                          <div className="relative">
                            <video
                              src={message.fileUrl}
                              controls
                              className="max-w-[240px] max-h-64 sm:max-w-xs sm:max-h-64 rounded-lg shadow-md"
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {message.fileName && `📹 ${message.fileName}`}
                            </div>
                          </div>
                        )}
                        {message.content && (
                          <p className="text-sm break-words leading-relaxed">{message.content}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {message.fileUrl && (
                          <div className="flex items-center space-x-2 p-2 sm:p-3 bg-gray-100 dark:bg-gray-600 rounded-lg border">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <a
                                href={message.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block"
                              >
                                {message.fileName || "File"}
                              </a>
                              {message.fileSize && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {(message.fileSize / 1024 / 1024).toFixed(2)} MB
                                </p>
                              )}
                            </div>
                            <Download className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                          </div>
                        )}
                        {message.content && (
                          <p className="text-sm break-words leading-relaxed">{message.content}</p>
                        )}
                      </div>
                    )}

                    {/* Message Reactions */}
                    {message.reactions.length > 0 && (
                      <MessageReactions
                        reactions={message.reactions}
                        onReaction={(emoji: string) => onReaction(message._id, emoji)}
                        currentUserId={currentUserId}
                      />
                    )}
                  </div>

                  <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isOwn ? "text-right" : "ml-1 sm:ml-2"}`}>
                    {formatMessageTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-1 sm:space-x-2 px-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8"></div>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-3 py-2 sm:px-4 sm:py-2">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
        {selectedFile && (
          <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mb-2">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Paperclip className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{selectedFile.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
              className="text-gray-500 hover:text-gray-700 p-1 ml-2 flex-shrink-0"
              aria-label="Remove selected file"
            >
              ×
            </Button>
          </div>
        )}

        <div className="flex items-end space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 sm:p-2.5 flex-shrink-0"
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="flex-1 relative">
            <Input
              ref={messageInputRef}
              value={messageText}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-10 sm:pr-12 rounded-full border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base py-2.5 sm:py-3"
              aria-label="Type your message"
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 p-1 sm:p-1.5"
              aria-label="Add emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>

            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-2 z-50">
                <EmojiPicker
                  onEmojiSelect={(emoji: string) => {
                    setMessageText(messageText + emoji);
                    setShowEmojiPicker(false);
                    messageInputRef.current?.focus();
                  }}
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() && !selectedFile}
            className="p-2 sm:p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>

      {/* Group Info Modal */}
      <GroupInfoModal
        isOpen={showGroupInfo}
        onClose={() => setShowGroupInfo(false)}
        chat={chat}
        currentUserId={currentUserId || ""}
        onUpdateGroup={handleUpdateGroup}
        onLeaveGroup={handleLeaveGroup}
        onRemoveMember={handleRemoveMember}
      />

      {/* Personal Chat Info Modal */}
      <PersonalChatInfoModal
        isOpen={showPersonalInfo}
        onClose={() => setShowPersonalInfo(false)}
        chat={chat}
        currentUserId={currentUserId || ""}
        onClearChat={handleClearChat}
        onBlockUser={handleBlockUser}
      />
    </div>
  );
}
