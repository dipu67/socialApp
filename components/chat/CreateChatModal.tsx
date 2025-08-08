"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import { Search, Users, X, Plus, Check, MessageCircle, Crown, AlertCircle } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (chatData: {
    isGroupChat: boolean;
    name?: string;
    description?: string;
    participants: string[];
  }) => void;
}

export default function CreateChatModal({ isOpen, onClose, onCreateChat }: CreateChatModalProps) {
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [chatName, setChatName] = useState("");
  const [chatDescription, setChatDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsGroupChat(false);
      setChatName("");
      setChatDescription("");
      setSearchQuery("");
      setSelectedUsers([]);
      setAvailableUsers([]);
      setError("");
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  }, [isOpen]);

  // Debounced search for users
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers();
      }, 300);
    } else {
      setAvailableUsers([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const searchUsers = useCallback(async () => {
    setSearchLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users || []);
      } else {
        setError("Failed to search users");
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setError("Error searching users");
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const toggleUserSelection = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
      } else {
        // For direct chat, only allow one user
        if (!isGroupChat) {
          return [user];
        }
        return [...prev, user];
      }
    });
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u._id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (selectedUsers.length === 0) {
      setError("Please select at least one user");
      return;
    }

    if (isGroupChat && !chatName.trim()) {
      setError("Please enter a group name");
      return;
    }

    if (isGroupChat && selectedUsers.length < 2) {
      setError("Group chat requires at least 2 participants");
      return;
    }

    if (!isGroupChat && selectedUsers.length !== 1) {
      setError("Direct chat requires exactly one participant");
      return;
    }

    setLoading(true);

    try {
      const chatData = {
        isGroupChat,
        name: isGroupChat ? chatName.trim() : undefined,
        description: isGroupChat ? chatDescription.trim() : undefined,
        participants: selectedUsers.map(user => user._id),
      };

      await onCreateChat(chatData);
    } catch (error) {
      setError("Failed to create chat");
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span>Create New Chat</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-6 overflow-y-auto flex-1 pr-1">
            {/* Chat Type Toggle */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isGroupChat 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                }`}>
                  {isGroupChat ? <Users className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                </div>
                <div>
                  <Label htmlFor="group-chat" className="font-semibold text-base cursor-pointer">
                    Group Chat
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create a group conversation with multiple people
                  </p>
                </div>
              </div>
              <Switch
                id="group-chat"
                checked={isGroupChat}
                onCheckedChange={(checked) => {
                  setIsGroupChat(checked);
                  setError("");
                  if (!checked) {
                    // Reset to single user selection for direct chat
                    setSelectedUsers(prev => prev.slice(0, 1));
                    setChatName("");
                    setChatDescription("");
                  }
                }}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>

            {/* Group Chat Details */}
            {isGroupChat && (
              <div className="space-y-4">
                <div className="relative">
                  <Label htmlFor="chat-name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Group Name *
                  </Label>
                  <Input
                    id="chat-name"
                    value={chatName}
                    onChange={(e) => setChatName(e.target.value)}
                    placeholder="Enter group name"
                    maxLength={50}
                    className="mt-2 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {chatName.length}/50
                  </div>
                </div>
                <div className="relative">
                  <Label htmlFor="chat-description" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="chat-description"
                    value={chatDescription}
                    onChange={(e) => setChatDescription(e.target.value)}
                    placeholder="What's this group about?"
                    rows={3}
                    maxLength={200}
                    className="mt-2 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {chatDescription.length}/200
                  </div>
                </div>
              </div>
            )}

            {/* User Search */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {isGroupChat ? "Add Participants" : "Select Contact"} *
              </Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="pl-10 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Selected Participants ({selectedUsers.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user, index) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-800 dark:text-blue-200 px-3 py-2 rounded-full text-sm border border-blue-200 dark:border-blue-800 transition-all hover:shadow-md"
                    >
                      <div className="relative">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold overflow-hidden">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            getUserInitials(user.name)
                          )}
                        </div>
                        {index === 0 && isGroupChat && (
                          <Crown className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                      <span className="font-medium truncate max-w-24">{user.name}</span>
                      <button
                        type="button"
                        onClick={() => removeSelectedUser(user._id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                        aria-label={`Remove ${user.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Users */}
            {searchQuery && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                {searchLoading ? (
                  <div className="flex items-center justify-center p-6">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Searching users...</span>
                    </div>
                  </div>
                ) : availableUsers.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {availableUsers.map(user => {
                        const isSelected = selectedUsers.some(u => u._id === user._id);
                        return (
                          <button
                            key={user._id}
                            type="button"
                            onClick={() => toggleUserSelection(user)}
                            className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ${
                              isSelected 
                                ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-l-4 border-blue-500" 
                                : ""
                            }`}
                            disabled={!isGroupChat && selectedUsers.length > 0 && !isSelected}
                          >
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold overflow-hidden transition-all">
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-lg">{getUserInitials(user.name)}</span>
                                )}
                              </div>
                              {isSelected && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                            </div>
                            {!isGroupChat && selectedUsers.length > 0 && !isSelected && (
                              <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                Direct chat only
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No users found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Try searching with a different term</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 mt-auto border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedUsers.length === 0 || (isGroupChat && !chatName.trim())}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {isGroupChat ? <Users className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                  <span>Create {isGroupChat ? "Group" : "Chat"}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
