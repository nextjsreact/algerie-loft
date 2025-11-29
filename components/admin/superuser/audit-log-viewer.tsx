"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Wrench
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

  const formatActionDetails = (details: Record<string, any>) => {
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
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Filtres et Recherche</span>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les détails..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            
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
                <SelectItem value="USER_MANAGEMENT">Gestion utilisateurs</SelectItem>
                <SelectItem value="BACKUP">Sauvegarde</SelectItem>
                <SelectItem value="SYSTEM_CONFIG">Configuration système</SelectItem>
                <SelectItem value="SECURITY">Sécurité</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
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
                <SelectValue placeholder="Niveau de sévérité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                <SelectItem value="LOW">Faible</SelectItem>
                <SelectItem value="MEDIUM">Moyen</SelectItem>
                <SelectItem value="HIGH">Élevé</SelectItem>
                <SelectItem value="CRITICAL">Critique</SelectItem>
              </SelectContent>
            </Select>

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
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Journal d'Audit</CardTitle>
          <CardDescription>
            {pagination.total} entrées trouvées
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Horodatage</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Sévérité</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Cible</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionTypeIcon(log.action_type)}
                      <Badge variant="outline">
                        {log.action_type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSeverityBadgeVariant(log.severity)}>
                      {log.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {log.superuser_name || 'Système'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {log.target_user_name || log.target_resource || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground max-w-xs truncate">
                      {formatActionDetails(log.action_details)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono">
                      {log.ip_address}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} sur {pagination.totalPages} 
                ({pagination.total} entrées au total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Détails de l'Entrée d'Audit</DialogTitle>
            <DialogDescription>
              Informations complètes sur l'action effectuée
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Horodatage</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type d'Action</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getActionTypeIcon(selectedLog.action_type)}
                    <Badge variant="outline">{selectedLog.action_type}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Sévérité</Label>
                  <div className="mt-1">
                    <Badge variant={getSeverityBadgeVariant(selectedLog.severity)}>
                      {selectedLog.severity}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Adresse IP</Label>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedLog.ip_address}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Détails de l'Action</Label>
                <pre className="mt-1 p-3 bg-muted rounded-md text-sm overflow-auto">
                  {JSON.stringify(selectedLog.action_details, null, 2)}
                </pre>
              </div>

              {selectedLog.metadata && (
                <div>
                  <Label className="text-sm font-medium">Métadonnées</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-sm overflow-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">User Agent</Label>
                <p className="text-sm text-muted-foreground break-all">
                  {selectedLog.user_agent}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}