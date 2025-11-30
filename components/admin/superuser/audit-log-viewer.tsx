"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
  Search, 
  Download, 
  Eye, 
  Filter,
  Calendar,
  AlertTriangle,
  Shield,
  User,
  Database,
  Settings,
  Wrench,
  RefreshCw
} from 'lucide-react';
import type { AuditLogEntry } from '@/types/superuser';

interface AuditFilters {
  search: string;
  actionType: AuditLogEntry['action_type'] | 'all';
  severity: AuditLogEntry['severity'] | 'all';
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  targetUserId?: string;
}

interface AuditLogWithUser extends AuditLogEntry {
  superuser_name?: string;
  target_user_name?: string;
}

export function AuditLogViewer() {
  const [auditLogs, setAuditLogs] = useState<AuditLogWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogWithUser | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState<AuditFilters>({
    search: '',
    actionType: 'all',
    severity: 'all',
    dateRange: {
      from: null,
      to: null
    }
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [filters, pagination.page]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.actionType !== 'all') queryParams.set('actionType', filters.actionType);
      if (filters.severity !== 'all') queryParams.set('severity', filters.severity);
      if (filters.dateRange.from) queryParams.set('dateFrom', filters.dateRange.from.toISOString());
      if (filters.dateRange.to) queryParams.set('dateTo', filters.dateRange.to.toISOString());
      if (filters.targetUserId) queryParams.set('targetUserId', filters.targetUserId);
      
      queryParams.set('page', pagination.page.toString());
      queryParams.set('limit', pagination.limit.toString());

      const response = await fetch(`/api/superuser/audit?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      const data = await response.json();
      setAuditLogs(data.logs || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0
      }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.actionType !== 'all') queryParams.set('actionType', filters.actionType);
      if (filters.severity !== 'all') queryParams.set('severity', filters.severity);
      if (filters.dateRange.from) queryParams.set('dateFrom', filters.dateRange.from.toISOString());
      if (filters.dateRange.to) queryParams.set('dateTo', filters.dateRange.to.toISOString());
      
      queryParams.set('export', 'true');

      const response = await fetch(`/api/superuser/audit/export?${queryParams}`);
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const getSeverityBadgeVariant = (severity: AuditLogEntry['severity']) => {
    switch (severity) {
      case 'LOW': return 'secondary';
      case 'MEDIUM': return 'default';
      case 'HIGH': return 'destructive';
      case 'CRITICAL': return 'destructive';
      default: return 'secondary';
    }
  };

  const getActionTypeIcon = (actionType: AuditLogEntry['action_type']) => {
    switch (actionType) {
      case 'USER_MANAGEMENT': return <User className="h-4 w-4" />;
      case 'BACKUP': return <Database className="h-4 w-4" />;
      case 'SYSTEM_CONFIG': return <Settings className="h-4 w-4" />;
      case 'SECURITY': return <Shield className="h-4 w-4" />;
      case 'MAINTENANCE': return <Wrench className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatActionDetails = (details: Record<string, any> | null | undefined) => {
    if (!details || typeof details !== 'object') {
      return 'N/A';
    }
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');
  };

  if (loading && auditLogs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8" />
              Journal d'Audit Système
            </h1>
            <p className="text-blue-100 mt-2">
              Surveillance et traçabilité des actions administratives
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{pagination.total}</div>
            <div className="text-blue-100 text-sm">Entrées totales</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aujourd'hui</p>
                <p className="text-2xl font-bold text-green-600">
                  {auditLogs.filter(log => 
                    new Date(log.timestamp).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critiques</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {auditLogs.filter(log => log.severity === 'CRITICAL').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilisateurs</p>
                <p className="text-2xl font-bold text-blue-600">
                  {new Set(auditLogs.map(log => log.superuser_name).filter(Boolean)).size}
                </p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(auditLogs.map(log => log.action_type)).size}
                </p>
              </div>
              <Settings className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Filtres et Recherche</CardTitle>
                <CardDescription>Affinez votre recherche dans les logs d'audit</CardDescription>
              </div>
            </div>
            <Button onClick={handleExport} variant="outline" className="gap-2 w-full sm:w-auto">
              <Download className="h-4 w-4" />
              Exporter CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select 
                value={filters.actionType} 
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  actionType: value as AuditLogEntry['action_type'] | 'all' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type d'action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  <SelectItem value="USER_MANAGEMENT">👤 Gestion utilisateurs</SelectItem>
                  <SelectItem value="BACKUP">💾 Sauvegarde</SelectItem>
                  <SelectItem value="SYSTEM_CONFIG">⚙️ Configuration</SelectItem>
                  <SelectItem value="SECURITY">🔒 Sécurité</SelectItem>
                  <SelectItem value="MAINTENANCE">🔧 Maintenance</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.severity} 
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  severity: value as AuditLogEntry['severity'] | 'all' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sévérité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les niveaux</SelectItem>
                  <SelectItem value="LOW">🟢 Faible</SelectItem>
                  <SelectItem value="MEDIUM">🟡 Moyen</SelectItem>
                  <SelectItem value="HIGH">🟠 Élevé</SelectItem>
                  <SelectItem value="CRITICAL">🔴 Critique</SelectItem>
                </SelectContent>
              </Select>

              <div className="w-full">
                <DatePickerWithRange
                  date={filters.dateRange.from && filters.dateRange.to ? {
                    from: filters.dateRange.from,
                    to: filters.dateRange.to
                  } : undefined}
                  onDateChange={(range) => setFilters(prev => ({ 
                    ...prev, 
                    dateRange: {
                      from: range?.from || null,
                      to: range?.to || null
                    }
                  }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Journal d'Audit</CardTitle>
              <CardDescription>
                {pagination.total} entrées trouvées
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAuditLogs}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Date</TableHead>
                  <TableHead className="w-[160px]">Action</TableHead>
                  <TableHead className="w-[100px]">Sévérité</TableHead>
                  <TableHead className="w-[140px]">Utilisateur</TableHead>
                  <TableHead className="w-[140px]">Cible</TableHead>
                  <TableHead className="w-[120px]">IP</TableHead>
                  <TableHead className="w-[100px] text-center sticky right-0 bg-background">Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <AlertTriangle className="h-8 w-8" />
                        <p className="font-medium">Aucune entrée d'audit trouvée</p>
                        <p className="text-sm">Essayez de modifier vos filtres de recherche</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {new Date(log.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionTypeIcon(log.action_type)}
                          <span className="text-sm font-medium">{log.action_type || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSeverityBadgeVariant(log.severity)} className="whitespace-nowrap">
                          {log.severity || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm truncate" title={log.superuser_name || 'Système'}>
                          {log.superuser_name || 'Système'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm truncate" title={log.target_user_name || log.target_resource || '-'}>
                          {log.target_user_name || log.target_resource || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-mono truncate" title={log.ip_address || 'N/A'}>
                          {log.ip_address || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center sticky right-0 bg-background">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetails(true);
                          }}
                          className="hover:bg-primary hover:text-primary-foreground"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t bg-slate-50 dark:bg-slate-900/50">
              <div className="text-sm text-muted-foreground mb-2 sm:mb-0">
                Affichage de <span className="font-semibold">{((pagination.page - 1) * pagination.limit) + 1}</span> à{' '}
                <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> sur{' '}
                <span className="font-semibold">{pagination.total}</span> entrées
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1 || loading}
                  className="gap-1"
                >
                  ← Précédent
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded-md font-medium">
                    {pagination.page}
                  </span>
                  <span className="text-sm text-muted-foreground">sur</span>
                  <span className="text-sm font-medium">
                    {pagination.totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages || loading}
                  className="gap-1"
                >
                  Suivant →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Détails de l'Entrée d'Audit
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur l'action effectuée
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Horodatage</Label>
                    <p className="text-sm font-medium mt-1">
                      {new Date(selectedLog.timestamp).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedLog.timestamp).toLocaleTimeString('fr-FR')}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-4">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Type d'Action</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getActionTypeIcon(selectedLog.action_type)}
                      <Badge variant="outline" className="text-sm">{selectedLog.action_type || 'Non spécifié'}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="pt-4">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Sévérité</Label>
                    <div className="mt-1">
                      <Badge variant={getSeverityBadgeVariant(selectedLog.severity)} className="text-sm">
                        {selectedLog.severity || 'Non spécifié'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Adresse IP</Label>
                    <p className="text-sm font-mono mt-1">
                      {selectedLog.ip_address || 'Non disponible'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-500">
                  <CardContent className="pt-4">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Utilisateur</Label>
                    <p className="text-sm font-medium mt-1">
                      {selectedLog.superuser_name || 'Système'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-pink-500">
                  <CardContent className="pt-4">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Cible</Label>
                    <p className="text-sm font-medium mt-1">
                      {selectedLog.target_user_name || selectedLog.target_resource || 'Non spécifié'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Action Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Détails de l'Action</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedLog.action_details && Object.keys(selectedLog.action_details).length > 0 ? (
                    <pre className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs overflow-auto max-h-60 border">
                      {JSON.stringify(selectedLog.action_details, null, 2)}
                    </pre>
                  ) : (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm text-muted-foreground border text-center">
                      Aucun détail disponible pour cette action
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Metadata */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Métadonnées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs overflow-auto max-h-60 border">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* User Agent */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Agent Utilisateur</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground break-all font-mono bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
                    {selectedLog.user_agent || 'Non disponible'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}