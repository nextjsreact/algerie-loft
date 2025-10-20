// Google Analytics 4 configuration and utilities

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Enhanced ecommerce events for property management business
export interface GAEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

// Business-specific event tracking
export const GAEvents = {
  // Lead generation events
  CONTACT_FORM_SUBMIT: 'contact_form_submit',
  PHONE_CLICK: 'phone_click',
  EMAIL_CLICK: 'email_click',
  WHATSAPP_CLICK: 'whatsapp_click',
  
  // Property events
  PROPERTY_VIEW: 'property_view',
  PROPERTY_INQUIRY: 'property_inquiry',
  PROPERTY_GALLERY_VIEW: 'property_gallery_view',
  PROPERTY_SHARE: 'property_share',
  
  // Service events
  SERVICE_VIEW: 'service_view',
  SERVICE_INQUIRY: 'service_inquiry',
  QUOTE_REQUEST: 'quote_request',
  
  // Engagement events
  SCROLL_DEPTH: 'scroll_depth',
  VIDEO_PLAY: 'video_play',
  VIDEO_COMPLETE: 'video_complete',
  FILE_DOWNLOAD: 'file_download',
  EXTERNAL_LINK_CLICK: 'external_link_click',
  
  // Search events
  SEARCH: 'search',
  SEARCH_RESULTS_VIEW: 'search_results_view',
  
  // Newsletter events
  NEWSLETTER_SIGNUP: 'newsletter_signup',
  
  // Social media events
  SOCIAL_SHARE: 'social_share',
  SOCIAL_FOLLOW: 'social_follow',
  
  // Error events
  ERROR_404: 'error_404',
  FORM_ERROR: 'form_error',
  API_ERROR: 'api_error',
};

// Initialize Google Analytics
export function initGA() {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  // Load gtag script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
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
      custom_parameter_1: 'page_type',
      custom_parameter_2: 'user_type',
      custom_parameter_3: 'property_type',
      custom_parameter_4: 'service_category',
    },
    
    // Privacy settings
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    
    // Cookie settings
    cookie_flags: 'SameSite=None;Secure',
    cookie_expires: 63072000, // 2 years
    
    // Debug mode for development
    debug_mode: process.env.NODE_ENV === 'development',
  });

  // Make gtag globally available
  (window as any).gtag = gtag;
}

// Track page views
export function trackPageView(url: string, title?: string) {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  (window as any).gtag?.('config', GA_MEASUREMENT_ID, {
    page_path: url,
    page_title: title,
  });
}

// Track custom events
export function trackEvent(eventName: string, parameters: Record<string, any> = {}) {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  (window as any).gtag?.('event', eventName, {
    event_category: parameters.category || 'General',
    event_label: parameters.label,
    value: parameters.value,
    ...parameters,
  });
}

