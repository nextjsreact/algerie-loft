import * as Sentry from '@sentry/nextjs';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: Map<string, PerformanceObserver> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Monitor long tasks (tasks that block the main thread for >50ms)
  monitorLongTasks() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`Long task detected: ${entry.duration}ms`);
            
            Sentry.addBreadcrumb({
              category: 'performance',
              message: `Long task: ${entry.duration}ms`,
              level: 'warning',
              data: {
                duration: entry.duration,
                startTime: entry.startTime,
              },
            });

            // Report critical long tasks to Sentry
            if (entry.duration > 100) {
              Sentry.captureMessage(`Critical long task: ${entry.duration}ms`, {
                level: 'warning',
                tags: {
                  performance: 'long-task',
                },
                extra: {
                  duration: entry.duration,
                  startTime: entry.startTime,
                },
              });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', observer);
    } catch (error) {
      console.error('Failed to monitor long tasks:', error);
    }
  }

  // Monitor layout shifts
  monitorLayoutShifts() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.value > 0.1) { // Significant layout shift
            console.warn(`Layout shift detected: ${entry.value}`);
            
            Sentry.addBreadcrumb({
              category: 'performance',
              message: `Layout shift: ${entry.value}`,
              level: 'warning',
              data: {
                value: entry.value,
                sources: entry.sources?.map((source: any) => ({
                  node: source.node?.tagName,
                  currentRect: source.currentRect,
                  previousRect: source.previousRect,
                })),
              },
            });
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('layout-shift', observer);
    } catch (error) {
      console.error('Failed to monitor layout shifts:', error);
    }
  }

  // Monitor resource loading performance
  monitorResourceTiming() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          
          // Check for slow resources (>2s)
          if (resource.duration > 2000) {
            console.warn(`Slow resource: ${resource.name} (${resource.duration}ms)`);
            
            Sentry.addBreadcrumb({
              category: 'performance',
              message: `Slow resource: ${resource.duration}ms`,
              level: 'warning',
              data: {
                name: resource.name,
                duration: resource.duration,
                size: resource.transferSize,
                type: resource.initiatorType,
              },
            });
          }

          // Check for failed resources
          if (resource.transferSize === 0 && resource.duration > 0) {
            Sentry.captureMessage(`Failed to load resource: ${resource.name}`, {
              level: 'error',
              tags: {
                performance: 'resource-error',
              },
              extra: {
                name: resource.name,
                type: resource.initiatorType,
              },
            });
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    } catch (error) {
      console.error('Failed to monitor resource timing:', error);
    }
  }

  // Monitor navigation timing
  monitorNavigationTiming() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          const metrics = {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            ssl: navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
            ttfb: navigation.responseStart - navigation.requestStart,
            download: navigation.responseEnd - navigation.responseStart,
            domParse: navigation.domContentLoadedEventStart - navigation.responseEnd,
            domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          };

          // Log navigation metrics
          console.log('[Performance] Navigation timing:', metrics);

          // Send to Sentry
          Sentry.addBreadcrumb({
            category: 'performance',
            message: 'Navigation timing',
            level: 'info',
            data: metrics,
          });

          // Alert on slow navigation
          if (navigation.loadEventEnd - navigation.navigationStart > 5000) {
            Sentry.captureMessage('Slow page load detected', {
              level: 'warning',
              tags: {
                performance: 'slow-navigation',
              },
              extra: metrics,
            });
          }
        }
      }, 0);
    });
  }

  // Initialize all monitoring
  init() {
    if (typeof window === 'undefined') return;

    this.monitorLongTasks();
    this.monitorLayoutShifts();
    this.monitorResourceTiming();
    this.monitorNavigationTiming();

    console.log('[Performance Monitor] Initialized');
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}

// Utility functions for manual performance tracking
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();
  
  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
        
        Sentry.addBreadcrumb({
          category: 'performance',
          message: `${name}: ${duration.toFixed(2)}ms`,
          level: 'info',
          data: { duration, name },
        });
      });
    } else {
      const duration = performance.now() - start;
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `${name}: ${duration.toFixed(2)}ms`,
        level: 'info',
        data: { duration, name },
      });
      
      return result;
    }
  } catch (error) {
    const duration = performance.now() - start;
    Sentry.captureException(error, {
      tags: {
        performance: 'measurement-error',
      },
      extra: {
        name,
        duration,
      },
    });
    throw error;
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    measure: measurePerformance,
    monitor: PerformanceMonitor.getInstance(),
  };
}