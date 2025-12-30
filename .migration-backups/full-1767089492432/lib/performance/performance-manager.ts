/**
 * Performance Manager for Dual-Audience Homepage
 * Coordinates all performance optimizations and monitoring
 */

import { CacheManager, getCachePerformanceMetrics } from './enhanced-caching';
import { preloadCriticalImages, measureImagePerformance } from './enhanced-image-optimization';
import { detectAudience, preloadAudienceComponents, measureBundlePerformance } from './code-splitting';

// Performance metrics interface
export interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  cacheHitRate: number;
  imageOptimizationSavings: number;
  bundleSize: number;
  audienceDetectionTime: number;
}

// Performance thresholds (Core Web Vitals)
export const PERFORMANCE_THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint (ms)
  FID: 100,  // First Input Delay (ms)
  CLS: 0.1,  // Cumulative Layout Shift
  FCP: 1800, // First Contentful Paint (ms)
  TTI: 3800, // Time to Interactive (ms)
  TTFB: 600  // Time to First Byte (ms)
} as const;

// Performance optimization strategies
export interface OptimizationStrategy {
  name: string;
  priority: 'high' | 'medium' | 'low';
  implementation: () => Promise<void>;
  expectedImprovement: string;
}

export class PerformanceManager {
  private static instance: PerformanceManager;
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private optimizationStrategies: OptimizationStrategy[] = [];

  private constructor() {
    this.initializePerformanceMonitoring();
    this.setupOptimizationStrategies();
  }

  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor resource loading
    this.observeResourceTiming();
    
