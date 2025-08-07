'use client';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import Sidebar from '@/components/sidebar';
import MobileBottomNav from '@/components/mobile-bottom-nav';
import MobileHeader from '@/components/mobile-header';

function AuthenticatedLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Check if we're in a chat window on mobile (when chatId is present in URL)
  const isInChatWindow = pathname === '/chat' && searchParams.get('chatId');
  
  // Hide mobile header when in chat window
  const hideMobileHeader = isInChatWindow;
  
  // Hide mobile bottom nav when in chat window
  const hideMobileBottomNav = isInChatWindow;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">Loading your app...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile Header - Hidden when in chat window */}
        {!hideMobileHeader && <MobileHeader />}
        
        {/* Page Content */}
        <main >
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Navigation - Hidden when in chat window */}
      {!hideMobileBottomNav && <MobileBottomNav />}
    </div>
  );
}

// Loading component for layout
function AuthenticatedLayoutLoading({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="animate-pulse">
        {/* Mobile Header Skeleton */}
        <div className="h-16 bg-white border-b border-gray-200 md:hidden">
          <div className="flex items-center justify-between h-full px-4">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="w-32 h-6 bg-gray-200 rounded"></div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar Skeleton */}
          <div className="hidden md:flex w-64 bg-white border-r border-gray-200">
            <div className="w-full p-4">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Nav Skeleton */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
          <div className="flex justify-around py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-12 h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main layout component with Suspense boundary
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AuthenticatedLayoutLoading>{children}</AuthenticatedLayoutLoading>}>
      <AuthenticatedLayoutContent>{children}</AuthenticatedLayoutContent>
    </Suspense>
  );
}
