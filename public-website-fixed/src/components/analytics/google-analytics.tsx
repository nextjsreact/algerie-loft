'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { 
  GA_MEASUREMENT_ID, 
  initGA, 
  trackPageView, 
  trackUserEngagement,
  enableAnalyticsDebug 
} from '@/lib/analytics/google-analytics';

interface GoogleAnalyticsProps {
  measurementId?: string;
  debug?: boolean;
}

export function GoogleAnalytics({ 
  measurementId = GA_MEASUREMENT_ID, 
  debug = false 
}: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!measurementId) {
      console.warn('Google Analytics measurement ID not provided');
      return;
    }

    // Initialize GA when component mounts
    initGA();
    
    if (debug) {
      enableAnalyticsDebug();
    }

    // Set up user engagement tracking
    const cleanup = trackUserEngagement();
    
    return cleanup;
  }, [measurementId, debug]);

  useEffect(() => {
    if (!measurementId) return;

    // Track page views on route changes
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);
  }, [pathname, searchParams, measurementId]);

  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
              debug_mode: ${debug},
              // Enhanced measurement settings
              enhanced_measurement: {
                scrolls: true,
                outbound_clicks: true,
                site_search: true,
                video_engagement: true,
                file_downloads: true,
              },
              // Privacy settings
              anonymize_ip: true,
              allow_google_signals: false,
              allow_ad_personalization_signals: false,
            });
          `,
        }}
      />
    </>
  );
}

// Hook pour utiliser les analytics dans les composants
export function useAnalytics() {
  const trackClick = (elementName: string, location?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'click', {
        event_category: 'engagement',
        event_label: elementName,
        custom_parameter_1: location,
      });
    }
  };

  const trackFormSubmission = (formName: string, success: boolean) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', success ? 'form_submit_success' : 'form_submit_error', {
        event_category: 'form_interaction',
        event_label: formName,
      });
    }
  };

  const trackDownload = (fileName: string, fileType: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'file_download', {
        event_category: 'engagement',
        event_label: fileName,
        custom_parameter_1: fileType,
      });
    }
  };

  return {
    trackClick,
    trackFormSubmission,
    trackDownload,
  };
}