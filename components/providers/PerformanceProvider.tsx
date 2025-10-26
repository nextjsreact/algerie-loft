'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PerformanceMonitor } from '@/components/debug/PerformanceMonitor';
import { OptimizedFonts, FontOptimizer } from '@/components/ui/OptimizedFonts';
import { usePerformanceMonitoring } from '@/lib/performance';

interface PerformanceContextType {
  isMonitoringEnabled: boolean;
  toggleMonitoring: () => void;
  metrics: PerformanceMetrics;
  clearCache: () => void;
}

interface PerformanceMetrics {
  renderCount: number;
  loadTime: number;
  memoryUsage: number;
  cacheHits: number;
  cacheMisses: number;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

interface PerformanceProviderProps {
  children: ReactNode;
  enableMonitoring?: boolean;
  enableDebugMode?: boolean;
}

export function PerformanceProvider({ 
  children, 
  enableMonitoring = process.env.NODE_ENV === 'development',
  enableDebugMode = false
}: PerformanceProviderProps) {
  const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(enableMonitoring);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    loadTime: 0,
    memoryUsage: 0,
    cacheHits: 0,
    cacheMisses: 0
  });

  // Initialize our new performance monitoring system
  const { recordRender } = usePerformanceMonitoring('PerformanceProvider');

  // Initialize performance monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Preload critical fonts
    FontOptimizer.preloadCriticalFonts();

    // Monitor page load performance
    const measurePageLoad = () => {
      if (performance.getEntriesByType) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.navigationStart;
          setMetrics(prev => ({ ...prev, loadTime }));
        }
      }
    };

    // Monitor memory usage
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({ 
          ...prev, 
          memoryUsage: memory.usedJSHeapSize 
        }));
      }
    };

    // Initial measurements
    measurePageLoad();
    measureMemory();

    // Record initial render performance
    recordRender(performance.now());

    // Set up periodic monitoring
    const interval = setInterval(() => {
      measureMemory();
    }, 5000);

    // Web Vitals monitoring
    if ('web-vital' in window) {
      // This would integrate with web-vitals library
      // getCLS(console.log);
      // getFID(console.log);
      // getLCP(console.log);
    }

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Performance observer for render tracking
  useEffect(() => {
    if (!isMonitoringEnabled || typeof window === 'undefined') return;

    let renderCount = 0;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure' && entry.name.includes('React')) {
          renderCount++;
          setMetrics(prev => ({ ...prev, renderCount }));
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['measure'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }

    return () => {
      observer.disconnect();
    };
  }, [isMonitoringEnabled]);

  const toggleMonitoring = () => {
    setIsMonitoringEnabled(!isMonitoringEnabled);
  };

  const clearCache = () => {
    // Clear various caches
    if (typeof window !== 'undefined') {
      // Clear localStorage cache
      Object.keys(localStorage)
        .filter(key => key.startsWith('loft-cache-'))
        .forEach(key => localStorage.removeItem(key));

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear browser cache (if possible)
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
    }

    // Reset metrics
    setMetrics({
      renderCount: 0,
      loadTime: 0,
      memoryUsage: 0,
      cacheHits: 0,
      cacheMisses: 0
    });
  };

  const contextValue: PerformanceContextType = {
    isMonitoringEnabled,
    toggleMonitoring,
    metrics,
    clearCache
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      <OptimizedFonts />
      {children}
      {(isMonitoringEnabled || enableDebugMode) && <PerformanceMonitor />}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

// Performance tracking hooks
export function usePerformanceTracker(componentName: string) {
  const { isMonitoringEnabled } = usePerformance();
  
  useEffect(() => {
    if (!isMonitoringEnabled) return;

    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 16) { // More than one frame
        console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`);
      }
    };
  });
}

// Resource loading tracker
export function useResourceTracker() {
  const [loadedResources, setLoadedResources] = useState<string[]>([]);
  const [failedResources, setFailedResources] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          if (resourceEntry.transferSize === 0 && resourceEntry.decodedBodySize === 0) {
            // Resource failed to load
            setFailedResources(prev => [...prev, resourceEntry.name]);
          } else {
            // Resource loaded successfully
            setLoadedResources(prev => [...prev, resourceEntry.name]);
          }
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Resource Performance Observer not supported:', error);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return { loadedResources, failedResources };
}

// Critical resource preloader
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;

  const criticalResources = [
    '/logo.png',
    '/_next/static/css/app.css',
    '/_next/static/chunks/main.js'
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    
    if (resource.endsWith('.css')) {
      link.as = 'style';
    } else if (resource.endsWith('.js')) {
      link.as = 'script';
    } else if (resource.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
      link.as = 'image';
    }
    
    link.href = resource;
    document.head.appendChild(link);
  });
}