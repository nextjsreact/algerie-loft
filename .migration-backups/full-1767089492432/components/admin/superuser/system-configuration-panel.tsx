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
import { Edit, Trash2, RotateCcw, AlertTriangle, Eye, EyeOff, Save, X, RefreshCw } from 'lucide-react';

const translations = {
  ar: {
    title: "تكوين النظام",
    subtitle: "إدارة إعدادات النظام والتكوينات العامة",
    category: "الفئة",
    allCategories: "جميع الفئات",
    refresh: "تحديث",
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
    value: "القيمة",
    loading: "جاري التحميل...",
    noConfigs: "لا توجد تكوينات",
    deleteConfirm: "هل أنت متأكد من حذف هذا التكوين؟",
    rollbackConfirm: "هل أنت متأكد من استرجاع القيمة السابقة؟",
    categories: {
      archive: "الأرشيف",
      backup: "النسخ الاحتياطية",
      maintenance: "الصيانة",
      security: "الأمان"
    },
    configs: {
      auto_archive_enabled: "تفعيل الأرشفة التلقائية للبيانات",
      default_archive_after_days: "عدد الأيام الافتراضي قبل أرشفة البيانات",
      auto_backup_enabled: "تفعيل النسخ الاحتياطية اليومية التلقائية",
      backup_compression_enabled: "تفعيل ضغط ملفات النسخ الاحتياطية",
      backup_retention_days: "عدد الأيام للاحتفاظ بملفات النسخ الاحتياطية",
      maintenance_window_duration_hours: "مدة نافذة الصيانة بالساعات",
      maintenance_window_start: "وقت بدء نافذة الصيانة اليومية",
      account_lockout_duration_minutes: "مدة قفل الحساب بالدقائق",
      max_failed_login_attempts: "الحد الأقصى لمحاولات تسجيل الدخول الفاشلة",
      require_2fa_for_superusers: "طلب المصادقة الثنائية لحسابات المدير الأعلى",
      session_timeout_minutes: "مهلة الجلسة للمستخدمين العاديين",
      superuser_session_timeout_minutes: "مهلة الجلسة لحسابات المدير الأعلى"
    }
  },
  fr: {
    title: "Configuration Système",
    subtitle: "Gérer les paramètres système",
    category: "Catégorie",
    allCategories: "Toutes les catégories",
    refresh: "Actualiser",
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
    value: "Valeur",
    loading: "Chargement...",
    noConfigs: "Aucune configuration",
    deleteConfirm: "Supprimer cette configuration ?",
    rollbackConfirm: "Restaurer la valeur précédente ?",
    categories: {
      archive: "Archivage",
      backup: "Sauvegardes",
      maintenance: "Maintenance",
      security: "Sécurité"
    },
    configs: {
      auto_archive_enabled: "Activer l'archivage automatique",
      default_archive_after_days: "Jours avant archivage",
      auto_backup_enabled: "Activer les sauvegardes automatiques",
      backup_compression_enabled: "Activer la compression",
      backup_retention_days: "Jours de conservation",
      maintenance_window_duration_hours: "Durée de maintenance",
      maintenance_window_start: "Heure de début maintenance",
      account_lockout_duration_minutes: "Durée de verrouillage",
      max_failed_login_attempts: "Tentatives max échouées",
      require_2fa_for_superusers: "Exiger 2FA",
      session_timeout_minutes: "Expiration session",
      superuser_session_timeout_minutes: "Expiration session admin"
    }
  },
  en: {
    title: "System Configuration",
    subtitle: "Manage system settings",
    category: "Category",
    allCategories: "All Categories",
    refresh: "Refresh",
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
    value: "Value",
    loading: "Loading...",
    noConfigs: "No configurations",
    deleteConfirm: "Delete this configuration?",
    rollbackConfirm: "Rollback to previous value?",
    categories: {
      archive: "Archive",
      backup: "Backup",
      maintenance: "Maintenance",
      security: "Security"
    },
    configs: {
      auto_archive_enabled: "Enable automatic archiving",
      default_archive_after_days: "Days before archiving",
      auto_backup_enabled: "Enable automatic backups",
      backup_compression_enabled: "Enable compression",
      backup_retention_days: "Retention days",
      maintenance_window_duration_hours: "Maintenance duration",
      maintenance_window_start: "Maintenance start time",
      account_lockout_duration_minutes: "Lockout duration",
      max_failed_login_attempts: "Max failed attempts",
      require_2fa_for_superusers: "Require 2FA",
      session_timeout_minutes: "Session timeout",
      superuser_session_timeout_minutes: "Admin session timeout"
    }
  }
};

interface Config {
  id: string;
  category: string;
  config_key: string;
  config_value: any;
  data_type: string;
  is_sensitive: boolean;
  requires_restart: boolean;
  modified_by: string;
  modified_at: string;
  previous_value?: any;
}

