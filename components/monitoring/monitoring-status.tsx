'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  RefreshCw
} from 'lucide-react';
import { useMonitoringDashboard } from '@/hooks/use-monitoring-dashboard';

interface MonitoringStatusProps {
  compact?: boolean;
  showDetails?: boolean;
}

export function MonitoringStatus({ compact = true, showDetails = false }: MonitoringStatusProps) {
  const { 
    data, 
    loading, 
    error, 
    lastUpdated, 
    refresh,
    systemStatus,
    criticalErrors,
    averageUptime,
    isHealthy,
    isDegraded,
    isUnhealthy 
  } = useMonitoringDashboard({
    refreshInterval: 60000, // Refresh every minute for status
    autoRefresh: true,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusIcon = () => {
    if (loading) return <Activity className="h-3 w-3 animate-pulse" />;
    if (isHealthy) return <CheckCircle className="h-3 w-3 text-green-600" />;
    if (isDegraded) return <AlertTriangle className="h-3 w-3 text-yellow-600" />;
    if (isUnhealthy) return <AlertTriangle className="h-3 w-3 text-red-600" />;
    return <Activity className="h-3 w-3 text-gray-600" />;
  };

  const getStatusColor = () => {
    if (isHealthy) return 'bg-green-100 text-green-800 border-green-200';
    if (isDegraded) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (isUnhealthy) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = () => {
    if (loading) return 'Checking...';
    if (error) return 'Error';
    return systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1);
  };

  if (compact && !showDetails) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            {getStatusIcon()}
            <span className="ml-1 text-xs">{getStatusText()}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">System Status</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Status</span>
                <Badge className={getStatusColor()}>
                  {getStatusText()}
                </Badge>
              </div>
              
              {data && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Uptime</span>
                    <span className="text-sm font-medium">
                      {averageUptime.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Response Time</span>
                    <span className="text-sm font-medium">
                      {Math.round(data.systemHealth.avgResponseTime)}ms
                    </span>
                  </div>
                  
                  {criticalErrors > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Critical Errors</span>
                      <Badge variant="destructive" className="text-xs">
                        {criticalErrors}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Sessions</span>
                    <span className="text-sm font-medium">
                      {data.analytics.totalSessions.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
              
              {lastUpdated && (
                <div className="pt-2 border-t">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    Updated {lastUpdated.toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Full status display
  return (
    <div className="flex items-center space-x-4 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <span className="font-medium">{getStatusText()}</span>
      </div>
      
      {data && (
        <>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Eye className="h-3 w-3" />
            <span>{data.analytics.totalSessions.toLocaleString()} sessions</span>
          </div>
          
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Activity className="h-3 w-3" />
            <span>{Math.round(data.systemHealth.avgResponseTime)}ms avg</span>
          </div>
          
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <CheckCircle className="h-3 w-3" />
            <span>{averageUptime.toFixed(1)}% uptime</span>
          </div>
        </>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="ml-auto"
      >
        <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}

// Minimal status indicator for headers/footers
export function MonitoringIndicator() {
  const { isHealthy, isDegraded, isUnhealthy, loading } = useMonitoringDashboard({
    refreshInterval: 120000, // Refresh every 2 minutes
    autoRefresh: true,
  });

  if (loading) {
    return (
      <div className="flex items-center space-x-1">
        <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse" />
        <span className="text-xs text-muted-foreground">Checking</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      <div className={`h-2 w-2 rounded-full ${
        isHealthy ? 'bg-green-500' :
        isDegraded ? 'bg-yellow-500' :
        isUnhealthy ? 'bg-red-500' :
        'bg-gray-400'
      }`} />
      <span className="text-xs text-muted-foreground">
        {isHealthy ? 'All systems operational' :
         isDegraded ? 'Some issues detected' :
         isUnhealthy ? 'Service disruption' :
         'Status unknown'}
      </span>
    </div>
  );
}