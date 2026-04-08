'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RefreshCw, TrendingUp, TrendingDown, Building2, Users, CreditCard, ChevronDown, Search, X, Star } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

const PAYMENT_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  cash:     { label: 'Espèces',           emoji: '💵', color: 'bg-green-50 border-green-200 text-green-800' },
  ccp:      { label: 'CCP',               emoji: '🏦', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  virement: { label: 'Virement bancaire', emoji: '🏛️', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  paypal:   { label: 'PayPal',            emoji: '📱', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
  cheque:   { label: 'Chèque',            emoji: '📄', color: 'bg-orange-50 border-orange-200 text-orange-800' },
  baridi:   { label: 'Baridi Mob',        emoji: '📲', color: 'bg-teal-50 border-teal-200 text-teal-800' },
  autre:    { label: 'Autre',             emoji: '💳', color: 'bg-gray-50 border-gray-200 text-gray-800' },
}

export function FinancialSummaryReport() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Filters
  const [filterLoft, setFilterLoft] = useState<string>('')
  const [filterOwner, setFilterOwner] = useState<string>('')
  const [loftSearch, setLoftSearch] = useState('')
  const [ownerSearch, setOwnerSearch] = useState('')
  const [loftPopover, setLoftPopover] = useState(false)
  const [ownerPopover, setOwnerPopover] = useState(false)

  const fmt = (n: number) => n.toLocaleString('fr-DZ') + ' DA'

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate, endDate })
      if (filterLoft) params.set('loftId', filterLoft)
      if (filterOwner) params.set('ownerId', filterOwner)
      const res = await fetch(`/api/reports/financial-summary?${params}`)
      const json = await res.json()
      setData(json)
    } catch {}
    setLoading(false)
  }, [startDate, endDate, filterLoft, filterOwner])

  useEffect(() => { fetchData() }, [fetchData])

  const loftsList: any[] = data?.lofts_list || []
  const ownersList: any[] = data?.owners_list || []

  const selectedLoftName = loftsList.find((l: any) => l.id === filterLoft)?.name
  const selectedOwnerName = ownersList.find((o: any) => o.id === filterOwner)?.name

  const hasFilter = filterLoft || filterOwner

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

            {/* Loft filter */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Appartement</Label>
              <Popover open={loftPopover} onOpenChange={o => { setLoftPopover(o); if (!o) setLoftSearch('') }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 w-[180px] justify-between font-normal text-sm">
                    <span className="truncate">{selectedLoftName || 'Tous les apparts'}</span>
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
                        onClick={() => { setFilterLoft(l.id); setFilterOwner(''); setLoftPopover(false) }}>
                        {l.name}
                      </button>
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
                  <Button variant="outline" className="h-9 w-[180px] justify-between font-normal text-sm">
                    <span className="truncate">{selectedOwnerName || 'Tous les partenaires'}</span>
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
                        onClick={() => { setFilterOwner(o.id); setFilterLoft(''); setOwnerPopover(false) }}>
                        {o.name}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Button size="sm" onClick={fetchData} disabled={loading} className="h-9">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>

            {hasFilter && (
              <Button size="sm" variant="ghost" className="h-9 text-gray-400 hover:text-gray-600"
                onClick={() => { setFilterLoft(''); setFilterOwner('') }}>
                <X className="h-4 w-4 mr-1" /> Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading && <div className="text-center text-gray-400 py-8 animate-pulse">Chargement...</div>}
      {!data && !loading && <div className="text-center text-gray-400 py-8">Aucune donnée</div>}

      {data && (
        <>
          {/* Source badge */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className={`px-2 py-1 rounded-full font-medium ${data.period?.source === 'reservations' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
              {data.period?.source === 'reservations' ? '📋 Revenus : Réservations (prorata)' : '💳 Revenus : Transactions'}
            </span>
            {hasFilter && (
              <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                🔍 Filtré : {selectedLoftName || selectedOwnerName}
              </span>
            )}
          </div>

          {/* ── SECTION 1 : GLOBAL ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-1 mb-1"><TrendingUp className="h-3.5 w-3.5 text-green-200" /><p className="text-green-100 text-xs">Revenu acquis</p></div>
                <p className="text-xl font-bold">{fmt(data.global.total_income)}</p>
                <p className="text-xs text-green-200 mt-1">Prorata réservations</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-1 mb-1"><CreditCard className="h-3.5 w-3.5 text-purple-200" /><p className="text-purple-100 text-xs">Trésorerie encaissée</p></div>
                <p className="text-xl font-bold">{fmt(data.global.cash_received)}</p>
                <p className="text-xs text-purple-200 mt-1">Paiements reçus</p>
              </CardContent>
            </Card>
            <Card className={`border-0 shadow-lg text-white ${(data.global.outstanding || 0) > 0 ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-green-600 to-teal-600'}`}>
              <CardContent className="p-4">
                <p className="text-xs text-white/80 mb-1">Créances en cours</p>
                <p className="text-xl font-bold">{fmt(data.global.outstanding || 0)}</p>
                <p className="text-xs text-white/70 mt-1">Reste à encaisser</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-1 mb-1"><TrendingDown className="h-3.5 w-3.5 text-red-200" /><p className="text-red-100 text-xs">Dépenses</p></div>
                <p className="text-xl font-bold">{fmt(data.global.total_expense)}</p>
              </CardContent>
            </Card>
            <Card className={`border-0 shadow-lg text-white ${data.global.net >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-orange-500 to-red-600'}`}>
              <CardContent className="p-4">
                <p className="text-xs text-white/80 mb-1">Bénéfice net</p>
                <p className="text-xl font-bold">{fmt(data.global.net)}</p>
                <p className="text-xs text-white/70 mt-1">Revenu − Dépenses</p>
              </CardContent>
            </Card>
          </div>

          {/* ── SECTION 2 : LOFT ALGÉRIE TOTAL ── */}
          {data.loft_algerie && !hasFilter && (
            <Card className="border-0 shadow-xl bg-gradient-to-r from-slate-800 to-slate-900 text-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Star className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Gains Loft Algérie</h3>
                      <p className="text-slate-300 text-xs">Lofts propres (net) + Part société sur partenaires</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-slate-400 text-xs">Lofts propres (net)</p>
                      <p className="font-semibold text-blue-300">{fmt(data.loft_algerie.own_loft_net)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400 text-xs">Part sur partenaires</p>
                      <p className="font-semibold text-emerald-300">{fmt(data.loft_algerie.partner_company_share)}</p>
                    </div>
                    <div className="text-center border-l border-white/20 pl-8">
                      <p className="text-slate-300 text-xs mb-1">TOTAL GAINS</p>
                      <p className="text-3xl font-bold text-yellow-400">{fmt(data.loft_algerie.total)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── SECTION 3 : PAR MODE DE PAIEMENT ── */}
          {data.by_payment_method?.length > 0 && (
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-t-lg pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-5 w-5" />
                  Paiements reçus par mode
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 ml-auto">
                    Total : {fmt(data.global.total_payments_received)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {data.by_payment_method.map((p: any) => {
                    const info = PAYMENT_LABELS[p.method] || { label: p.method, emoji: '💳', color: 'bg-gray-50 border-gray-200 text-gray-800' }
                    const pct = data.global.total_payments_received > 0
                      ? Math.round(p.amount / data.global.total_payments_received * 100) : 0
                    return (
                      <div key={p.method} className={`rounded-lg p-3 border ${info.color}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{info.emoji}</span>
                          <span className="text-sm font-semibold">{info.label}</span>
                        </div>
                        <p className="font-bold text-lg">{fmt(p.amount)}</p>
                        <div className="mt-2 h-1.5 bg-black/10 rounded-full">
                          <div className="h-1.5 bg-current rounded-full opacity-40" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs opacity-70 mt-1">{pct}% du total encaissé</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── SECTION 4 : PAR LOFT ── */}
          {data.by_loft?.length > 0 && (
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-5 w-5" />
                  Détail par appartement
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 ml-auto">
                    {data.by_loft.length} apparts
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 font-medium">
                    <div className="col-span-4">Appartement</div>
                    <div className="col-span-2 text-right text-green-600">Revenus</div>
                    <div className="col-span-2 text-right text-red-500">Dépenses</div>
                    <div className="col-span-2 text-right">Net</div>
                    <div className="col-span-2 text-right text-amber-600">Dû partenaire</div>
                  </div>
                  {data.by_loft.map((l: any) => (
                    <div key={l.loft_id} className="grid grid-cols-12 gap-2 px-5 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 text-sm">
                      <div className="col-span-4 flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                        <div>
                          <p className="font-medium truncate">{l.loft_name}</p>
                          {l.owner_name && <p className="text-xs text-gray-400">{l.owner_name} · {l.owner_percentage}%</p>}
                          {l.is_own && <Badge variant="outline" className="text-[10px] h-4 px-1 border-blue-300 text-blue-600">Propre</Badge>}
                        </div>
                      </div>
                      <div className="col-span-2 text-right text-green-600 font-medium">{fmt(l.income)}</div>
                      <div className="col-span-2 text-right text-red-500">{l.expense > 0 ? `-${fmt(l.expense)}` : '—'}</div>
                      <div className={`col-span-2 text-right font-semibold ${l.net >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{fmt(l.net)}</div>
                      <div className="col-span-2 text-right text-amber-700 font-semibold">
                        {l.is_own ? '—' : fmt(l.owner_due)}
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 dark:bg-gray-700/50 font-semibold text-sm">
                    <div className="col-span-4 text-gray-600">Total</div>
                    <div className="col-span-2 text-right text-green-600">{fmt(data.by_loft.reduce((s: number, l: any) => s + l.income, 0))}</div>
                    <div className="col-span-2 text-right text-red-500">-{fmt(data.by_loft.reduce((s: number, l: any) => s + l.expense, 0))}</div>
                    <div className="col-span-2 text-right text-blue-700">{fmt(data.by_loft.reduce((s: number, l: any) => s + l.net, 0))}</div>
                    <div className="col-span-2 text-right text-amber-700">{fmt(data.by_loft.filter((l: any) => !l.is_own).reduce((s: number, l: any) => s + l.owner_due, 0))}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── SECTION 5 : LOFTS PROPRES ── */}
          {data.own_lofts?.length > 0 && !filterOwner && (
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90">
              <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-t-lg pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Star className="h-5 w-5 text-yellow-400" />
                  Lofts propres — Loft Algérie
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 ml-auto">
                    Net : {fmt(data.own_lofts.reduce((s: number, l: any) => s + l.net, 0))}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.own_lofts.map((l: any) => (
                    <div key={l.name} className="grid grid-cols-4 gap-2 px-5 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 text-sm">
                      <div className="font-medium">{l.name}</div>
                      <div className="text-right text-green-600">{fmt(l.income)}</div>
                      <div className="text-right text-red-500">{l.expense > 0 ? `-${fmt(l.expense)}` : '—'}</div>
                      <div className={`text-right font-semibold ${l.net >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{fmt(l.net)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── SECTION 6 : PAR PARTENAIRE ── */}
          {data.by_partner?.length > 0 && !filterLoft && (
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90">
              <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5" />
                  Part société par partenaire
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 ml-auto">
                    Total : {fmt(data.by_partner.reduce((s: number, p: any) => s + p.total_company_share, 0))}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.by_partner.map((p: any) => (
                    <div key={p.owner_name} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{p.owner_name}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">Revenu total : <strong>{fmt(p.total_income)}</strong></span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Part société : {fmt(p.total_company_share)}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {p.lofts.map((l: any) => (
                          <div key={l.name} className="bg-amber-50 dark:bg-amber-900/20 rounded p-2 text-xs border border-amber-200">
                            <p className="font-medium truncate">{l.name}</p>
                            <p className="text-gray-500 mt-0.5">{fmt(l.income)} → <span className="text-emerald-700 font-semibold">{fmt(l.company_share)}</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
