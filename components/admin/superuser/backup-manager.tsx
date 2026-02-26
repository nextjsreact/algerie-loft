"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Download, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Loader2,
  Eye,
  XCircle,
  HardDrive
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
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  started_at: string;
  completed_at?: string;
  size_bytes?: number;
  error_message?: string;
  file_path?: string;
}

export function BackupManager() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
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
        throw new Error('Erreur lors du chargement des sauvegardes');
      }

      const data = await response.json();
      setBackups(data.backups || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (type: 'FULL' | 'MANUAL') => {
    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/superuser/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', type })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la création de la sauvegarde');
      }

      const data = await response.json();
      setSuccess(`Sauvegarde ${type} lancée avec succès!`);
      
      // Refresh list after 2 seconds
      setTimeout(() => {
        fetchBackups();
        setCreating(false);
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setCreating(false);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    const gb = mb / 1024;
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
    const config = {
      COMPLETED: { variant: 'default' as const, label: 'Terminé', icon: CheckCircle, color: 'text-green-600' },
      IN_PROGRESS: { variant: 'secondary' as const, label: 'En cours', icon: Loader2, color: 'text-blue-600' },
      PENDING: { variant: 'secondary' as const, label: 'En attente', icon: Clock, color: 'text-yellow-600' },
      FAILED: { variant: 'destructive' as const, label: 'Échoué', icon: XCircle, color: 'text-red-600' }
    };
    
    const cfg = config[status] || config.PENDING;
    const Icon = cfg.icon;
    
    return (
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${cfg.color} ${status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} />
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>
    );
  };

  const getTypeLabel = (type: BackupRecord['type']) => {
    const labels = {
      FULL: 'Complète',
      INCREMENTAL: 'Incrémentale',
      MANUAL: 'Manuelle'
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

  const lastBackup = backups.find(b => b.status === 'COMPLETED');
  const totalSize = backups
    .filter(b => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.size_bytes || 0), 0);

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Database className="h-8 w-8" />
              Gestion des Sauvegardes
            </h1>
            <p className="text-purple-100 mt-2">
              Système de sauvegarde et restauration de la base de données
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchBackups}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
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
            <CardTitle className="text-sm font-medium">Dernière Sauvegarde</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {lastBackup ? (
              <>
                <div className="text-lg font-bold text-green-600">
                  {formatDate(lastBackup.completed_at || lastBackup.started_at)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatSize(lastBackup.size_bytes)}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Aucune sauvegarde</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prochaine Sauvegarde</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-600">Automatique</div>
            <p className="text-xs text-muted-foreground">Quotidienne à 2h00</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espace Utilisé</CardTitle>
            <HardDrive className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-600">{formatSize(totalSize)}</div>
            <p className="text-xs text-muted-foreground">{backups.length} sauvegardes</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Créer une Sauvegarde
            </CardTitle>
            <CardDescription>
              Créez une nouvelle sauvegarde de la base de données
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
                  Création en cours...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Sauvegarde Complète
                </>
              )}
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
              Sauvegarde Manuelle
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historique des Sauvegardes
            </CardTitle>
            <CardDescription>
              Les 10 dernières sauvegardes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {backups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucune sauvegarde disponible</p>
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
                      Voir
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
              Détails de la Sauvegarde
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur la sauvegarde
            </DialogDescription>
          </DialogHeader>
          
          {selectedBackup && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID</p>
                  <p className="text-sm font-mono">{selectedBackup.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="text-sm">{getTypeLabel(selectedBackup.type)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Statut</p>
                  {getStatusBadge(selectedBackup.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taille</p>
                  <p className="text-sm">{formatSize(selectedBackup.size_bytes)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Démarré</p>
                  <p className="text-sm">{formatDate(selectedBackup.started_at)}</p>
                </div>
                {selectedBackup.completed_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Terminé</p>
                    <p className="text-sm">{formatDate(selectedBackup.completed_at)}</p>
                  </div>
                )}
              </div>

              {selectedBackup.file_path && (
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Chemin du fichier</p>
                    <p className="text-xs font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded border break-all">
                      {selectedBackup.file_path}
                    </p>
                  </CardContent>
                </Card>
              )}

              {selectedBackup.error_message && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{selectedBackup.error_message}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
