// =====================================================
// ANALYTICS AND TRACKING SYSTEM
// =====================================================
// Comprehensive analytics for user behavior and business metrics
// Requirements: 10.4, 10.5
// =====================================================

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// =====================================================
// ANALYTICS CONFIGURATION
// =====================================================
const ANALYTICS_CONFIG = {
  // Google Analytics
  googleAnalytics: {
    enabled: process.env.NEXT_PUBLIC_GA_ID !== undefined,
    measurementId: process.env.NEXT_PUBLIC_GA_ID,
    config: {
      page_title: document?.title,
      page_location: window?.location?.href,
      send_page_view: true,
      anonymize_ip: true,
      cookie_flags: 'SameSite=Strict;Secure'
    }
  },

  // Custom analytics
  customAnalytics: {
    enabled: true,
    endpoint: '/api/analytics',
    batchSize: 10,
    flushInterval: 30000, // 30 seconds
    sessionTimeout: 1800000 // 30 minutes
  },

  // Performance monitoring
  performance: {
    enabled: true,
    sampleRate: 0.1, // 10% sampling
    thresholds: {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      fcp: 1800,
      ttfb: 800
    }
  },

  // Business metrics
  business: {
    enabled: true,
    trackReservations: true,
    trackPayments: true,
    trackUserJourney: true,
    trackConversions: true
  }
};

