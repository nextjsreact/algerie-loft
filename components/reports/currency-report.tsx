'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RefreshCw, TrendingUp, TrendingDown, ChevronDown, Search, X } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

const CURRENCY_FLAGS: Record<string, string> = {
  DZD: '🇩🇿', EUR: '🇪🇺', USD: '🇺🇸', GBP: '🇬🇧',
  CAD: '🇨🇦', CHF: '🇨🇭', MAD: '🇲🇦', TND: '🇹🇳',
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Espèces', ccp: 'CCP', virement: 'Virement',
  paypal: 'PayPal', cheque: 'Chèque', baridi: 'Baridi Mob', autre: 'Autre',
}

export function CurrencyReport() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Filters
  const [filterLoft, setFilterLoft] = useState('')
  const [filterOwner, setFilterOwner] = useState('')
  const [loftSearch, setLoftSearch] = useState('')
  const [ownerSearch, setOwnerSearch] = useState('')
  const [loftPopover, setLoftPopover] = useState(false)
  const [ownerPopover, setOwnerPopover] = useState(false)

  // Detail modal
  const [detailCurrency, setDetailCurrency] = useState<any>(null)
  const [detailType, setDetailType] = useState<'income' | 'expense' | 'payment'>('income')

  const fmt = (n: number, currency: string) => {
    if (currency === 'DZD') return n.toLocaleString('fr-DZ') + ' DA'
    // For foreign currencies, show 2 decimal places
    return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + currency
  }

  const fmtDate = (d: string) => {
    try { return format(new Date(d), 'dd/MM/yyyy', { locale: fr }) } catch { return d }
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate, endDate })
      if (filterLoft) params.set('loftId', filterLoft)
      if (filterOwner) params.set('ownerId', filterOwner)
      const res = await fetch(`/api/reports/by-currency?${params}`)
      const json = await res.json()
      if (json.error) toast.error(json.error)
      else setData(json)
    } catch { toast.error('Erreur réseau') }
    setLoading(false)
  }, [startDate, endDate, filterLoft, filterOwner])

  useEffect(() => { fetchData() }, [fetchData])

  const loftsList = data?.lofts_list || []
  const ownersList = data?.owners_list || []
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
                  <Button variant="outline" className="h-9 w-[170px] justify-between font-normal text-sm">
                    <span className="truncate">{selectedLoftName || 'Tous'}</span>
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
                        onClick={() => { setFilterLoft(l.id); setFilterOwner(''); setLoftPopover(false) }}>{l.name}</button>
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
                  <Button variant="outline" className="h-9 w-[170px] justify-between font-normal text-sm">
                    <span className="truncate">{selectedOwnerName || 'Tous'}</span>
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
                        onClick={() => { setFilterOwner(o.id); setFilterLoft(''); setOwnerPopover(false) }}>{o.name}</button>
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
              <Button size="sm" variant="ghost" className="h-9 text-gray-400"
                onClick={() => { setFilterLoft(''); setFilterOwner('') }}>
                <X className="h-4 w-4 mr-1" /> Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading && <div className="text-center text-gray-400 py-8 animate-pulse">Chargement...</div>}

      {data && !loading && (
        <>
          {/* Grand totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-1 mb-1"><TrendingUp className="h-3.5 w-3.5 text-green-200" /><p className="text-green-100 text-xs">Revenus acquis</p></div>
                <p className="text-xl font-bold">{data.totals.income.toLocaleString('fr-DZ')} DA</p>
                <p className="text-xs text-green-200 mt-1">{data.period?.source === 'reservations' ? 'Prorata réservations' : 'Transactions'}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-1 mb-1"><TrendingUp className="h-3.5 w-3.5 text-purple-200" /><p className="text-purple-100 text-xs">Trésorerie encaissée</p></div>
                <p className="text-xl font-bold">{data.totals.payments.toLocaleString('fr-DZ')} DA</p>
                <p className="text-xs text-purple-200 mt-1">Paiements reçus</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-1 mb-1"><TrendingDown className="h-3.5 w-3.5 text-red-200" /><p className="text-red-100 text-xs">Total dépenses</p></div>
                <p className="text-xl font-bold">{data.totals.expense.toLocaleString('fr-DZ')} DA</p>
              </CardContent>
            </Card>
            <Card className={`border-0 shadow-lg text-white ${data.totals.net >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-orange-500 to-red-600'}`}>
              <CardContent className="p-4">
                <p className="text-xs text-white/80 mb-1">Net (revenus − dépenses)</p>
                <p className="text-xl font-bold">{data.totals.net.toLocaleString('fr-DZ')} DA</p>
              </CardContent>
            </Card>
          </div>

          {/* Per currency */}
          {data.by_currency.length === 0 && (
            <div className="text-center py-12 text-gray-400">Aucune transaction pour cette période</div>
          )}

          {data.by_currency.map((c: any) => (
            <Card key={c.currency} className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 overflow-hidden">
              {/* Currency header */}
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CURRENCY_FLAGS[c.currency] || '💱'}</span>
                  <div>
                    <h3 className="font-bold text-lg">{c.currency}</h3>
                    <p className="text-slate-300 text-xs">{c.income_count + c.expense_count} transaction{c.income_count + c.expense_count > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 text-right">
                  <div>
                    <p className="text-slate-400 text-xs">Revenus</p>
                    <p className="font-semibold text-green-300">{fmt(c.income, c.currency)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Encaissé</p>
                    <p className="font-semibold text-purple-300">{fmt(c.payments, c.currency)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Dépenses</p>
                    <p className="font-semibold text-red-300">{fmt(c.expense, c.currency)}</p>
                  </div>
                  <div className="border-l border-white/20 pl-8">
                    <p className="text-slate-300 text-xs">Net</p>
                    <p className={`font-bold text-xl ${c.net >= 0 ? 'text-green-300' : 'text-red-300'}`}>{fmt(c.net, c.currency)}</p>
                  </div>
                </div>
              </div>

              <CardContent className="p-0">
                <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700">
                  {/* Income/Revenue column */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" /> Revenus acquis ({c.income_count})
                      </h4>
                      {c.income_count > 0 && (
                        <button onClick={() => { setDetailCurrency(c); setDetailType('income') }}
                          className="text-xs text-blue-600 hover:underline">Détails</button>
                      )}
                    </div>
                    {c.income_details.slice(0, 4).map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0 text-xs">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{d.loft_name}</p>
                          <p className="text-gray-400">{fmtDate(d.date)}{d.guest_name ? ` · ${d.guest_name}` : ''}</p>
                          {d.amount_dzd && c.currency !== 'DZD' && (
                            <p className="text-gray-300 text-[10px]">≈ {d.amount_dzd.toLocaleString('fr-DZ')} DA</p>
                          )}
                        </div>
                        <span className="font-semibold text-green-600">+{fmt(d.amount, d.currency)}</span>
                      </div>
                    ))}
                    {c.income_count > 4 && (
                      <button onClick={() => { setDetailCurrency(c); setDetailType('income') }}
                        className="text-xs text-blue-600 hover:underline mt-2">+{c.income_count - 4} autres</button>
                    )}
                    {c.income_count === 0 && <p className="text-xs text-gray-400 text-center py-4">Aucun revenu</p>}
                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between text-sm font-bold">
                      <span className="text-gray-600 dark:text-gray-400">Sous-total</span>
                      <span className="text-green-600">+{fmt(c.income, c.currency)}</span>
                    </div>
                  </div>

                  {/* Payments/Cash received column */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" /> Encaissements ({c.payments_count})
                      </h4>
                      {c.payments_count > 0 && (
                        <button onClick={() => { setDetailCurrency(c); setDetailType('payment') }}
                          className="text-xs text-blue-600 hover:underline">Détails</button>
                      )}
                    </div>
                    {c.payments_details.slice(0, 4).map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0 text-xs">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{d.loft_name}</p>
                          <p className="text-gray-400">{fmtDate(d.date)} · {PAYMENT_LABELS[d.payment_method] || d.payment_method}</p>
                        </div>
                        <span className="font-semibold text-purple-600">+{fmt(d.amount, d.currency)}</span>
                      </div>
                    ))}
                    {c.payments_count > 4 && (
                      <button onClick={() => { setDetailCurrency(c); setDetailType('payment') }}
                        className="text-xs text-blue-600 hover:underline mt-2">+{c.payments_count - 4} autres</button>
                    )}
                    {c.payments_count === 0 && <p className="text-xs text-gray-400 text-center py-4">Aucun encaissement</p>}
                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between text-sm font-bold">
                      <span className="text-gray-600 dark:text-gray-400">Sous-total</span>
                      <span className="text-purple-600">+{fmt(c.payments, c.currency)}</span>
                    </div>
                  </div>

                  {/* Expense column */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-1">
                        <TrendingDown className="h-3.5 w-3.5" /> Dépenses ({c.expense_count})
                      </h4>
                      {c.expense_count > 0 && (
                        <button onClick={() => { setDetailCurrency(c); setDetailType('expense') }}
                          className="text-xs text-blue-600 hover:underline">Détails</button>
                      )}
                    </div>
                    {c.expense_details.slice(0, 4).map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-700 last:border-0 text-xs">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{d.description}</p>
                          <p className="text-gray-400">{fmtDate(d.date)} · {d.loft_name}</p>
                        </div>
                        <span className="font-semibold text-red-600">-{fmt(d.amount, d.currency)}</span>
                      </div>
                    ))}
                    {c.expense_count > 4 && (
                      <button onClick={() => { setDetailCurrency(c); setDetailType('expense') }}
                        className="text-xs text-blue-600 hover:underline mt-2">+{c.expense_count - 4} autres</button>
                    )}
                    {c.expense_count === 0 && <p className="text-xs text-gray-400 text-center py-4">Aucune dépense</p>}
                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between text-sm font-bold">
                      <span className="text-gray-600 dark:text-gray-400">Sous-total</span>
                      <span className="text-red-600">-{fmt(c.expense, c.currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Net row */}
                <div className={`px-6 py-3 flex justify-between items-center text-sm font-bold ${c.net >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <span className="text-gray-700 dark:text-gray-300">Net {c.currency} (revenus − dépenses)</span>
                  <span className={c.net >= 0 ? 'text-green-700 dark:text-green-400 text-base' : 'text-red-700 dark:text-red-400 text-base'}>
                    {c.net >= 0 ? '+' : ''}{fmt(c.net, c.currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {/* Detail modal */}
      {detailCurrency && (
        <Dialog open={!!detailCurrency} onOpenChange={() => setDetailCurrency(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {CURRENCY_FLAGS[detailCurrency.currency] || '💱'} {detailCurrency.currency} —
                {detailType === 'income' ? ' Revenus acquis' : detailType === 'payment' ? ' Encaissements' : ' Dépenses'}
              </DialogTitle>
            </DialogHeader>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 font-medium">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">{detailType === 'expense' ? 'Description' : 'Appartement'}</th>
                  <th className="text-left p-3">{detailType === 'income' ? 'Client' : detailType === 'payment' ? 'Mode' : 'Catégorie'}</th>
                  <th className="text-right p-3">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {(detailType === 'income' ? detailCurrency.income_details : detailType === 'payment' ? detailCurrency.payments_details : detailCurrency.expense_details).map((d: any) => (
                  <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="p-3 text-gray-500">{fmtDate(d.date)}</td>
                    <td className="p-3 font-medium">{detailType === 'expense' ? d.description : d.loft_name}</td>
                    <td className="p-3 text-gray-500">
                      {detailType === 'income' ? (d.guest_name || '—') : detailType === 'payment' ? (PAYMENT_LABELS[d.payment_method] || d.payment_method) : d.category}
                    </td>
                    <td className={`p-3 text-right font-semibold ${detailType === 'expense' ? 'text-red-600' : detailType === 'payment' ? 'text-purple-600' : 'text-green-600'}`}>
                      {detailType === 'expense' ? '-' : '+'}{fmt(d.amount, d.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-700 font-bold">
                  <td colSpan={3} className="p-3 text-gray-600 dark:text-gray-400">Total</td>
                  <td className={`p-3 text-right ${detailType === 'expense' ? 'text-red-600' : detailType === 'payment' ? 'text-purple-600' : 'text-green-600'}`}>
                    {detailType === 'expense' ? '-' : '+'}{fmt(
                      detailType === 'income' ? detailCurrency.income : detailType === 'payment' ? detailCurrency.payments : detailCurrency.expense,
                      detailCurrency.currency
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
