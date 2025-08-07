'use client';

import { useEffect, Suspense } from 'react';
import { useAnalytics, AnalyticsPageTracker } from '@/lib/analytics';

// Type definitions for Web Vitals
interface PerformanceEntryFID extends PerformanceEntry {
  processingStart: number;
}

interface PerformanceEntryCLS extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

function PerformanceTracking() {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    // Track Core Web Vitals
    const trackWebVitals = () => {
      // Performance observer for tracking metrics
      if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            trackEvent({
              action: 'web_vital_lcp',
              category: 'performance',
              value: Math.round(entry.startTime),
            });
          });
        });

        try {
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {
          // LCP not supported
        }

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const fidEntry = entry as PerformanceEntryFID;
            trackEvent({
              action: 'web_vital_fid',
              category: 'performance',
              value: Math.round(fidEntry.processingStart - fidEntry.startTime),
            });
          });
        });

        try {
          fidObserver.observe({ type: 'first-input', buffered: true });
        } catch (e) {
          // FID not supported
        }

        // Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const clsEntry = entry as PerformanceEntryCLS;
            if (!clsEntry.hadRecentInput) {
              clsValue += clsEntry.value;
            }
          });
          
          trackEvent({
            action: 'web_vital_cls',
            category: 'performance',
            value: Math.round(clsValue * 1000),
          });
        });

        try {
          clsObserver.observe({ type: 'layout-shift', buffered: true });
        } catch (e) {
          // CLS not supported
        }
      }

      // Track page load time
      if (typeof window !== 'undefined' && window.performance) {
        const navigationTiming = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigationTiming && navigationTiming.loadEventEnd) {
          const loadTime = navigationTiming.loadEventEnd - navigationTiming.fetchStart;
          trackEvent({
            action: 'page_load_time',
            category: 'performance',
            value: Math.round(loadTime),
          });
        }
      }
    };

    // Track network connection
    const trackNetworkInfo = () => {
      if (typeof navigator !== 'undefined' && 'connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          trackEvent({
            action: 'network_type',
            category: 'performance',
            label: connection.effectiveType || 'unknown',
          });
        }
      }
    };

    // Track device type
    const trackDeviceInfo = () => {
      if (typeof window !== 'undefined') {
        const isMobile = window.innerWidth <= 768;
        const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
        const isDesktop = window.innerWidth > 1024;

        let deviceType = 'unknown';
        if (isMobile) deviceType = 'mobile';
        else if (isTablet) deviceType = 'tablet';
        else if (isDesktop) deviceType = 'desktop';

        trackEvent({
          action: 'device_type',
          category: 'user_info',
          label: deviceType,
        });
      }
    };

    // Run tracking after page load
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        trackWebVitals();
        trackNetworkInfo();
        trackDeviceInfo();
      } else {
        window.addEventListener('load', () => {
          trackWebVitals();
          trackNetworkInfo();
          trackDeviceInfo();
        });
      }
    }

    // Track session start
    trackEvent({
      action: 'session_start',
      category: 'engagement',
    });

    // Track session end on page unload
    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - performance.now();
      trackEvent({
        action: 'session_end',
        category: 'engagement',
        value: Math.round(sessionDuration / 1000), // Convert to seconds
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [trackEvent]);

  return null; // This component doesn't render anything
}

// Main performance monitor component with Suspense boundary
export default function PerformanceMonitor() {
  return (
    <>
      <PerformanceTracking />
      <Suspense fallback={null}>
        <AnalyticsPageTracker />
      </Suspense>
    </>
  );
}
