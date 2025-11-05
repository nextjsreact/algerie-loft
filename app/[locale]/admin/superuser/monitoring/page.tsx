import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Server, Database, Users, Zap, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Monitoring Système - Superuser',
  description: 'Surveillance en temps réel du système'
}

export default async function MonitoringPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Monitoring Système
        </h1>
        <p className="text-gray-600 mt-2">
          Surveillance en temps réel des performances et de la santé du système
        </p>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">23%</div>
            <p className="text-xs text-muted-foreground">
              Normal - 8 cores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">67%</div>
            <p className="text-xs text-muted-foreground">
              5.4GB / 8GB utilisés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">
              Response: 12ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">247</div>
            <p className="text-xs text-muted-foreground">
              +12% depuis hier
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Métriques de Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Temps de réponse API</span>
              <Badge variant="default">145ms</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Throughput</span>
              <Badge variant="default">1,247 req/min</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Taux d'erreur</span>
              <Badge variant="secondary">0.02%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Uptime</span>
              <Badge variant="default" className="bg-green-100 text-green-800">99.98%</Badge>
            </div>
          </CardContent>
        </Card>

        {/* System Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Services Système
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Web Server', status: 'running', uptime: '15d 4h' },
              { name: 'Database', status: 'running', uptime: '15d 4h' },
              { name: 'Redis Cache', status: 'running', uptime: '15d 4h' },
              { name: 'Email Service', status: 'running', uptime: '15d 4h' },
              { name: 'Backup Service', status: 'running', uptime: '15d 4h' },
            ].map((service, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">{service.name}</span>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-green-600">Running</Badge>
                  <div className="text-xs text-gray-500 mt-1">{service.uptime}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertes Récentes
          </CardTitle>
          <CardDescription>
            Événements système et alertes de surveillance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { 
                time: '14:32', 
                type: 'INFO', 
                message: 'Sauvegarde automatique terminée avec succès',
                severity: 'low'
              },
              { 
                time: '12:15', 
                type: 'WARNING', 
                message: 'Utilisation mémoire élevée détectée (85%)',
                severity: 'medium'
              },
              { 
                time: '09:45', 
                type: 'INFO', 
                message: 'Nouveau utilisateur enregistré: partner@example.com',
                severity: 'low'
              },
              { 
                time: '08:30', 
                type: 'INFO', 
                message: 'Maintenance programmée terminée',
                severity: 'low'
              },
            ].map((alert, index) => (
              <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex items-start space-x-3">
                  {alert.severity === 'medium' ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  )}
                  <div>
                    <div className="font-medium text-sm">{alert.message}</div>
                    <div className="text-xs text-gray-500">Aujourd'hui à {alert.time}</div>
                  </div>
                </div>
                <Badge variant={alert.severity === 'medium' ? 'secondary' : 'outline'}>
                  {alert.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}