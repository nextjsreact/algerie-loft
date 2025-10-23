'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCacheStats } from '@/hooks/useOptimizedQuery';
import { cacheManager } from '@/lib/cache-manager';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  
  // Other metrics
  ttfb?: number; // Time to First Byte
  fcp?: number; // First Contentful Paint
  tti?: number; // Time to Interactive
  
  // Memory
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  
  // Network
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isVisible, setIsVisible] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>({});
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Collect performance metrics
  const collectMetrics = () => {
    const newMetrics: PerformanceMetrics = {};

    // Performance Navigation Timing
    if (performance.getEntriesByType) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        newMetrics.ttfb = navigation.responseStart - navigation.requestStart;
        newMetrics.fcp = navigation.loadEventEnd - navigation.navigationStart;
      }
    }

    // Memory usage (Chrome only)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      newMetrics.usedJSHeapSize = memory.usedJSHeapSize;
      newMetrics.totalJSHeapSize = memory.totalJSHeapSize;
      newMetrics.jsHeapSizeLimit = memory.jsHeapSizeLimit;
    }

    // Network information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      newMetrics.connectionType = connection.type;
      newMetrics.effectiveType = connection.effectiveType;
      newMetrics.downlink = connection.downlink;
      newMetrics.rtt = connection.rtt;
    }

    setMetrics(newMetrics);
  };

  // Collect cache statistics
  const collectCacheStats = () => {
    const queryStats = getCacheStats();
    const cacheManagerStats = cacheManager.getStats();
    
    setCacheStats({
      queryCache: queryStats,
      cacheManager: cacheManagerStats
    });
  };

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format milliseconds
  const formatMs = (ms: number) => {
    return `${ms.toFixed(2)}ms`;
  };

  // Get performance score color
  const getScoreColor = (value: number, thresholds: { good: number; needs: number }) => {
    if (value <= thresholds.good) return 'bg-green-500';
    if (value <= thresholds.needs) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Toggle visibility
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // Start/stop auto refresh
  const toggleAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    } else {
      const interval = setInterval(() => {
        collectMetrics();
        collectCacheStats();
      }, 5000); // Refresh every 5 seconds
      setRefreshInterval(interval);
    }
  };

  // Manual refresh
  const refresh = () => {
    collectMetrics();
    collectCacheStats();
  };

  // Clear all caches
  const clearAllCaches = () => {
    cacheManager.clear();
    collectCacheStats();
  };

  useEffect(() => {
    collectMetrics();
    collectCacheStats();

    // Cleanup interval on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={toggleVisibility}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
        >
          📊 Performance
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto">
      <Card className="shadow-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Performance Monitor</CardTitle>
            <div className="flex space-x-1">
              <Button
                onClick={toggleAutoRefresh}
                variant="outline"
                size="sm"
                className={refreshInterval ? 'bg-green-100' : ''}
              >
                {refreshInterval ? '⏸️' : '▶️'}
              </Button>
              <Button onClick={refresh} variant="outline" size="sm">
                🔄
              </Button>
              <Button onClick={toggleVisibility} variant="outline" size="sm">
                ❌
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 text-xs">
          {/* Loading Metrics */}
          <div>
            <h4 className="font-semibold mb-2">Loading</h4>
            <div className="space-y-1">
              {metrics.ttfb && (
                <div className="flex justify-between">
                  <span>TTFB:</span>
                  <Badge variant="outline">{formatMs(metrics.ttfb)}</Badge>
                </div>
              )}
              {metrics.fcp && (
                <div className="flex justify-between">
                  <span>FCP:</span>
                  <Badge variant="outline">{formatMs(metrics.fcp)}</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Memory Usage */}
          {metrics.usedJSHeapSize && (
            <div>
              <h4 className="font-semibold mb-2">Memory</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Used:</span>
                  <Badge variant="outline">{formatBytes(metrics.usedJSHeapSize)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <Badge variant="outline">{formatBytes(metrics.totalJSHeapSize || 0)}</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${((metrics.usedJSHeapSize / (metrics.totalJSHeapSize || 1)) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Network */}
          {metrics.connectionType && (
            <div>
              <h4 className="font-semibold mb-2">Network</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <Badge variant="outline">{metrics.effectiveType}</Badge>
                </div>
                {metrics.downlink && (
                  <div className="flex justify-between">
                    <span>Speed:</span>
                    <Badge variant="outline">{metrics.downlink} Mbps</Badge>
                  </div>
                )}
                {metrics.rtt && (
                  <div className="flex justify-between">
                    <span>RTT:</span>
                    <Badge variant="outline">{metrics.rtt}ms</Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cache Statistics */}
          <div>
            <h4 className="font-semibold mb-2">Cache</h4>
            <div className="space-y-1">
              {cacheStats.queryCache && (
                <div className="flex justify-between">
                  <span>Query Cache:</span>
                  <Badge variant="outline">{cacheStats.queryCache.size} entries</Badge>
                </div>
              )}
              {cacheStats.cacheManager && (
                <>
                  <div className="flex justify-between">
                    <span>Memory Cache:</span>
                    <Badge variant="outline">{cacheStats.cacheManager.memoryEntries} entries</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Persistent:</span>
                    <Badge variant="outline">{cacheStats.cacheManager.persistentEntries} entries</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Usage:</span>
                    <Badge variant="outline">{formatBytes(cacheStats.cacheManager.totalMemoryUsage)}</Badge>
                  </div>
                </>
              )}
              <Button 
                onClick={clearAllCaches} 
                variant="destructive" 
                size="sm" 
                className="w-full mt-2"
              >
                Clear All Caches
              </Button>
            </div>
          </div>

          {/* Performance Tips */}
          <div>
            <h4 className="font-semibold mb-2">Tips</h4>
            <div className="text-xs text-gray-600 space-y-1">
              {metrics.usedJSHeapSize && metrics.totalJSHeapSize && 
               (metrics.usedJSHeapSize / metrics.totalJSHeapSize) > 0.8 && (
                <div className="text-red-600">⚠️ High memory usage detected</div>
              )}
              {metrics.ttfb && metrics.ttfb > 600 && (
                <div className="text-yellow-600">⚠️ Slow server response time</div>
              )}
              {cacheStats.cacheManager?.memoryEntries > 800 && (
                <div className="text-yellow-600">⚠️ Consider clearing cache</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}