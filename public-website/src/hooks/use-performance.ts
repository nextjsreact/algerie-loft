'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

export function usePerformance() {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        switch (entry.entryType) {
          case 'navigation':
            const navEntry = entry as PerformanceNavigationTiming;
            setMetrics(prev => ({
              ...prev,
              loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            }));
            break;
            
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              setMetrics(prev => ({
                ...prev,
                firstContentfulPaint: entry.startTime,
              }));
            }
            break;
            
          case 'largest-contentful-paint':
            setMetrics(prev => ({
              ...prev,
              largestContentfulPaint: entry.startTime,
            }));
            break;
            
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              setMetrics(prev => ({
                ...prev,
                cumulativeLayoutShift: (prev.cumulativeLayoutShift || 0) + (entry as any).value,
              }));
            }
            break;
            
          case 'first-input':
            setMetrics(prev => ({
              ...prev,
              firstInputDelay: (entry as any).processingStart - entry.startTime,
            }));
            break;
        }
      });
    });

    // Observe different types of performance entries
    try {
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }

    // Set loading to false after initial metrics are collected
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const getPerformanceScore = () => {
    if (!metrics.largestContentfulPaint || !metrics.firstContentfulPaint) {
      return null;
    }

    let score = 100;
    
    // LCP scoring (0-40 points)
    if (metrics.largestContentfulPaint > 4000) score -= 40;
    else if (metrics.largestContentfulPaint > 2500) score -= 20;
    
    // FCP scoring (0-30 points)
    if (metrics.firstContentfulPaint > 3000) score -= 30;
    else if (metrics.firstContentfulPaint > 1800) score -= 15;
    
    // CLS scoring (0-30 points)
    if ((metrics.cumulativeLayoutShift || 0) > 0.25) score -= 30;
    else if ((metrics.cumulativeLayoutShift || 0) > 0.1) score -= 15;

    return Math.max(0, score);
  };

  return {
    metrics,
    isLoading,
    performanceScore: getPerformanceScore(),
  };
}

export function usePageLoadTime() {
  const [loadTime, setLoadTime] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const measureLoadTime = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const time = navigation.loadEventEnd - navigation.navigationStart;
        setLoadTime(time);
      }
    };

    if (document.readyState === 'complete') {
      measureLoadTime();
    } else {
      window.addEventListener('load', measureLoadTime);
      return () => window.removeEventListener('load', measureLoadTime);
    }
  }, []);

  return loadTime;
}