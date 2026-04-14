'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { ResponsivePartnerLayout } from '@/components/partner/responsive-partner-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Espèces', ccp: 'CCP', virement: 'Virement bancaire',
  paypal: 'PayPal', cheque: 'Chèque', baridi: 'Baridi Mob', autre: 'Autre',
}

export default function PartnerRevenuePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fmt = (n: number) => n.toLocaleString('fr-DZ') + ' DA'
  const fmtOrig = (n: number, c: string) => c === 'DZD'
    ? fmt(n)
    : n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + c

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/partner/reports?startDate=${startDate}&endDate=${endDate}`)
      const json = await res.json()
      setData(json)
    } catch {}
    setLoading(false)
  }, [startDate, endDate])

  useEffect(() => { fetchData() }, [fetchData])

  // Quick period buttons
  const setPeriod = (months: number) => {
    const d = subMonths(new Date(), months - 1)
    setStartDate(format(startOfMonth(d), 'yyyy-MM-dd'))
    setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  }

  return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            Mes revenus & rapport dû
          </h1>
          <p className="text-gray-500 text-sm mt-1">Consultez vos revenus et ce que Loft Algérie vous doit</p>
        </div>

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
              <div className="flex gap-2">
                {[1, 3, 6].map(m => (
                  <Button key={m} size="sm" variant="outline" className="h-9" onClick={() => setPeriod(m)}>
                    {m === 1 ? 'Ce mois' : `${m} mois`}
                  </Button>
                ))}
              </div>
              <Button size="sm" onClick={fetchData} disabled={loading} className="h-9">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading && <div className="text-center text-gray-400 py-8 animate-pulse">Chargement...</div>}

        {data && !loading && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 mb-1"><TrendingUp className="h-3.5 w-3.5 text-green-200" /><p className="text-green-100 text-xs">Revenus totaux</p></div>
                  <p className="text-xl font-bold">{fmt(data.summary.total_income)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                <CardContent className="p-4">
                  <p className="text-amber-100 text-xs mb-1">Dû partenaire</p>
                  <p className="text-xl font-bold">{fmt(data.summary.owner_due)}</p>
                  <p className="text-xs text-amber-200 mt-1">Revenus × % − Dépenses</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1 mb-1"><TrendingDown className="h-3.5 w-3.5 text-red-200" /><p className="text-red-100 text-xs">Dépenses</p></div>
                  <p className="text-xl font-bold">{fmt(data.summary.total_expense)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Per loft */}
            {data.lofts?.length > 0 && (
              <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg px-6 py-4">
                  <h3 className="font-semibold text-base">Détail par appartement</h3>
                </div>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {data.lofts.map((l: any) => (
                      <div key={l.loft_id} className="px-5 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{l.loft_name}</p>
                            <p className="text-xs text-gray-500">Part partenaire : {l.owner_percentage}% · {l.reservations_count} réservation{l.reservations_count > 1 ? 's' : ''}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Revenus</p>
                            <p className="font-semibold text-green-600">{fmt(l.income)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-amber-600">Dû</p>
                            <p className="font-bold text-amber-700 text-lg">{fmt(l.owner_due)}</p>
                          </div>
                        </div>
                        {l.reservations?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {l.reservations.map((r: any) => (
                              <div key={r.id} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-700/30 rounded px-3 py-1.5">
                                <span className="text-gray-600 dark:text-gray-400">{r.guest_name || '—'}</span>
                                <span className="text-gray-500">{r.check_in} → {r.check_out}</span>
                                <span className="font-medium text-green-600">+{fmt(r.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payments by method/currency */}
            {data.by_payment?.length > 0 && (
              <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90">
                <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-t-lg px-6 py-4">
                  <h3 className="font-semibold text-base">Paiements reçus par mode et devise</h3>
                </div>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {data.by_payment.map((p: any, i: number) => (
                      <div key={i} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 mb-1">{PAYMENT_LABELS[p.method] || p.method}</p>
                        <p className="font-bold text-gray-900 dark:text-white">{fmtOrig(p.total, p.currency)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{p.count} paiement{p.count > 1 ? 's' : ''}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analytics chart */}
            {data.analytics?.length > 0 && (
              <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg px-6 py-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <h3 className="font-semibold text-base">Évolution sur 6 mois</h3>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {data.analytics.map((m: any) => {
                      const maxIncome = Math.max(...data.analytics.map((a: any) => a.income), 1)
                      const pct = Math.round((m.income / maxIncome) * 100)
                      return (
                        <div key={m.month} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-20 flex-shrink-0">{m.label}</span>
                          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
                              {fmt(m.income)}
                            </span>
                          </div>
                          <span className="text-xs text-amber-600 font-medium w-28 text-right flex-shrink-0">
                            Dû : {fmt(m.owner_due)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.lofts?.length === 0 && (
              <div className="text-center py-12 text-gray-400">Aucune donnée pour cette période</div>
            )}
          </>
        )}
      </div>
    </ResponsivePartnerLayout>
  )
}
