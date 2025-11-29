"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Archive, 
  Database, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Loader2,
  Settings,
  Calendar,
  HardDrive,
  Trash2,
  Download
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ArchivePolicy {
  id: string;
  table_name: string;
  enabled: boolean;
  retention_days: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  last_run?: string;
  next_run?: string;
  archived_count: number;
  archived_size_mb: number;
}

interface ArchiveStats {
  totalArchived: number;
  totalSize: number;
  oldestArchive?: string;
  newestArchive?: string;
}

const AVAILABLE_TABLES = [
  { value: 'audit_logs', label: 'Logs d\'Audit', description: 'Historique des actions administratives' },
  { value: 'visitor_tracking', label: 'Tracking Visiteurs', description: 'Données de suivi des visiteurs' },
  { value: 'notifications', label: 'Notifications', description: 'Anciennes notifications' },
  { value: 'sessions', label: 'Sessions', description: 'Sessions expirées' },
  { value: 'reservations', label: 'Réservations', description: 'Réservations anciennes (complétées/annulées)' },
  { value: 'transactions', label: 'Transactions', description: 'Historique des transactions' },
  { value: 'messages', label: 'Messages', description: 'Conversations archivées' },
  { value: 'activity_logs', label: 'Logs d\'Activité', description: 'Logs système généraux' },
];

const FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'Quotidien', description: 'Tous les jours à minuit' },
  { value: 'WEEKLY', label: 'Hebdomadaire', description: 'Tous les dimanches' },
  { value: 'MONTHLY', label: 'Mensuel', description: 'Le 1er de chaque mois' },
];

