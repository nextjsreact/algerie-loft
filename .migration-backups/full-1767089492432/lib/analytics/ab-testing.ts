import { trackEvent } from './gtag';

export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ABVariant[];
  trafficAllocation: number; // Percentage of users to include in test
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetMetric: string;
  minimumSampleSize: number;
  confidenceLevel: number;
}

export interface ABVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // Percentage of test traffic
  config: Record<string, any>;
  isControl: boolean;
}

export interface ABTestAssignment {
  testId: string;
  variantId: string;
  userId: string;
  assignedAt: Date;
  sessionId: string;
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  metric: string;
  value: number;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class ABTestingFramework {
  private static instance: ABTestingFramework;
  private assignments: Map<string, ABTestAssignment> = new Map();
  private activeTests: Map<string, ABTest> = new Map();
  private userId: string = '';
  private sessionId: string = '';

  static getInstance(): ABTestingFramework {
    if (!ABTestingFramework.instance) {
      ABTestingFramework.instance = new ABTestingFramework();
    }
    return ABTestingFramework.instance;
  }

  // Initialize A/B testing framework
  async init(userId?: string, sessionId?: string) {
    if (typeof window === 'undefined') return;

    this.userId = userId || this.generateUserId();
    this.sessionId = sessionId || this.generateSessionId();

    // Load active tests from API
    await this.loadActiveTests();

    // Load existing assignments from storage
    this.loadAssignments();

    // Assign user to tests
    await this.assignUserToTests();

    console.log('[A/B Testing] Framework initialized');
  }

  // Generate unique user ID
  private generateUserId(): string {
    let userId = localStorage.getItem('ab_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ab_user_id', userId);
    }
    return userId;
  }

  // Generate session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Load active tests from API
  private async loadActiveTests() {
    try {
      const response = await fetch('/api/analytics/ab-tests/active');
      const tests: ABTest[] = await response.json();
      
      tests.forEach(test => {
        this.activeTests.set(test.id, test);
      });
    } catch (error) {
      console.error('Failed to load active A/B tests:', error);
      // Load default tests for homepage optimization
      this.loadDefaultTests();
    }
  }

  // Load default tests for dual-audience homepage
  private loadDefaultTests() {
    const defaultTests: ABTest[] = [
      {
        id: 'homepage_hero_layout',
        name: 'Homepage Hero Layout Test',
        description: 'Test different hero section arrangements for guest vs owner focus',
        variants: [
          {
            id: 'control',
            name: 'Current Layout',
            description: 'Existing hero section layout',
            weight: 50,
            config: { layout: 'current' },
            isControl: true,
          },
          {
            id: 'guest_first',
            name: 'Guest-First Layout',
            description: 'Hero optimized for guest booking experience',
            weight: 50,
            config: { 
              layout: 'guest_first',
              heroHeadline: 'Réservez votre loft idéal en Algérie',
              ctaPrimary: 'Rechercher maintenant',
              searchWidgetPosition: 'prominent'
            },
            isControl: false,
          },
        ],
        trafficAllocation: 100,
        startDate: new Date(),
        status: 'active',
        targetMetric: 'booking_conversion',
        minimumSampleSize: 1000,
        confidenceLevel: 95,
      },
      {
        id: 'cta_button_text',
        name: 'CTA Button Text Test',
        description: 'Test different call-to-action button texts',
        variants: [
          {
            id: 'control',
            name: 'Réserver maintenant',
            description: 'Current booking CTA text',
            weight: 33.33,
            config: { ctaText: 'Réserver maintenant' },
            isControl: true,
          },
          {
            id: 'variant_a',
            name: 'Voir disponibilités',
            description: 'Availability-focused CTA',
            weight: 33.33,
            config: { ctaText: 'Voir disponibilités' },
            isControl: false,
          },
          {
            id: 'variant_b',
            name: 'Découvrir nos lofts',
            description: 'Discovery-focused CTA',
            weight: 33.34,
            config: { ctaText: 'Découvrir nos lofts' },
            isControl: false,
          },
        ],
        trafficAllocation: 50,
        startDate: new Date(),
        status: 'active',
        targetMetric: 'cta_click_rate',
        minimumSampleSize: 500,
        confidenceLevel: 95,
      },
      {
        id: 'owner_section_position',
        name: 'Owner Section Position Test',
        description: 'Test optimal positioning of property owner section',
        variants: [
          {
            id: 'control',
            name: 'After Trust Section',
            description: 'Owner section positioned after trust indicators',
            weight: 50,
            config: { ownerSectionPosition: 'after_trust' },
            isControl: true,
          },
          {
            id: 'variant',
            name: 'After Featured Lofts',
            description: 'Owner section positioned after featured lofts',
            weight: 50,
            config: { ownerSectionPosition: 'after_lofts' },
            isControl: false,
          },
        ],
        trafficAllocation: 30,
        startDate: new Date(),
        status: 'active',
        targetMetric: 'owner_inquiry_rate',
        minimumSampleSize: 300,
        confidenceLevel: 90,
      },
    ];

    defaultTests.forEach(test => {
      this.activeTests.set(test.id, test);
    });
  }

