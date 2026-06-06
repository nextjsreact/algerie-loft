'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Loader2, RefreshCw, AlertTriangle, Search, Download, Link2, Database, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface Reservation {
  id: string;
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  guest_count: number;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  total_amount: number;
  currency_code: string;
  status: string;
  payment_status?: string;
  airbnb_confirmation_code?: string;
  source: string;
  matched_via?: string;
  special_requests?: string;
  last_manual_edit_at?: string;
  loft: { id: string; name: string; airbnb_listing_id?: string } | null;
}

export default function ReservationsProvenancePage() {
  const t = useTranslations('reservationsProvenance');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [lofts, setLofts] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [loftFilter, setLoftFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [matchedViaFilter, setMatchedViaFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (sourceFilter !== 'all') params.append('source', sourceFilter);
      if (loftFilter !== 'all') params.append('loft_id', loftFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (matchedViaFilter !== 'all') params.append('matched_via', matchedViaFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      params.append('limit', '500');

      const r = await fetch(`/api/admin/reservations-provenance?${params}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setReservations(data.reservations);
      setStats(data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [search, sourceFilter, loftFilter, statusFilter, matchedViaFilter, dateFrom, dateTo]);

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
  useEffect(() => { fetchData(); }, [fetchData]);

  // Debounce sur la recherche
  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const fmtMoney = (a: number, c: string) =>
    new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: c || 'DZD', maximumFractionDigits: 0 }).format(a || 0);

  const sourceBadge = (s: string) => {
    if (s === 'airbnb_scraper') return <Badge className="bg-blue-500 text-white"><Database className="w-3 h-3 mr-1" />Airbnb</Badge>;
    if (s === 'manual') return <Badge className="bg-purple-500 text-white"><User className="w-3 h-3 mr-1" />Manuel</Badge>;
    return <Badge variant="outline">{s || '—'}</Badge>;
  };

  const matchedViaBadge = (mv?: string) => {
    if (!mv || mv === 'none') return <Badge variant="outline">—</Badge>;
    if (mv === 'airbnb_id') return <Badge className="bg-green-500">airbnb_id</Badge>;
    if (mv === 'fuzzy_manual') return <Badge className="bg-amber-500"><Link2 className="w-3 h-3 mr-1" />fuzzy_manual</Badge>;
    return <Badge variant="outline">{mv}</Badge>;
  };

  const exportCSV = () => {
    const headers = ['guest_name', 'loft', 'check_in', 'check_out', 'nights', 'status', 'payment_status', 'source', 'matched_via', 'airbnb_confirmation_code', 'total', 'currency', 'special_requests', 'last_manual_edit'];
    const rows = reservations.map((r) => [
      r.guest_name, r.loft?.name || '', r.check_in_date, r.check_out_date, r.nights,
      r.status, r.payment_status || '', r.source, r.matched_via || '', r.airbnb_confirmation_code || '',
      r.total_amount, r.currency_code, (r.special_requests || '').replace(/"/g, '""'), r.last_manual_edit_at || '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `reservations_provenance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(t('exportSuccess'));
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={!reservations.length}>
            <Download className="w-4 h-4 mr-2" />{t('exportCsv')}
          </Button>
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('stats.total')}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-600">{t('stats.airbnb')}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-blue-600">{stats.by_source.airbnb_scraper}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-purple-600">{t('stats.manual')}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-purple-600">{stats.by_source.manual}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-600">{t('stats.fuzzyLinked')}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-amber-600">{stats.by_matched_via.fuzzy_manual}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-orange-600">{t('stats.manuallyEdited')}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-orange-600">{stats.with_manual_edit}</div></CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>{t('filters.title')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-7">
            <div className="lg:col-span-2">
              <label className="text-xs font-medium mb-1 block">{t('filters.search')}</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input placeholder={t('filters.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">{t('filters.source')}</label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.sourceAll')}</SelectItem>
                  <SelectItem value="airbnb_scraper">{t('filters.sourceAirbnb')}</SelectItem>
                  <SelectItem value="manual">{t('filters.sourceManual')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">{t('filters.link')}</label>
              <Select value={matchedViaFilter} onValueChange={setMatchedViaFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.linkAll')}</SelectItem>
                  <SelectItem value="airbnb_id">{t('filters.linkAirbnbId')}</SelectItem>
                  <SelectItem value="fuzzy_manual">{t('filters.linkFuzzy')}</SelectItem>
                  <SelectItem value="none">{t('filters.linkNone')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">{t('filters.status')}</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filters.statusAll')}</SelectItem>
                  <SelectItem value="confirmed">{t('filters.statusConfirmed')}</SelectItem>
                  <SelectItem value="pending">{t('filters.statusPending')}</SelectItem>
                  <SelectItem value="cancelled">{t('filters.statusCancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">{t('filters.dateFrom')}</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">{t('filters.dateTo')}</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs font-medium mb-1 block">{t('filters.loft')}</label>
            <Select value={loftFilter} onValueChange={setLoftFilter}>
              <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
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
          <CardTitle>{t('table.title', { count: reservations.length })}</CardTitle>
          <CardDescription>
            {t('table.fuzzyNote')} <Badge className="bg-amber-500 mx-1">fuzzy_manual</Badge> {t('table.fuzzyNoteEnd')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : error ? (
            <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>{t('table.error')}</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
          ) : reservations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t('table.noResults')}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.guest')}</TableHead>
                    <TableHead>{t('table.loft')}</TableHead>
                    <TableHead>{t('table.dates')}</TableHead>
                    <TableHead>{t('table.nights')}</TableHead>
                    <TableHead>{t('table.source')}</TableHead>
                    <TableHead>{t('table.link')}</TableHead>
                    <TableHead>{t('table.airbnbId')}</TableHead>
                    <TableHead>{t('table.status')}</TableHead>
                    <TableHead className="text-right">{t('table.total')}</TableHead>
                    <TableHead>{t('table.editedManually')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((r) => (
                    <TableRow
                      key={r.id}
                      className={
                        r.matched_via === 'fuzzy_manual'
                          ? 'border-l-4 border-l-amber-500'
                          : r.last_manual_edit_at
                          ? 'border-l-4 border-l-orange-500'
                          : ''
                      }
                    >
                      <TableCell className="font-medium">{r.guest_name}</TableCell>
                      <TableCell>{r.loft?.name || '—'}</TableCell>
                      <TableCell className="text-xs">{fmt(r.check_in_date)} → {fmt(r.check_out_date)}</TableCell>
                      <TableCell className="text-center">{r.nights}</TableCell>
                      <TableCell>{sourceBadge(r.source)}</TableCell>
                      <TableCell>{matchedViaBadge(r.matched_via)}</TableCell>
                      <TableCell className="text-xs font-mono">
                        {r.airbnb_confirmation_code || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          r.status === 'cancelled' ? 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400' :
                          r.status === 'confirmed' ? 'border-green-300 text-green-700 dark:border-green-700 dark:text-green-400' :
                          r.status === 'completed' ? 'border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400' :
                          r.status === 'pending' ? 'border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-400' :
                          'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-400'
                        }>
                          {t.has(`status.${r.status}`) ? t(`status.${r.status}`) : r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {fmtMoney(r.total_amount, r.currency_code)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.last_manual_edit_at ? fmt(r.last_manual_edit_at) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
