'use client';
import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface UsePostViewProps {
  postId: string;
  enabled?: boolean; // Whether to track views
  threshold?: number; // Percentage of element that must be visible (0-1)
  delay?: number; // Delay in milliseconds before counting view
}

export function usePostView({ 
  postId, 
  enabled = true, 
  threshold = 0.5, 
  delay = 2000 
}: UsePostViewProps) {
  const { data: session } = useSession();
  const elementRef = useRef<HTMLDivElement>(null);
  const viewTracked = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const trackView = async () => {
    if (!session || viewTracked.current) return;

    try {
      const response = await fetch(`/api/posts/${postId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('View tracked:', data);
        viewTracked.current = true;
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  useEffect(() => {
    if (!enabled || !session || !elementRef.current) return;

    const element = elementRef.current;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            // Start timer when element becomes visible
            timeoutRef.current = setTimeout(() => {
              trackView();
            }, delay);
          } else {
            // Clear timer if element is no longer visible
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
          }
        });
      },
      {
        threshold: threshold,
        rootMargin: '0px'
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [postId, session, enabled, threshold, delay]);

  return {
    ref: elementRef,
    viewTracked: viewTracked.current
  };
}

// Hook for getting view analytics
export function usePostViewAnalytics(postId: string) {
  const { data: session } = useSession();

  const getAnalytics = async () => {
    if (!session) return null;

    try {
      const response = await fetch(`/api/posts/${postId}/view`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching view analytics:', error);
    }
    return null;
  };

  return { getAnalytics };
}
