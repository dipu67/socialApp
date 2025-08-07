"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  UserPlus, 
  X, 
  Loader2 
} from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  username?: string;
}

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  existingMembers: User[];
  onMembersAdded: () => void;
}

export default function AddMembersModal({
  isOpen,
  onClose,
  chatId,
  existingMembers,
  onMembersAdded
}: AddMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
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
        // Filter out existing members
        const existingMemberIds = existingMembers.map(member => member._id);
        const filteredUsers = (data.users || []).filter((user: User) => 
          !existingMemberIds.includes(user._id)
        );
        setAvailableUsers(filteredUsers);
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
        return [...prev, user];
      }
    });
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u._id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUsers.length === 0) {
      alert("Please select at least one user to add");
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`/api/chats/${chatId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: selectedUsers.map(user => user._id)
        }),
      });

      if (response.ok) {
        onMembersAdded();
        onClose();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add members');
      }
    } catch (error) {
      console.error("Error adding members:", error);
      alert('Failed to add members');
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Members
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Selected Users ({selectedUsers.length})</h4>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge
                    key={user._id}
                    variant="secondary"
                    className="flex items-center gap-2 pl-2 pr-1"
                  >
                    <span className="text-xs">{user.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-red-100"
                      onClick={() => removeSelectedUser(user._id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Available Users */}
          {searchQuery && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Search Results</h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {availableUsers.length === 0 && !searchLoading ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {searchQuery.length < 2 ? 'Type at least 2 characters to search' : 'No users found'}
                  </p>
                ) : (
                  availableUsers.map((user) => (
                    <div
                      key={user._id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedUsers.some(u => u._id === user._id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => toggleUserSelection(user)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {user.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={user.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                              {getUserInitials(user.name)}
                            </div>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      {selectedUsers.some(u => u._id === user._id) && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={selectedUsers.length === 0 || loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Add {selectedUsers.length > 0 ? `${selectedUsers.length} ` : ''}Member{selectedUsers.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