export function SystemConfigurationPanel() {
  // Détecter la langue depuis l'URL
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const localeFromUrl = pathname.startsWith('/ar') ? 'ar' : pathname.startsWith('/fr') ? 'fr' : 'en';
  const locale = localeFromUrl as 'ar' | 'fr' | 'en';
  const t = translations[locale];
  
  console.log('🌐 URL:', pathname);
  console.log('🌐 Locale détecté:', locale);
  console.log('📝 Titre:', t.title);
  
  const [configs, setConfigs] = useState<Config[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Config | null>(null);
  const [showSensitive, setShowSensitive] = useState<Set<string>>(new Set());
  const [editVal, setEditVal] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedCat]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCat !== 'all') params.append('category', selectedCat);
      params.append('includeHistory', 'false');
      const res = await fetch(`/api/superuser/system?${params}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setConfigs(data.configurations || []);
      setCategories(['all', ...data.categories]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, val: any) => {
    try {
      const res = await fetch(`/api/superuser/system/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config_value: val })
      });
      if (!res.ok) throw new Error('Failed');
      setEditing(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  const del = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      const res = await fetch(`/api/superuser/system/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  const rollback = async (id: string) => {
    if (!confirm(t.rollbackConfirm)) return;
    try {
      const res = await fetch(`/api/superuser/system/${id}/rollback`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  const fmt = (v: any, type: string) => type === 'json' ? JSON.stringify(v, null, 2) : String(v);
  const parse = (v: string, type: string) => {
    if (type === 'number') return parseFloat(v);
    if (type === 'boolean') return v === 'true';
    if (type === 'json') return JSON.parse(v);
    return v;
  };

  const toggle = (id: string) => {
    const s = new Set(showSensitive);
    s.has(id) ? s.delete(id) : s.add(id);
    setShowSensitive(s);
  };

  const typeColor = (type: string) => {
    const c: any = {
      string: 'bg-blue-100 text-blue-800',
      number: 'bg-green-100 text-green-800',
      boolean: 'bg-purple-100 text-purple-800',
      json: 'bg-orange-100 text-orange-800'
    };
    return c[type] || 'bg-gray-100 text-gray-800';
  };

  const catName = (c: string) => (t.categories as any)[c] || c;
  const cfgName = (k: string) => (t.configs as any)[k] || k;
  
  // Traduire les types de données
  const typeNames: Record<string, Record<string, string>> = {
    ar: { string: 'نص', number: 'رقم', boolean: 'منطقي', json: 'JSON' },
    fr: { string: 'texte', number: 'nombre', boolean: 'booléen', json: 'JSON' },
    en: { string: 'string', number: 'number', boolean: 'boolean', json: 'JSON' }
  };
  const typeName = (type: string) => typeNames[locale][type] || type;

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
        <Button onClick={fetchData}>
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
        <Label>{t.category}</Label>
        <Select value={selectedCat} onValueChange={setSelectedCat}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allCategories}</SelectItem>
            {categories.filter(c => c !== 'all').map(c => (
              <SelectItem key={c} value={c}>{catName(c)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {configs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {t.noConfigs}
            </CardContent>
          </Card>
        ) : (
          configs.map(cfg => (
            <Card key={cfg.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{catName(cfg.category)}</Badge>
                      <Badge className={typeColor(cfg.data_type)}>{typeName(cfg.data_type)}</Badge>
                      {cfg.requires_restart && <Badge variant="destructive">{t.requiresRestart}</Badge>}
                      {cfg.is_sensitive && <Badge variant="secondary">{t.sensitive}</Badge>}
                    </div>
                    
                    <h3 className="text-lg font-semibold">{cfgName(cfg.config_key)}</h3>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">{t.currentValue}</Label>
                      <div className="mt-1 flex items-center gap-2">
                        {cfg.is_sensitive && !showSensitive.has(cfg.id) ? (
                          <>
                            <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">••••••••</span>
                            <Button size="sm" variant="ghost" onClick={() => toggle(cfg.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                              {fmt(cfg.config_value, cfg.data_type)}
                            </span>
                            {cfg.is_sensitive && (
                              <Button size="sm" variant="ghost" onClick={() => toggle(cfg.id)}>
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {cfg.previous_value && (
                      <div>
                        <Label className="text-xs text-muted-foreground">{t.previousValue}</Label>
                        <div className="text-sm font-mono bg-yellow-50 px-3 py-1 rounded mt-1">
                          {fmt(cfg.previous_value, cfg.data_type)}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {t.modifiedBy} {cfg.modified_by || 'system'} {t.on} {new Date(cfg.modified_at).toLocaleString(locale)}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      setEditing(cfg);
                      setEditVal(fmt(cfg.config_value, cfg.data_type));
                    }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {cfg.previous_value && (
                      <Button size="sm" variant="outline" onClick={() => rollback(cfg.id)}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => del(cfg.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {editing && (
        <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.edit}: {cfgName(editing.config_key)}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t.value}</Label>
                <Input value={editVal} onChange={(e) => setEditVal(e.target.value)} className="mt-2" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                <X className="h-4 w-4 mr-2" />
                {t.cancel}
              </Button>
              <Button onClick={() => update(editing.id, parse(editVal, editing.data_type))}>
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
