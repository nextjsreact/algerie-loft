import { initUptimeMonitoring, defaultUptimeConfig } from './uptime';
import { setupGlobalErrorHandling } from './error-tracking';

// Server-side monitoring initialization
export function initServerMonitoring() {
  if (typeof window !== 'undefined') {
    console.warn('[Server Monitoring] This should only run on the server');
    return;
  }

  console.log('[Server Monitoring] Initializing server-side monitoring...');

  try {
    // Setup global error handling
    setupGlobalErrorHandling();
    
    // Initialize uptime monitoring
    const uptimeMonitor = initUptimeMonitoring({
      ...defaultUptimeConfig,
      endpoints: [
        process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/health`,
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/contact`,
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/analytics/web-vitals`,
      ],
    });

    if (uptimeMonitor) {
      console.log('[Server Monitoring] Uptime monitoring started');
    }

    // Setup process error handlers
    process.on('uncaughtException', (error) => {
      console.error('[Server Monitoring] Uncaught Exception:', error);
      // Don't exit the process in production, let PM2 or similar handle it
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('[Server Monitoring] Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit the process, just log it
    });

    console.log('[Server Monitoring] Server-side monitoring initialized successfully');
  } catch (error) {
    console.error('[Server Monitoring] Failed to initialize server monitoring:', error);
  }
}

// Cleanup function for graceful shutdown
export function cleanupServerMonitoring() {
  console.log('[Server Monitoring] Cleaning up server monitoring...');
  
  try {
    // Stop uptime monitoring
    const { UptimeMonitor } = require('./uptime');
    const monitor = UptimeMonitor.getInstance();
    monitor.stopMonitoring();
    
    console.log('[Server Monitoring] Server monitoring cleanup completed');
  } catch (error) {
    console.error('[Server Monitoring] Error during cleanup:', error);
  }
}

// Handle graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    console.log('[Server Monitoring] SIGTERM received, cleaning up...');
    cleanupServerMonitoring();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('[Server Monitoring] SIGINT received, cleaning up...');
    cleanupServerMonitoring();
    process.exit(0);
  });
}