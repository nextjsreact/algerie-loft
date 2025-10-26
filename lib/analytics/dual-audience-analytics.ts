import { trackEvent } from './gtag';

export type AudienceType = 'guest' | 'owner' | 'unknown';

export interface AudienceSegment {
  type: AudienceType;
  confidence: number; // 0-100
  indicators: string[];
  timestamp: Date;
}

export interface GuestFunnel {
  step: 'homepage_view' | 'search_initiated' | 'results_viewed' | 'loft_clicked' | 'booking_started' | 'booking_completed';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface OwnerFunnel {
  step: 'homepage_view' | 'owner_section_viewed' | 'benefits_viewed' | 'form_started' | 'form_completed' | 'inquiry_sent';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ConversionMetrics {
  audienceType: AudienceType;
  funnelSteps: (GuestFunnel | OwnerFunnel)[];
  conversionRate: number;
  timeToConversion?: number;
  dropoffPoint?: string;
  completedGoal: boolean;
}

export interface EngagementMetrics {
  audienceType: AudienceType;
  pageViews: number;
  timeOnSite: number;
  scrollDepth: number;
  interactions: number;
  sectionsViewed: string[];
  ctaClicks: number;
  formInteractions: number;
}

export interface AudienceInsights {
  totalVisitors: number;
  guestPercentage: number;
  ownerPercentage: number;
  unknownPercentage: number;
  guestConversionRate: number;
  ownerConversionRate: number;
  averageTimeOnSite: {
    guests: number;
    owners: number;
  };
  popularSections: {
    guests: string[];
    owners: string[];
  };
  dropoffPoints: {
    guests: string[];
    owners: string[];
  };
}

export class DualAudienceAnalytics {
  private static instance: DualAudienceAnalytics;
  private currentAudience: AudienceSegment | null = null;
  private guestFunnel: GuestFunnel[] = [];
  private ownerFunnel: OwnerFunnel[] = [];
  private engagementData: EngagementMetrics | null = null;
  private sessionStartTime: number = 0;
  private userId: string = '';
  private sessionId: string = '';

  static getInstance(): DualAudienceAnalytics {
    if (!DualAudienceAnalytics.instance) {
      DualAudienceAnalytics.instance = new DualAudienceAnalytics();
    }
    return DualAudienceAnalytics.instance;
  }

  // Initialize dual-audience analytics
  init(userId?: string, sessionId?: string) {
    if (typeof window === 'undefined') return;

    this.userId = userId || this.generateUserId();
    this.sessionId = sessionId || this.generateSessionId();
    this.sessionStartTime = Date.now();

    // Initialize engagement tracking
    this.initEngagementTracking();

    // Detect initial audience type
    this.detectAudienceType();

    console.log('[Dual Audience Analytics] Initialized');
  }

  // Generate unique user ID
  private generateUserId(): string {
    let userId = localStorage.getItem('audience_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('audience_user_id', userId);
    }
    return userId;
  }

  // Generate session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Initialize engagement tracking
  private initEngagementTracking() {
    this.engagementData = {
      audienceType: 'unknown',
      pageViews: 1,
      timeOnSite: 0,
      scrollDepth: 0,
      interactions: 0,
      sectionsViewed: [],
      ctaClicks: 0,
      formInteractions: 0,
    };

    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.updateTimeOnSite();
      }
    });

