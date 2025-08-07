'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Register from '@/components/register';

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect authenticated users to feed
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/feed');
    }
  }, [status, router]);

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

  // Don't render register if user is already authenticated
  if (status === 'authenticated') {
    return null;
  }

  return <Register />;
}
