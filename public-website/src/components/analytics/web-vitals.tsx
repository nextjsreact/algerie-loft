'use client';

import { useEffect } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

interface WebVitalsProps {
  debug?: boolean;
}

export function WebVitals({ debug = false }: WebVitalsProps) {
  useEffect(() => {
    // Function to send metrics to analytics
    const sendToAnalytics = (metric: any) => {
      if (debug) {
        console.log('Web Vital:', metric);
      }

      // Send to Google Analytics 4
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', metric.name, {
          event_category: 'Web Vitals',
          event_label: metric.id,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          non_interaction: true,
        });
      }

      // Send to custom analytics endpoint
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/analytics/web-vitals', {
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
        }).catch((error) => {
          if (debug) {
            console.error('Failed to send web vital:', error);
          }
        });
      }
    };

    // Collect all Core Web Vitals
    onCLS(sendToAnalytics);
    onINP(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  }, [debug]);

  return null;
}

// Performance observer for additional metrics
export function PerformanceMonitor({ debug = false }: { debug?: boolean }) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Monitor Long Tasks
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (debug) {
            console.log('Long Task detected:', entry);
          }
          
          // Send long task data to analytics
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'long_task', {
              event_category: 'Performance',
              event_label: 'Long Task',
              value: Math.round(entry.duration),
              custom_map: {
                start_time: entry.startTime,
                duration: entry.duration,
              },
            });
          }
        });
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      if (debug) {
        console.warn('Long Task Observer not supported:', error);
      }
    }

    // Monitor Layout Shifts
    try {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.hadRecentInput) return; // Ignore shifts caused by user input
          
          if (debug) {
            console.log('Layout Shift detected:', entry);
          }
        });
      });

      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      if (debug) {
        console.warn('Layout Shift Observer not supported:', error);
      }
    }

    // Monitor Resource Loading
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // Track slow loading resources
          if (entry.duration > 1000) { // Resources taking more than 1 second
            if (debug) {
              console.log('Slow resource detected:', entry);
            }
            
            if (typeof window !== 'undefined' && (window as any).gtag) {
              (window as any).gtag('event', 'slow_resource', {
                event_category: 'Performance',
                event_label: entry.name,
                value: Math.round(entry.duration),
              });
            }
          }
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      if (debug) {
        console.warn('Resource Observer not supported:', error);
      }
    }
  }, [debug]);

  return null;
}

// Component to track page load performance
export function PageLoadTracker({ debug = false }: { debug?: boolean }) {
  useEffect(() => {
    const trackPageLoad = () => {
      if (typeof window === 'undefined') return;

      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const metrics = {
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp: navigation.connectEnd - navigation.connectStart,
          ssl: navigation.connectEnd - navigation.secureConnectionStart,
          ttfb: navigation.responseStart - navigation.requestStart,
          download: navigation.responseEnd - navigation.responseStart,
          domParse: navigation.domContentLoadedEventStart - navigation.responseEnd,
          domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          onLoad: navigation.loadEventEnd - navigation.loadEventStart,
          total: navigation.loadEventEnd - navigation.fetchStart,
        };

        if (debug) {
          console.log('Page Load Metrics:', metrics);
        }

        // Send to analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          Object.entries(metrics).forEach(([key, value]) => {
            if (value > 0) {
              (window as any).gtag('event', `page_load_${key}`, {
                event_category: 'Page Load',
                event_label: key.toUpperCase(),
                value: Math.round(value),
              });
            }
          });
        }
      }
    };

    // Track when page is fully loaded
    if (document.readyState === 'complete') {
      trackPageLoad();
    } else {
      window.addEventListener('load', trackPageLoad);
      return () => window.removeEventListener('load', trackPageLoad);
    }
  }, [debug]);

  return null;
}