import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface UserProfile {
  _id?: string;
  name: string;
  email: string;
  username: string;
  bio: string;
  phone: string;
  address: string;
  avatar: string;
  coverImage: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    github: string;
  };
  followers: number;
  following: number;
  posts: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const useUserProfile = () => {
  const { data: session } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchProfile = async () => {
    if (!session?.user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/profile');
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setUserProfile(data.user);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!session?.user?.email) {
      throw new Error('Not authenticated');
    }

    try {
      setUpdating(true);
      setError(null);

      console.log('Updating profile with:', updates);

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      setUserProfile(data.user);
      
      console.log('Profile updated successfully');
      return data.user;
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  const updateProfileImage = async (imageUrl: string, type: 'avatar' | 'coverImage') => {
    const updates = {
      [type]: imageUrl
    };
    return updateProfile(updates);
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetchProfile();
    }
  }, [session?.user?.email]);

  return {
    userProfile,
    loading,
    error,
    updating,
    updateProfile,
    updateProfileImage,
    refetchProfile: fetchProfile,
  };
};
