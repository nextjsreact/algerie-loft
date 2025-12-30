// Google Analytics 4 configuration and utilities

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Check if GA is enabled
export const isGAEnabled = GA_TRACKING_ID && typeof window !== 'undefined';

// Initialize Google Analytics
export function initGA() {
  if (!isGAEnabled) return;

  // Load gtag script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_TRACKING_ID, {
    page_title: document.title,
    page_location: window.location.href,
    // Enhanced measurement settings
    enhanced_measurement: {
      scrolls: true,
      outbound_clicks: true,
      site_search: true,
      video_engagement: true,
      file_downloads: true,
    },
    // Custom dimensions for Web Vitals
    custom_map: {
      custom_parameter_1: 'metric_id',
      custom_parameter_2: 'metric_value',
      custom_parameter_3: 'metric_delta',
    },
  });
}

// Track page views
export function trackPageView(url: string, title?: string) {
  if (!isGAEnabled) return;

  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
    page_title: title || document.title,
  });
}

// Track custom events
export function trackEvent(
  action: string,
  category: string = 'engagement',
  label?: string,
  value?: number,
  customParameters?: Record<string, any>
) {
  if (!isGAEnabled) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
    ...customParameters,
  });
}

// Track form submissions
export function trackFormSubmission(formName: string, success: boolean = true) {
  trackEvent('form_submit', 'forms', formName, success ? 1 : 0, {
    form_name: formName,
    success: success,
  });
}

// Track contact interactions
export function trackContact(method: 'email' | 'phone' | 'form', location?: string) {
  trackEvent('contact', 'engagement', method, 1, {
    contact_method: method,
    page_location: location || window.location.pathname,
  });
}

// Track property views
export function trackPropertyView(propertyId: string, propertyType?: string) {
  trackEvent('view_item', 'properties', propertyId, 1, {
    item_id: propertyId,
    item_category: propertyType || 'property',
    content_type: 'property',
  });
}

// Track service inquiries
export function trackServiceInquiry(serviceName: string) {
  trackEvent('generate_lead', 'services', serviceName, 1, {
    service_name: serviceName,
    lead_type: 'service_inquiry',
  });
}

// Track search usage
export function trackSearch(searchTerm: string, resultsCount?: number) {
  trackEvent('search', 'engagement', searchTerm, resultsCount, {
    search_term: searchTerm,
    results_count: resultsCount,
  });
}

// Track language changes
export function trackLanguageChange(fromLang: string, toLang: string) {
  trackEvent('language_change', 'i18n', `${fromLang}_to_${toLang}`, 1, {
    from_language: fromLang,
    to_language: toLang,
  });
}

// Track errors (for non-sensitive errors only)
export function trackError(errorType: string, errorMessage?: string, fatal: boolean = false) {
  trackEvent('exception', 'errors', errorType, fatal ? 1 : 0, {
    description: errorMessage?.substring(0, 100), // Limit error message length
    fatal: fatal,
  });
}

// Declare global gtag interface
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}