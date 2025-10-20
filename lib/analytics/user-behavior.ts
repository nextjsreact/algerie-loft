import { trackEvent } from './gtag';

export interface UserSession {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: UserEvent[];
  userAgent: string;
  referrer: string;
  locale: string;
}

export interface UserEvent {
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  page: string;
  metadata?: Record<string, any>;
}

export interface PageEngagement {
  page: string;
  timeOnPage: number;
  scrollDepth: number;
  interactions: number;
  bounced: boolean;
}

export class UserBehaviorAnalytics {
  private static instance: UserBehaviorAnalytics;
  private session: UserSession | null = null;
  private currentPage: string = '';
  private pageStartTime: number = 0;
  private maxScrollDepth: number = 0;
  private interactionCount: number = 0;
  private isActive: boolean = true;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private scrollTimer: NodeJS.Timeout | null = null;

  static getInstance(): UserBehaviorAnalytics {
    if (!UserBehaviorAnalytics.instance) {
      UserBehaviorAnalytics.instance = new UserBehaviorAnalytics();
    }
    return UserBehaviorAnalytics.instance;
  }

  // Initialize user behavior tracking
  init() {
    if (typeof window === 'undefined') return;

    this.initSession();
    this.setupEventListeners();
    this.startPageTracking();
    
    console.log('[User Behavior] Analytics initialized');
  }

  // Initialize user session
  private initSession() {
    if (typeof window === 'undefined') return;

    const sessionId = this.generateSessionId();
    const now = Date.now();

    this.session = {
      sessionId,
      startTime: now,
      lastActivity: now,
      pageViews: 0,
      events: [],
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      locale: navigator.language,
    };

    // Store session in sessionStorage
    sessionStorage.setItem('analytics_session', JSON.stringify(this.session));
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Setup event listeners for user interactions
  private setupEventListeners() {
    if (typeof window === 'undefined') return;

    // Track clicks
    document.addEventListener('click', (event) => {
      this.trackInteraction('click', event);
    });

    // Track form interactions
    document.addEventListener('submit', (event) => {
      this.trackInteraction('form_submit', event);
    });

    document.addEventListener('input', (event) => {
      this.trackInteraction('form_input', event);
    });

    // Track scroll behavior
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackScrollDepth();
      }, 100);
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.handlePageHidden();
      } else {
        this.handlePageVisible();
      }
    });

    // Track user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => {
        this.updateActivity();
      }, { passive: true });
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.handlePageUnload();
    });
  }

  // Start tracking current page
  private startPageTracking() {
    if (typeof window === 'undefined') return;

    this.currentPage = window.location.pathname;
    this.pageStartTime = Date.now();
    this.maxScrollDepth = 0;
    this.interactionCount = 0;

    this.trackPageView();
  }

  // Track page view
  trackPageView(page?: string) {
    if (typeof window === 'undefined') return;

    const currentPage = page || window.location.pathname;
    
    // End previous page tracking
    if (this.currentPage && this.currentPage !== currentPage) {
      this.endPageTracking();
    }

    // Start new page tracking
    this.currentPage = currentPage;
    this.pageStartTime = Date.now();
    this.maxScrollDepth = 0;
    this.interactionCount = 0;

    if (this.session) {
      this.session.pageViews++;
      this.updateSession();
    }

    this.trackEvent('page_view', 'navigation', 'page_view', currentPage);
    
    console.log(`[User Behavior] Page view: ${currentPage}`);
  }

  // Track custom event
  trackEvent(
    type: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ) {
    if (!this.session) return;

    const event: UserEvent = {
      type,
      category,
      action,
      label,
      value,
      timestamp: Date.now(),
      page: this.currentPage,
      metadata,
    };

    this.session.events.push(event);
    this.updateSession();

    // Send to Google Analytics
    trackEvent(action, category, label, value, metadata);

    // Send to custom analytics endpoint
    this.sendEventToAPI(event);
  }

  // Track user interactions
  private trackInteraction(type: string, event: Event) {
    this.interactionCount++;
    
    const target = event.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    const className = target.className;
    const id = target.id;
    const text = target.textContent?.substring(0, 50) || '';

    let category = 'interaction';
    let action = type;
    let label = tagName;

    // Enhanced tracking for specific elements
    if (tagName === 'a') {
      category = 'link';
      action = 'click';
      label = (target as HTMLAnchorElement).href;
    } else if (tagName === 'button') {
      category = 'button';
      action = 'click';
      label = text || className || id;
    } else if (tagName === 'form') {
      category = 'form';
      action = 'submit';
      label = id || className;
    } else if (['input', 'textarea', 'select'].includes(tagName)) {
      category = 'form';
      action = type;
      label = (target as HTMLInputElement).name || id || className;
    }

    this.trackEvent(type, category, action, label, 1, {
      tagName,
      className,
      id,
      text: text.substring(0, 50),
    });
  }

  // Track scroll depth
  private trackScrollDepth() {
    if (typeof window === 'undefined') return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / documentHeight) * 100);

    if (scrollPercent > this.maxScrollDepth) {
      this.maxScrollDepth = scrollPercent;

      // Track milestone scroll depths
      const milestones = [25, 50, 75, 90, 100];
      const milestone = milestones.find(m => scrollPercent >= m && this.maxScrollDepth < m);
      
      if (milestone) {
        this.trackEvent('scroll', 'engagement', 'scroll_depth', `${milestone}%`, milestone);
      }
    }
  }

  // Update user activity
  private updateActivity() {
    this.isActive = true;
    
    if (this.session) {
      this.session.lastActivity = Date.now();
      this.updateSession();
    }

    // Reset inactivity timer
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = setTimeout(() => {
      this.isActive = false;
      this.trackEvent('user_inactive', 'engagement', 'inactive', this.currentPage);
    }, 30000); // 30 seconds of inactivity
  }

  // Handle page hidden
  private handlePageHidden() {
    this.endPageTracking();
    this.trackEvent('page_hidden', 'engagement', 'visibility_change', this.currentPage);
  }

  // Handle page visible
  private handlePageVisible() {
    this.startPageTracking();
    this.trackEvent('page_visible', 'engagement', 'visibility_change', this.currentPage);
  }

  // Handle page unload
  private handlePageUnload() {
    this.endPageTracking();
    this.sendSessionData();
  }

  // End current page tracking
  private endPageTracking() {
    if (!this.pageStartTime) return;

    const timeOnPage = Date.now() - this.pageStartTime;
    const bounced = this.interactionCount === 0 && timeOnPage < 10000; // Less than 10 seconds with no interactions

    const engagement: PageEngagement = {
      page: this.currentPage,
      timeOnPage,
      scrollDepth: this.maxScrollDepth,
      interactions: this.interactionCount,
      bounced,
    };

    this.trackEvent('page_engagement', 'engagement', 'page_end', this.currentPage, timeOnPage, {
      scrollDepth: this.maxScrollDepth,
      interactions: this.interactionCount,
      bounced,
    });

    // Send engagement data to API
    this.sendEngagementToAPI(engagement);
  }

  // Update session in storage
  private updateSession() {
    if (this.session && typeof window !== 'undefined') {
      sessionStorage.setItem('analytics_session', JSON.stringify(this.session));
    }
  }

  // Send event to custom analytics API
  private async sendEventToAPI(event: UserEvent) {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.session?.sessionId,
          event,
        }),
      });
    } catch (error) {
      console.error('Failed to send event to analytics API:', error);
    }
  }

  // Send engagement data to API
  private async sendEngagementToAPI(engagement: PageEngagement) {
    try {
      await fetch('/api/analytics/engagement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.session?.sessionId,
          engagement,
        }),
      });
    } catch (error) {
      console.error('Failed to send engagement to analytics API:', error);
    }
  }

  // Send complete session data
  private async sendSessionData() {
    if (!this.session) return;

    try {
      await fetch('/api/analytics/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.session),
      });
    } catch (error) {
      console.error('Failed to send session data:', error);
    }
  }

  // Get current session data
  getSession(): UserSession | null {
    return this.session;
  }

  // Track specific business events
  trackContactFormView(formType: string) {
    this.trackEvent('contact_form_view', 'lead_generation', 'form_view', formType);
  }

  trackContactFormSubmit(formType: string, success: boolean) {
    this.trackEvent('contact_form_submit', 'lead_generation', 'form_submit', formType, success ? 1 : 0);
  }

  trackPropertyView(propertyId: string, propertyType: string) {
    this.trackEvent('property_view', 'properties', 'view', propertyId, 1, { propertyType });
  }

  trackServiceInquiry(serviceName: string) {
    this.trackEvent('service_inquiry', 'services', 'inquiry', serviceName);
  }

  trackSearch(query: string, resultsCount: number) {
    this.trackEvent('search', 'engagement', 'search', query, resultsCount);
  }

  trackLanguageChange(fromLang: string, toLang: string) {
    this.trackEvent('language_change', 'i18n', 'change', `${fromLang}_to_${toLang}`);
  }

  trackDownload(fileName: string, fileType: string) {
    this.trackEvent('download', 'engagement', 'file_download', fileName, 1, { fileType });
  }

  trackVideoPlay(videoId: string, videoTitle: string) {
    this.trackEvent('video_play', 'media', 'play', videoId, 1, { videoTitle });
  }

  trackSocialShare(platform: string, content: string) {
    this.trackEvent('social_share', 'social', 'share', platform, 1, { content });
  }
}