export function ArchiveManager() {
  const t = useTranslations('superuser.archives');
  const [policies, setPolicies] = useState<ArchivePolicy[]>([]);
  const [stats, setStats] = useState<ArchiveStats>({
    totalArchived: 0,
    totalSize: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<ArchivePolicy | null>(null);
  const [archiving, setArchiving] = useState(false);

  // Form state for new/edit policy
  const [formData, setFormData] = useState({
    table_name: '',
    retention_days: 90,
    frequency: 'WEEKLY' as const,
    enabled: true,
  });

  useEffect(() => {
    fetchPolicies();
    fetchStats();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/superuser/archives/policies');
      
      if (!response.ok) {
        throw new Error(t('messages.loadError'));
      }

      const data = await response.json();
      setPolicies(data.policies || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.unknownError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/superuser/archives/stats');
      
      if (!response.ok) {
        throw new Error('Failed to load stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const createPolicy = async () => {
    try {
      setError(null);
      const response = await fetch('/api/superuser/archives/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('messages.createError'));
      }

      setSuccess(t('messages.policyCreated'));
      setShowAddDialog(false);
      fetchPolicies();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.unknownError'));
    }
  };

  const updatePolicy = async () => {
    if (!selectedPolicy) return;

    try {
      setError(null);
      const response = await fetch(`/api/superuser/archives/policies/${selectedPolicy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('messages.updateError'));
      }

      setSuccess(t('messages.policyUpdated'));
      setShowEditDialog(false);
      fetchPolicies();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.unknownError'));
    }
  };

  const deletePolicy = async (policyId: string) => {
    if (!confirm(t('messages.confirmDelete'))) return;

    try {
      const response = await fetch(`/api/superuser/archives/policies/${policyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(t('messages.deleteError'));
      }

      setSuccess(t('messages.policyDeleted'));
      fetchPolicies();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.unknownError'));
    }
  };

  const togglePolicy = async (policyId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/superuser/archives/policies/${policyId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error(t('messages.toggleError'));
      }

      setSuccess(enabled ? t('messages.policyEnabled') : t('messages.policyDisabled'));
      fetchPolicies();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.unknownError'));
    }
  };

  const runArchiveNow = async (policyId: string) => {
    try {
      setArchiving(true);
      setError(null);
      
      const response = await fetch(`/api/superuser/archives/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy_id: policyId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('messages.archiveError'));
      }

      const data = await response.json();
      setSuccess(t('messages.archiveSuccess', { count: data.archived_count }));
      fetchPolicies();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.unknownError'));
    } finally {
      setArchiving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      table_name: '',
      retention_days: 90,
      frequency: 'WEEKLY',
      enabled: true,
    });
    setSelectedPolicy(null);
  };

  const openEditDialog = (policy: ArchivePolicy) => {
    setSelectedPolicy(policy);
    setFormData({
      table_name: policy.table_name,
      retention_days: policy.retention_days,
      frequency: policy.frequency,
      enabled: policy.enabled,
    });
    setShowEditDialog(true);
  };

  const formatSize = (mb: number) => {
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('stats.never');
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTableLabel = (tableName: string) => {
    const table = AVAILABLE_TABLES.find(t => t.value === tableName);
    return table?.label || tableName;
  };

  const getFrequencyLabel = (frequency: string) => {
    const freq = FREQUENCY_OPTIONS.find(f => f.value === frequency);
    return freq?.label || frequency;
  };

  if (loading && policies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Archive className="h-8 w-8" />
              {t('title')}
            </h1>
            <p className="text-indigo-100 mt-2">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchPolicies}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t('actions.refresh')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddDialog(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {t('actions.newPolicy')}
            </Button>
          </div>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.totalArchived')}</CardTitle>
            <Archive className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalArchived.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('stats.entries')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.totalSize')}</CardTitle>
            <HardDrive className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatSize(stats.totalSize)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('stats.diskSpace')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.activePolicies')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {policies.filter(p => p.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('stats.of')} {policies.length} {t('stats.total')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.oldestArchive')}</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.oldestArchive ? formatDate(stats.oldestArchive).split(' ')[0] : t('stats.none')}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('stats.date')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Archive Policies List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t('policies.title')}
          </CardTitle>
          <CardDescription>
            {t('policies.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {policies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('policies.noPolicies')}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowAddDialog(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {t('actions.createFirst')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">{getTableLabel(policy.table_name)}</div>
                        <div className="text-sm text-gray-600">
                          {t('policies.retention')}: {policy.retention_days} {t('policies.days')} • 
                          {t('policies.frequency')}: {getFrequencyLabel(policy.frequency)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {t('policies.archived')}: {policy.archived_count.toLocaleString()} {t('policies.entries')} ({formatSize(policy.archived_size_mb)})
                        </div>
                        {policy.last_run && (
                          <div className="text-xs text-gray-500">
                            {t('policies.lastRun')}: {formatDate(policy.last_run)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={policy.enabled}
                      onCheckedChange={(checked) => togglePolicy(policy.id, checked)}
                    />
                    <Badge variant={policy.enabled ? 'default' : 'secondary'}>
                      {policy.enabled ? t('status.active') : t('status.inactive')}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runArchiveNow(policy.id)}
                      disabled={archiving || !policy.enabled}
                    >
                      {archiving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(policy)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePolicy(policy.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Policy Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              {t('dialog.addTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('dialog.addSubtitle')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="table">{t('dialog.table')}</Label>
              <Select
                value={formData.table_name}
                onValueChange={(value) => setFormData({ ...formData, table_name: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('dialog.selectTable')} />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_TABLES.map((table) => (
                    <SelectItem key={table.value} value={table.value}>
                      <div>
                        <div className="font-medium">{table.label}</div>
                        <div className="text-xs text-gray-500">{table.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="retention">{t('dialog.retention')}</Label>
              <Input
                id="retention"
                type="number"
                min="1"
                value={formData.retention_days}
                onChange={(e) => setFormData({ ...formData, retention_days: parseInt(e.target.value) })}
              />
              <p className="text-xs text-gray-500">{t('dialog.retentionHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">{t('dialog.frequency')}</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      <div>
                        <div className="font-medium">{freq.label}</div>
                        <div className="text-xs text-gray-500">{freq.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
              <Label htmlFor="enabled">{t('dialog.enableImmediately')}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              {t('dialog.cancel')}
            </Button>
            <Button onClick={createPolicy} disabled={!formData.table_name}>
              {t('dialog.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Policy Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              {t('dialog.editTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('dialog.editSubtitle')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('dialog.table')}</Label>
              <Input value={getTableLabel(formData.table_name)} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-retention">{t('dialog.retention')}</Label>
              <Input
                id="edit-retention"
                type="number"
                min="1"
                value={formData.retention_days}
                onChange={(e) => setFormData({ ...formData, retention_days: parseInt(e.target.value) })}
              />
              <p className="text-xs text-gray-500">{t('dialog.retentionHelp')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-frequency">{t('dialog.frequency')}</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      <div>
                        <div className="font-medium">{freq.label}</div>
                        <div className="text-xs text-gray-500">{freq.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
              <Label htmlFor="edit-enabled">{t('dialog.enabled')}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); resetForm(); }}>
              {t('dialog.cancel')}
            </Button>
            <Button onClick={updatePolicy}>
              {t('dialog.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
