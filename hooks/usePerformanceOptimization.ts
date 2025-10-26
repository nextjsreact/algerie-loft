'use client';

import { useEffect, useState } from 'react';
import { 
  initializePerformanceOptimizations,
  usePerformanceMonitoring,
  type PerformanceMetrics
} from '@/lib/performance/performance-manager';
import { detectAudience, preloadAudienceComponents } from '@/lib/performance/code-splitting';
import { preloadCriticalImages } from '@/lib/performance/enhanced-image-optimization';
import { CacheManager } from '@/lib/performance/enhanced-caching';

// Performance optimization hook for dual-audience homepage
export const usePerformanceOptimization = (options: {
  enableImageOptimization?: boolean;
  enableCodeSplitting?: boolean;
  enableCaching?: boolean;
  criticalImages?: string[];
} = {}) => {
  const {
    enableImageOptimization = true,
    enableCodeSplitting = true,
    enableCaching = true,
    criticalImages = []
  } = options;

  const [isOptimized, setIsOptimized] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [audience, setAudience] = useState<'guest' | 'owner' | 'both'>('both');
  const { getMetrics, analyzePerformance } = usePerformanceMonitoring();

  // Initialize performance optimizations
  useEffect(() => {
    const initializeOptimizations = async () => {
      try {
        setOptimizationProgress(10);

        // Detect audience type
        const detectedAudience = detectAudience();
        setAudience(detectedAudience);
        setOptimizationProgress(20);

        // Initialize caching if enabled
        if (enableCaching) {
          const cacheManager = CacheManager.getInstance();
          // Cache manager is already initialized
          setOptimizationProgress(40);
        }

        // Preload critical images if enabled
        if (enableImageOptimization && criticalImages.length > 0) {
          await preloadCriticalImages(criticalImages);
          setOptimizationProgress(60);
        }

        // Preload audience-specific components if enabled
        if (enableCodeSplitting) {
          await preloadAudienceComponents(detectedAudience);
          setOptimizationProgress(80);
        }

        // Initialize all performance optimizations
        await initializePerformanceOptimizations();
        setOptimizationProgress(100);
        setIsOptimized(true);

      } catch (error) {
        console.error('Performance optimization failed:', error);
        setIsOptimized(true); // Continue without optimizations
      }
    };

    initializeOptimizations();
  }, [enableImageOptimization, enableCodeSplitting, enableCaching, criticalImages]);

  // Performance metrics state
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);

  // Update performance metrics periodically
  useEffect(() => {
    if (!isOptimized) return;

    const updateMetrics = () => {
      const metrics = getMetrics();
      setPerformanceMetrics(metrics);
    };

    // Initial metrics
    updateMetrics();

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, [isOptimized, getMetrics]);

  // Get performance analysis
  const getPerformanceAnalysis = () => {
    if (!isOptimized) return null;
    return analyzePerformance();
  };

  // Preload specific images
  const preloadImages = async (imagePaths: string[]) => {
    if (!enableImageOptimization) return;
    
    try {
      await preloadCriticalImages(imagePaths);
    } catch (error) {
      console.warn('Failed to preload images:', error);
    }
  };

  // Cache specific data
  const cacheData = (key: string, data: any, type: 'guest' | 'owner' | 'static' = 'static') => {
    if (!enableCaching) return;

    const cacheManager = CacheManager.getInstance();
    const cache = cacheManager.getCache(
      type === 'guest' ? 'guestData' : 
      type === 'owner' ? 'ownerData' : 'staticContent'
    );
    cache.set(key, data);
  };

  // Get cached data
  const getCachedData = <T>(key: string, type: 'guest' | 'owner' | 'static' = 'static'): T | null => {
    if (!enableCaching) return null;

    const cacheManager = CacheManager.getInstance();
    const cache = cacheManager.getCache<T>(
      type === 'guest' ? 'guestData' : 
      type === 'owner' ? 'ownerData' : 'staticContent'
    );
    return cache.get(key);
  };

  return {
    // Optimization state
    isOptimized,
    optimizationProgress,
    audience,
    
    // Performance metrics
    performanceMetrics,
    getPerformanceAnalysis,
    
    // Utility functions
    preloadImages,
    cacheData,
    getCachedData,
    
    // Configuration
    config: {
      enableImageOptimization,
      enableCodeSplitting,
      enableCaching
    }
  };
};

// Hook for monitoring Core Web Vitals
export const useWebVitals = () => {
  const [vitals, setVitals] = useState<{
    LCP?: number;
    FID?: number;
    CLS?: number;
    FCP?: number;
    TTFB?: number;
  }>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Import web-vitals dynamically to avoid SSR issues
    import('web-vitals').then(({ onLCP, onFID, onCLS, onFCP, onTTFB }) => {
      onLCP((metric) => {
        setVitals(prev => ({ ...prev, LCP: metric.value }));
      });

      onFID((metric) => {
        setVitals(prev => ({ ...prev, FID: metric.value }));
      });

      onCLS((metric) => {
        setVitals(prev => ({ ...prev, CLS: metric.value }));
      });

      onFCP((metric) => {
        setVitals(prev => ({ ...prev, FCP: metric.value }));
      });

      onTTFB((metric) => {
        setVitals(prev => ({ ...prev, TTFB: metric.value }));
      });
    }).catch((error) => {
      console.warn('Failed to load web-vitals:', error);
    });
  }, []);

  return vitals;
};

// Hook for image loading optimization
export const useImageOptimization = (imageSrc: string, options: {
  priority?: boolean;
  audienceType?: 'guest' | 'owner' | 'shared';
} = {}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOptimized, setIsOptimized] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState(imageSrc);

  useEffect(() => {
    const optimizeImage = async () => {
      try {
        // This would use the enhanced image optimization
        // For now, we'll just use the original src
        setOptimizedSrc(imageSrc);
        setIsOptimized(true);
      } catch (error) {
        console.warn('Image optimization failed:', error);
        setOptimizedSrc(imageSrc);
        setIsOptimized(true);
      }
    };

    optimizeImage();
  }, [imageSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return {
    src: optimizedSrc,
    isLoaded,
    isOptimized,
    onLoad: handleLoad
  };
};