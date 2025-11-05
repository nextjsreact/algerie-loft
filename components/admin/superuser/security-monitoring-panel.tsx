"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  Ban,
  RefreshCw
} from 'lucide-react';

export function SecurityMonitoringPanel() {
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const response = await fetch('/api/superuser/security');
      const data = await response.json();
      setAlerts(data.alerts || []);
      setMetrics(data.metrics || {});
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch('/api/superuser/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'resolve-alert', alertId })
      });
      fetchSecurityData();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Surveillance de Sécurité</h2>
        <Button onClick={fetchSecurityData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Alertes Actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.filter((a: any) => !a.resolved).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tentatives Échouées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.failedLogins24h || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activités Suspectes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.suspiciousActivities24h || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alertes de Sécurité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.slice(0, 10).map((alert: any) => (
              <div key={alert.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <div className="font-medium">{alert.description}</div>
                  <div className="text-sm text-muted-foreground">
                    IP: {alert.source_ip} | {new Date(alert.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={alert.severity === 'CRITICAL' ? 'destructive' : 'default'}>
                    {alert.severity}
                  </Badge>
                  {!alert.resolved && (
                    <Button size="sm" onClick={() => resolveAlert(alert.id)}>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}