  // Load assignments from storage
  private loadAssignments() {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('ab_assignments');
    if (stored) {
      try {
        const assignments: ABTestAssignment[] = JSON.parse(stored);
        assignments.forEach(assignment => {
          this.assignments.set(assignment.testId, assignment);
        });
      } catch (error) {
        console.error('Failed to load A/B test assignments:', error);
      }
    }
  }

  // Save assignments to storage
  private saveAssignments() {
    if (typeof window === 'undefined') return;

    const assignments = Array.from(this.assignments.values());
    localStorage.setItem('ab_assignments', JSON.stringify(assignments));
  }

  // Assign user to active tests
  private async assignUserToTests() {
    for (const test of this.activeTests.values()) {
      if (test.status !== 'active') continue;

      // Check if user is already assigned to this test
      if (this.assignments.has(test.id)) continue;

      // Check if user should be included in test (traffic allocation)
      if (Math.random() * 100 > test.trafficAllocation) continue;

      // Assign user to variant based on weights
      const variant = this.selectVariant(test);
      if (!variant) continue;

      const assignment: ABTestAssignment = {
        testId: test.id,
        variantId: variant.id,
        userId: this.userId,
        assignedAt: new Date(),
        sessionId: this.sessionId,
      };

      this.assignments.set(test.id, assignment);

      // Track assignment event
      this.trackAssignment(test, variant);

      // Send assignment to API
      await this.sendAssignmentToAPI(assignment);
    }

    this.saveAssignments();
  }

