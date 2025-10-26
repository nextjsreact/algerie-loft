// Main analytics initialization and exports
import { initGA } from './gtag';
import { initWebVitals } from './web-vitals';
import { initUserBehaviorAnalytics } from './user-behavior';
import { initABTesting } from './ab-testing';
import { initSearchAnalytics } from './search-analytics';
import { initDualAudienceAnalytics } from './dual-audience-analytics';

// Initialize all analytics systems
export function initAnalytics(userId?: string, sessionId?: string) {
  if (typeof window === 'undefined') return;

  console.log('[Analytics] Initializing analytics systems...');

  try {
    // Initialize Google Analytics
    initGA();

    // Initialize Web Vitals tracking
    initWebVitals();

    // Initialize user behavior analytics
    const userBehavior = initUserBehaviorAnalytics();

    // Initialize A/B testing framework
    const abTesting = initABTesting(userId, sessionId);

    // Initialize search analytics
    const searchAnalytics = initSearchAnalytics(userId, sessionId);

    // Initialize dual-audience analytics
    const dualAudience = initDualAudienceAnalytics(userId, sessionId);

    console.log('[Analytics] All analytics systems initialized successfully');

    return {
      userBehavior,
      abTesting,
      searchAnalytics,
      dualAudience,
    };
  } catch (error) {
    console.error('[Analytics] Failed to initialize analytics:', error);
  }
}

// Re-export all analytics functions and types
export * from './gtag';
export * from './web-vitals';
export * from './user-behavior';
export * from './ab-testing';
export * from './search-analytics';
export * from './dual-audience-analytics';

// Analytics event types for type safety
export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

// Common analytics events for the dual-audience homepage
export const ANALYTICS_EVENTS = {
  // Guest events
  GUEST_HERO_VIEW: { category: 'guest', action: 'hero_view' },
  GUEST_SEARCH_START: { category: 'guest', action: 'search_start' },
  GUEST_LOFT_VIEW: { category: 'guest', action: 'loft_view' },
  GUEST_BOOKING_START: { category: 'guest', action: 'booking_start' },
  GUEST_BOOKING_COMPLETE: { category: 'guest', action: 'booking_complete' },

  // Owner events
  OWNER_SECTION_VIEW: { category: 'owner', action: 'section_view' },
  OWNER_BENEFITS_VIEW: { category: 'owner', action: 'benefits_view' },
  OWNER_FORM_START: { category: 'owner', action: 'form_start' },
  OWNER_FORM_COMPLETE: { category: 'owner', action: 'form_complete' },
  OWNER_INQUIRY_SENT: { category: 'owner', action: 'inquiry_sent' },

  // A/B testing events
  AB_TEST_ASSIGNMENT: { category: 'ab_testing', action: 'assignment' },
  AB_TEST_CONVERSION: { category: 'ab_testing', action: 'conversion' },

  // Search events
  SEARCH_INITIATED: { category: 'search', action: 'initiated' },
  SEARCH_COMPLETED: { category: 'search', action: 'completed' },
  SEARCH_RESULT_CLICK: { category: 'search', action: 'result_click' },
  SEARCH_CONVERSION: { category: 'search', action: 'conversion' },

  // Engagement events
  SECTION_VIEW: { category: 'engagement', action: 'section_view' },
  CTA_CLICK: { category: 'engagement', action: 'cta_click' },
  SCROLL_MILESTONE: { category: 'engagement', action: 'scroll_milestone' },
  TIME_ON_PAGE: { category: 'engagement', action: 'time_on_page' },
} as const;

// Analytics configuration
export const ANALYTICS_CONFIG = {
  // Google Analytics
  GA_TRACKING_ID: process.env.NEXT_PUBLIC_GA_ID || '',
  
  // A/B Testing
  AB_TEST_TRAFFIC_ALLOCATION: 100, // Percentage of users to include in tests
  AB_TEST_CONFIDENCE_LEVEL: 95,
  AB_TEST_MINIMUM_SAMPLE_SIZE: 100,
  
  // Search Analytics
  SEARCH_DEBOUNCE_MS: 300,
  SEARCH_RESULT_VIEW_THRESHOLD_MS: 1000,
  
  // User Behavior
  INACTIVITY_THRESHOLD_MS: 30000, // 30 seconds
  SESSION_TIMEOUT_MS: 1800000, // 30 minutes
  
  // Dual Audience
  AUDIENCE_CONFIDENCE_THRESHOLD: 70,
  FUNNEL_STEP_TIMEOUT_MS: 300000, // 5 minutes
} as const;

// Analytics utilities
export class AnalyticsUtils {
  // Generate unique tracking ID
  static generateTrackingId(prefix: string = 'track'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Format analytics data for API
  static formatAnalyticsData(data: any): any {
    return {
      ...data,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };
  }

  // Validate analytics event
  static validateEvent(event: AnalyticsEvent): boolean {
    return !!(event.category && event.action);
  }

  // Sanitize analytics data (remove PII)
  static sanitizeData(data: any): any {
    const sanitized = { ...data };
    
    // Remove potential PII fields
    const piiFields = ['email', 'phone', 'name', 'address', 'ip'];
    piiFields.forEach(field => {
      if (sanitized[field]) {
        delete sanitized[field];
      }
    });

    return sanitized;
  }

  // Calculate conversion rate
  static calculateConversionRate(conversions: number, total: number): number {
    return total > 0 ? (conversions / total) * 100 : 0;
  }

  // Calculate time difference in readable format
  static formatTimeDifference(startTime: number, endTime: number): string {
    const diff = endTime - startTime;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Default export for easy initialization
export default {
  init: initAnalytics,
  events: ANALYTICS_EVENTS,
  config: ANALYTICS_CONFIG,
  utils: AnalyticsUtils,
};