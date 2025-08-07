"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  User, 
  Mail, 
  Calendar, 
  MessageCircle,
  Phone,
  Video,
  MoreHorizontal
} from "lucide-react";

interface PersonalChatInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: any;
  currentUserId: string;
  onClearChat?: () => Promise<void>;
  onBlockUser?: () => Promise<void>;
}

export default function PersonalChatInfoModal({
  isOpen,
  onClose,
  chat,
  currentUserId,
  onClearChat,
  onBlockUser
}: PersonalChatInfoModalProps) {
  const [loading, setLoading] = useState(false);

  // Debug logging
  console.log('PersonalChatInfoModal - Props:', { 
    isOpen, 
    chat: chat ? { 
      _id: chat._id, 
      isGroupChat: chat.isGroupChat, 
      participants: chat.participants?.length 
    } : null, 
    currentUserId 
  });

  if (!chat || chat.isGroupChat) return null;

  const otherParticipant = chat.participants.find((p: any) => p.email !== currentUserId);
  
  // Debug logging for participant
  console.log('PersonalChatInfoModal - Other participant:', otherParticipant);
  
  if (!otherParticipant) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md w-full mx-4">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400">
              Unable to load contact information.
            </p>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleClearChat = async () => {
    if (!onClearChat) return;
    
    if (confirm("Are you sure you want to clear this chat? This action cannot be undone.")) {
      setLoading(true);
      try {
        await onClearChat();
        onClose();
      } catch (error) {
        console.error("Error clearing chat:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBlockUser = async () => {
    if (!onBlockUser) return;
    
    if (confirm(`Are you sure you want to block ${otherParticipant.name}?`)) {
      setLoading(true);
      try {
        await onBlockUser();
        onClose();
      } catch (error) {
        console.error("Error blocking user:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center overflow-hidden">
              {otherParticipant.avatar ? (
                <img
                  src={otherParticipant.avatar}
                  alt={otherParticipant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">Contact Info</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Personal conversation
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center overflow-hidden">
              {otherParticipant.avatar ? (
                <img
                  src={otherParticipant.avatar}
                  alt={otherParticipant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-16 w-16 text-white" />
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {otherParticipant.name}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Online
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium">{otherParticipant.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Chat started</p>
                  <p className="font-medium">{formatDate(chat.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <MessageCircle className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last message</p>
                  <p className="font-medium">
                    {chat.lastMessage ? formatDate(chat.lastMessage.createdAt) : "No messages yet"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Actions</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => alert('Voice call feature coming soon!')}
                disabled={loading}
              >
                <Phone className="h-4 w-4" />
                Call
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => alert('Video call feature coming soon!')}
                disabled={loading}
              >
                <Video className="h-4 w-4" />
                Video
              </Button>
            </div>
          </div>

          {/* Chat Actions */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Chat Actions</h4>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={handleClearChat}
                disabled={loading}
                className="w-full justify-start text-red-600 hover:text-red-700"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Clear Chat History
              </Button>
              
              <Button
                variant="outline"
                onClick={handleBlockUser}
                disabled={loading}
                className="w-full justify-start text-red-600 hover:text-red-700"
              >
                <User className="h-4 w-4 mr-2" />
                Block User
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
