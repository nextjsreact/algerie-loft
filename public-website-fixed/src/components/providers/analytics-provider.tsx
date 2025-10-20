'use client';

interface AnalyticsProviderProps {
  children: React.ReactNode;
  userId?: string;
  userEmail?: string;
  debug?: boolean;
}

export function AnalyticsProvider({ 
  children, 
  userId, 
  userEmail, 
  debug = false 
}: AnalyticsProviderProps) {
  // Simplified analytics provider - full implementation available but disabled for now
  // to prevent compilation errors
  
  if (debug) {
    console.log('Analytics Provider initialized', { userId, userEmail });
  }

  return <>{children}</>;
}

// Hook for comprehensive analytics tracking
export function useAnalytics() {
  const trackEvent = (eventName: string, properties: Record<string, any> = {}) => {
    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties);
    }
    
    // Custom analytics endpoint
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: eventName,
          properties: {
            ...properties,
            timestamp: Date.now(),
            url: window.location.href,
            referrer: document.referrer,
          },
        }),
      }).catch((error) => {
        console.error('Failed to track event:', error);
      });
    }
  };

  const trackPageView = (url: string, title?: string) => {
    trackEvent('page_view', {
      page_path: url,
      page_title: title,
    });
  };

  const trackUserAction = (action: string, category: string, label?: string, value?: number) => {
    trackEvent(action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  };

  const trackBusinessGoal = (goal: string, value?: number, currency?: string) => {
    trackEvent('business_goal', {
      goal_name: goal,
      goal_value: value,
      currency: currency || 'DZD',
    });
  };

  // Specific business tracking methods
  const trackContactFormSubmission = (formType: string, source: string) => {
    trackBusinessGoal('contact_form_submission');
    trackUserAction('form_submit', 'Contact', formType);
    trackEvent('generate_lead', {
      event_category: 'Lead Generation',
      form_type: formType,
      source: source,
    });
  };

  const trackPropertyInquiry = (propertyId: string, propertyType: string) => {
    trackBusinessGoal('property_inquiry');
    trackEvent('view_item', {
      event_category: 'Property',
      item_id: propertyId,
      item_category: propertyType,
    });
  };

  const trackServiceInterest = (serviceName: string, engagementType: string) => {
    trackBusinessGoal('service_interest');
    trackEvent('select_content', {
      event_category: 'Service',
      content_type: 'service',
      item_id: serviceName,
      engagement_type: engagementType,
    });
  };

  const trackPhoneCall = (source: string) => {
    trackBusinessGoal('phone_call', 1);
    trackEvent('contact_attempt', {
      event_category: 'Contact',
      method: 'phone',
      source: source,
    });
  };

  const trackEmailClick = (source: string) => {
    trackBusinessGoal('email_click', 1);
    trackEvent('contact_attempt', {
      event_category: 'Contact',
      method: 'email',
      source: source,
    });
  };

  const trackSocialMediaClick = (platform: string, source: string) => {
    trackEvent('social_media_click', {
      event_category: 'Social Media',
      platform: platform,
      source: source,
    });
  };

  const trackFileDownload = (fileName: string, fileType: string, source: string) => {
    trackEvent('file_download', {
      event_category: 'Download',
      file_name: fileName,
      file_type: fileType,
      source: source,
    });
  };

  const trackVideoPlay = (videoTitle: string, videoId: string, source: string) => {
    trackEvent('video_play', {
      event_category: 'Video',
      video_title: videoTitle,
      video_id: videoId,
      source: source,
    });
  };

  const trackSearchQuery = (query: string, resultsCount: number, source: string) => {
    trackEvent('search', {
      event_category: 'Search',
      search_term: query,
      results_count: resultsCount,
      source: source,
    });
  };

  const trackNewsletterSignup = (source: string) => {
    trackBusinessGoal('newsletter_signup');
    trackEvent('sign_up', {
      event_category: 'Newsletter',
      method: 'email',
      source: source,
    });
  };

  return {
    trackEvent,
    trackPageView,
    trackUserAction,
    trackBusinessGoal,
    trackContactFormSubmission,
    trackPropertyInquiry,
    trackServiceInterest,
    trackPhoneCall,
    trackEmailClick,
    trackSocialMediaClick,
    trackFileDownload,
    trackVideoPlay,
    trackSearchQuery,
    trackNewsletterSignup,
  };
}