// Business-specific tracking functions
export const GATracking = {
  // Lead generation tracking
  trackContactFormSubmission: (formType: string, source: string) => {
    trackEvent(GAEvents.CONTACT_FORM_SUBMIT, {
      category: 'Lead Generation',
      label: formType,
      form_type: formType,
      source: source,
      conversion: true,
    });
    
    // Track as conversion
    trackEvent('generate_lead', {
      currency: 'DZD',
      value: 100, // Estimated lead value
      lead_type: formType,
      source: source,
    });
  },

  trackPhoneClick: (source: string, phoneNumber?: string) => {
    trackEvent(GAEvents.PHONE_CLICK, {
      category: 'Contact',
      label: source,
      contact_method: 'phone',
      phone_number: phoneNumber,
      source: source,
    });
  },

  trackEmailClick: (source: string, emailAddress?: string) => {
    trackEvent(GAEvents.EMAIL_CLICK, {
      category: 'Contact',
      label: source,
      contact_method: 'email',
      email_address: emailAddress,
      source: source,
    });
  },

  trackWhatsAppClick: (source: string) => {
    trackEvent(GAEvents.WHATSAPP_CLICK, {
      category: 'Contact',
      label: source,
      contact_method: 'whatsapp',
      source: source,
    });
  },

  // Property tracking
  trackPropertyView: (propertyId: string, propertyType: string, propertyLocation?: string) => {
    trackEvent(GAEvents.PROPERTY_VIEW, {
      category: 'Property',
      label: propertyId,
      property_id: propertyId,
      property_type: propertyType,
      property_location: propertyLocation,
    });

    // Enhanced ecommerce view_item event
    trackEvent('view_item', {
      currency: 'DZD',
      value: 0,
      items: [{
        item_id: propertyId,
        item_name: `Property ${propertyId}`,
        item_category: propertyType,
        item_category2: propertyLocation,
        quantity: 1,
      }],
    });
  },

  trackPropertyInquiry: (propertyId: string, propertyType: string, inquiryType: string) => {
    trackEvent(GAEvents.PROPERTY_INQUIRY, {
      category: 'Property',
      label: propertyId,
      property_id: propertyId,
      property_type: propertyType,
      inquiry_type: inquiryType,
      conversion: true,
    });

    // Track as conversion
    trackEvent('generate_lead', {
      currency: 'DZD',
      value: 150, // Estimated property inquiry value
      lead_type: 'property_inquiry',
      property_id: propertyId,
      property_type: propertyType,
    });
  },

  trackPropertyShare: (propertyId: string, platform: string) => {
    trackEvent(GAEvents.PROPERTY_SHARE, {
      category: 'Property',
      label: propertyId,
      property_id: propertyId,
      share_platform: platform,
    });
  },

  // Service tracking
  trackServiceView: (serviceName: string, serviceCategory: string) => {
    trackEvent(GAEvents.SERVICE_VIEW, {
      category: 'Service',
      label: serviceName,
      service_name: serviceName,
      service_category: serviceCategory,
    });
  },

  trackServiceInquiry: (serviceName: string, serviceCategory: string) => {
    trackEvent(GAEvents.SERVICE_INQUIRY, {
      category: 'Service',
      label: serviceName,
      service_name: serviceName,
      service_category: serviceCategory,
      conversion: true,
    });

    // Track as conversion
    trackEvent('generate_lead', {
      currency: 'DZD',
      value: 200, // Estimated service inquiry value
      lead_type: 'service_inquiry',
      service_name: serviceName,
      service_category: serviceCategory,
    });
  },

  trackQuoteRequest: (serviceType: string, estimatedValue?: number) => {
    trackEvent(GAEvents.QUOTE_REQUEST, {
      category: 'Service',
      label: serviceType,
      service_type: serviceType,
      estimated_value: estimatedValue,
      conversion: true,
    });

    // Track as conversion
    trackEvent('generate_lead', {
      currency: 'DZD',
      value: estimatedValue || 300,
      lead_type: 'quote_request',
      service_type: serviceType,
    });
  },

  // Engagement tracking
  trackScrollDepth: (percentage: number) => {
    trackEvent(GAEvents.SCROLL_DEPTH, {
      category: 'Engagement',
      label: `${percentage}%`,
      scroll_depth: percentage,
    });
  },

  trackVideoPlay: (videoTitle: string, videoId?: string) => {
    trackEvent(GAEvents.VIDEO_PLAY, {
      category: 'Video',
      label: videoTitle,
      video_title: videoTitle,
      video_id: videoId,
    });
  },

  trackVideoComplete: (videoTitle: string, videoId?: string, duration?: number) => {
    trackEvent(GAEvents.VIDEO_COMPLETE, {
      category: 'Video',
      label: videoTitle,
      video_title: videoTitle,
      video_id: videoId,
      video_duration: duration,
    });
  },

  trackFileDownload: (fileName: string, fileType: string, fileSize?: number) => {
    trackEvent(GAEvents.FILE_DOWNLOAD, {
      category: 'Download',
      label: fileName,
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
    });
  },

  trackExternalLinkClick: (url: string, linkText?: string) => {
    trackEvent(GAEvents.EXTERNAL_LINK_CLICK, {
      category: 'Outbound Link',
      label: url,
      link_url: url,
      link_text: linkText,
    });
  },

  // Search tracking
  trackSearch: (searchTerm: string, resultsCount?: number, searchCategory?: string) => {
    trackEvent(GAEvents.SEARCH, {
      category: 'Search',
      label: searchTerm,
      search_term: searchTerm,
      results_count: resultsCount,
      search_category: searchCategory,
    });
  },

  // Newsletter tracking
  trackNewsletterSignup: (source: string, email?: string) => {
    trackEvent(GAEvents.NEWSLETTER_SIGNUP, {
      category: 'Newsletter',
      label: source,
      signup_source: source,
      email: email,
      conversion: true,
    });

    // Track as conversion
    trackEvent('sign_up', {
      method: 'email',
      source: source,
    });
  },

  // Social media tracking
  trackSocialShare: (platform: string, contentType: string, contentId?: string) => {
    trackEvent(GAEvents.SOCIAL_SHARE, {
      category: 'Social Media',
      label: platform,
      social_platform: platform,
      content_type: contentType,
      content_id: contentId,
    });
  },

  trackSocialFollow: (platform: string, source: string) => {
    trackEvent(GAEvents.SOCIAL_FOLLOW, {
      category: 'Social Media',
      label: platform,
      social_platform: platform,
      follow_source: source,
    });
  },

  // Error tracking
  trackError: (errorType: string, errorMessage: string, errorLocation?: string) => {
    trackEvent('exception', {
      description: errorMessage,
      fatal: false,
      error_type: errorType,
      error_location: errorLocation,
    });
  },

  track404Error: (requestedUrl: string, referrer?: string) => {
    trackEvent(GAEvents.ERROR_404, {
      category: 'Error',
      label: requestedUrl,
      requested_url: requestedUrl,
      referrer: referrer,
    });
  },

  trackFormError: (formName: string, errorField: string, errorMessage: string) => {
    trackEvent(GAEvents.FORM_ERROR, {
      category: 'Form Error',
      label: formName,
      form_name: formName,
      error_field: errorField,
      error_message: errorMessage,
    });
  },

  trackAPIError: (endpoint: string, statusCode: number, errorMessage: string) => {
    trackEvent(GAEvents.API_ERROR, {
      category: 'API Error',
      label: endpoint,
      api_endpoint: endpoint,
      status_code: statusCode,
      error_message: errorMessage,
    });
  },
};

