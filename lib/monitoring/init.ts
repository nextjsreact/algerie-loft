'use client';

import { PerformanceMonitor } from './performance';

// Initialize all monitoring systems
export function initMonitoring() {
  if (typeof window === 'undefined') return;

  try {
    // Initialize performance monitoring
    const performanceMonitor = PerformanceMonitor.getInstance();
    performanceMonitor.init();

    // Monitor unhandled errors
    window.addEventListener('error', (event) => {
      console.error('Unhandled error:', event.error);
      
      // Don't send to Sentry here as it's already handled by Sentry's global handler
      // Just log for debugging
    });

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Don't send to Sentry here as it's already handled by Sentry's global handler
      // Just log for debugging
    });

    // Monitor visibility changes (for analytics)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Page is being hidden, good time to send any pending analytics
        console.log('[Monitoring] Page hidden, flushing analytics');
      }
    });

    // Monitor connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const logConnection = () => {
        console.log('[Monitoring] Connection:', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        });
      };

      connection.addEventListener('change', logConnection);
      logConnection(); // Log initial state
    }

    console.log('[Monitoring] All systems initialized');
  } catch (error) {
    console.error('Failed to initialize monitoring:', error);
  }
}

// Cleanup function for when the app unmounts
export function cleanupMonitoring() {
  if (typeof window === 'undefined') return;

  try {
    const performanceMonitor = PerformanceMonitor.getInstance();
    performanceMonitor.cleanup();
    
    console.log('[Monitoring] Cleanup completed');
  } catch (error) {
    console.error('Failed to cleanup monitoring:', error);
  }
}