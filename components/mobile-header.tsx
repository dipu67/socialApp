'use client';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { Badge } from '@/components/ui/badge';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { 
  MessageCircle, 
  Bell,
  Plus
} from 'lucide-react';

export default function MobileHeader() {
  const { data: session } = useSession();
  const { user: currentUser } = useCurrentUser();

    const { totalUnreadCount } = useUnreadMessages();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="lg:hidden sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-4">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold">SocialApp</h1>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {totalUnreadCount && totalUnreadCount > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center text-black justify-center  rounded-full">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </Badge>
            )}
          </Button>
          
          <Button size="sm" className="rounded-full">
            <Plus className="h-4 w-4" />
          </Button>

          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser?.avatar || `https://avatar.vercel.sh/${currentUser?.email}`} />
            <AvatarFallback className="text-sm">
              {currentUser?.name ? getInitials(currentUser.name) : 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
