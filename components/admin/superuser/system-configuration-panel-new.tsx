"use client";

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, RotateCcw, AlertTriangle, Eye, EyeOff, Save, X, Plus, RefreshCw } from 'lucide-react';

// Traductions intégrées
const translations = {
  ar: {
    title: "تكوين النظام",
    subtitle: "إدارة إعدادات النظام والتكوينات العامة",
    category: "الفئة",
    allCategories: "جميع الفئات",
    refresh: "تحديث",
    newConfig: "تكوين جديد",
    currentValue: "القيمة الحالية",
    previousValue: "القيمة السابقة",
    modifiedBy: "تم التعديل بواسطة",
    on: "في",
    requiresRestart: "يتطلب إعادة التشغيل",
    sensitive: "حساس",
    edit: "تعديل",
    delete: "حذف",
    rollback: "استرجاع",
    save: "حفظ",
    cancel: "إلغاء",
    create: "إنشاء",
    configKey: "مفتاح التكوين",
    dataType: "نوع البيانات",
    value: "القيمة",
    description: "الوصف",
    loading: "جاري التحميل...",
    noConfigs: "لا توجد تكوينات",
    error: "خطأ",
    deleteConfirm: "هل أنت متأكد من حذف هذا التكوين؟",
    rollbackConfirm: "هل أنت متأكد من استرجاع القيمة السابقة؟",
    categories: {
      archive: "الأرشيف",
      backup: "النسخ الاحتياطية",
      maintenance: "الصيانة",
      security: "الأمان"
    },
    descriptions: {
      auto_archive_enabled: "تفعيل الأرشفة التلقائية للبيانات",
      default_archive_after_days: "عدد الأيام الافتراضي قبل أرشفة البيانات",
      auto_backup_enabled: "تفعيل النسخ الاحتياطية اليومية التلقائية",
      backup_compression_enabled: "تفعيل ضغط ملفات النسخ الاحتياطية",
      backup_retention_days: "عدد الأيام للاحتفاظ بملفات النسخ الاحتياطية",
      maintenance_window_duration_hours: "مدة نافذة الصيانة بالساعات",
      maintenance_window_start: "وقت بدء نافذة الصيانة اليومية (صيغة 24 ساعة)",
      account_lockout_duration_minutes: "مدة قفل الحساب بالدقائق",
      max_failed_login_attempts: "الحد الأقصى لمحاولات تسجيل الدخول الفاشلة قبل قفل الحساب",
      require_2fa_for_superusers: "طلب المصادقة الثنائية لحسابات المدير الأعلى",
      session_timeout_minutes: "مهلة الجلسة الافتراضية للمستخدمين العاديين (بالدقائق)",
      superuser_session_timeout_minutes: "مهلة الجلسة لحسابات المدير الأعلى (بالدقائق)"
    }
  },
  fr: {
    title: "Configuration Système",
    subtitle: "Gérer les paramètres système et les configurations globales",
    category: "Catégorie",
    allCategories: "Toutes les catégories",
    refresh: "Actualiser",
    newConfig: "Nouvelle Configuration",
    currentValue: "Valeur actuelle",
    previousValue: "Valeur précédente",
    modifiedBy: "Modifié par",
    on: "le",
    requiresRestart: "Redémarrage requis",
    sensitive: "Sensible",
    edit: "Modifier",
    delete: "Supprimer",
    rollback: "Restaurer",
    save: "Sauvegarder",
    cancel: "Annuler",
    create: "Créer",
    configKey: "Clé de Configuration",
    dataType: "Type de Données",
    value: "Valeur",
    description: "Description",
    loading: "Chargement...",
    noConfigs: "Aucune configuration",
    error: "Erreur",
    deleteConfirm: "Êtes-vous sûr de vouloir supprimer cette configuration ?",
    rollbackConfirm: "Êtes-vous sûr de vouloir restaurer la valeur précédente ?",
    categories: {
      archive: "Archivage",
      backup: "Sauvegardes",
      maintenance: "Maintenance",
      security: "Sécurité"
    },
    descriptions: {
      auto_archive_enabled: "Activer l'archivage automatique des données",
      default_archive_after_days: "Nombre de jours par défaut avant l'archivage des données",
      auto_backup_enabled: "Activer les sauvegardes quotidiennes automatiques",
      backup_compression_enabled: "Activer la compression des sauvegardes",
      backup_retention_days: "Nombre de jours de conservation des fichiers de sauvegarde",
      maintenance_window_duration_hours: "Durée de la fenêtre de maintenance en heures",
      maintenance_window_start: "Heure de début de la fenêtre de maintenance quotidienne (format 24h)",
      account_lockout_duration_minutes: "Durée du verrouillage du compte en minutes",
      max_failed_login_attempts: "Nombre maximum de tentatives de connexion échouées avant verrouillage",
      require_2fa_for_superusers: "Exiger l'authentification à deux facteurs pour les comptes superutilisateurs",
      session_timeout_minutes: "Délai d'expiration de session par défaut pour les utilisateurs réguliers (en minutes)",
      superuser_session_timeout_minutes: "Délai d'expiration de session pour les comptes superutilisateurs (en minutes)"
    }
  },
  en: {
    title: "System Configuration",
    subtitle: "Manage system settings and global configurations",
    category: "Category",
    allCategories: "All Categories",
    refresh: "Refresh",
    newConfig: "New Configuration",
    currentValue: "Current Value",
    previousValue: "Previous Value",
    modifiedBy: "Modified by",
    on: "on",
    requiresRestart: "Requires Restart",
    sensitive: "Sensitive",
    edit: "Edit",
    delete: "Delete",
    rollback: "Rollback",
    save: "Save",
    cancel: "Cancel",
    create: "Create",
    configKey: "Configuration Key",
    dataType: "Data Type",
    value: "Value",
    description: "Description",
    loading: "Loading...",
    noConfigs: "No configurations",
    error: "Error",
    deleteConfirm: "Are you sure you want to delete this configuration?",
    rollbackConfirm: "Are you sure you want to rollback to the previous value?",
    categories: {
      archive: "Archive",
      backup: "Backup",
      maintenance: "Maintenance",
      security: "Security"
    },
    descriptions: {
      auto_archive_enabled: "Enable automatic data archiving",
      default_archive_after_days: "Default number of days before archiving data",
      auto_backup_enabled: "Enable automatic daily backups",
      backup_compression_enabled: "Enable backup compression",
      backup_retention_days: "Number of days to retain backup files",
      maintenance_window_duration_hours: "Duration of maintenance window in hours",
      maintenance_window_start: "Daily maintenance window start time (24h format)",
      account_lockout_duration_minutes: "Duration of account lockout in minutes",
      max_failed_login_attempts: "Maximum failed login attempts before account lockout",
      require_2fa_for_superusers: "Require two-factor authentication for superuser accounts",
      session_timeout_minutes: "Default session timeout for regular users (in minutes)",
      superuser_session_timeout_minutes: "Session timeout for superuser accounts (in minutes)"
    }
  }
};

