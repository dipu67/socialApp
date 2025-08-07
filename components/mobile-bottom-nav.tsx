'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';


import { 
  MessageCircle, 
  Search, 
  User, 
  Settings,
  Home
} from 'lucide-react';

export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user: currentUser } = useCurrentUser();

  const getActiveSection = () => {
    const currentPath = pathname;
    if (currentPath.includes('/feed')) return 'feed';
    if (currentPath.includes('/chat')) return 'chat' ;
    if (currentPath.includes('/explore')) return 'search';
    if (currentPath.includes('/profile')) return 'profile';
    if (currentPath.includes('/settings')) return 'settings';
    return 'feed'; // default
  };

  const navigationItems = [
    { 
      id: 'feed', 
      icon: Home, 
      label: 'Feed', 
      route: '/feed' 
    },
    { 
      id: 'search', 
      icon: Search, 
      label: 'Explore', 
      route: '/explore' 
    },
    { 
      id: 'chat', 
      icon: MessageCircle, 
      label: 'Chat', 
      route: '/chat',
    
    },
    { 
      id: 'profile', 
      icon: User, 
      label: 'Profile', 
      route: '/profile' 
    },
    { 
      id: 'settings', 
      icon: Settings, 
      label: 'Settings', 
      route: '/settings' 
    }
  ] as Array<{
    id: string;
    icon: any;
    label: string;
    route: string;
  }>;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 safe-area-pb">
      <div className="grid grid-cols-5 h-16">
        {navigationItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => router.push(item.route)}
            className={`relative flex flex-col items-center justify-center h-full rounded-none space-y-1 ${
              getActiveSection() === item.id
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium">{item.label}</span>
              
          </Button>
        ))}
      </div>
    </div>
  );
}