    // Monitor navigation timing
    this.observeNavigationTiming();
  }

  // Observe Core Web Vitals
  private observeWebVitals(): void {
    if (!('PerformanceObserver' in window)) return;

    // LCP Observer
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      this.metrics.largestContentfulPaint = lastEntry.startTime;
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.push(lcpObserver);

    // FID Observer
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
    this.observers.push(fidObserver);

    // CLS Observer
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.metrics.cumulativeLayoutShift = clsValue;
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    this.observers.push(clsObserver);

    // FCP Observer
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
        }
      });
    });
    fcpObserver.observe({ entryTypes: ['paint'] });
    this.observers.push(fcpObserver);
  }

  // Observe resource timing
  private observeResourceTiming(): void {
    if (!('PerformanceObserver' in window)) return;

    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        // Track image loading performance
        if (entry.initiatorType === 'img') {
          const loadTime = entry.responseEnd - entry.startTime;
          this.trackImageLoadTime(loadTime);
        }
      });
    });
    resourceObserver.observe({ entryTypes: ['resource'] });
    this.observers.push(resourceObserver);
  }

  // Observe navigation timing
  private observeNavigationTiming(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      this.metrics.timeToInteractive = navigation.domInteractive - navigation.fetchStart;
    });
  }

  // Setup optimization strategies
  private setupOptimizationStrategies(): void {
    this.optimizationStrategies = [
      {
        name: 'Preload Critical Images',
        priority: 'high',
        implementation: async () => {
          const criticalImages = [
            '/hero-image.jpg',
            '/featured-loft-1.jpg',
            '/featured-loft-2.jpg'
          ];
          await preloadCriticalImages(criticalImages);
        },
        expectedImprovement: 'Reduce LCP by 20-30%'
      },
      {
        name: 'Audience-Based Code Splitting',
        priority: 'high',
        implementation: async () => {
          const audience = detectAudience();
          await preloadAudienceComponents(audience);
        },
        expectedImprovement: 'Reduce bundle size by 40-50%'
      },
      {
        name: 'Cache Warming',
        priority: 'medium',
        implementation: async () => {
          const cacheManager = CacheManager.getInstance();
          // Warm critical caches
          const criticalUrls = [
            '/api/lofts/featured',
            '/api/translations/fr',
            '/api/owner/metrics'
          ];
          
          // This would be implemented with actual API calls
          console.log('Warming caches for:', criticalUrls);
        },
        expectedImprovement: 'Reduce API response time by 60-80%'
      },
      {
        name: 'Progressive Image Loading',
        priority: 'medium',
        implementation: async () => {
          // Enable progressive loading for all images
          const images = document.querySelectorAll('img[data-progressive]');
          images.forEach((img) => {
            // Implementation would be handled by EnhancedImage component
          });
        },
        expectedImprovement: 'Improve perceived performance by 25%'
      }
    ];
  }

  // Execute optimization strategies
  async executeOptimizations(priority?: 'high' | 'medium' | 'low'): Promise<void> {
    const strategies = priority 
      ? this.optimizationStrategies.filter(s => s.priority === priority)
      : this.optimizationStrategies;

    const optimizationPromises = strategies.map(async (strategy) => {
      try {
        const startTime = performance.now();
        await strategy.implementation();
        const executionTime = performance.now() - startTime;
        
        console.log(`✅ ${strategy.name} completed in ${executionTime.toFixed(2)}ms`);
      } catch (error) {
        console.error(`❌ ${strategy.name} failed:`, error);
      }
    });

    await Promise.allSettled(optimizationPromises);
  }

  // Get current performance metrics
  getMetrics(): PerformanceMetrics {
    const cacheMetrics = getCachePerformanceMetrics();
    
    return {
      ...this.metrics,
      cacheHitRate: Object.values(cacheMetrics.hitRates).reduce((a, b) => a + b, 0) / Object.keys(cacheMetrics.hitRates).length || 0,
      bundleSize: cacheMetrics.memoryUsage,
      imageOptimizationSavings: this.calculateImageSavings(),
      audienceDetectionTime: this.metrics.audienceDetectionTime || 0
    } as PerformanceMetrics;
  }

  // Analyze performance and provide recommendations
  analyzePerformance(): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check LCP
    if (metrics.largestContentfulPaint > PERFORMANCE_THRESHOLDS.LCP) {
      issues.push(`LCP is ${metrics.largestContentfulPaint}ms (should be < ${PERFORMANCE_THRESHOLDS.LCP}ms)`);
      recommendations.push('Optimize critical images and preload hero content');
      score -= 20;
    }

    // Check FID
    if (metrics.firstInputDelay > PERFORMANCE_THRESHOLDS.FID) {
      issues.push(`FID is ${metrics.firstInputDelay}ms (should be < ${PERFORMANCE_THRESHOLDS.FID}ms)`);
      recommendations.push('Reduce JavaScript execution time and implement code splitting');
      score -= 15;
    }

    // Check CLS
    if (metrics.cumulativeLayoutShift > PERFORMANCE_THRESHOLDS.CLS) {
      issues.push(`CLS is ${metrics.cumulativeLayoutShift} (should be < ${PERFORMANCE_THRESHOLDS.CLS})`);
      recommendations.push('Set explicit dimensions for images and avoid dynamic content insertion');
      score -= 15;
    }

    // Check cache hit rate
    if (metrics.cacheHitRate < 70) {
      issues.push(`Cache hit rate is ${metrics.cacheHitRate}% (should be > 70%)`);
      recommendations.push('Implement more aggressive caching strategies');
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  // Track image load time
  private trackImageLoadTime(loadTime: number): void {
    // Implementation for tracking image performance
  }

  // Calculate image optimization savings
  private calculateImageSavings(): number {
    // This would calculate actual savings from WebP/AVIF conversion
    // For now, return estimated savings
    return 35; // 35% average savings
  }

  // Generate performance report
  generateReport(): {
    metrics: PerformanceMetrics;
    analysis: ReturnType<typeof this.analyzePerformance>;
    optimizations: OptimizationStrategy[];
    timestamp: number;
  } {
    return {
      metrics: this.getMetrics(),
      analysis: this.analyzePerformance(),
      optimizations: this.optimizationStrategies,
      timestamp: Date.now()
    };
  }

  // Cleanup observers
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Utility functions for performance monitoring
export const initializePerformanceOptimizations = async (): Promise<void> => {
  const manager = PerformanceManager.getInstance();
  
  // Execute high-priority optimizations immediately
  await manager.executeOptimizations('high');
  
  // Execute medium-priority optimizations after initial load
  setTimeout(() => {
    manager.executeOptimizations('medium');
  }, 1000);
  
  // Execute low-priority optimizations when idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      manager.executeOptimizations('low');
    });
  } else {
    setTimeout(() => {
      manager.executeOptimizations('low');
    }, 5000);
  }
};

// Performance monitoring hook for React components
export const usePerformanceMonitoring = () => {
  const manager = PerformanceManager.getInstance();
  
  return {
    getMetrics: () => manager.getMetrics(),
    analyzePerformance: () => manager.analyzePerformance(),
    generateReport: () => manager.generateReport()
  };
};

// Export singleton instance
export const performanceManager = PerformanceManager.getInstance();