"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import { Search, Users, X, Plus } from "lucide-react";

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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsGroupChat(false);
      setChatName("");
      setChatDescription("");
      setSearchQuery("");
      setSelectedUsers([]);
      setAvailableUsers([]);
    }
  }, [isOpen]);

  // Search for users
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      searchUsers();
    } else {
      setAvailableUsers([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearchLoading(false);
    }
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUsers.length === 0) {
      alert("Please select at least one user");
      return;
    }

    if (isGroupChat && !chatName.trim()) {
      alert("Please enter a group name");
      return;
    }

    if (isGroupChat && selectedUsers.length < 2) {
      alert("Group chat requires at least 2 participants");
      return;
    }

    if (!isGroupChat && selectedUsers.length !== 1) {
      alert("Direct chat requires exactly one participant");
      return;
    }

    const chatData = {
      isGroupChat,
      name: isGroupChat ? chatName.trim() : undefined,
      description: isGroupChat ? chatDescription.trim() : undefined,
      participants: selectedUsers.map(user => user._id),
    };

    onCreateChat(chatData);
  };

  const getUserInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Create New Chat</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chat Type Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label htmlFor="group-chat" className="font-medium">Group Chat</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create a group conversation with multiple people
              </p>
            </div>
            <Switch
              id="group-chat"
              checked={isGroupChat}
              onCheckedChange={(checked) => {
                setIsGroupChat(checked);
                if (!checked) {
                  // Reset to single user selection for direct chat
                  setSelectedUsers(prev => prev.slice(0, 1));
                  setChatName("");
                  setChatDescription("");
                }
              }}
            />
          </div>

          {/* Group Chat Details */}
          {isGroupChat && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="chat-name">Group Name *</Label>
                <Input
                  id="chat-name"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  placeholder="Enter group name"
                  maxLength={50}
                />
              </div>
              <div>
                <Label htmlFor="chat-description">Description (Optional)</Label>
                <Textarea
                  id="chat-description"
                  value={chatDescription}
                  onChange={(e) => setChatDescription(e.target.value)}
                  placeholder="What's this group about?"
                  rows={2}
                  maxLength={200}
                />
              </div>
            </div>
          )}

          {/* User Search */}
          <div>
            <Label>
              {isGroupChat ? "Add Participants" : "Select Contact"} *
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Selected ({selectedUsers.length})
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedUsers.map(user => (
                  <div
                    key={user._id}
                    className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                  >
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
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
                    <span className="font-medium">{user.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSelectedUser(user._id)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
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
            <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              {searchLoading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : availableUsers.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {availableUsers.map(user => {
                    const isSelected = selectedUsers.some(u => u._id === user._id);
                    return (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => toggleUserSelection(user)}
                        className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          isSelected ? "bg-blue-50 dark:bg-blue-900/30" : ""
                        }`}
                      >
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold overflow-hidden">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getUserInitials(user.name)
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Plus className="h-3 w-3 text-white transform rotate-45" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No users found
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedUsers.length === 0 || (isGroupChat && !chatName.trim())}
              className="flex-1"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                `Create ${isGroupChat ? "Group" : "Chat"}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