    // Track scroll depth
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / documentHeight) * 100);
      
      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
        if (this.engagementData) {
          this.engagementData.scrollDepth = maxScrollDepth;
        }
      }
    });

    // Track interactions
    document.addEventListener('click', (event) => {
      if (this.engagementData) {
        this.engagementData.interactions++;
        
        const target = event.target as HTMLElement;
        
        // Track CTA clicks
        if (target.matches('[data-cta], .cta-button, button[type="submit"]')) {
          this.engagementData.ctaClicks++;
          this.trackCTAClick(target);
        }
        
        // Track form interactions
        if (target.matches('input, textarea, select')) {
          this.engagementData.formInteractions++;
        }
      }
    });
  }

  // Detect audience type based on behavior
  private detectAudienceType() {
    const indicators: string[] = [];
    let guestScore = 0;
    let ownerScore = 0;

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('owner') || urlParams.has('partner')) {
      ownerScore += 30;
      indicators.push('owner_url_param');
    }

    // Check referrer
    const referrer = document.referrer.toLowerCase();
    if (referrer.includes('booking') || referrer.includes('airbnb') || referrer.includes('hotel')) {
      guestScore += 20;
      indicators.push('booking_referrer');
    }

    // Check user agent (mobile users more likely to be guests)
    if (/Mobile|Android|iPhone|iPad/.test(navigator.userAgent)) {
      guestScore += 10;
      indicators.push('mobile_device');
    }

    // Check time of day (business hours suggest owner)
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      ownerScore += 5;
      indicators.push('business_hours');
    } else {
      guestScore += 5;
      indicators.push('leisure_hours');
    }

    // Check language (French/Arabic more likely guests, English could be owners)
    const language = navigator.language.toLowerCase();
    if (language.startsWith('fr') || language.startsWith('ar')) {
      guestScore += 10;
      indicators.push('local_language');
    } else if (language.startsWith('en')) {
      ownerScore += 5;
      indicators.push('english_language');
    }

    // Determine audience type
    let audienceType: AudienceType = 'unknown';
    let confidence = 0;

    if (guestScore > ownerScore) {
      audienceType = 'guest';
      confidence = Math.min(guestScore, 100);
    } else if (ownerScore > guestScore) {
      audienceType = 'owner';
      confidence = Math.min(ownerScore, 100);
    } else {
      confidence = 0;
    }

    this.currentAudience = {
      type: audienceType,
      confidence,
      indicators,
      timestamp: new Date(),
    };

    if (this.engagementData) {
      this.engagementData.audienceType = audienceType;
    }

    // Track audience detection
    trackEvent('audience_detected', 'segmentation', 'audience_type', audienceType, confidence, {
      audience_type: audienceType,
      confidence,
      indicators: indicators.join(','),
      detection_method: 'behavioral',
    });

    console.log(`[Dual Audience Analytics] Audience detected: ${audienceType} (${confidence}% confidence)`);
  }

  // Update audience type based on behavior
  updateAudienceType(newType: AudienceType, reason: string) {
    if (!this.currentAudience) return;

    const oldType = this.currentAudience.type;
    this.currentAudience.type = newType;
    this.currentAudience.confidence = Math.min(this.currentAudience.confidence + 20, 100);
    this.currentAudience.indicators.push(reason);

    if (this.engagementData) {
      this.engagementData.audienceType = newType;
    }

    // Track audience update
    trackEvent('audience_updated', 'segmentation', 'audience_change', `${oldType}_to_${newType}`, 1, {
      old_type: oldType,
      new_type: newType,
      reason,
      confidence: this.currentAudience.confidence,
    });

    console.log(`[Dual Audience Analytics] Audience updated: ${oldType} → ${newType} (${reason})`);
  }

  // Track guest funnel step
  trackGuestFunnel(step: GuestFunnel['step'], metadata?: Record<string, any>) {
    const funnelStep: GuestFunnel = {
      step,
      timestamp: new Date(),
      metadata,
    };

    this.guestFunnel.push(funnelStep);

    // Update audience type if not already guest
    if (this.currentAudience?.type !== 'guest') {
      this.updateAudienceType('guest', `guest_funnel_${step}`);
    }

    // Track funnel event
    trackEvent('guest_funnel', 'conversion', step, step, 1, {
      funnel_type: 'guest',
      step,
      step_number: this.guestFunnel.length,
      time_since_start: Date.now() - this.sessionStartTime,
      ...metadata,
    });

    console.log(`[Dual Audience Analytics] Guest funnel: ${step}`);
  }

  // Track owner funnel step
  trackOwnerFunnel(step: OwnerFunnel['step'], metadata?: Record<string, any>) {
    const funnelStep: OwnerFunnel = {
      step,
      timestamp: new Date(),
      metadata,
    };

    this.ownerFunnel.push(funnelStep);

    // Update audience type if not already owner
    if (this.currentAudience?.type !== 'owner') {
      this.updateAudienceType('owner', `owner_funnel_${step}`);
    }

    // Track funnel event
    trackEvent('owner_funnel', 'conversion', step, step, 1, {
      funnel_type: 'owner',
      step,
      step_number: this.ownerFunnel.length,
      time_since_start: Date.now() - this.sessionStartTime,
      ...metadata,
    });

    console.log(`[Dual Audience Analytics] Owner funnel: ${step}`);
  }

  // Track section view
  trackSectionView(sectionName: string, audienceRelevance: 'guest' | 'owner' | 'both') {
    if (this.engagementData && !this.engagementData.sectionsViewed.includes(sectionName)) {
      this.engagementData.sectionsViewed.push(sectionName);
    }

    // Update audience type based on section relevance
    if (audienceRelevance === 'guest' && this.currentAudience?.type === 'unknown') {
      this.updateAudienceType('guest', `viewed_${sectionName}`);
    } else if (audienceRelevance === 'owner' && this.currentAudience?.type === 'unknown') {
      this.updateAudienceType('owner', `viewed_${sectionName}`);
    }

    // Track section view
    trackEvent('section_view', 'engagement', 'section_viewed', sectionName, 1, {
      section_name: sectionName,
      audience_relevance: audienceRelevance,
      audience_type: this.currentAudience?.type,
      time_on_site: Date.now() - this.sessionStartTime,
    });
  }

  // Track CTA click
  private trackCTAClick(element: HTMLElement) {
    const ctaType = element.getAttribute('data-cta') || 'unknown';
    const ctaText = element.textContent?.trim() || '';
    
    // Determine audience relevance
    let audienceRelevance: 'guest' | 'owner' | 'both' = 'both';
    if (ctaType.includes('booking') || ctaType.includes('search') || ctaType.includes('reserve')) {
      audienceRelevance = 'guest';
    } else if (ctaType.includes('owner') || ctaType.includes('partner') || ctaType.includes('property')) {
      audienceRelevance = 'owner';
    }

    // Update audience type
    if (audienceRelevance === 'guest' && this.currentAudience?.type !== 'guest') {
      this.updateAudienceType('guest', `clicked_${ctaType}`);
    } else if (audienceRelevance === 'owner' && this.currentAudience?.type !== 'owner') {
      this.updateAudienceType('owner', `clicked_${ctaType}`);
    }

    // Track CTA click
    trackEvent('cta_click', 'conversion', 'cta_clicked', ctaType, 1, {
      cta_type: ctaType,
      cta_text: ctaText,
      audience_relevance: audienceRelevance,
      audience_type: this.currentAudience?.type,
    });
  }

  // Update time on site
  private updateTimeOnSite() {
    if (this.engagementData) {
      this.engagementData.timeOnSite = Date.now() - this.sessionStartTime;
    }
  }

  // Get conversion metrics
  getConversionMetrics(): ConversionMetrics | null {
    if (!this.currentAudience) return null;

    const funnelSteps = this.currentAudience.type === 'guest' ? this.guestFunnel : this.ownerFunnel;
    const totalSteps = this.currentAudience.type === 'guest' ? 6 : 6; // Total possible steps
    const completedSteps = funnelSteps.length;
    const conversionRate = (completedSteps / totalSteps) * 100;

    // Check if goal completed
    const completedGoal = this.currentAudience.type === 'guest' 
      ? funnelSteps.some(step => step.step === 'booking_completed')
      : funnelSteps.some(step => step.step === 'inquiry_sent');

    // Calculate time to conversion
    let timeToConversion: number | undefined;
    if (completedGoal && funnelSteps.length > 0) {
      const firstStep = funnelSteps[0];
      const lastStep = funnelSteps[funnelSteps.length - 1];
      timeToConversion = lastStep.timestamp.getTime() - firstStep.timestamp.getTime();
    }

    return {
      audienceType: this.currentAudience.type,
      funnelSteps,
      conversionRate,
      timeToConversion,
      completedGoal,
    };
  }

  // Get engagement metrics
  getEngagementMetrics(): EngagementMetrics | null {
    if (!this.engagementData) return null;

    this.updateTimeOnSite();
    return { ...this.engagementData };
  }

  // Get current audience
  getCurrentAudience(): AudienceSegment | null {
    return this.currentAudience;
  }

  // Send analytics data to API
  async sendAnalyticsData() {
    const conversionMetrics = this.getConversionMetrics();
    const engagementMetrics = this.getEngagementMetrics();

    const analyticsData = {
      userId: this.userId,
      sessionId: this.sessionId,
      audience: this.currentAudience,
      conversion: conversionMetrics,
      engagement: engagementMetrics,
      timestamp: new Date(),
    };

    try {
      await fetch('/api/analytics/dual-audience', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analyticsData),
      });
    } catch (error) {
      console.error('Failed to send dual-audience analytics:', error);
    }
  }
}

// Initialize dual-audience analytics
export function initDualAudienceAnalytics(userId?: string, sessionId?: string) {
  if (typeof window === 'undefined') return null;

  const analytics = DualAudienceAnalytics.getInstance();
  analytics.init(userId, sessionId);
  return analytics;
}

// Convenience functions
export const trackGuestFunnel = (step: GuestFunnel['step'], metadata?: Record<string, any>) => {
  DualAudienceAnalytics.getInstance().trackGuestFunnel(step, metadata);
};

export const trackOwnerFunnel = (step: OwnerFunnel['step'], metadata?: Record<string, any>) => {
  DualAudienceAnalytics.getInstance().trackOwnerFunnel(step, metadata);
};

export const trackSectionView = (sectionName: string, audienceRelevance: 'guest' | 'owner' | 'both') => {
  DualAudienceAnalytics.getInstance().trackSectionView(sectionName, audienceRelevance);
};

export const getCurrentAudience = () => {
  return DualAudienceAnalytics.getInstance().getCurrentAudience();
};

export const getConversionMetrics = () => {
  return DualAudienceAnalytics.getInstance().getConversionMetrics();
};

export const getEngagementMetrics = () => {
  return DualAudienceAnalytics.getInstance().getEngagementMetrics();
};