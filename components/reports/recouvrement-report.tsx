'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, ChevronDown, Search, X, CheckCircle, AlertCircle, Clock, Eye } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Espèces', ccp: 'CCP', virement: 'Virement',
  paypal: 'PayPal', cheque: 'Chèque', baridi: 'Baridi Mob', autre: 'Autre',
}

const STATUS_CONFIG = {
  paid:    { label: 'Soldé',    color: 'bg-green-100 text-green-800 border-green-300',  icon: CheckCircle },
  partial: { label: 'Partiel',  color: 'bg-amber-100 text-amber-800 border-amber-300',  icon: AlertCircle },
  unpaid:  { label: 'Non payé', color: 'bg-red-100 text-red-800 border-red-300',        icon: Clock },
}

export function RecouvrementReport() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterLoft, setFilterLoft] = useState('')
  const [filterOwner, setFilterOwner] = useState('')
  const [loftSearch, setLoftSearch] = useState('')
  const [ownerSearch, setOwnerSearch] = useState('')
  const [loftPopover, setLoftPopover] = useState(false)
  const [ownerPopover, setOwnerPopover] = useState(false)
  const [detailRes, setDetailRes] = useState<any>(null)

  const fmtDZD = (n: number) => n.toLocaleString('fr-DZ') + ' DA'
  const fmtOrig = (n: number, c: string) => c === 'DZD'
    ? fmtDZD(n)
    : n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + c
  const fmtDate = (d: string) => { try { return format(new Date(d), 'dd/MM/yyyy', { locale: fr }) } catch { return d } }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate, endDate, status: filterStatus })
      if (filterLoft) params.set('loftId', filterLoft)
      if (filterOwner) params.set('ownerId', filterOwner)
      const res = await fetch(`/api/reports/recouvrement?${params}`)
      const json = await res.json()
      if (json.error) toast.error(json.error)
      else setData(json)
    } catch { toast.error('Erreur réseau') }
    setLoading(false)
  }, [startDate, endDate, filterStatus, filterLoft, filterOwner])

  useEffect(() => { fetchData() }, [fetchData])

  const loftsList = data?.lofts_list || []
  const ownersList = data?.owners_list || []
  const reservations: any[] = data?.reservations || []
  const summary = data?.summary

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Du</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 w-[145px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Au</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 w-[145px]" />
            </div>

            {/* Status filter */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Statut paiement</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="unpaid">❌ Non payé</SelectItem>
                  <SelectItem value="partial">⚠️ Partiel</SelectItem>
                  <SelectItem value="paid">✅ Soldé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Loft filter */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Appartement</Label>
              <Popover open={loftPopover} onOpenChange={o => { setLoftPopover(o); if (!o) setLoftSearch('') }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 w-[160px] justify-between font-normal text-sm">
                    <span className="truncate">{loftsList.find((l: any) => l.id === filterLoft)?.name || 'Tous'}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50 ml-1 flex-shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input placeholder="Rechercher..." value={loftSearch} onChange={e => setLoftSearch(e.target.value)} className="h-8 pl-7 text-sm" autoFocus />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-1">
                    <button className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent ${!filterLoft ? 'bg-accent font-medium' : ''}`}
                      onClick={() => { setFilterLoft(''); setLoftPopover(false) }}>Tous</button>
                    {loftsList.filter((l: any) => l.name.toLowerCase().includes(loftSearch.toLowerCase())).map((l: any) => (
                      <button key={l.id} className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent ${filterLoft === l.id ? 'bg-accent font-medium' : ''}`}
                        onClick={() => { setFilterLoft(l.id); setLoftPopover(false) }}>{l.name}</button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Owner filter */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Partenaire</Label>
              <Popover open={ownerPopover} onOpenChange={o => { setOwnerPopover(o); if (!o) setOwnerSearch('') }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 w-[160px] justify-between font-normal text-sm">
                    <span className="truncate">{ownersList.find((o: any) => o.id === filterOwner)?.name || 'Tous'}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50 ml-1 flex-shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input placeholder="Rechercher..." value={ownerSearch} onChange={e => setOwnerSearch(e.target.value)} className="h-8 pl-7 text-sm" autoFocus />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-1">
                    <button className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent ${!filterOwner ? 'bg-accent font-medium' : ''}`}
                      onClick={() => { setFilterOwner(''); setOwnerPopover(false) }}>Tous</button>
                    {ownersList.filter((o: any) => o.name.toLowerCase().includes(ownerSearch.toLowerCase())).map((o: any) => (
                      <button key={o.id} className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent ${filterOwner === o.id ? 'bg-accent font-medium' : ''}`}
                        onClick={() => { setFilterOwner(o.id); setOwnerPopover(false) }}>{o.name}</button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Button size="sm" onClick={fetchData} disabled={loading} className="h-9">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            {(filterLoft || filterOwner || filterStatus !== 'all') && (
              <Button size="sm" variant="ghost" className="h-9 text-gray-400"
                onClick={() => { setFilterLoft(''); setFilterOwner(''); setFilterStatus('all') }}>
                <X className="h-4 w-4 mr-1" /> Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading && <div className="text-center text-gray-400 py-8 animate-pulse">Chargement...</div>}

      {summary && !loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-600 to-slate-700 text-white col-span-2 md:col-span-1">
              <CardContent className="p-4">
                <p className="text-xs text-slate-300 mb-1">Total dû</p>
                <p className="text-lg font-bold">{fmtDZD(summary.total_due_dzd)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <CardContent className="p-4">
                <p className="text-xs text-green-100 mb-1">Total encaissé</p>
                <p className="text-lg font-bold">{fmtDZD(summary.total_paid_dzd)}</p>
              </CardContent>
            </Card>
            <Card className={`border-0 shadow-lg text-white ${summary.total_remaining_dzd > 0 ? 'bg-gradient-to-br from-red-500 to-rose-600' : 'bg-gradient-to-br from-green-600 to-teal-600'}`}>
              <CardContent className="p-4">
                <p className="text-xs text-white/80 mb-1">Reste à encaisser</p>
                <p className="text-lg font-bold">{fmtDZD(summary.total_remaining_dzd)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:bg-green-900/20">
              <CardContent className="p-4">
                <p className="text-xs text-green-700 mb-1">✅ Soldées</p>
                <p className="text-2xl font-bold text-green-700">{summary.count_paid}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:bg-amber-900/20">
              <CardContent className="p-4">
                <p className="text-xs text-amber-700 mb-1">⚠️ Partielles / ❌ Non payées</p>
                <p className="text-2xl font-bold text-amber-700">{summary.count_partial + summary.count_unpaid}</p>
              </CardContent>
            </Card>
          </div>

          {/* Reservations table */}
          {reservations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Aucune réservation pour ces critères</div>
          ) : (
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 font-medium">
                      <th className="text-left px-4 py-3">Client / Appartement</th>
                      <th className="text-left px-4 py-3">Séjour</th>
                      <th className="text-right px-4 py-3">Montant dû</th>
                      <th className="text-right px-4 py-3">Encaissé (DA)</th>
                      <th className="text-left px-4 py-3">Payé en</th>
                      <th className="text-right px-4 py-3">Reste (DA)</th>
                      <th className="text-center px-4 py-3">Statut</th>
                      <th className="text-center px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {reservations.map(r => {
                      const sc = STATUS_CONFIG[r.payment_status as keyof typeof STATUS_CONFIG]
                      const Icon = sc.icon
                      return (
                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900 dark:text-white">{r.guest_name}</p>
                            <p className="text-xs text-gray-400">{r.loft_name}</p>
                            {r.guest_phone && <p className="text-xs text-blue-500">{r.guest_phone}</p>}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {fmtDate(r.check_in)} → {fmtDate(r.check_out)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            <p>{fmtOrig(r.total_due_original, r.currency)}</p>
                            {r.currency !== 'DZD' && <p className="text-xs text-gray-400">≈ {fmtDZD(r.total_due_dzd)}</p>}
                          </td>
                          <td className="px-4 py-3 text-right text-green-600 font-medium">
                            {fmtDZD(r.total_paid_dzd)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(r.payments_by_currency).map(([curr, info]: any) => (
                                <span key={curr} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-700">
                                  {fmtOrig(info.amount, curr)}
                                </span>
                              ))}
                              {r.payments_count === 0 && <span className="text-xs text-gray-400">—</span>}
                            </div>
                          </td>
                          <td className={`px-4 py-3 text-right font-bold ${r.remaining_dzd > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {r.remaining_dzd > 0 ? (
                              <>
                                <p>{fmtDZD(r.remaining_dzd)}</p>
                                {r.currency !== 'DZD' && <p className="text-xs font-normal text-gray-400">≈ {fmtOrig(r.remaining_original, r.currency)}</p>}
                              </>
                            ) : '✓ 0'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={`${sc.color} gap-1 text-xs`}>
                              <Icon className="h-3 w-3" />
                              {sc.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                              onClick={() => setDetailRes(r)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-gray-700 font-semibold text-sm">
                      <td colSpan={2} className="px-4 py-3 text-gray-600 dark:text-gray-400">Total ({reservations.length} réservations)</td>
                      <td className="px-4 py-3 text-right">{fmtDZD(summary.total_due_dzd)}</td>
                      <td className="px-4 py-3 text-right text-green-600">{fmtDZD(summary.total_paid_dzd)}</td>
                      <td className="px-4 py-3"></td>
                      <td className={`px-4 py-3 text-right ${summary.total_remaining_dzd > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {fmtDZD(summary.total_remaining_dzd)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Detail modal */}
      {detailRes && (
        <Dialog open={!!detailRes} onOpenChange={() => setDetailRes(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {(() => { const sc = STATUS_CONFIG[detailRes.payment_status as keyof typeof STATUS_CONFIG]; const Icon = sc.icon; return <Badge className={`${sc.color} gap-1`}><Icon className="h-3 w-3" />{sc.label}</Badge> })()}
                {detailRes.guest_name} — {detailRes.loft_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Reservation info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Séjour</p>
                  <p className="font-medium">{fmtDate(detailRes.check_in)} → {fmtDate(detailRes.check_out)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Contact</p>
                  <p className="font-medium">{detailRes.guest_phone || '—'}</p>
                </div>
              </div>

              {/* Financial summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center border">
                  <p className="text-xs text-gray-500 mb-1">Total dû</p>
                  <p className="font-bold">{fmtOrig(detailRes.total_due_original, detailRes.currency)}</p>
                  {detailRes.currency !== 'DZD' && <p className="text-xs text-gray-400">≈ {fmtDZD(detailRes.total_due_dzd)}</p>}
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center border border-green-200">
                  <p className="text-xs text-green-600 mb-1">Encaissé</p>
                  <p className="font-bold text-green-700">{fmtDZD(detailRes.total_paid_dzd)}</p>
                </div>
                <div className={`rounded-lg p-3 text-center border ${detailRes.remaining_dzd > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <p className={`text-xs mb-1 ${detailRes.remaining_dzd > 0 ? 'text-red-600' : 'text-green-600'}`}>Reste</p>
                  <p className={`font-bold ${detailRes.remaining_dzd > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {detailRes.remaining_dzd > 0 ? fmtDZD(detailRes.remaining_dzd) : '✓ Soldé'}
                  </p>
                  {detailRes.remaining_dzd > 0 && detailRes.currency !== 'DZD' && (
                    <p className="text-xs text-gray-400">≈ {fmtOrig(detailRes.remaining_original, detailRes.currency)}</p>
                  )}
                </div>
              </div>

              {/* Payments detail */}
              {detailRes.payments.length > 0 ? (
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Paiements reçus</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-500">
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Mode</th>
                        <th className="text-right p-2">Montant original</th>
                        <th className="text-right p-2">Équivalent DA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {detailRes.payments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="p-2 text-gray-500">{fmtDate(p.date)}</td>
                          <td className="p-2">{PAYMENT_LABELS[p.payment_method] || p.payment_method}</td>
                          <td className="p-2 text-right font-medium text-green-600">
                            +{fmtOrig(p.original_amount, p.original_currency)}
                          </td>
                          <td className="p-2 text-right text-xs text-gray-400">
                            {p.original_currency !== 'DZD' ? `≈ ${fmtDZD(p.amount_dzd)}` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 dark:bg-gray-700 font-bold">
                        <td colSpan={2} className="p-2 text-gray-600">Total encaissé</td>
                        <td colSpan={2} className="p-2 text-right text-green-600">{fmtDZD(detailRes.total_paid_dzd)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-400 py-4">Aucun paiement enregistré</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