// Initialize user behavior analytics
export function initUserBehaviorAnalytics() {
  if (typeof window === 'undefined') return null;

  const analytics = UserBehaviorAnalytics.getInstance();
  analytics.init();
  return analytics;
}

// Export convenience functions
export const trackContactFormView = (formType: string) => {
  UserBehaviorAnalytics.getInstance().trackContactFormView(formType);
};

export const trackContactFormSubmit = (formType: string, success: boolean) => {
  UserBehaviorAnalytics.getInstance().trackContactFormSubmit(formType, success);
};

export const trackPropertyView = (propertyId: string, propertyType: string) => {
  UserBehaviorAnalytics.getInstance().trackPropertyView(propertyId, propertyType);
};

export const trackServiceInquiry = (serviceName: string) => {
  UserBehaviorAnalytics.getInstance().trackServiceInquiry(serviceName);
};

export const trackSearch = (query: string, resultsCount: number) => {
  UserBehaviorAnalytics.getInstance().trackSearch(query, resultsCount);
};

export const trackLanguageChange = (fromLang: string, toLang: string) => {
  UserBehaviorAnalytics.getInstance().trackLanguageChange(fromLang, toLang);
};

export const trackDownload = (fileName: string, fileType: string) => {
  UserBehaviorAnalytics.getInstance().trackDownload(fileName, fileType);
};

export const trackVideoPlay = (videoId: string, videoTitle: string) => {
  UserBehaviorAnalytics.getInstance().trackVideoPlay(videoId, videoTitle);
};

export const trackSocialShare = (platform: string, content: string) => {
  UserBehaviorAnalytics.getInstance().trackSocialShare(platform, content);
};