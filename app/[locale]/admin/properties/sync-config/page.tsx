/**
 * Property Sync Config Page
 * 
 * Page de configuration des URLs iCal pour les 85 lofts.
 * Permet d'activer/désactiver la sync par loft.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, CheckCircle2, XCircle, Edit, Save, X, AlertTriangle } from 'lucide-react';

interface LoftConfig {
  loft_id: string;
  loft_name: string;
  ical_url: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  config_exists: boolean;
}

interface Stats {
  total_lofts: number;
  configured: number;
  active: number;
  inactive: number;
  not_configured: number;
}

export default function PropertySyncConfigPage() {
  const [configs, setConfigs] = useState<LoftConfig[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLoft, setEditingLoft] = useState<LoftConfig | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editActive, setEditActive] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchConfigs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/properties/sync-config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des configurations');
      }

      const data = await response.json();
      setConfigs(data.configs);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleEdit = (config: LoftConfig) => {
    setEditingLoft(config);
    setEditUrl(config.ical_url || '');
    setEditActive(config.is_active);
  };

  const handleSave = async () => {
    if (!editingLoft) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/properties/sync-config', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loft_id: editingLoft.loft_id,
          ical_url: editUrl || null,
          is_active: editActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      // Rafraîchir la liste
      await fetchConfigs();
      setEditingLoft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (config: LoftConfig) => {
    try {
      const response = await fetch('/api/properties/sync-config', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loft_id: config.loft_id,
          is_active: !config.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      // Rafraîchir la liste
      await fetchConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const filteredConfigs = configs.filter(config =>
    config.loft_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (config: LoftConfig) => {
    if (!config.ical_url) {
      return <Badge variant="outline">Non configuré</Badge>;
    }
    if (config.is_active) {
      return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Actif</Badge>;
    }
    return <Badge variant="secondary">Inactif</Badge>;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
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
          <h1 className="text-3xl font-bold">Configuration des Lofts</h1>
          <p className="text-muted-foreground">
            Gérez les URLs iCal et l'activation de la synchronisation pour chaque loft
          </p>
        </div>
        <Button onClick={fetchConfigs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lofts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_lofts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Configurés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.configured}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.configured / stats.total_lofts) * 100)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.inactive}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Non configurés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.not_configured}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instructions */}
      <Alert>
        <AlertDescription>
          <strong>Comment obtenir l'URL iCal:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Connectez-vous à Airbnb</li>
            <li>Allez sur Hosting → Calendar</li>
            <li>Cliquez sur "Availability settings"</li>
            <li>Cliquez sur "Export calendar"</li>
            <li>Copiez l'URL iCal (format: https://www.airbnb.com/calendar/ical/...)</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Rechercher</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Rechercher un loft par nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Lofts</CardTitle>
          <CardDescription>
            {filteredConfigs.length} loft(s) affiché(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom du Loft</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>URL iCal</TableHead>
                  <TableHead>Dernière Sync</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConfigs.map((config) => (
                  <TableRow key={config.loft_id}>
                    <TableCell className="font-medium">{config.loft_name}</TableCell>
                    <TableCell>{getStatusBadge(config)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {config.ical_url ? (
                        <span className="text-sm text-muted-foreground" title={config.ical_url}>
                          {config.ical_url.substring(0, 50)}...
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Non configuré</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(config.last_sync_at)}
                        {config.last_sync_status && (
                          <div className="text-xs text-muted-foreground">
                            {config.last_sync_status}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={config.is_active}
                        onCheckedChange={() => handleToggleActive(config)}
                        disabled={!config.ical_url}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(config)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingLoft} onOpenChange={(open) => !open && setEditingLoft(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurer {editingLoft?.loft_name}</DialogTitle>
            <DialogDescription>
              Modifiez l'URL iCal et l'état d'activation pour ce loft
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ical-url">URL iCal</Label>
              <Input
                id="ical-url"
                placeholder="https://www.airbnb.com/calendar/ical/..."
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                L'URL doit être en HTTPS et provenir d'Airbnb
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={editActive}
                onCheckedChange={setEditActive}
                disabled={!editUrl}
              />
              <Label htmlFor="is-active">
                Activer la synchronisation automatique
              </Label>
            </div>

            {!editUrl && editActive && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Vous devez fournir une URL iCal pour activer la synchronisation
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingLoft(null)}
              disabled={saving}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
