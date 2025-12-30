'use client';

import { useEffect, useState } from 'react';
import { getCachePerformanceMetrics } from '@/lib/performance/caching-strategy';

interface PerformanceMetrics {
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
}

interface CacheMetrics {
  hitRate: number;
  totalItems: number;
  validItems: number;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
  });
  
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or when explicitly enabled
    const shouldShow = process.env.NODE_ENV === 'development' || 
                      localStorage.getItem('show-performance-monitor') === 'true';
    setIsVisible(shouldShow);

    if (!shouldShow) return;

    // Measure Core Web Vitals
    const measureWebVitals = () => {
      // LCP - Largest Contentful Paint
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID - First Input Delay
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
        });
      }).observe({ entryTypes: ['first-input'] });

      // CLS - Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            setMetrics(prev => ({ ...prev, cls: clsValue }));
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });

      // FCP - First Contentful Paint
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
          }
        });
      }).observe({ entryTypes: ['paint'] });

      // TTFB - Time to First Byte
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
        setMetrics(prev => ({ ...prev, ttfb: navEntry.responseStart - navEntry.requestStart }));
      }
    };

    // Update cache metrics periodically
    const updateCacheMetrics = () => {
      const cacheStats = getCachePerformanceMetrics();
      setCacheMetrics(cacheStats.client);
    };

    measureWebVitals();
    updateCacheMetrics();

    // Update cache metrics every 5 seconds
    const cacheInterval = setInterval(updateCacheMetrics, 5000);

    return () => {
      clearInterval(cacheInterval);
    };
  }, []);

  // Send metrics to analytics
  useEffect(() => {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      Object.entries(metrics).forEach(([key, value]) => {
        if (value !== null) {
          (window as any).gtag('event', 'web_vitals', {
            metric_name: key,
            metric_value: Math.round(value),
            page_path: window.location.pathname,
          });
        }
      });
    }
  }, [metrics]);

  if (!isVisible) return null;

  const getMetricColor = (metric: string, value: number | null) => {
    if (value === null) return 'text-gray-400';
    
    switch (metric) {
      case 'lcp':
        return value <= 2500 ? 'text-green-500' : value <= 4000 ? 'text-yellow-500' : 'text-red-500';
      case 'fid':
        return value <= 100 ? 'text-green-500' : value <= 300 ? 'text-yellow-500' : 'text-red-500';
      case 'cls':
        return value <= 0.1 ? 'text-green-500' : value <= 0.25 ? 'text-yellow-500' : 'text-red-500';
      case 'fcp':
        return value <= 1800 ? 'text-green-500' : value <= 3000 ? 'text-yellow-500' : 'text-red-500';
      case 'ttfb':
        return value <= 800 ? 'text-green-500' : value <= 1800 ? 'text-yellow-500' : 'text-red-500';
      default:
        return 'text-gray-600';
    }
  };

  const formatValue = (metric: string, value: number | null) => {
    if (value === null) return 'N/A';
    
    switch (metric) {
      case 'cls':
        return value.toFixed(3);
      case 'lcp':
      case 'fid':
      case 'fcp':
      case 'ttfb':
        return `${Math.round(value)}ms`;
      default:
        return value.toString();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Performance</h3>
        <button
          onClick={() => {
            localStorage.setItem('show-performance-monitor', 'false');
            setIsVisible(false);
          }}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      {/* Core Web Vitals */}
      <div className="space-y-1 mb-3">
        <div className="text-xs text-gray-300 font-semibold">Core Web Vitals</div>
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="uppercase">{key}:</span>
            <span className={getMetricColor(key, value)}>
              {formatValue(key, value)}
            </span>
          </div>
        ))}
      </div>

      {/* Cache Metrics */}
      {cacheMetrics && (
        <div className="space-y-1 border-t border-gray-600 pt-2">
          <div className="text-xs text-gray-300 font-semibold">Cache</div>
          <div className="flex justify-between">
            <span>Hit Rate:</span>
            <span className={cacheMetrics.hitRate > 0.8 ? 'text-green-500' : 'text-yellow-500'}>
              {(cacheMetrics.hitRate * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Items:</span>
            <span className="text-blue-400">{cacheMetrics.validItems}/{cacheMetrics.totalItems}</span>
          </div>
        </div>
      )}

      {/* Performance Tips */}
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div className="text-xs text-gray-300">
          {metrics.lcp && metrics.lcp > 2500 && '⚠️ Optimize LCP'}
          {metrics.fid && metrics.fid > 100 && '⚠️ Reduce FID'}
          {metrics.cls && metrics.cls > 0.1 && '⚠️ Fix Layout Shift'}
          {cacheMetrics && cacheMetrics.hitRate < 0.5 && '⚠️ Low Cache Hit Rate'}
        </div>
      </div>
    </div>
  );
}

// Hook for performance monitoring
export function usePerformanceMonitoring() {
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    const shouldMonitor = process.env.NODE_ENV === 'development' || 
                         localStorage.getItem('enable-performance-monitoring') === 'true';
    setIsMonitoring(shouldMonitor);
  }, []);

  const startMonitoring = () => {
    localStorage.setItem('enable-performance-monitoring', 'true');
    localStorage.setItem('show-performance-monitor', 'true');
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    localStorage.setItem('enable-performance-monitoring', 'false');
    localStorage.setItem('show-performance-monitor', 'false');
    setIsMonitoring(false);
  };

  return {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
  };
}