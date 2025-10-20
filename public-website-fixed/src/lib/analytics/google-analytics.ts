// Google Analytics 4 configuration and utilities

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Initialize Google Analytics
export function initGA() {
  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics Measurement ID not found');
    return;
  }

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
    // Enhanced measurement
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
}

// Track page views
export function trackPageView(url: string, title?: string) {
  if (!GA_MEASUREMENT_ID) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
    page_title: title || document.title,
  });
}

// Track custom events
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (!GA_MEASUREMENT_ID) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

// Track business-specific events
export const BusinessEvents = {
  // Contact events
  contactFormSubmit: (method: 'email' | 'phone' | 'form') => {
    trackEvent('contact_form_submit', 'engagement', method);
  },

  contactButtonClick: (location: string) => {
    trackEvent('contact_button_click', 'engagement', location);
  },

  // Service events
  serviceView: (serviceName: string) => {
    trackEvent('service_view', 'services', serviceName);
  },

  serviceInquiry: (serviceName: string) => {
    trackEvent('service_inquiry', 'lead_generation', serviceName);
  },

  // Property events
  propertyView: (propertyId: string, propertyType: string) => {
    trackEvent('property_view', 'portfolio', `${propertyType}_${propertyId}`);
  },

  propertyInquiry: (propertyId: string) => {
    trackEvent('property_inquiry', 'lead_generation', propertyId);
  },

  // Language events
  languageChange: (fromLang: string, toLang: string) => {
    trackEvent('language_change', 'internationalization', `${fromLang}_to_${toLang}`);
  },

  // Navigation events
  navigationClick: (section: string, page: string) => {
    trackEvent('navigation_click', 'navigation', `${section}_${page}`);
  },

  // Download events
  brochureDownload: (brochureType: string) => {
    trackEvent('brochure_download', 'engagement', brochureType);
  },

  // Social events
  socialShare: (platform: string, content: string) => {
    trackEvent('social_share', 'engagement', `${platform}_${content}`);
  },

  // Performance events
  pageLoadTime: (loadTime: number, page: string) => {
    trackEvent('page_load_time', 'performance', page, loadTime);
  },
};

// Enhanced ecommerce tracking (for future use)
export function trackPurchase(transactionId: string, value: number, currency: string = 'EUR') {
  if (!GA_MEASUREMENT_ID) return;

  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    value: value,
    currency: currency,
  });
}

// User engagement tracking
export function trackUserEngagement() {
  if (!GA_MEASUREMENT_ID) return;

  // Track scroll depth
  let maxScroll = 0;
  const trackScroll = () => {
    const scrollPercent = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    
    if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
      maxScroll = scrollPercent;
      trackEvent('scroll_depth', 'engagement', `${scrollPercent}%`);
    }
  };

  // Track time on page
  const startTime = Date.now();
  const trackTimeOnPage = () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    if (timeSpent > 0 && timeSpent % 30 === 0) { // Every 30 seconds
      trackEvent('time_on_page', 'engagement', `${timeSpent}s`);
    }
  };

  window.addEventListener('scroll', trackScroll);
  const timeInterval = setInterval(trackTimeOnPage, 30000);

  // Cleanup function
  return () => {
    window.removeEventListener('scroll', trackScroll);
    clearInterval(timeInterval);
  };
}

// GDPR compliance utilities
export function setAnalyticsConsent(granted: boolean) {
  if (!GA_MEASUREMENT_ID) return;

  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: 'denied', // Always deny ad storage for privacy
  });
}

// Debug mode for development
export function enableAnalyticsDebug() {
  if (process.env.NODE_ENV === 'development') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      debug_mode: true,
    });
  }
}