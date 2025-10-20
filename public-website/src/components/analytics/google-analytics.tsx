'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

interface GoogleAnalyticsProps {
  measurementId: string;
  debug?: boolean;
}

export function GoogleAnalytics({ measurementId, debug = false }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!measurementId || typeof window === 'undefined') return;

    // Track page views
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    
    if ((window as any).gtag) {
      (window as any).gtag('config', measurementId, {
        page_path: url,
        debug_mode: debug,
      });
      
      if (debug) {
        console.log('GA4 Page View:', url);
      }
    }
  }, [pathname, searchParams, measurementId, debug]);

  if (!measurementId) {
    if (debug) {
      console.warn('Google Analytics measurement ID not provided');
    }
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
              // Custom parameters
              custom_map: {
                'custom_parameter_1': 'page_type',
                'custom_parameter_2': 'user_type',
              },
              // Cookie settings
              cookie_flags: 'SameSite=None;Secure',
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

// Hook for tracking custom events
export function useGoogleAnalytics() {
  const trackEvent = (
    eventName: string,
    parameters: Record<string, any> = {}
  ) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, parameters);
    }
  };

  const trackPageView = (url: string, title?: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
        page_path: url,
        page_title: title,
      });
    }
  };

  const trackConversion = (conversionId: string, value?: number, currency?: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        send_to: conversionId,
        value: value,
        currency: currency || 'DZD',
      });
    }
  };

  const trackFormSubmission = (formName: string, formId?: string) => {
    trackEvent('form_submit', {
      event_category: 'Form',
      event_label: formName,
      form_id: formId,
    });
  };

  const trackContactAttempt = (method: 'phone' | 'email' | 'form' | 'whatsapp') => {
    trackEvent('contact_attempt', {
      event_category: 'Contact',
      event_label: method,
      method: method,
    });
  };

  const trackPropertyView = (propertyId: string, propertyType: string) => {
    trackEvent('view_item', {
      event_category: 'Property',
      event_label: propertyId,
      item_id: propertyId,
      item_category: propertyType,
    });
  };

  const trackServiceView = (serviceName: string, serviceCategory: string) => {
    trackEvent('view_item', {
      event_category: 'Service',
      event_label: serviceName,
      item_name: serviceName,
      item_category: serviceCategory,
    });
  };

  const trackDownload = (fileName: string, fileType: string) => {
    trackEvent('file_download', {
      event_category: 'Download',
      event_label: fileName,
      file_name: fileName,
      file_extension: fileType,
    });
  };

  const trackOutboundClick = (url: string, linkText?: string) => {
    trackEvent('click', {
      event_category: 'Outbound Link',
      event_label: url,
      link_url: url,
      link_text: linkText,
    });
  };

  const trackSearch = (searchTerm: string, resultsCount?: number) => {
    trackEvent('search', {
      event_category: 'Search',
      event_label: searchTerm,
      search_term: searchTerm,
      results_count: resultsCount,
    });
  };

  const trackUserEngagement = (engagementType: string, value?: number) => {
    trackEvent('user_engagement', {
      event_category: 'Engagement',
      event_label: engagementType,
      engagement_time_msec: value,
    });
  };

  return {
    trackEvent,
    trackPageView,
    trackConversion,
    trackFormSubmission,
    trackContactAttempt,
    trackPropertyView,
    trackServiceView,
    trackDownload,
    trackOutboundClick,
    trackSearch,
    trackUserEngagement,
  };
}

// Component for tracking scroll depth
export function ScrollDepthTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const scrollDepths = [25, 50, 75, 90, 100];
    const triggeredDepths = new Set<number>();

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / documentHeight) * 100);

      scrollDepths.forEach((depth) => {
        if (scrollPercent >= depth && !triggeredDepths.has(depth)) {
          triggeredDepths.add(depth);
          
          if ((window as any).gtag) {
            (window as any).gtag('event', 'scroll', {
              event_category: 'Engagement',
              event_label: `${depth}%`,
              value: depth,
            });
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return null;
}