interface SystemConfiguration {
  id: string;
  category: string;
  config_key: string;
  config_value: any;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  is_sensitive: boolean;
  requires_restart: boolean;
  modified_by: string;
  modified_at: string;
  previous_value?: any;
  previous_modified_at?: string;
  previous_modified_by?: string;
}

export function SystemConfigurationPanel() {
  const locale = useLocale() as 'ar' | 'fr' | 'en';
  const t = translations[locale] || translations.en;
  
  const [configurations, setConfigurations] = useState<SystemConfiguration[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<SystemConfiguration | null>(null);
  const [showSensitiveValues, setShowSensitiveValues] = useState<Set<string>>(new Set());
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    fetchConfigurations();
  }, [selectedCategory]);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      params.append('includeHistory', 'false');

      const response = await fetch(`/api/superuser/system?${params}`);
      if (!response.ok) throw new Error('Failed to fetch configurations');

      const data = await response.json();
      setConfigurations(data.configurations || []);
      setCategories(['all', ...data.categories]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfiguration = async (id: string, newValue: any) => {
    try {
      const response = await fetch(`/api/superuser/system/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config_value: newValue })
      });

      if (!response.ok) throw new Error('Failed to update configuration');
      
      setEditingConfig(null);
      await fetchConfigurations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDeleteConfiguration = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;

    try {
      const response = await fetch(`/api/superuser/system/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete configuration');
      await fetchConfigurations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleRollbackConfiguration = async (id: string) => {
    if (!confirm(t.rollbackConfirm)) return;

    try {
      const response = await fetch(`/api/superuser/system/${id}/rollback`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to rollback configuration');
      await fetchConfigurations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const formatConfigValue = (value: any, dataType: string) => {
    if (dataType === 'json') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const parseConfigValue = (value: string, dataType: string) => {
    switch (dataType) {
      case 'number': return parseFloat(value);
      case 'boolean': return value === 'true';
      case 'json': return JSON.parse(value);
      default: return value;
    }
  };

  const toggleSensitiveValue = (configId: string) => {
    const newSet = new Set(showSensitiveValues);
    if (newSet.has(configId)) {
      newSet.delete(configId);
    } else {
      newSet.add(configId);
    }
    setShowSensitiveValues(newSet);
  };

  const getDataTypeColor = (dataType: string) => {
    switch (dataType) {
      case 'string': return 'bg-blue-100 text-blue-800';
      case 'number': return 'bg-green-100 text-green-800';
      case 'boolean': return 'bg-purple-100 text-purple-800';
      case 'json': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryName = (category: string) => {
    return t.categories[category as keyof typeof t.categories] || category;
  };

  const getDescription = (configKey: string, originalDescription?: string) => {
    return t.descriptions[configKey as keyof typeof t.descriptions] || originalDescription || configKey;
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
          <h2 className="text-2xl font-bold">{t.title}</h2>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button onClick={() => fetchConfigurations()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t.refresh}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4 items-center">
        <Label htmlFor="category-filter">{t.category}</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allCategories}</SelectItem>
            {categories.filter(c => c !== 'all').map((category) => (
              <SelectItem key={category} value={category}>
                {getCategoryName(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {configurations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {t.noConfigs}
            </CardContent>
          </Card>
        ) : (
          configurations.map((config) => (
            <Card key={config.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{getCategoryName(config.category)}</Badge>
                      <Badge className={getDataTypeColor(config.data_type)}>
                        {config.data_type}
                      </Badge>
                      {config.requires_restart && (
                        <Badge variant="destructive">{t.requiresRestart}</Badge>
                      )}
                      {config.is_sensitive && (
                        <Badge variant="secondary">{t.sensitive}</Badge>
                      )}
                    </div>
                    
                    <h4 className="font-semibold text-lg mb-1">{config.config_key}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {getDescription(config.config_key, config.description)}
                    </p>
                    
                    <div className="mt-2">
                      <Label className="text-xs text-muted-foreground">{t.currentValue}:</Label>
                      <div className="mt-1">
                        {config.is_sensitive && !showSensitiveValues.has(config.id) ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              ••••••••
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleSensitiveValue(config.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded max-w-md truncate">
                              {formatConfigValue(config.config_value, config.data_type)}
                            </span>
                            {config.is_sensitive && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleSensitiveValue(config.id)}
                              >
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {config.previous_value && (
                      <div className="mt-2">
                        <Label className="text-xs text-muted-foreground">{t.previousValue}:</Label>
                        <div className="text-sm font-mono bg-yellow-50 px-2 py-1 rounded mt-1">
                          {formatConfigValue(config.previous_value, config.data_type)}
                        </div>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-muted-foreground">
                      {t.modifiedBy} {config.modified_by} {t.on} {new Date(config.modified_at).toLocaleString(locale)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingConfig(config);
                        setEditValue(formatConfigValue(config.config_value, config.data_type));
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    {config.previous_value && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRollbackConfiguration(config.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteConfiguration(config.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {editingConfig && (
        <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t.edit} {editingConfig.config_key}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>{t.value}</Label>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingConfig(null)}>
                <X className="h-4 w-4 mr-2" />
                {t.cancel}
              </Button>
              <Button 
                onClick={() => {
                  const newValue = parseConfigValue(editValue, editingConfig.data_type);
                  handleUpdateConfiguration(editingConfig.id, newValue);
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                {t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
