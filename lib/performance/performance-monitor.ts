/**
 * Moniteur de performance pour surveiller les métriques Web Vitals
 */

import { WEB_VITALS_CONFIG } from './optimization-config';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isEnabled = WEB_VITALS_CONFIG.ENABLE_MONITORING;

  constructor() {
    if (typeof window !== 'undefined' && this.isEnabled) {
      this.initializeWebVitals();
    }
  }

  /**
   * Initialise le monitoring des Web Vitals
   */
  private initializeWebVitals() {
    // Lazy load web-vitals pour éviter d'impacter le bundle principal
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
      onCLS(this.handleMetric.bind(this));
      onFID(this.handleMetric.bind(this));
      onFCP(this.handleMetric.bind(this));
      onLCP(this.handleMetric.bind(this));
      onTTFB(this.handleMetric.bind(this));
    });
  }

  /**
   * Gère les métriques reçues
   */
  private handleMetric(metric: any) {
    // Échantillonnage pour réduire la charge
    if (Math.random() > WEB_VITALS_CONFIG.SAMPLE_RATE) {
      return;
    }

    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      timestamp: Date.now(),
      url: window.location.href
    };

    this.metrics.push(performanceMetric);
    this.reportMetric(performanceMetric);

    // Limite le nombre de métriques en mémoire
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-50);
    }
  }

  /**
   * Rapporte une métrique (peut être envoyé à un service d'analytics)
   */
  private reportMetric(metric: PerformanceMetric) {
    // Log en développement
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance Metric: ${metric.name} = ${metric.value}ms`);
    }

    // Alerte si les seuils sont dépassés
    this.checkThresholds(metric);

    // Ici vous pouvez envoyer les métriques à votre service d'analytics
    // Exemple: analytics.track('performance_metric', metric);
  }

  /**
   * Vérifie si les seuils de performance sont respectés
   */
  private checkThresholds(metric: PerformanceMetric) {
    const thresholds = {
      LCP: WEB_VITALS_CONFIG.LCP_THRESHOLD,
      FID: WEB_VITALS_CONFIG.FID_THRESHOLD,
      CLS: WEB_VITALS_CONFIG.CLS_THRESHOLD
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    
    if (threshold && metric.value > threshold) {
      console.warn(`⚠️ Performance Alert: ${metric.name} (${metric.value}) exceeds threshold (${threshold})`);
    }
  }

  /**
   * Mesure le temps d'exécution d'une fonction
   */
  measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    this.reportMetric({
      name: `custom_${name}`,
      value: duration,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : ''
    });

    return result;
  }

  /**
   * Mesure le temps d'exécution d'une fonction async
   */
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    this.reportMetric({
      name: `async_${name}`,
      value: duration,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : ''
    });

    return result;
  }

  /**
   * Obtient les métriques collectées
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Obtient un résumé des performances
   */
  getPerformanceSummary() {
    const metricsByName = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    const summary = Object.entries(metricsByName).map(([name, values]) => ({
      name,
      count: values.length,
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    }));

    return summary;
  }

  /**
   * Vide les métriques
   */
  clearMetrics() {
    this.metrics = [];
  }
}

// Instance singleton
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook React pour mesurer les performances des composants
 */
export function usePerformanceMonitor(componentName: string) {
  React.useEffect(() => {
    const startTime = performance.now();

    return () => {
      const renderTime = performance.now() - startTime;
      performanceMonitor.reportMetric({
        name: `component_render_${componentName}`,
        value: renderTime,
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : ''
      });
    };
  }, [componentName]);
}

/**
 * Décorateur pour mesurer les performances des fonctions
 */
export function measurePerformance(name: string) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return performanceMonitor.measureFunction(
        `${name}_${propertyKey}`,
        () => originalMethod?.apply(this, args)
      );
    } as T;

    return descriptor;
  };
}

// Import React
import React from 'react';