'use client';
import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RealtimeBadge, NotificationIcon } from '@/components/ui/realtime-badge';
import { 
  MessageCircle, 
  Search, 
  Settings, 
  Plus, 
  LogOut,
  MoreVertical,
  User,
  Menu,
  X,
  Bell
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  isActive?: boolean;
  unreadCount?: number;
}

export default function Sidebar() {
  const { data: session } = useSession();
  const { user: currentUser } = useCurrentUser();
  const { totalUnreadCount } = useUnreadMessages();
  const { 
    notifications, 
    unreadCount: notificationCount, 
    isConnected,
    connectionStatus 
  } = useRealtimeNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Mock chat data - replace with real data from your backend
 

 console.log(currentUser)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navigationItems = [
    { 
      id: 'feed', 
      icon: MessageCircle, 
      label: 'Feed', 
      route: '/feed',
      count: 0 // Could add feed notifications later
    },
    { 
      id: 'chat', 
      icon: MessageCircle, 
      label: 'Chat', 
      route: '/chat', 
      count: totalUnreadCount,
      realtime: true
    },
    { 
      id: 'explore', 
      icon: Search, 
      label: 'Explore', 
      route: '/explore',
      count: 0
    },
    { 
      id: 'notifications',
      icon: Bell,
      label: 'Notifications',
      route: '/notifications',
      count: notificationCount,
      realtime: true
    },
    { 
      id: 'profile', 
      icon: User, 
      label: 'Profile', 
      route: `/profile/`,
      count: 0
    },
    { 
      id: 'settings', 
      icon: Settings, 
      label: 'Settings', 
      route: '/settings',
      count: 0
    }
  ];

  const getActiveSection = () => {
    const currentPath = pathname;
    if (currentPath.includes('/feed')) return 'feed';
    if (currentPath.includes('/chat')) return 'chat';
    if (currentPath.includes('/explore')) return 'explore';
    if (currentPath.includes('/notifications')) return 'notifications';
    if (currentPath.includes('/profile')) return 'profile';
    if (currentPath.includes('/settings')) return 'settings';
    return 'feed'; // default
  };

  return (
    <aside className="w-full lg:w-80 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-3 lg:p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <h1 className="text-lg lg:text-xl font-bold flex items-center gap-2">
            <MessageCircle className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            <span className="hidden sm:inline">SocialApp</span>
            
            {/* Real-time connection indicator */}
            <div className="flex items-center gap-1 ml-2">
              <div 
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  isConnected 
                    ? 'bg-green-500' 
                    : connectionStatus === 'connecting' 
                    ? 'bg-yellow-500 animate-pulse' 
                    : 'bg-red-500'
                }`} 
                title={`Real-time status: ${connectionStatus}`}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden lg:inline">
                {connectionStatus}
              </span>
            </div>
          </h1>
          <div className="flex items-center gap-2">
            {/* Mobile Navigation Toggle */}
            <Button 
              size="sm" 
              variant="ghost"
              className="lg:hidden rounded-full p-2 h-8 w-8"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            >
              {isMobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <Button size="sm" className="rounded-full p-2 h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`space-y-1 transition-all duration-300 ease-in-out lg:block ${
          isMobileNavOpen ? 'block' : 'hidden'
        }`}>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                router.push(item.route);
                // Close mobile nav when item is selected
                setIsMobileNavOpen(false);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full relative ${
                getActiveSection() === item.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <NotificationIcon 
                hasNotifications={Boolean(item.realtime && item.count > 0)}
                className="flex-shrink-0"
              >
                <item.icon className="h-5 w-5" />
              </NotificationIcon>
              
              <span className="flex-1 text-left">{item.label}</span>
              
              {/* Connection status indicator for real-time items */}
              {item.realtime && (
                <div className="flex items-center gap-1">
                  <div 
                    className={`w-2 h-2 rounded-full ${
                      isConnected 
                        ? 'bg-green-500' 
                        : connectionStatus === 'connecting' 
                        ? 'bg-yellow-500 animate-pulse' 
                        : 'bg-red-500'
                    }`} 
                    title={`Connection: ${connectionStatus}`}
                  />
                </div>
              )}
              
              {/* Enhanced notification badge */}
              {item.count > 0 && (
                <RealtimeBadge
                  count={item.count}
                  animate={item.realtime}
                  pulse={item.realtime && isConnected}
                  variant="destructive"
                  size="sm"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area - This will be handled by individual route pages */}
      <div className="flex-1 overflow-hidden">
        {/* Content is now handled by routing */}
      </div>

      {/* User Profile Section at Bottom */}
      <div className="p-3 lg:p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="flex items-center space-x-2 lg:space-x-3">
          <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
            <AvatarImage src={currentUser?.avatar || `https://avatar.vercel.sh/${session?.user?.email}`} />
            <AvatarFallback>
              {session?.user?.name ? getInitials(session.user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs lg:text-sm font-medium text-gray-900 dark:text-white truncate">
              {session?.user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {session?.user?.email || 'user@example.com'}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 lg:h-8 lg:w-8 p-0">
                <MoreVertical className="h-3 w-3 lg:h-4 lg:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="h-4 w-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
