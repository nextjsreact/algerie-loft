"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, 
  Database, 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Activity,
  BarChart3,
  Zap,
  Server,
  Play,
  Pause
} from 'lucide-react';

interface SystemStatus {
  database: {
    info: any;
    tableSizes: Array<{
      schema_name: string;
      table_name: string;
      total_size: string;
      table_size: string;
      index_size: string;
      row_count: number;
    }>;
    activeConnections: number;
  };
  timestamp: string;
}

interface DatabaseStats {
  tableStats: Array<{
    schema_name: string;
    table_name: string;
    n_live_tup: number;
    n_dead_tup: number;
    last_vacuum: string;
    last_analyze: string;
  }>;
  indexUsage: Array<{
    schema_name: string;
    table_name: string;
    index_name: string;
    usage_ratio: number;
  }>;
}

interface MaintenanceOperation {
  id: string;
  name: string;
  description: string;
  category: 'database' | 'cache' | 'system';
  requiresConfirmation: boolean;
  estimatedDuration: string;
  riskLevel: 'low' | 'medium' | 'high';
}

const MAINTENANCE_OPERATIONS: MaintenanceOperation[] = [
  {
    id: 'database-cleanup',
    name: 'Nettoyage Base de Données',
    description: 'Supprime les anciens logs d\'audit, sessions expirées et enregistrements orphelins',
    category: 'database',
    requiresConfirmation: true,
    estimatedDuration: '2-5 minutes',
    riskLevel: 'low'
  },
  {
    id: 'cache-clear',
    name: 'Vider le Cache',
    description: 'Vide tous les caches de l\'application pour forcer le rechargement',
    category: 'cache',
    requiresConfirmation: false,
    estimatedDuration: '< 1 minute',
    riskLevel: 'low'
  },
  {
    id: 'optimize-database',
    name: 'Optimiser Base de Données',
    description: 'Réindexe les tables et met à jour les statistiques pour améliorer les performances',
    category: 'database',
    requiresConfirmation: true,
    estimatedDuration: '5-15 minutes',
    riskLevel: 'medium'
  },
  {
    id: 'vacuum-analyze',
    name: 'VACUUM ANALYZE',
    description: 'Effectue un nettoyage complet et une analyse des tables de la base de données',
    category: 'database',
    requiresConfirmation: true,
    estimatedDuration: '10-30 minutes',
    riskLevel: 'medium'
  }
];

