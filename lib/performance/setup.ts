/**
 * Performance monitoring setup for Next.js application
 * Import this file to initialize performance monitoring
 */

// Import the initialization module which will auto-initialize
import './init';

// Export key components for use in the application
export { 
  globalPerformanceMonitor,
  globalCache,
  globalAlertManager,
  getPerformanceReport
} from './index';

export { 
  withPerformanceTracking,
  createTrackedSupabaseClient
} from '../middleware/performance-middleware';

// Initialize performance monitoring on import
console.log('Performance monitoring system loaded');