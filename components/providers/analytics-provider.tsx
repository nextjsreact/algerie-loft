'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initGA, trackPageView } from '@/lib/analytics/gtag';
import { initWebVitals } from '@/lib/analytics/web-vitals';
import { initMonitoring, cleanupMonitoring } from '@/lib/monitoring/init';
import { initUserBehaviorAnalytics } from '@/lib/analytics/user-behavior';
import { setupGlobalErrorHandling } from '@/lib/monitoring/error-tracking';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize Google Analytics
    initGA();
    
    // Initialize Web Vitals tracking
    initWebVitals();
    
    // Initialize performance monitoring
    initMonitoring();
    
    // Initialize user behavior analytics
    initUserBehaviorAnalytics();
    
    // Setup global error handling
    setupGlobalErrorHandling();
    
    // Cleanup on unmount
    return () => {
      cleanupMonitoring();
    };
  }, []);

  useEffect(() => {
    // Track page views on route changes
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  return <>{children}</>;
}

// Hook for tracking analytics events in components
export function useAnalytics() {
  return {
    trackPageView,
    trackEvent: (action: string, category?: string, label?: string, value?: number) => {
      if (typeof window !== 'undefined') {
        const { trackEvent } = require('@/lib/analytics/gtag');
        trackEvent(action, category, label, value);
      }
    },
    trackFormSubmission: (formName: string, success: boolean = true) => {
      if (typeof window !== 'undefined') {
        const { trackFormSubmission } = require('@/lib/analytics/gtag');
        trackFormSubmission(formName, success);
      }
    },
    trackContact: (method: 'email' | 'phone' | 'form', location?: string) => {
      if (typeof window !== 'undefined') {
        const { trackContact } = require('@/lib/analytics/gtag');
        trackContact(method, location);
      }
    },
    trackPropertyView: (propertyId: string, propertyType?: string) => {
      if (typeof window !== 'undefined') {
        const { trackPropertyView } = require('@/lib/analytics/gtag');
        trackPropertyView(propertyId, propertyType);
      }
    },
    trackServiceInquiry: (serviceName: string) => {
      if (typeof window !== 'undefined') {
        const { trackServiceInquiry } = require('@/lib/analytics/gtag');
        trackServiceInquiry(serviceName);
      }
    },
    trackSearch: (searchTerm: string, resultsCount?: number) => {
      if (typeof window !== 'undefined') {
        const { trackSearch } = require('@/lib/analytics/gtag');
        trackSearch(searchTerm, resultsCount);
      }
    },
    trackLanguageChange: (fromLang: string, toLang: string) => {
      if (typeof window !== 'undefined') {
        const { trackLanguageChange } = require('@/lib/analytics/gtag');
        trackLanguageChange(fromLang, toLang);
      }
    },
  };
}