  // Select variant based on weights
  private selectVariant(test: ABTest): ABVariant | null {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        return variant;
      }
    }

    return test.variants[0]; // Fallback to first variant
  }

  // Get variant for a test
  getVariant(testId: string): ABVariant | null {
    const assignment = this.assignments.get(testId);
    if (!assignment) return null;

    const test = this.activeTests.get(testId);
    if (!test) return null;

    return test.variants.find(v => v.id === assignment.variantId) || null;
  }

  // Get variant config for a test
  getVariantConfig(testId: string): Record<string, any> {
    const variant = this.getVariant(testId);
    return variant?.config || {};
  }

  // Check if user is in test variant
  isInVariant(testId: string, variantId: string): boolean {
    const assignment = this.assignments.get(testId);
    return assignment?.variantId === variantId;
  }

  // Track conversion event
  trackConversion(testId: string, metric: string, value: number = 1, metadata?: Record<string, any>) {
    const assignment = this.assignments.get(testId);
    if (!assignment) return;

    const test = this.activeTests.get(testId);
    if (!test) return;

    const variant = this.getVariant(testId);
    if (!variant) return;

    // Create result record
    const result: ABTestResult = {
      testId,
      variantId: assignment.variantId,
      metric,
      value,
      userId: this.userId,
      timestamp: new Date(),
      metadata,
    };

    // Track in Google Analytics
    trackEvent('ab_test_conversion', 'ab_testing', metric, `${testId}_${assignment.variantId}`, value, {
      test_id: testId,
      variant_id: assignment.variantId,
      variant_name: variant.name,
      is_control: variant.isControl,
      ...metadata,
    });

    // Send to API
    this.sendResultToAPI(result);

    console.log(`[A/B Testing] Conversion tracked: ${testId} - ${assignment.variantId} - ${metric}: ${value}`);
  }

  // Track assignment event
  private trackAssignment(test: ABTest, variant: ABVariant) {
    trackEvent('ab_test_assignment', 'ab_testing', 'assignment', `${test.id}_${variant.id}`, 1, {
      test_id: test.id,
      test_name: test.name,
      variant_id: variant.id,
      variant_name: variant.name,
      is_control: variant.isControl,
    });

    console.log(`[A/B Testing] User assigned to test: ${test.name} - ${variant.name}`);
  }

  // Send assignment to API
  private async sendAssignmentToAPI(assignment: ABTestAssignment) {
    try {
      await fetch('/api/analytics/ab-tests/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignment),
      });
    } catch (error) {
      console.error('Failed to send A/B test assignment:', error);
    }
  }

  // Send result to API
  private async sendResultToAPI(result: ABTestResult) {
    try {
      await fetch('/api/analytics/ab-tests/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });
    } catch (error) {
      console.error('Failed to send A/B test result:', error);
    }
  }

  // Get all active assignments
  getActiveAssignments(): ABTestAssignment[] {
    return Array.from(this.assignments.values());
  }

  // Get test configuration for React components
  getTestConfig(testId: string): Record<string, any> {
    const variant = this.getVariant(testId);
    return variant?.config || {};
  }

  // Force assignment to specific variant (for testing)
  forceAssignment(testId: string, variantId: string) {
    const test = this.activeTests.get(testId);
    if (!test) return;

    const variant = test.variants.find(v => v.id === variantId);
    if (!variant) return;

    const assignment: ABTestAssignment = {
      testId,
      variantId,
      userId: this.userId,
      assignedAt: new Date(),
      sessionId: this.sessionId,
    };

    this.assignments.set(testId, assignment);
    this.saveAssignments();

    console.log(`[A/B Testing] Forced assignment: ${testId} - ${variantId}`);
  }
}

// Initialize A/B testing framework
export function initABTesting(userId?: string, sessionId?: string) {
  if (typeof window === 'undefined') return null;

  const framework = ABTestingFramework.getInstance();
  framework.init(userId, sessionId);
  return framework;
}

// Convenience functions for React components
export const getVariant = (testId: string) => {
  return ABTestingFramework.getInstance().getVariant(testId);
};

export const getVariantConfig = (testId: string) => {
  return ABTestingFramework.getInstance().getVariantConfig(testId);
};

export const isInVariant = (testId: string, variantId: string) => {
  return ABTestingFramework.getInstance().isInVariant(testId, variantId);
};

export const trackConversion = (testId: string, metric: string, value?: number, metadata?: Record<string, any>) => {
  return ABTestingFramework.getInstance().trackConversion(testId, metric, value, metadata);
};

// React hook for A/B testing
export function useABTest(testId: string) {
  const framework = ABTestingFramework.getInstance();
  const variant = framework.getVariant(testId);
  const config = framework.getVariantConfig(testId);

  return {
    variant,
    config,
    isInVariant: (variantId: string) => framework.isInVariant(testId, variantId),
    trackConversion: (metric: string, value?: number, metadata?: Record<string, any>) => 
      framework.trackConversion(testId, metric, value, metadata),
  };
}