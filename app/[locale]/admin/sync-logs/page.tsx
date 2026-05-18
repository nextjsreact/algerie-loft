/**
 * Sync Logs Dashboard
 * 
 * Dashboard pour visualiser l'historique des synchronisations Airbnb.
 * Affiche les métriques, les logs, et les alertes.
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface SyncLog {
  id: string;
  sync_type: 'ical_auto' | 'csv_auto' | 'csv_manual';
  status: 'success' | 'error' | 'partial_success';
  properties_synced: number;
  bookings_created: number;
  bookings_updated: number;
  conflicts_detected: number;
  errors_count: number;
  duration_ms: number;
  metadata?: any;
  created_at: string;
}

interface Stats {
  total: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  success_rate: number;
  avg_duration_ms: number;
  total_bookings_created: number;
  total_bookings_updated: number;
  total_conflicts: number;
  total_errors: number;
}

interface ConsecutiveFailure {
  sync_type: string;
  consecutive_count: number;
  last_failure: string;
  needs_attention: boolean;
}

export default function SyncLogsPage() {
  const t = useTranslations('admin.syncLogs');
  
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState<ConsecutiveFailure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [days, setDays] = useState<number>(30);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        days: days.toString(),
        limit: '100',
      });

      if (filterType !== 'all') {
        params.append('type', filterType);
      }

      const response = await fetch(`/api/sync/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setStats(data.stats);
      setConsecutiveFailures(data.consecutive_failures);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterType, days]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Succès</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erreur</Badge>;
      case 'partial_success':
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Partiel</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSyncTypeLabel = (type: string) => {
    switch (type) {
      case 'ical_auto':
        return 'iCal Auto';
      case 'csv_auto':
        return 'CSV Auto';
      case 'csv_manual':
        return 'CSV Manuel';
      default:
        return type;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Logs de Synchronisation</h1>
          <p className="text-muted-foreground">
            Historique et métriques des synchronisations Airbnb
          </p>
        </div>
        <Button onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Alertes pour échecs consécutifs */}
      {consecutiveFailures.filter(f => f.needs_attention).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Attention requise</AlertTitle>
          <AlertDescription>
            {consecutiveFailures.filter(f => f.needs_attention).map(failure => (
              <div key={failure.sync_type}>
                <strong>{getSyncTypeLabel(failure.sync_type)}</strong>: {failure.consecutive_count} échecs consécutifs
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistiques */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.success_rate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.by_status['success'] || 0} / {stats.total} syncs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Réservations</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_bookings_created + stats.total_bookings_updated}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.total_bookings_created} créées, {stats.total_bookings_updated} mises à jour
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Durée Moyenne</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.avg_duration_ms)}</div>
              <p className="text-xs text-muted-foreground">
                Par synchronisation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conflits</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_conflicts}</div>
              <p className="text-xs text-muted-foreground">
                Chevauchements détectés
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Type de Sync</label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="ical_auto">iCal Auto</SelectItem>
                <SelectItem value="csv_auto">CSV Auto</SelectItem>
                <SelectItem value="csv_manual">CSV Manuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Période</label>
            <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
                <SelectItem value="90">90 derniers jours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table des logs */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Synchronisations</CardTitle>
          <CardDescription>
            {logs.length} synchronisation(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune synchronisation trouvée
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Lofts</TableHead>
                  <TableHead className="text-right">Créées</TableHead>
                  <TableHead className="text-right">Mises à jour</TableHead>
                  <TableHead className="text-right">Conflits</TableHead>
                  <TableHead className="text-right">Erreurs</TableHead>
                  <TableHead className="text-right">Durée</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                  >
                    <TableCell>{formatDate(log.created_at)}</TableCell>
                    <TableCell>{getSyncTypeLabel(log.sync_type)}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-right">{log.properties_synced}</TableCell>
                    <TableCell className="text-right">{log.bookings_created}</TableCell>
                    <TableCell className="text-right">{log.bookings_updated}</TableCell>
                    <TableCell className="text-right">
                      {log.conflicts_detected > 0 ? (
                        <span className="text-red-500 font-semibold">{log.conflicts_detected}</span>
                      ) : (
                        log.conflicts_detected
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.errors_count > 0 ? (
                        <span className="text-orange-500 font-semibold">{log.errors_count}</span>
                      ) : (
                        log.errors_count
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatDuration(log.duration_ms)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