export function MaintenanceToolsPanel() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningOperations, setRunningOperations] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState<MaintenanceOperation | null>(null);
  const [operationOptions, setOperationOptions] = useState<any>({});

  useEffect(() => {
    fetchSystemStatus();
    fetchDatabaseStats();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/superuser/maintenance?operation=system-status');
      if (!response.ok) {
        throw new Error('Failed to fetch system status');
      }
      const data = await response.json();
      setSystemStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchDatabaseStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/superuser/maintenance?operation=database-stats');
      if (!response.ok) {
        throw new Error('Failed to fetch database stats');
      }
      const data = await response.json();
      setDatabaseStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const executeOperation = async (operation: MaintenanceOperation, options: any = {}) => {
    try {
      setRunningOperations(prev => new Set([...prev, operation.id]));
      setError(null);

      const response = await fetch('/api/superuser/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: operation.id,
          options
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Operation failed');
      }

      const result = await response.json();
      
      // Refresh data after successful operation
      await Promise.all([fetchSystemStatus(), fetchDatabaseStats()]);
      
      // Show success message
      setError(`✅ ${operation.name} terminé avec succès`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRunningOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operation.id);
        return newSet;
      });
      setShowConfirmDialog(null);
    }
  };

  const handleOperationClick = (operation: MaintenanceOperation) => {
    if (operation.requiresConfirmation) {
      setShowConfirmDialog(operation);
      setOperationOptions({});
    } else {
      executeOperation(operation);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'database': return <Database className="h-4 w-4" />;
      case 'cache': return <Zap className="h-4 w-4" />;
      case 'system': return <Server className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Outils de Maintenance</h2>
          <p className="text-muted-foreground">
            Gérer l'optimisation et la maintenance du système
          </p>
        </div>
        <Button onClick={() => { fetchSystemStatus(); fetchDatabaseStats(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {error && (
        <Alert variant={error.startsWith('✅') ? 'default' : 'destructive'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="operations">Opérations</TabsTrigger>
          <TabsTrigger value="database">Base de Données</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* System Status Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">État du Système</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Connexions actives:</span>
                    <Badge variant="outline">{systemStatus?.database.activeConnections || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Taille BD:</span>
                    <span className="text-sm font-medium">
                      {systemStatus?.database.info?.database_size || 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cache Status Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">État du Cache</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Taux de réussite:</span>
                    <Badge variant="outline">85%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Taille:</span>
                    <span className="text-sm font-medium">125MB</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Operations Status Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Opérations</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">En cours:</span>
                    <Badge variant={runningOperations.size > 0 ? "default" : "outline"}>
                      {runningOperations.size}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Dernière MAJ:</span>
                    <span className="text-sm font-medium">
                      {systemStatus ? new Date(systemStatus.timestamp).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MAINTENANCE_OPERATIONS.map((operation) => (
              <Card key={operation.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(operation.category)}
                      <CardTitle className="text-lg">{operation.name}</CardTitle>
                    </div>
                    <Badge className={getRiskLevelColor(operation.riskLevel)}>
                      {operation.riskLevel}
                    </Badge>
                  </div>
                  <CardDescription>{operation.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Durée estimée:</span>
                      <span className="font-medium">{operation.estimatedDuration}</span>
                    </div>
                    
                    {runningOperations.has(operation.id) && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">Opération en cours...</span>
                        </div>
                        <Progress value={undefined} className="w-full" />
                      </div>
                    )}
                    
                    <Button 
                      onClick={() => handleOperationClick(operation)}
                      disabled={runningOperations.has(operation.id)}
                      className="w-full"
                      variant={operation.riskLevel === 'high' ? 'destructive' : 'default'}
                    >
                      {runningOperations.has(operation.id) ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          En cours...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Exécuter
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Table Sizes */}
            <Card>
              <CardHeader>
                <CardTitle>Tailles des Tables</CardTitle>
                <CardDescription>Les plus grandes tables de la base de données</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {systemStatus?.database.tableSizes.slice(0, 10).map((table, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <div className="font-medium">{table.table_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {table.row_count.toLocaleString()} lignes
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{table.total_size}</div>
                        <div className="text-sm text-muted-foreground">
                          Table: {table.table_size}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Table Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiques des Tables</CardTitle>
                <CardDescription>État de maintenance des tables</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {databaseStats?.tableStats.slice(0, 10).map((stat, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <div className="font-medium">{stat.table_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Vivantes: {stat.n_live_tup} | Mortes: {stat.n_dead_tup}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          Dernier VACUUM: {stat.last_vacuum ? 
                            new Date(stat.last_vacuum).toLocaleDateString() : 'Jamais'}
                        </div>
                        <div className="text-sm">
                          Dernier ANALYZE: {stat.last_analyze ? 
                            new Date(stat.last_analyze).toLocaleDateString() : 'Jamais'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Utilisation des Index</CardTitle>
              <CardDescription>Efficacité des index de la base de données</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {databaseStats?.indexUsage.slice(0, 15).map((index, i) => (
                  <div key={i} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <div className="font-medium">{index.index_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {index.table_name}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={index.usage_ratio} className="w-20" />
                      <span className="text-sm font-medium">{index.usage_ratio}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <Dialog open={!!showConfirmDialog} onOpenChange={() => setShowConfirmDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer l'opération</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir exécuter "{showConfirmDialog.name}" ?
                <br />
                <br />
                <strong>Description:</strong> {showConfirmDialog.description}
                <br />
                <strong>Durée estimée:</strong> {showConfirmDialog.estimatedDuration}
                <br />
                <strong>Niveau de risque:</strong> {showConfirmDialog.riskLevel}
              </DialogDescription>
            </DialogHeader>
            
            {showConfirmDialog.id === 'database-cleanup' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="clean-audit-logs"
                    checked={operationOptions.cleanAuditLogs !== false}
                    onCheckedChange={(checked) => 
                      setOperationOptions(prev => ({ ...prev, cleanAuditLogs: checked }))
                    }
                  />
                  <Label htmlFor="clean-audit-logs">Nettoyer les logs d'audit anciens</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="clean-sessions"
                    checked={operationOptions.cleanSessions !== false}
                    onCheckedChange={(checked) => 
                      setOperationOptions(prev => ({ ...prev, cleanSessions: checked }))
                    }
                  />
                  <Label htmlFor="clean-sessions">Nettoyer les sessions expirées</Label>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(null)}>
                Annuler
              </Button>
              <Button 
                onClick={() => executeOperation(showConfirmDialog, operationOptions)}
                variant={showConfirmDialog.riskLevel === 'high' ? 'destructive' : 'default'}
              >
                Confirmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}