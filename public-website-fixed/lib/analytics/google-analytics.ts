// Google Analytics 4 implementation
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// Initialize Google Analytics
export const initGA = () => {
  if (!GA_TRACKING_ID) return;

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_TRACKING_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
};

// Track page views
export const trackPageView = (url: string, title?: string) => {
  if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

  window.gtag('config', GA_TRACKING_ID, {
    page_title: title || document.title,
    page_location: url,
  });
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Track form submissions
export const trackFormSubmission = (formName: string, success: boolean) => {
  trackEvent(
    success ? 'form_submit_success' : 'form_submit_error',
    'engagement',
    formName
  );
};

// Track contact interactions
export const trackContactInteraction = (method: 'email' | 'phone' | 'form') => {
  trackEvent('contact_interaction', 'engagement', method);
};

// Track property views
export const trackPropertyView = (propertyId: string, propertyType: string) => {
  trackEvent('property_view', 'engagement', `${propertyType}_${propertyId}`);
};

// Track service interest
export const trackServiceInterest = (serviceName: string) => {
  trackEvent('service_interest', 'engagement', serviceName);
};

// Track newsletter signup
export const trackNewsletterSignup = (source: string) => {
  trackEvent('newsletter_signup', 'engagement', source);
};

// Track file downloads
export const trackDownload = (fileName: string, fileType: string) => {
  trackEvent('file_download', 'engagement', `${fileType}_${fileName}`);
};

// Track external link clicks
export const trackExternalLink = (url: string, linkText?: string) => {
  trackEvent('external_link_click', 'engagement', linkText || url);
};

// Track scroll depth
export const trackScrollDepth = (percentage: number) => {
  trackEvent('scroll_depth', 'engagement', `${percentage}%`, percentage);
};

// Enhanced ecommerce tracking for lead generation
export const trackLead = (leadType: 'contact' | 'quote' | 'consultation', value?: number) => {
  if (!GA_TRACKING_ID || typeof window.gtag !== 'function') return;

  window.gtag('event', 'generate_lead', {
    currency: 'EUR',
    value: value || 0,
    lead_type: leadType,
  });
};