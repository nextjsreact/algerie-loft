// Google Tag Manager implementation
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export const initGTM = () => {
  if (!GTM_ID) return;

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  
  // Push GTM initialization
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js'
  });

  // Load GTM script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(script);
};

// Push custom events to dataLayer
export const pushToDataLayer = (data: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(data);
  }
};

// Track page views
export const trackGTMPageView = (pagePath: string, pageTitle: string) => {
  pushToDataLayer({
    event: 'page_view',
    page_path: pagePath,
    page_title: pageTitle,
    page_location: window.location.href
  });
};

// Track form interactions
export const trackGTMFormInteraction = (
  formName: string,
  action: 'start' | 'submit' | 'error',
  fieldName?: string
) => {
  pushToDataLayer({
    event: 'form_interaction',
    form_name: formName,
    form_action: action,
    field_name: fieldName
  });
};

// Track contact events
export const trackGTMContact = (method: string, source: string) => {
  pushToDataLayer({
    event: 'contact_interaction',
    contact_method: method,
    contact_source: source
  });
};

// Track property interactions
export const trackGTMProperty = (
  action: 'view' | 'inquiry' | 'favorite',
  propertyId: string,
  propertyType: string
) => {
  pushToDataLayer({
    event: 'property_interaction',
    property_action: action,
    property_id: propertyId,
    property_type: propertyType
  });
};

// Track service interactions
export const trackGTMService = (serviceName: string, action: 'view' | 'inquiry') => {
  pushToDataLayer({
    event: 'service_interaction',
    service_name: serviceName,
    service_action: action
  });
};

// Track user engagement
export const trackGTMEngagement = (
  engagementType: 'scroll' | 'time_on_page' | 'click',
  value: number | string
) => {
  pushToDataLayer({
    event: 'user_engagement',
    engagement_type: engagementType,
    engagement_value: value
  });
};