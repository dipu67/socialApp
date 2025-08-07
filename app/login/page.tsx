'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Login from '@/components/login';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

    // Redirect authenticated users to feed
  useEffect(() => {
    if (session) {
      router.push('/feed');
    }
  }, [session, router]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login if user is already authenticated
  if (status === 'authenticated') {
    return null;
  }

  return <Login />;
}
