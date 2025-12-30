"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Download, 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Loader2,
  Eye,
  XCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BackupRecord {
  id: string;
  type: 'FULL' | 'INCREMENTAL' | 'MANUAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  started_at: string;
  completed_at?: string;
  size_bytes?: number;
  error_message?: string;
}

interface BackupStats {
  lastBackup?: BackupRecord;
  nextScheduled?: Date;
  totalSize: number;
  availableSpace: number;
}

export function BackupManager() {
  const t = useTranslations('superuser.backup');
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [stats, setStats] = useState<BackupStats>({
    totalSize: 0,
    availableSpace: 100 * 1024 * 1024 * 1024 // 100 GB
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/superuser/backup?action=history&limit=10');
      
      if (!response.ok) {
        throw new Error(t('messages.loadError'));
      }

      const data = await response.json();
      setBackups(data.backups || []);
      
      if (data.backups && data.backups.length > 0) {
        const lastCompleted = data.backups.find((b: BackupRecord) => b.status === 'COMPLETED');
        const totalSize = data.backups
          .filter((b: BackupRecord) => b.status === 'COMPLETED')
          .reduce((sum: number, b: BackupRecord) => sum + (b.size_bytes || 0), 0);
        
        setStats(prev => ({
          ...prev,
          lastBackup: lastCompleted,
          totalSize
        }));
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.unknownError'));
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (type: 'FULL' | 'INCREMENTAL' | 'MANUAL') => {
    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/superuser/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          type,
          compression: true
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('messages.createError'));
      }

      const data = await response.json();
      const backupId = data.backup_id;
      setSuccess(t('messages.launched', { type, id: backupId }));
      
      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60; // 60 attempts = 2 minutes max
      
      const pollInterval = setInterval(async () => {
        attempts++;
        
        try {
          await fetchBackups();
          
          // Check if backup is completed or failed
          const currentBackups = await fetch('/api/superuser/backup?action=history&limit=10').then(r => r.json());
          const backup = currentBackups.backups?.find((b: BackupRecord) => b.id === backupId);
          
          if (backup && (backup.status === 'COMPLETED' || backup.status === 'FAILED')) {
            clearInterval(pollInterval);
            setCreating(false);
            
            if (backup.status === 'COMPLETED') {
              setSuccess(t('messages.completed', { size: formatSize(backup.size_bytes) }));
            } else {
              setError(t('messages.failed', { error: backup.error_message || t('messages.unknownError') }));
            }
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setCreating(false);
            setError(t('messages.timeout'));
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000); // Poll every 2 seconds
      
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.unknownError'));
      setCreating(false);
    }
  };

  const verifyBackup = async (backupId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/superuser/backup?action=verify&backup_id=${backupId}`);
      
      if (!response.ok) {
        throw new Error(t('messages.verifyError'));
      }

      const data = await response.json();
      setSuccess(data.valid ? t('messages.verifySuccess') : t('messages.verifyFailed'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.verifyError'));
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return t('stats.notAvailable');
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: BackupRecord['status']) => {
    const variants = {
      COMPLETED: { variant: 'default' as const, label: t('status.completed'), icon: CheckCircle, color: 'text-green-600' },
      IN_PROGRESS: { variant: 'secondary' as const, label: t('status.inProgress'), icon: Loader2, color: 'text-blue-600' },
      PENDING: { variant: 'secondary' as const, label: t('status.pending'), icon: Clock, color: 'text-yellow-600' },
      FAILED: { variant: 'destructive' as const, label: t('status.failed'), icon: XCircle, color: 'text-red-600' },
      CANCELLED: { variant: 'secondary' as const, label: t('status.cancelled'), icon: XCircle, color: 'text-gray-600' }
    };
    
    const config = variants[status] || variants.PENDING;
    const Icon = config.icon;
    
    return (
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${config.color} ${status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} />
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>
    );
  };

  const getTypeLabel = (type: BackupRecord['type']) => {
    const labels = {
      FULL: t('types.full'),
      INCREMENTAL: t('types.incremental'),
      MANUAL: t('types.manual')
    };
    return labels[type] || type;
  };

  if (loading && backups.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Database className="h-8 w-8" />
              {t('title')}
            </h1>
            <p className="text-purple-100 mt-2">
              {t('subtitle')}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchBackups}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('actions.refresh')}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.lastBackup')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {stats.lastBackup ? (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {getStatusBadge(stats.lastBackup.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDate(stats.lastBackup.completed_at || stats.lastBackup.started_at)} - {formatSize(stats.lastBackup.size_bytes)}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">{t('stats.noBackup')}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.nextBackup')}</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{t('stats.automatic')}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.dailyScheduled')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.spaceUsed')}</CardTitle>
            <Database className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatSize(stats.totalSize)}</div>
            <p className="text-xs text-muted-foreground">
              {t('stats.of')} {formatSize(stats.availableSpace)} {t('stats.available')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t('actions.title')}
            </CardTitle>
            <CardDescription>
              {t('actions.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => createBackup('FULL')}
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('actions.inProgress')}
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  {t('actions.fullBackup')}
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => createBackup('INCREMENTAL')}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {t('actions.incrementalBackup')}
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => createBackup('MANUAL')}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {t('actions.manualBackup')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('history.title')}
            </CardTitle>
            <CardDescription>
              {t('history.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {backups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{t('history.noBackups')}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {backups.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center space-x-3 flex-1">
                      {getStatusBadge(backup.status)}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{formatDate(backup.started_at)}</div>
                        <div className="text-xs text-gray-500">
                          {getTypeLabel(backup.type)} - {formatSize(backup.size_bytes)}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedBackup(backup);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t('history.view')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              {t('details.title')}
            </DialogTitle>
            <DialogDescription>
              {t('details.subtitle')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBackup && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('details.id')}</p>
                  <p className="text-sm font-mono">{selectedBackup.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('details.type')}</p>
                  <p className="text-sm">{getTypeLabel(selectedBackup.type)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('details.status')}</p>
                  {getStatusBadge(selectedBackup.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('details.size')}</p>
                  <p className="text-sm">{formatSize(selectedBackup.size_bytes)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('details.started')}</p>
                  <p className="text-sm">{formatDate(selectedBackup.started_at)}</p>
                </div>
                {selectedBackup.completed_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('details.completed')}</p>
                    <p className="text-sm">{formatDate(selectedBackup.completed_at)}</p>
                  </div>
                )}
              </div>

              {/* File Path */}
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">{t('details.filePath')}</p>
                  <p className="text-xs font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded border break-all">
                    {selectedBackup.file_path || t('details.notAvailable')}
                  </p>
                  {selectedBackup.checksum && (
                    <>
                      <p className="text-sm font-medium text-muted-foreground mt-3 mb-2">{t('details.checksum')}</p>
                      <p className="text-xs font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded border break-all">
                        {selectedBackup.checksum}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {selectedBackup.error_message && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{selectedBackup.error_message}</AlertDescription>
                </Alert>
              )}

              {selectedBackup.status === 'COMPLETED' && (
                <Button
                  className="w-full"
                  onClick={() => verifyBackup(selectedBackup.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('details.verifyIntegrity')}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
