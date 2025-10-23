'use client';

import React from 'react';
import { performanceMonitor } from '@/lib/performance/performance-monitor';
import { cacheManager } from '@/lib/performance/cache-manager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Database, Clock, TrendingUp, RefreshCw } from 'lucide-react';

export function PerformanceMonitor() {
  const [metrics, setMetrics] = React.useState<any[]>([]);
  const [cacheStats, setCacheStats] = React.useState<any>({});
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const updateStats = () => {
      setMetrics(performanceMonitor.getPerformanceSummary());
      setCacheStats(cacheManager.getStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Mise à jour toutes les 5 secondes

    return () => clearInterval(interval);
  }, []);

  const clearCache = () => {
    cacheManager.clear();
    performanceMonitor.clearMetrics();
    setCacheStats(cacheManager.getStats());
    setMetrics([]);
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
          title="Ouvrir le moniteur de performance"
        >
          <Zap className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="shadow-2xl border-2 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-blue-600" />
              Performance Monitor
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={clearCache}
                title="Vider le cache"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
              >
                ✕
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Cache Stats */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-green-600" />
              <span className="font-medium">Cache</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <div className="font-bold text-blue-600">{cacheStats.size || 0}</div>
                <div className="text-gray-500">Entrées</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-600">{Math.round(cacheStats.usage || 0)}%</div>
                <div className="text-gray-500">Utilisation</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-purple-600">{cacheStats.limit || 0}</div>
                <div className="text-gray-500">Limite</div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="font-medium">Métriques</span>
            </div>
            
            {metrics.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {metrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="truncate">{metric.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={metric.average < 100 ? 'default' : metric.average < 500 ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {Math.round(metric.average)}ms
                      </Badge>
                      <span className="text-gray-400 text-xs">({metric.count})</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 text-sm py-4">
                Aucune métrique collectée
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              <span className="font-medium">Actions</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.reload()}
                className="text-xs"
              >
                Recharger
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(registrations => {
                      registrations.forEach(registration => registration.unregister());
                    });
                  }
                }}
                className="text-xs"
              >
                Clear SW
              </Button>
            </div>
          </div>

          {/* Status */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Monitoring actif</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}