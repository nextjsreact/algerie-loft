'use client';

import { useEffect } from 'react';
import { BusinessEvents } from '@/lib/analytics/google-analytics';

export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Mesurer le temps de chargement de la page
    const measurePageLoad = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        const firstPaint = performance.getEntriesByName('first-paint')[0]?.startTime || 0;
        const firstContentfulPaint = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0;

        // Envoyer les métriques à Google Analytics
        BusinessEvents.pageLoadTime(Math.round(loadTime), window.location.pathname);
        
        // Log pour le développement
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 Performance Metrics:', {
            'Load Time': `${Math.round(loadTime)}ms`,
            'DOM Content Loaded': `${Math.round(domContentLoaded)}ms`,
            'First Paint': `${Math.round(firstPaint)}ms`,
            'First Contentful Paint': `${Math.round(firstContentfulPaint)}ms`,
          });
        }
      }
    };

    // Mesurer les Core Web Vitals
    const measureWebVitals = () => {
      // Largest Contentful Paint (LCP)
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 LCP:', Math.round(lastEntry.startTime), 'ms');
        }
      });
      
      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP not supported
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📐 CLS:', clsValue.toFixed(4));
        }
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // CLS not supported
      }
    };

    // Attendre que la page soit complètement chargée
    if (document.readyState === 'complete') {
      measurePageLoad();
      measureWebVitals();
    } else {
      window.addEventListener('load', () => {
        measurePageLoad();
        measureWebVitals();
      });
    }

    // Mesurer les ressources lentes
    const measureSlowResources = () => {
      const resources = performance.getEntriesByType('resource');
      const slowResources = resources.filter(resource => resource.duration > 1000);
      
      if (slowResources.length > 0 && process.env.NODE_ENV === 'development') {
        console.warn('🐌 Slow Resources (>1s):', 
          slowResources.map(r => ({
            name: r.name,
            duration: `${Math.round(r.duration)}ms`,
            type: (r as any).initiatorType
          }))
        );
      }
    };

    // Exécuter après un délai pour capturer toutes les ressources
    setTimeout(measureSlowResources, 3000);

  }, []);

  // Ce composant ne rend rien visuellement
  return null;
}

// Hook pour mesurer les performances des composants
export function usePerformanceTracking(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development' && renderTime > 100) {
        console.warn(`⚠️ Slow component render: ${componentName} took ${Math.round(renderTime)}ms`);
      }
    };
  }, [componentName]);
}

// Composant pour afficher les métriques en développement
export function PerformanceDebugger() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="mb-2 font-bold">🚀 Performance Debug</div>
      <div id="performance-metrics">
        <div>Monitoring active...</div>
      </div>
    </div>
  );
}