import { useState, useEffect, useCallback } from 'react';

interface DashboardData {
  timestamp: number;
  systemHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    errorRate: number;
    avgResponseTime: number;
  };
  webVitals: Array<{
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    threshold: { good: number; poor: number };
  }>;
  uptime: Record<string, {
    status: 'up' | 'down' | 'degraded';
    responseTime: number;
    uptime: number;
    avgResponseTime: number;
    totalChecks: number;
  }>;
  errors: {
    totalErrors: number;
    errorsByLevel: Record<string, number>;
    topErrors: Array<{ fingerprint: string; count: number; lastSeen: number }>;
    recentErrors: Array<{
      id: string;
      message: string;
      level: 'error' | 'warning' | 'info';
      timestamp: number;
    }>;
  };
  analytics: {
    totalSessions: number;
    totalPageViews: number;
    avgSessionDuration: number;
    bounceRate: number;
    topPages: Array<{ page: string; views: number }>;
    deviceBreakdown: Record<string, number>;
  };
}

interface UseMonitoringDashboardOptions {
  refreshInterval?: number;
  hours?: number;
  autoRefresh?: boolean;
}

export function useMonitoringDashboard(options: UseMonitoringDashboardOptions = {}) {
  const {
    refreshInterval = 30000, // 30 seconds
    hours = 24,
    autoRefresh = true,
  } = options;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch(`/api/monitoring/dashboard?hours=${hours}`, {
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const dashboardData = await response.json();
      setData(dashboardData);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [hours]);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchDashboardData, refreshInterval, autoRefresh]);

  // Manual refresh function
  const refresh = useCallback(() => {
    setLoading(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Helper functions for data analysis
  const getSystemStatus = useCallback(() => {
    if (!data) return 'unknown';
    return data.systemHealth.status;
  }, [data]);

  const getCriticalErrors = useCallback(() => {
    if (!data) return 0;
    return data.errors.errorsByLevel.error || 0;
  }, [data]);

  const getAverageUptime = useCallback(() => {
    if (!data || Object.keys(data.uptime).length === 0) return 100;
    
    const uptimes = Object.values(data.uptime).map(service => service.uptime);
    return uptimes.reduce((sum, uptime) => sum + uptime, 0) / uptimes.length;
  }, [data]);

  const getWorstPerformingEndpoint = useCallback(() => {
    if (!data || Object.keys(data.uptime).length === 0) return null;
    
    return Object.entries(data.uptime).reduce((worst, [endpoint, stats]) => {
      if (!worst || stats.avgResponseTime > worst.stats.avgResponseTime) {
        return { endpoint, stats };
      }
      return worst;
    }, null as { endpoint: string; stats: any } | null);
  }, [data]);

  const getPoorWebVitals = useCallback(() => {
    if (!data) return [];
    return data.webVitals.filter(vital => vital.rating === 'poor');
  }, [data]);

  const getTopErrorMessages = useCallback(() => {
    if (!data) return [];
    return data.errors.recentErrors
      .slice(0, 5)
      .map(error => ({
        message: error.message,
        level: error.level,
        timestamp: error.timestamp,
      }));
  }, [data]);

  const getAnalyticsSummary = useCallback(() => {
    if (!data) return null;
    
    const { analytics } = data;
    return {
      sessionsPerPageView: analytics.totalPageViews / analytics.totalSessions,
      avgSessionMinutes: Math.round(analytics.avgSessionDuration / 60000),
      topPage: analytics.topPages[0]?.page || 'N/A',
      primaryDevice: Object.entries(analytics.deviceBreakdown)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown',
    };
  }, [data]);

  return {
    // Data
    data,
    loading,
    error,
    lastUpdated,
    
    // Actions
    refresh,
    
    // Computed values
    systemStatus: getSystemStatus(),
    criticalErrors: getCriticalErrors(),
    averageUptime: getAverageUptime(),
    worstPerformingEndpoint: getWorstPerformingEndpoint(),
    poorWebVitals: getPoorWebVitals(),
    topErrorMessages: getTopErrorMessages(),
    analyticsSummary: getAnalyticsSummary(),
    
    // Status helpers
    isHealthy: getSystemStatus() === 'healthy',
    isDegraded: getSystemStatus() === 'degraded',
    isUnhealthy: getSystemStatus() === 'unhealthy',
    hasErrors: getCriticalErrors() > 0,
    hasPerformanceIssues: getPoorWebVitals().length > 0,
  };
}

// Hook for real-time monitoring alerts
export function useMonitoringAlerts() {
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
    acknowledged: boolean;
  }>>([]);

  const addAlert = useCallback((alert: Omit<typeof alerts[0], 'id' | 'acknowledged'>) => {
    const newAlert = {
      ...alert,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      acknowledged: false,
    };
    
    setAlerts(prev => [newAlert, ...prev.slice(0, 9)]); // Keep only 10 most recent
  }, []);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const unacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length;

  return {
    alerts,
    unacknowledgedCount,
    addAlert,
    acknowledgeAlert,
    clearAlerts,
  };
}