import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

// Google Analytics 4 event tracking
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

// Send Core Web Vitals to Google Analytics
function sendToGoogleAnalytics(metric: Metric) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
      custom_map: {
        metric_id: 'dimension1',
        metric_value: 'metric1',
        metric_delta: 'metric2',
      },
    });
  }
}

// Send Core Web Vitals to custom analytics endpoint
async function sendToAnalytics(metric: Metric) {
  try {
    await fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        delta: metric.delta,
        rating: metric.rating,
        navigationType: metric.navigationType,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    });
  } catch (error) {
    console.error('Failed to send web vitals:', error);
  }
}

// Combined handler for metrics
function handleMetric(metric: Metric) {
  // Send to Google Analytics
  sendToGoogleAnalytics(metric);
  
  // Send to custom analytics
  sendToAnalytics(metric);
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }
}

// Initialize Core Web Vitals tracking
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  try {
    onCLS(handleMetric);
    onINP(handleMetric);
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
  } catch (error) {
    console.error('Failed to initialize Web Vitals:', error);
  }
}

// Export individual metric collectors for custom usage
export {
  onCLS,
  onINP,
  onFCP,
  onLCP,
  onTTFB,
  type Metric,
};