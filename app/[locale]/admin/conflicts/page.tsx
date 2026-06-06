'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Loader2, RefreshCw, AlertTriangle, CheckCircle2, X,
  ChevronDown, ChevronRight, Calendar, User,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReservationDetail {
  id: string;
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  source: string;
  matched_via?: string;
  total_amount: number;
  currency_code: string;
  airbnb_confirmation_code?: string;
  special_requests?: string;
  payment_status?: string;
}

interface Conflict {
  id: string;
  loft_id: string;
  reservation_1_id: string;
  reservation_2_id: string;
  overlap_start: string;
  overlap_end: string;
  overlap_nights: number;
  severity: 'critical' | 'warning' | 'info';
  status: 'open' | 'acknowledged' | 'resolved' | 'false_positive';
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
  loft: { id: string; name: string; airbnb_listing_id?: string } | null;
  reservation_1: ReservationDetail | null;
  reservation_2: ReservationDetail | null;
}

interface Stats {
  total: number;
  by_status: { open: number; acknowledged: number; resolved: number; false_positive: number };
  by_severity: { critical: number; warning: number; info: number };
}

export default function ConflictsPage() {
  const t = useTranslations('conflicts');
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [lofts, setLofts] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('open');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterLoft, setFilterLoft] = useState('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchConflicts = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ status: filterStatus });
      if (filterSeverity !== 'all') params.append('severity', filterSeverity);
      if (filterLoft !== 'all') params.append('loft_id', filterLoft);

      const r = await fetch(`/api/admin/conflicts?${params}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setConflicts(data.conflicts);
      setStats(data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('table.error'));
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSeverity, filterLoft, t]);

  const fetchLofts = useCallback(async () => {
    try {
      const r = await fetch('/api/lofts?limit=500');
      if (r.ok) {
        const data = await r.json();
        setLofts(data.lofts || data || []);
      }
    } catch {}
  }, []);

  useEffect(() => { fetchLofts(); }, [fetchLofts]);
  useEffect(() => { fetchConflicts(); }, [fetchConflicts]);

  async function updateConflictStatus(conflictId: string, newStatus: string, notes?: string) {
    setResolving(conflictId);
    try {
      const r = await fetch('/api/admin/conflicts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conflict_id: conflictId, status: newStatus, resolution_notes: notes }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || t('table.error'));
      }
      const toastMsg =
        newStatus === 'resolved' ? t('actions.resolvedToast') :
        newStatus === 'false_positive' ? t('actions.falsePositiveToast') :
        t('actions.acknowledgedToast');
      toast.success(toastMsg);
      await fetchConflicts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('table.error'));
    } finally {
      setResolving(null);
    }
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtMoney = (amount: number, currency: string) =>
    new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: currency || 'DZD' }).format(amount || 0);

  const severityBadge = (s: string) => {
    const map: Record<string, string> = {
      critical: 'bg-red-500 text-white',
      warning: 'bg-orange-500 text-white',
      info: 'bg-blue-500 text-white',
    };
    return <Badge className={map[s] || ''}>{s}</Badge>;
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      open: 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400',
      acknowledged: 'border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-400',
      resolved: 'border-green-300 text-green-700 dark:border-green-700 dark:text-green-400',
      false_positive: 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-400',
    };
    const statusKey = s as keyof typeof map;
    return (
      <Badge variant="outline" className={map[statusKey] || ''}>
        {t.has(`status.${s}`) ? t(`status.${s}` as any) : s}
      </Badge>
    );
  };

  const sourceBadge = (s: string) => {
    if (s === 'airbnb_scraper') return <Badge className="bg-blue-500">Airbnb</Badge>;
    if (s === 'manual') return <Badge className="bg-purple-500">{t('filters.severityAll') === 'All' ? 'Manual' : 'Manuel'}</Badge>;
    return <Badge variant="outline">{s || '—'}</Badge>;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={fetchConflicts} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </Button>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('stats.total')}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-red-600">{t('stats.critical')}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-600">{stats.by_severity.critical}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-orange-600">{t('stats.warnings')}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-orange-600">{stats.by_severity.warning}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-green-600">{t('stats.resolved')}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{stats.by_status.resolved}</div></CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>{t('filters.title')}</CardTitle></CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">{t('filters.status')}</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.statusAll')}</SelectItem>
                <SelectItem value="open">{t('filters.statusOpen')}</SelectItem>
                <SelectItem value="acknowledged">{t('filters.statusAcknowledged')}</SelectItem>
                <SelectItem value="resolved">{t('filters.statusResolved')}</SelectItem>
                <SelectItem value="false_positive">{t('filters.statusFalsePositive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">{t('filters.severity')}</label>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.severityAll')}</SelectItem>
                <SelectItem value="critical">{t('filters.severityCritical')}</SelectItem>
                <SelectItem value="warning">{t('filters.severityWarning')}</SelectItem>
                <SelectItem value="info">{t('filters.severityInfo')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">{t('filters.loft')}</label>
            <Select value={filterLoft} onValueChange={setFilterLoft}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.loftAll')}</SelectItem>
                {lofts.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('table.title', { count: conflicts.length })}</CardTitle>
          <CardDescription>{t('table.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('table.error')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : conflicts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
              {t('table.noResults')}
            </div>
          ) : (
            <div className="space-y-2">
              {conflicts.map((c) => (
                <div key={c.id} className="border rounded-lg">
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedRow(expandedRow === c.id ? null : c.id)}
                  >
                    {expandedRow === c.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    {severityBadge(c.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{c.loft?.name || t('table.unknownLoft')}</div>
                      <div className="text-sm text-muted-foreground">
                        {c.reservation_1?.guest_name || '?'} ↔ {c.reservation_2?.guest_name || '?'} •
                        {' '}{t('table.overlapNights', { nights: c.overlap_nights })} ({fmt(c.overlap_start)} → {fmt(c.overlap_end)})
                      </div>
                    </div>
                    {statusBadge(c.status)}
                  </div>

                  {expandedRow === c.id && (
                    <div className="border-t p-4 bg-muted/30 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <ReservationCard
                          title={t('table.reservation1')}
                          res={c.reservation_1}
                          sourceBadge={sourceBadge}
                          fmt={fmt}
                          fmtMoney={fmtMoney}
                          missingDataLabel={t('table.missingData')}
                          airbnbIdLabel={t('table.airbnbId')}
                          matchLabel={t('table.match')}
                          totalLabel={t('table.total')}
                        />
                        <ReservationCard
                          title={t('table.reservation2')}
                          res={c.reservation_2}
                          sourceBadge={sourceBadge}
                          fmt={fmt}
                          fmtMoney={fmtMoney}
                          missingDataLabel={t('table.missingData')}
                          airbnbIdLabel={t('table.airbnbId')}
                          matchLabel={t('table.match')}
                          totalLabel={t('table.total')}
                        />
                      </div>

                      {c.resolution_notes && (
                        <div className="text-sm bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 p-2 rounded">
                          <strong>{t('table.note')} :</strong> {c.resolution_notes}
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {c.status !== 'acknowledged' && c.status !== 'resolved' && c.status !== 'false_positive' && (
                          <Button size="sm" variant="outline" onClick={() => updateConflictStatus(c.id, 'acknowledged')} disabled={resolving === c.id}>
                            {t('actions.acknowledge')}
                          </Button>
                        )}
                        <Button size="sm" onClick={() => updateConflictStatus(c.id, 'resolved')} disabled={resolving === c.id}>
                          <CheckCircle2 className="w-4 h-4 mr-1" />{t('actions.resolve')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                          const notes = prompt(t('actions.falsePositivePrompt'));
                          if (notes) updateConflictStatus(c.id, 'false_positive', notes);
                        }} disabled={resolving === c.id}>
                          <X className="w-4 h-4 mr-1" />{t('actions.falsePositive')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReservationCard({ title, res, sourceBadge, fmt, fmtMoney, missingDataLabel, airbnbIdLabel, matchLabel, totalLabel }: {
  title: string;
  res: ReservationDetail | null;
  sourceBadge: (s: string) => JSX.Element;
  fmt: (d: string) => string;
  fmtMoney: (a: number, c: string) => string;
  missingDataLabel: string;
  airbnbIdLabel: string;
  matchLabel: string;
  totalLabel: string;
}) {
  if (!res) return <div className="text-sm text-muted-foreground">{title} : {missingDataLabel}</div>;
  return (
    <div className="border rounded p-3 space-y-2 bg-card">
      <div className="flex items-center justify-between">
        <strong className="text-card-foreground">{title}</strong>
        {sourceBadge(res.source)}
      </div>
      <div className="space-y-1 text-sm text-card-foreground">
        <div className="flex items-center gap-1"><User className="w-3 h-3" />{res.guest_name}</div>
        <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmt(res.check_in_date)} → {fmt(res.check_out_date)}</div>
        <div><Badge variant="outline">{res.status}</Badge></div>
        {res.airbnb_confirmation_code && (
          <div className="text-xs text-muted-foreground">{airbnbIdLabel} : {res.airbnb_confirmation_code}</div>
        )}
        {res.matched_via && (
          <div className="text-xs">{matchLabel} : <Badge variant="outline">{res.matched_via}</Badge></div>
        )}
        <div>{totalLabel} : {fmtMoney(res.total_amount, res.currency_code)}</div>
        {res.guest_email && <div className="text-xs text-muted-foreground">{res.guest_email}</div>}
        {res.guest_phone && <div className="text-xs text-muted-foreground">{res.guest_phone}</div>}
        {res.special_requests && <div className="text-xs italic">"{res.special_requests}"</div>}
      </div>
    </div>
  );
}
