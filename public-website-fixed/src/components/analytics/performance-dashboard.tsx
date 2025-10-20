'use client';

import { useEffect, useState } from 'react';
import { useAnalytics } from '@/components/providers/analytics-provider';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  samples: number;
}

interface PerformanceData {
  metrics: Record<string, WebVitalMetric>;
  timestamp: number;
  timeframe: string;
}

interface AnalyticsData {
  total_events: number;
  total_unique_users: number;
  data: Array<{
    event: string;
    count: number;
    unique_users: number;
    timestamp: number;
  }>;
}

export function PerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [performanceResponse, analyticsResponse] = await Promise.all([
          fetch('/api/analytics/web-vitals'),
          fetch('/api/analytics/events'),
        ]);

        if (!performanceResponse.ok || !analyticsResponse.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const [performanceData, analyticsData] = await Promise.all([
          performanceResponse.json(),
          analyticsResponse.json(),
        ]);

        setPerformanceData(performanceData);
        setAnalyticsData(analyticsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-medium">Error loading performance data</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatMetricValue = (name: string, value: number) => {
    switch (name) {
      case 'CLS':
        return value.toFixed(3);
      case 'FID':
      case 'FCP':
      case 'LCP':
      case 'TTFB':
        return `${Math.round(value)}ms`;
      default:
        return value.toString();
    }
  };

  const getMetricDescription = (name: string) => {
    switch (name) {
      case 'CLS':
        return 'Cumulative Layout Shift';
      case 'FID':
        return 'First Input Delay';
      case 'FCP':
        return 'First Contentful Paint';
      case 'LCP':
        return 'Largest Contentful Paint';
      case 'TTFB':
        return 'Time to First Byte';
      default:
        return name;
    }
  };

  return (
    <div className="space-y-6">
      {/* Core Web Vitals */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Core Web Vitals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {performanceData?.metrics && Object.entries(performanceData.metrics).map(([name, metric]) => (
            <div key={name} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">{name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRatingColor(metric.rating)}`}>
                  {metric.rating}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {formatMetricValue(name, metric.value)}
              </div>
              <div className="text-xs text-gray-500">
                {getMetricDescription(name)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {metric.samples} samples
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Analytics Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Total Events</h3>
            <div className="text-3xl font-bold text-blue-600">
              {analyticsData?.total_events?.toLocaleString() || 0}
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Unique Users</h3>
            <div className="text-3xl font-bold text-green-600">
              {analyticsData?.total_unique_users?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Event Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Event Breakdown
        </h2>
        <div className="space-y-3">
          {analyticsData?.data?.map((event, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">{event.event}</h3>
                <p className="text-sm text-gray-500">
                  {event.unique_users} unique users
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {event.count.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">events</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">
          Performance Recommendations
        </h2>
        <div className="space-y-3">
          {performanceData?.metrics && Object.entries(performanceData.metrics).map(([name, metric]) => {
            if (metric.rating === 'poor') {
              return (
                <div key={name} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-medium text-blue-900">
                      Improve {getMetricDescription(name)}
                    </h3>
                    <p className="text-sm text-blue-700">
                      Current value: {formatMetricValue(name, metric.value)} (Poor)
                    </p>
                  </div>
                </div>
              );
            }
            if (metric.rating === 'needs-improvement') {
              return (
                <div key={name} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-medium text-blue-900">
                      Optimize {getMetricDescription(name)}
                    </h3>
                    <p className="text-sm text-blue-700">
                      Current value: {formatMetricValue(name, metric.value)} (Needs Improvement)
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })}
          {performanceData?.metrics && Object.values(performanceData.metrics).every(m => m.rating === 'good') && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-blue-900">
                  Excellent Performance!
                </h3>
                <p className="text-sm text-blue-700">
                  All Core Web Vitals are in the good range.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for real-time performance monitoring
export function usePerformanceMonitoring() {
  const { trackEvent } = useAnalytics();
  
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Monitor page load performance
    const trackPagePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const metrics = {
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp: navigation.connectEnd - navigation.connectStart,
          ssl: navigation.connectEnd - navigation.secureConnectionStart,
          ttfb: navigation.responseStart - navigation.requestStart,
          download: navigation.responseEnd - navigation.responseStart,
          domParse: navigation.domContentLoadedEventStart - navigation.responseEnd,
          domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          onLoad: navigation.loadEventEnd - navigation.loadEventStart,
          total: navigation.loadEventEnd - navigation.navigationStart,
        };

        // Track slow performance
        if (metrics.total > 3000) {
          trackEvent('slow_page_load', {
            event_category: 'Performance',
            load_time: metrics.total,
            page_url: window.location.pathname,
          });
        }

        if (metrics.ttfb > 1000) {
          trackEvent('slow_ttfb', {
            event_category: 'Performance',
            ttfb: metrics.ttfb,
            page_url: window.location.pathname,
          });
        }
      }
    };

    // Monitor resource loading
    const trackResourcePerformance = () => {
      const resources = performance.getEntriesByType('resource');
      
      resources.forEach((resource) => {
        if (resource.duration > 2000) { // Resources taking more than 2 seconds
          trackEvent('slow_resource', {
            event_category: 'Performance',
            resource_name: resource.name,
            duration: resource.duration,
            resource_type: (resource as any).initiatorType,
          });
        }
      });
    };

    // Track when page is fully loaded
    if (document.readyState === 'complete') {
      trackPagePerformance();
      trackResourcePerformance();
    } else {
      window.addEventListener('load', () => {
        trackPagePerformance();
        trackResourcePerformance();
      });
    }

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // More than 50MB
        trackEvent('high_memory_usage', {
          event_category: 'Performance',
          used_heap_size: memory.usedJSHeapSize,
          total_heap_size: memory.totalJSHeapSize,
        });
      }
    }
  }, [trackEvent]);
}