// =====================================================
// ANALYTICS CLASS
// =====================================================
class Analytics {
  constructor() {
    this.isInitialized = false;
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.eventQueue = [];
    this.performanceMetrics = {};
    
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  // Initialize analytics
  init() {
    if (this.isInitialized) return;

    // Initialize Google Analytics
    if (ANALYTICS_CONFIG.googleAnalytics.enabled) {
      this.initGoogleAnalytics();
    }

    // Initialize performance monitoring
    if (ANALYTICS_CONFIG.performance.enabled) {
      this.initPerformanceMonitoring();
    }

    // Set up event listeners
    this.setupEventListeners();

    // Start batch processing
    this.startBatchProcessing();

    this.isInitialized = true;
    console.log('Analytics initialized');
  }

  // Initialize Google Analytics
  initGoogleAnalytics() {
    const { measurementId, config } = ANALYTICS_CONFIG.googleAnalytics;
    
    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    
    window.gtag('js', new Date());
    window.gtag('config', measurementId, config);
  }

  // Initialize performance monitoring
  initPerformanceMonitoring() {
    // Web Vitals
    getCLS(this.handlePerformanceMetric.bind(this));
    getFID(this.handlePerformanceMetric.bind(this));
    getFCP(this.handlePerformanceMetric.bind(this));
    getLCP(this.handlePerformanceMetric.bind(this));
    getTTFB(this.handlePerformanceMetric.bind(this));

    // Custom performance metrics
    this.trackNavigationTiming();
    this.trackResourceTiming();
  }

  // Handle performance metrics
  handlePerformanceMetric(metric) {
    const { name, value, id } = metric;
    
    // Store metric
    this.performanceMetrics[name] = value;

    // Check thresholds
    const threshold = ANALYTICS_CONFIG.performance.thresholds[name.toLowerCase()];
    const status = threshold && value > threshold ? 'poor' : 'good';

    // Track metric
    this.track('performance_metric', {
      metric_name: name,
      metric_value: value,
      metric_id: id,
      status,
      threshold,
      url: window.location.pathname
    });

    // Send to Google Analytics
    if (ANALYTICS_CONFIG.googleAnalytics.enabled && window.gtag) {
      window.gtag('event', name, {
        event_category: 'Web Vitals',
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        event_label: id,
        non_interaction: true
      });
    }
  }

  // Track navigation timing
  trackNavigationTiming() {
    if (!window.performance || !window.performance.timing) return;

    const timing = window.performance.timing;
    const navigationStart = timing.navigationStart;

    const metrics = {
      dns_lookup: timing.domainLookupEnd - timing.domainLookupStart,
      tcp_connect: timing.connectEnd - timing.connectStart,
      server_response: timing.responseStart - timing.requestStart,
      dom_processing: timing.domComplete - timing.domLoading,
      page_load: timing.loadEventEnd - navigationStart
    };

    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        this.track('navigation_timing', {
          metric_name: name,
          metric_value: value,
          url: window.location.pathname
        });
      }
    });
  }

  // Track resource timing
  trackResourceTiming() {
    if (!window.performance || !window.performance.getEntriesByType) return;

    const resources = window.performance.getEntriesByType('resource');
    const slowResources = resources.filter(resource => resource.duration > 1000);

    slowResources.forEach(resource => {
      this.track('slow_resource', {
        resource_name: resource.name,
        resource_type: resource.initiatorType,
        duration: resource.duration,
        size: resource.transferSize || 0
      });
    });
  }

  // Set up event listeners
  setupEventListeners() {
    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.track('page_visibility', {
        visibility_state: document.visibilityState
      });
    });

    // Unload events
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Error tracking
    window.addEventListener('error', (event) => {
      this.trackError(event.error, {
        type: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(event.reason, {
        type: 'unhandled_promise_rejection'
      });
    });
  }

  // Generate session ID
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set user ID
  setUserId(userId) {
    this.userId = userId;
    
    if (ANALYTICS_CONFIG.googleAnalytics.enabled && window.gtag) {
      window.gtag('config', ANALYTICS_CONFIG.googleAnalytics.measurementId, {
        user_id: userId
      });
    }
  }

  // Track event
  track(eventName, properties = {}) {
    const event = {
      event: eventName,
      properties: {
        ...properties,
        timestamp: Date.now(),
        session_id: this.sessionId,
        user_id: this.userId,
        url: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`
      }
    };

    // Add to queue
    this.eventQueue.push(event);

    // Send to Google Analytics
    if (ANALYTICS_CONFIG.googleAnalytics.enabled && window.gtag) {
      window.gtag('event', eventName, {
        event_category: properties.category || 'General',
        event_label: properties.label,
        value: properties.value,
        custom_parameters: properties
      });
    }

    // Flush if queue is full
    if (this.eventQueue.length >= ANALYTICS_CONFIG.customAnalytics.batchSize) {
      this.flush();
    }
  }

  // Track page view
  trackPageView(path, title) {
    this.track('page_view', {
      page_path: path || window.location.pathname,
      page_title: title || document.title,
      category: 'Navigation'
    });
  }

  // Track user interaction
  trackInteraction(element, action, properties = {}) {
    this.track('user_interaction', {
      element_type: element.tagName?.toLowerCase(),
      element_id: element.id,
      element_class: element.className,
      action,
      ...properties,
      category: 'Interaction'
    });
  }

  // Track form submission
  trackFormSubmission(formName, success, errors = []) {
    this.track('form_submission', {
      form_name: formName,
      success,
      errors: errors.join(', '),
      category: 'Form'
    });
  }

  // Track search
  trackSearch(query, results, filters = {}) {
    this.track('search', {
      search_query: query,
      results_count: results,
      filters: JSON.stringify(filters),
      category: 'Search'
    });
  }

  // Track reservation events
  trackReservation(action, reservationData = {}) {
    if (!ANALYTICS_CONFIG.business.trackReservations) return;

    this.track(`reservation_${action}`, {
      ...reservationData,
      category: 'Reservation'
    });
  }

  // Track payment events
  trackPayment(action, paymentData = {}) {
    if (!ANALYTICS_CONFIG.business.trackPayments) return;

    this.track(`payment_${action}`, {
      ...paymentData,
      category: 'Payment'
    });
  }

  // Track conversion events
  trackConversion(conversionType, value, currency = 'DZD') {
    if (!ANALYTICS_CONFIG.business.trackConversions) return;

    this.track('conversion', {
      conversion_type: conversionType,
      value,
      currency,
      category: 'Conversion'
    });

    // Send to Google Analytics as conversion
    if (ANALYTICS_CONFIG.googleAnalytics.enabled && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: `${Date.now()}-${Math.random()}`,
        value,
        currency,
        event_category: 'Ecommerce'
      });
    }
  }

  // Track error
  trackError(error, context = {}) {
    const errorData = {
      error_message: error?.message || 'Unknown error',
      error_stack: error?.stack,
      error_name: error?.name,
      ...context,
      category: 'Error'
    };

    this.track('error', errorData);

    // Send to Google Analytics
    if (ANALYTICS_CONFIG.googleAnalytics.enabled && window.gtag) {
      window.gtag('event', 'exception', {
        description: errorData.error_message,
        fatal: context.fatal || false
      });
    }
  }

  // Start batch processing
  startBatchProcessing() {
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush();
      }
    }, ANALYTICS_CONFIG.customAnalytics.flushInterval);
  }

  // Flush events to server
  async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(ANALYTICS_CONFIG.customAnalytics.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events }),
        keepalive: true
      });

      if (!response.ok) {
        console.error('Failed to send analytics events:', response.statusText);
        // Re-add events to queue for retry
        this.eventQueue.unshift(...events);
      }
    } catch (error) {
      console.error('Analytics flush error:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...events);
    }
  }

  // Get performance summary
  getPerformanceSummary() {
    return {
      ...this.performanceMetrics,
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: Date.now()
    };
  }
}

// =====================================================
// ANALYTICS HOOKS FOR REACT
// =====================================================
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

// Hook for tracking page views
export const usePageTracking = () => {
  const router = useRouter();
  const analytics = useRef(null);

  useEffect(() => {
    if (!analytics.current) {
      analytics.current = new Analytics();
    }

    const handleRouteChange = (url) => {
      analytics.current.trackPageView(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    
    // Track initial page view
    analytics.current.trackPageView(router.asPath);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  return analytics.current;
};

// Hook for tracking interactions
export const useInteractionTracking = () => {
  const analytics = useRef(null);

  useEffect(() => {
    if (!analytics.current) {
      analytics.current = new Analytics();
    }
  }, []);

  const trackClick = (element, properties = {}) => {
    analytics.current?.trackInteraction(element, 'click', properties);
  };

  const trackFormSubmit = (formName, success, errors = []) => {
    analytics.current?.trackFormSubmission(formName, success, errors);
  };

  const trackSearch = (query, results, filters = {}) => {
    analytics.current?.trackSearch(query, results, filters);
  };

  return {
    trackClick,
    trackFormSubmit,
    trackSearch,
    analytics: analytics.current
  };
};

// =====================================================
// BUSINESS METRICS UTILITIES
// =====================================================
export const BusinessMetrics = {
  // Track reservation funnel
  trackReservationFunnel: (step, data = {}) => {
    const analytics = new Analytics();
    analytics.trackReservation(`funnel_${step}`, {
      funnel_step: step,
      ...data
    });
  },

  // Track conversion rate
  trackConversionRate: (conversionType, numerator, denominator) => {
    const analytics = new Analytics();
    const rate = denominator > 0 ? (numerator / denominator) * 100 : 0;
    
    analytics.track('conversion_rate', {
      conversion_type: conversionType,
      rate,
      numerator,
      denominator,
      category: 'Business'
    });
  },

  // Track revenue
  trackRevenue: (amount, currency = 'DZD', source = 'reservation') => {
    const analytics = new Analytics();
    analytics.track('revenue', {
      amount,
      currency,
      source,
      category: 'Business'
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================
export default Analytics;
export { ANALYTICS_CONFIG };

// =====================================================
// USAGE EXAMPLES
// =====================================================
/*
// In _app.js:
import Analytics, { usePageTracking } from '../lib/analytics';

export default function App({ Component, pageProps }) {
  usePageTracking();
  
  return <Component {...pageProps} />;
}

// In components:
import { useInteractionTracking } from '../lib/analytics';

const ReservationForm = () => {
  const { trackClick, trackFormSubmit } = useInteractionTracking();
  
  const handleSubmit = async (data) => {
    try {
      await submitReservation(data);
      trackFormSubmit('reservation_form', true);
    } catch (error) {
      trackFormSubmit('reservation_form', false, [error.message]);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <button onClick={(e) => trackClick(e.target, { button_type: 'submit' })}>
        Submit Reservation
      </button>
    </form>
  );
};
*/