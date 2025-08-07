import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface CurrentUser {
  _id: string;
  name: string;
  username?: string;
  email: string;
  image?: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  followers: number;
  following: number;
  posts: any[];
  createdAt: Date;
  updatedAt: Date;
}

export function useCurrentUser() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/me');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const userData = await response.json();
        setUser(userData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [session, status]);

  return { user, loading, error };
}
