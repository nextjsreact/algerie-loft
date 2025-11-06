"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Database, 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Server,
  HardDrive,
  Zap
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import type { SystemMetrics, SecurityAlert, AuditLogEntry } from '@/types/superuser';

interface DashboardData {
  systemMetrics: SystemMetrics;
  recentAlerts: SecurityAlert[];
  recentAuditLogs: AuditLogEntry[];
}

export function SuperuserDashboard() {
  const t = useTranslations('superuser');
  const locale = useLocale();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/superuser/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusColor = (status: SystemMetrics['system_health']) => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600';
      case 'WARNING': return 'text-yellow-600';
      case 'CRITICAL': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthStatusIcon = (status: SystemMetrics['system_health']) => {
    switch (status) {
      case 'HEALTHY': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'WARNING': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'CRITICAL': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityBadgeVariant = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'LOW': return 'secondary';
      case 'MEDIUM': return 'default';
      case 'HIGH': return 'destructive';
      case 'CRITICAL': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {t('dashboard.errorLoading')}: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert>
        <AlertDescription>
          {t('dashboard.noData')}
        </AlertDescription>
      </Alert>
    );
  }

  const { systemMetrics, recentAlerts, recentAuditLogs } = dashboardData;

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.systemStatus')}</CardTitle>
            {getHealthStatusIcon(systemMetrics.system_health)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthStatusColor(systemMetrics.system_health)}`}>
              {systemMetrics.system_health}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.responseTime')}: {systemMetrics.response_time_avg}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.activeUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.active_users}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.sessions')}: {systemMetrics.active_sessions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.reservations')}</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.total_reservations}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.errorRate')}: {systemMetrics.error_rate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.backup')}</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={systemMetrics.backup_status === 'UP_TO_DATE' ? 'default' : 'destructive'}>
                {systemMetrics.backup_status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.lastBackup')}: {new Date(systemMetrics.last_backup).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('dashboard.overview')}</TabsTrigger>
          <TabsTrigger value="alerts">{t('dashboard.securityAlerts')}</TabsTrigger>
          <TabsTrigger value="audit">{t('dashboard.auditLog')}</TabsTrigger>
          <TabsTrigger value="emergency">{t('dashboard.emergencyActions')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {t('dashboard.systemPerformance')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{t('dashboard.database')}</span>
                  <span className="text-sm text-muted-foreground">
                    {(systemMetrics.database_size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{t('dashboard.avgResponseTime')}</span>
                  <span className="text-sm text-muted-foreground">
                    {systemMetrics.response_time_avg}ms
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{t('dashboard.errorRate')}</span>
                  <Badge variant={systemMetrics.error_rate > 5 ? 'destructive' : 'secondary'}>
                    {systemMetrics.error_rate}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  {t('dashboard.quickActions')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = `/${locale}/admin/superuser/users`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {t('dashboard.cards.userManagement.title')}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = `/${locale}/admin/superuser/backup`}
                >
                  <Database className="h-4 w-4 mr-2" />
                  {t('dashboard.cards.backup.title')}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = `/${locale}/admin/superuser/audit`}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {t('dashboard.cards.audit.title')}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = `/${locale}/admin/superuser/maintenance`}
                >
                  <Server className="h-4 w-4 mr-2" />
                  {t('dashboard.cards.maintenance.title')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.recentSecurityAlerts')}</CardTitle>
              <CardDescription>
                {t('dashboard.securityAlertsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentAlerts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {t('dashboard.noRecentAlerts')}
                </p>
              ) : (
                <div className="space-y-3">
                  {recentAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <span className="text-sm font-medium">{alert.alert_type}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {alert.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          IP: {alert.source_ip} • {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!alert.resolved && (
                        <Button size="sm" variant="outline">
                          {t('dashboard.resolve')}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.recentAuditLog')}</CardTitle>
              <CardDescription>
                {t('dashboard.auditLogDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentAuditLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {t('dashboard.noRecentAuditEntries')}
                </p>
              ) : (
                <div className="space-y-3">
                  {recentAuditLogs.map((log) => (
                    <div key={log.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{log.action_type}</Badge>
                          <Badge variant={getSeverityBadgeVariant(log.severity)}>
                            {log.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {JSON.stringify(log.action_details)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          IP: {log.ip_address} • {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">{t('dashboard.emergencyActions')}</CardTitle>
              <CardDescription>
                {t('dashboard.emergencyActionsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t('dashboard.emergencyWarning')}
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="destructive" className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  {t('dashboard.emergencyLockdown')}
                </Button>
                <Button variant="destructive" className="w-full">
                  <Database className="h-4 w-4 mr-2" />
                  {t('dashboard.emergencyBackup')}
                </Button>
                <Button variant="destructive" className="w-full">
                  <Server className="h-4 w-4 mr-2" />
                  {t('dashboard.systemRestart')}
                </Button>
                <Button variant="destructive" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  {t('dashboard.massLogout')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}