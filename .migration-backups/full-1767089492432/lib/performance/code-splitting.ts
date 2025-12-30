/**
 * Code Splitting Utilities for Dual-Audience Homepage
 * Implements dynamic imports and lazy loading for guest vs owner functionality
 */

import React, { lazy, ComponentType, LazyExoticComponent, useState } from 'react';
import { EnhancedCache } from './enhanced-caching';

// Component cache for dynamic imports
const componentCache = new EnhancedCache<ComponentType<any>>('components', {
  ttl: 60 * 60 * 1000, // 1 hour
  maxSize: 50,
  strategy: 'lru',
  persistent: false
});

// Audience type detection
export type AudienceType = 'guest' | 'owner' | 'both';

// Dynamic import with caching and error handling
export function dynamicImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: T,
  cacheKey?: string
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      // Check cache first if key provided
      if (cacheKey) {
        const cached = componentCache.get(cacheKey);
        if (cached) {
          return { default: cached as T };
        }
      }
      
      const module = await importFn();
      
      // Cache the component if key provided
      if (cacheKey) {
        componentCache.set(cacheKey, module.default);
      }
      
      return module;
    } catch (error) {
      console.error('Dynamic import failed:', error);
      
      if (fallback) {
        return { default: fallback };
      }
      
      // Return a minimal error component
      const ErrorComponent = () => {
        return React.createElement('div', {
          className: 'p-4 text-center text-red-500'
        }, 'Failed to load component');
      };
      
      return { default: ErrorComponent as T };
    }
  });
}

// Guest-specific components (lazy loaded)
export const GuestComponents = {
  // Placeholder components - will be implemented when actual components exist
  // GuestHero: dynamicImport(
  //   () => import('@/components/guest/GuestHero'),
  //   undefined,
  //   'guest-hero'
  // ),
};

// Owner-specific components (lazy loaded)
export const OwnerComponents = {
  // Placeholder components - will be implemented when actual components exist
  // OwnerValueProp: dynamicImport(
  //   () => import('@/components/owner/OwnerValueProp'),
  //   undefined,
  //   'owner-value-prop'
  // ),
};

// Shared components (loaded immediately)
export const SharedComponents = {
  // Placeholder components - will be implemented when actual components exist
  // Header: dynamicImport(
  //   () => import('@/components/shared/Header'),
  //   undefined,
  //   'shared-header'
  // ),
};

// Audience detection utilities
export const detectAudience = (): AudienceType => {
  if (typeof window === 'undefined') return 'both';
  
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const audienceParam = urlParams.get('audience');
  
  if (audienceParam === 'owner' || audienceParam === 'guest') {
    return audienceParam;
  }
  
  // Check localStorage for user preference
  const storedPreference = localStorage.getItem('audience_preference');
  if (storedPreference === 'owner' || storedPreference === 'guest') {
    return storedPreference;
  }
  
  // Check referrer for hints
  const referrer = document.referrer;
  if (referrer.includes('booking') || referrer.includes('reservation')) {
    return 'guest';
  }
  if (referrer.includes('partner') || referrer.includes('owner')) {
    return 'owner';
  }
  
  // Default to both (show all content)
  return 'both';
};

// Preload components based on audience
export const preloadAudienceComponents = async (audience: AudienceType): Promise<void> => {
  const preloadPromises: Promise<any>[] = [];
  
  // Always preload shared components
  preloadPromises.push(
    ...Object.values(SharedComponents).map(Component => 
      Component.preload?.() || Promise.resolve()
    )
  );
  
  // Preload audience-specific components
  if (audience === 'guest' || audience === 'both') {
    preloadPromises.push(
      ...Object.values(GuestComponents).map(Component => 
        Component.preload?.() || Promise.resolve()
      )
    );
  }
  
  if (audience === 'owner' || audience === 'both') {
    preloadPromises.push(
      ...Object.values(OwnerComponents).map(Component => 
        Component.preload?.() || Promise.resolve()
      )
    );
  }
  
  try {
    await Promise.allSettled(preloadPromises);
  } catch (error) {
    console.warn('Some components failed to preload:', error);
  }
};

// Route-based code splitting
export const getRouteComponents = (route: string): {
  guest: ComponentType<any>[];
  owner: ComponentType<any>[];
  shared: ComponentType<any>[];
} => {
  // Return empty arrays for now - will be populated when components exist
  return {
    guest: [],
    owner: [],
    shared: []
  };
};

// Bundle size monitoring
export interface BundleMetrics {
  totalSize: number;
  guestSize: number;
  ownerSize: number;
  sharedSize: number;
  loadTime: number;
}

export const measureBundlePerformance = async (): Promise<BundleMetrics> => {
  const startTime = performance.now();
  
  // This would be implemented with actual bundle analysis tools
  // For now, we'll provide estimated metrics
  const metrics: BundleMetrics = {
    totalSize: 0,
    guestSize: 0,
    ownerSize: 0,
    sharedSize: 0,
    loadTime: performance.now() - startTime
  };
  
  // In a real implementation, you would:
  // 1. Use webpack-bundle-analyzer data
  // 2. Measure actual component sizes
  // 3. Track network requests
  
  return metrics;
};

// Progressive loading strategy
export const createProgressiveLoader = (
  components: ComponentType<any>[],
  priority: 'high' | 'medium' | 'low' = 'medium'
) => {
  const delays = {
    high: 0,
    medium: 100,
    low: 500
  };
  
  return components.map((Component, index) => {
    const delay = delays[priority] + (index * 50);
    
    return setTimeout(() => {
      // Trigger component preload
      if ('preload' in Component && typeof Component.preload === 'function') {
        Component.preload();
      }
    }, delay);
  });
};

// Component loading state management
export const useComponentLoadingState = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  const setLoading = (componentName: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [componentName]: isLoading
    }));
  };
  
  const isLoading = (componentName: string) => {
    return loadingStates[componentName] || false;
  };
  
  const isAnyLoading = () => {
    return Object.values(loadingStates).some(Boolean);
  };
  
  return {
    setLoading,
    isLoading,
    isAnyLoading,
    loadingStates
  };
};

// Export utilities for external use
export const CodeSplittingUtils = {
  detectAudience,
  preloadAudienceComponents,
  getRouteComponents,
  measureBundlePerformance,
  createProgressiveLoader
};