'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface UseAuthRedirectProps {
  requireAuth?: boolean;
  redirectTo?: string;
  redirectAuthenticatedTo?: string;
}

export function useAuthRedirect({
  requireAuth = true,
  redirectTo = '/login',
  redirectAuthenticatedTo = '/dashboard'
}: UseAuthRedirectProps = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (requireAuth && status === 'unauthenticated') {
      router.push(redirectTo);
    } else if (!requireAuth && status === 'authenticated') {
      router.push(redirectAuthenticatedTo);
    }
  }, [status, requireAuth, redirectTo, redirectAuthenticatedTo, router]);

  return {
    session,
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isUnauthenticated: status === 'unauthenticated'
  };
}
