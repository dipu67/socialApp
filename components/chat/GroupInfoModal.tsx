"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import AddMembersModal from "./AddMembersModal";
import { useGroupImageUpload } from "@/hooks/useGroupImageUpload";
import { 
  Users, 
  Edit3, 
  Save, 
  X, 
  Crown, 
  Shield, 
  UserMinus,
  UserPlus,
  Camera
} from "lucide-react";

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: any;
  currentUserId: string;
  onUpdateGroup?: (data: any) => Promise<void>;
  onLeaveGroup?: () => Promise<void>;
  onRemoveMember?: (memberId: string) => Promise<void>;
}

export default function GroupInfoModal({
  isOpen,
  onClose,
  chat,
  currentUserId,
  onUpdateGroup,
  onLeaveGroup,
  onRemoveMember
}: GroupInfoModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(chat?.groupName || "");
  const [groupDescription, setGroupDescription] = useState(chat?.groupDescription || "");
  const [loading, setLoading] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  
  // Use the new group image upload hook
  const { uploadImage, removeImage, isUploading: imageUploading, error: imageError } = useGroupImageUpload();

  const isAdmin = chat?.admin?.email === currentUserId;
  const isModerator = chat?.moderators?.some((mod: any) => mod.email === currentUserId);
  const canEdit = isAdmin || isModerator;

  useEffect(() => {
    if (chat) {
      setGroupName(chat.groupName || "");
      setGroupDescription(chat.groupDescription || "");
    }
  }, [chat]);

  // Show image upload errors if any
  useEffect(() => {
    if (imageError) {
      alert(imageError);
    }
  }, [imageError]);

  const handleSave = async () => {
    if (!onUpdateGroup) return;
    
    setLoading(true);
    try {
      await onUpdateGroup({
        name: groupName.trim(),
        description: groupDescription.trim()
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating group:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!onLeaveGroup) return;
    
    if (confirm("Are you sure you want to leave this group?")) {
      setLoading(true);
      try {
        await onLeaveGroup();
        onClose();
      } catch (error) {
        console.error("Error leaving group:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm("Are you sure you want to remove this member?")) {
      setLoading(true);
      try {
        const response = await fetch(`/api/chats/${chat._id}/members/${memberId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          if (onRemoveMember) {
            await onRemoveMember(memberId);
          }
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Failed to remove member');
        }
      } catch (error) {
        console.error("Error removing member:", error);
        alert('Failed to remove member');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePromoteMember = async (memberId: string) => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/chats/${chat._id}/moderators/${memberId}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        // Refresh the chat data if needed
        if (onUpdateGroup) {
          await onUpdateGroup({ name: groupName, description: groupDescription });
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update moderator status');
      }
    } catch (error) {
      console.error("Error updating moderator status:", error);
      alert('Failed to update moderator status');
    } finally {
      setLoading(false);
    }
  };

  const handleMembersAdded = () => {
    // Refresh the chat data
    if (onUpdateGroup) {
      onUpdateGroup({ name: groupName, description: groupDescription });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadImage(chat._id, file);
      
      // Update the local chat data
      if (onUpdateGroup) {
        await onUpdateGroup({ name: groupName, description: groupDescription });
      }
      
      alert('Group image updated successfully!');
    } catch (error) {
      // Error is already handled by the hook and shown via useEffect
      console.error('Error uploading image:', error);
    } finally {
      // Reset the input
      event.target.value = '';
    }
  };

  const handleRemoveImage = async () => {
    if (!confirm('Are you sure you want to remove the group image?')) return;

    try {
      await removeImage(chat._id);
      
      // Update the local chat data
      if (onUpdateGroup) {
        await onUpdateGroup({ name: groupName, description: groupDescription });
      }
      
      alert('Group image removed successfully!');
    } catch (error) {
      // Error is already handled by the hook and shown via useEffect
      console.error('Error removing image:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!chat || !chat.isGroupChat) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Group Info</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {chat.participants.length} members
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                {chat.groupAvatar ? (
                  <img 
                    src={chat.groupAvatar} 
                    alt={chat.groupName || "Group"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="h-12 w-12 text-white" />
                )}
              </div>
              {canEdit && (
                <div className="absolute bottom-0 right-0">
                  <input
                    type="file"
                    id="group-image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={imageUploading}
                  />
                  <label
                    htmlFor="group-image-upload"
                    className={`w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors cursor-pointer ${
                      imageUploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {imageUploading ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </label>
                </div>
              )}
            </div>
            {canEdit && chat.groupAvatar && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveImage}
                disabled={imageUploading}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                Remove Image
              </Button>
            )}
          </div>

          {/* Group Details */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Group Name
                </label>
                {canEdit && !isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Group name"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    size="sm"
                    className="px-3"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setGroupName(chat.groupName || "");
                      setGroupDescription(chat.groupDescription || "");
                    }}
                    variant="ghost"
                    size="sm"
                    className="px-3"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-lg font-semibold">{chat.groupName || "Unnamed Group"}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Group description"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-h-[80px] resize-none"
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  {chat.groupDescription || "No description"}
                </p>
              )}
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Created: {formatDate(chat.createdAt)}</p>
            </div>
          </div>

          {/* Members Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Members ({chat.participants.length})</h3>
              {canEdit && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddMembersModal(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              )}
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {chat.participants.map((member: any) => (
                <div key={member._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center overflow-hidden">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {chat.admin?.email === member.email && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs">
                        <Crown className="h-3 w-3" />
                        Admin
                      </div>
                    )}
                    {chat.moderators?.some((mod: any) => mod.email === member.email) && chat.admin?.email !== member.email && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                        <Shield className="h-3 w-3" />
                        Mod
                      </div>
                    )}
                    {member.email === currentUserId && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">You</span>
                    )}
                    {isAdmin && member.email !== currentUserId && member.email !== chat.admin?.email && (
                      <div className="flex items-center gap-1">
                        {!chat.moderators?.some((mod: any) => mod.email === member.email) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePromoteMember(member._id)}
                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700"
                            title="Promote to Moderator"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePromoteMember(member._id)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                            title="Demote from Moderator"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member._id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          title="Remove Member"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {!isAdmin && (
              <Button
                variant="destructive"
                onClick={handleLeaveGroup}
                disabled={loading}
                className="flex-1"
              >
                Leave Group
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Add Members Modal */}
      <AddMembersModal
        isOpen={showAddMembersModal}
        onClose={() => setShowAddMembersModal(false)}
        chatId={chat._id}
        existingMembers={chat.participants}
        onMembersAdded={handleMembersAdded}
      />
    </Dialog>
  );
}