// Enhanced ecommerce tracking for property management
export const GAEcommerce = {
  // Track property viewing as product view
  viewProperty: (property: {
    id: string;
    name: string;
    category: string;
    location?: string;
    price?: number;
  }) => {
    trackEvent('view_item', {
      currency: 'DZD',
      value: property.price || 0,
      items: [{
        item_id: property.id,
        item_name: property.name,
        item_category: property.category,
        item_category2: property.location,
        price: property.price || 0,
        quantity: 1,
      }],
    });
  },

  // Track service selection
  selectService: (service: {
    id: string;
    name: string;
    category: string;
    price?: number;
  }) => {
    trackEvent('select_item', {
      currency: 'DZD',
      value: service.price || 0,
      items: [{
        item_id: service.id,
        item_name: service.name,
        item_category: service.category,
        price: service.price || 0,
        quantity: 1,
      }],
    });
  },

  // Track lead generation as purchase
  generateLead: (lead: {
    type: string;
    value: number;
    source: string;
    items?: Array<{
      id: string;
      name: string;
      category: string;
    }>;
  }) => {
    trackEvent('purchase', {
      transaction_id: `lead_${Date.now()}`,
      currency: 'DZD',
      value: lead.value,
      lead_type: lead.type,
      lead_source: lead.source,
      items: lead.items?.map(item => ({
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: lead.value / (lead.items?.length || 1),
        quantity: 1,
      })) || [],
    });
  },
};

// Utility functions
export const GAUtils = {
  // Check if GA is loaded
  isLoaded: (): boolean => {
    return typeof window !== 'undefined' && !!(window as any).gtag;
  },

  // Get client ID
  getClientId: (): Promise<string> => {
    return new Promise((resolve) => {
      if (!GAUtils.isLoaded()) {
        resolve('');
        return;
      }

      (window as any).gtag('get', GA_MEASUREMENT_ID, 'client_id', (clientId: string) => {
        resolve(clientId);
      });
    });
  },

  // Set user properties
  setUserProperties: (properties: Record<string, any>) => {
    if (!GAUtils.isLoaded()) return;

    (window as any).gtag('config', GA_MEASUREMENT_ID, {
      user_properties: properties,
    });
  },

  // Set custom dimensions
  setCustomDimensions: (dimensions: Record<string, any>) => {
    if (!GAUtils.isLoaded()) return;

    (window as any).gtag('config', GA_MEASUREMENT_ID, {
      custom_map: dimensions,
    });
  },
};

// Type declarations for window.gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}