'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, TrendingUp, TrendingDown, Banknote, Building2, Users, CreditCard } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

const PAYMENT_LABELS: Record<string, { label: string; emoji: string }> = {
  cash:     { label: 'Espèces',           emoji: '💵' },
  ccp:      { label: 'CCP',               emoji: '🏦' },
  virement: { label: 'Virement bancaire', emoji: '🏛️' },
  paypal:   { label: 'PayPal',            emoji: '📱' },
  cheque:   { label: 'Chèque',            emoji: '📄' },
  baridi:   { label: 'Baridi Mob',        emoji: '📲' },
  autre:    { label: 'Autre',             emoji: '💳' },
}

export function FinancialSummaryReport() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)), 'yyyy-MM-dd'))
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/financial-summary?startDate=${startDate}&endDate=${endDate}`)
      const json = await res.json()
      setData(json)
    } catch {}
    setLoading(false)
  }, [startDate, endDate])

  useEffect(() => { fetchData() }, [fetchData])

  const fmt = (n: number) => n.toLocaleString('fr-DZ') + ' DA'

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Du</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 w-[150px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Au</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 w-[150px]" />
            </div>
            <Button size="sm" onClick={fetchData} disabled={loading} className="h-9">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {!data && !loading && <div className="text-center text-gray-400 py-8">Aucune donnée</div>}
      {loading && <div className="text-center text-gray-400 py-8 animate-pulse">Chargement...</div>}

      {data && (
        <>
          {/* Section 1: Global */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-200" />
                  <p className="text-green-100 text-xs">Recettes totales</p>
                </div>
                <p className="text-xl font-bold">{fmt(data.global.total_income)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-red-200" />
                  <p className="text-red-100 text-xs">Dépenses totales</p>
                </div>
                <p className="text-xl font-bold">{fmt(data.global.total_expense)}</p>
              </CardContent>
            </Card>
            <Card className={`border-0 shadow-lg text-white ${data.global.net >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-orange-500 to-red-600'}`}>
              <CardContent className="p-5">
                <p className="text-blue-100 text-xs mb-1">Bénéfice net</p>
                <p className="text-xl font-bold">{fmt(data.global.net)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-purple-200" />
                  <p className="text-purple-100 text-xs">Paiements reçus</p>
                </div>
                <p className="text-xl font-bold">{fmt(data.global.total_payments_received)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Section 2: By payment method */}
          {data.by_payment_method.length > 0 && (
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-5 w-5" />
                  Paiements reçus par mode
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {data.by_payment_method.map((p: any) => {
                    const info = PAYMENT_LABELS[p.method] || { label: p.method, emoji: '💳' }
                    const pct = data.global.total_payments_received > 0
                      ? Math.round(p.amount / data.global.total_payments_received * 100) : 0
                    return (
                      <div key={p.method} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{info.emoji}</span>
                          <span className="text-sm font-medium">{info.label}</span>
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white">{fmt(p.amount)}</p>
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full">
                          <div className="h-1.5 bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{pct}% du total</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 3: Own lofts */}
          {data.own_lofts.length > 0 && (
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-5 w-5" />
                  Lofts propres (Loft Algérie)
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 ml-auto">
                    {data.own_lofts.length} lofts
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  <div className="grid grid-cols-4 gap-2 px-6 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 font-medium">
                    <div>Appartement</div>
                    <div className="text-right text-green-600">Recettes</div>
                    <div className="text-right text-red-500">Dépenses</div>
                    <div className="text-right">Net</div>
                  </div>
                  {data.own_lofts.map((l: any) => (
                    <div key={l.name} className="grid grid-cols-4 gap-2 px-6 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <div className="text-sm font-medium truncate">{l.name}</div>
                      <div className="text-right text-sm text-green-600">{fmt(l.income)}</div>
                      <div className="text-right text-sm text-red-500">-{fmt(l.expense)}</div>
                      <div className={`text-right text-sm font-semibold ${l.net >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{fmt(l.net)}</div>
                    </div>
                  ))}
                  <div className="grid grid-cols-4 gap-2 px-6 py-3 bg-blue-50 dark:bg-blue-900/20 font-semibold text-sm">
                    <div className="text-gray-600">Total</div>
                    <div className="text-right text-green-600">{fmt(data.own_lofts.reduce((s: number, l: any) => s + l.income, 0))}</div>
                    <div className="text-right text-red-500">-{fmt(data.own_lofts.reduce((s: number, l: any) => s + l.expense, 0))}</div>
                    <div className="text-right text-blue-700">{fmt(data.own_lofts.reduce((s: number, l: any) => s + l.net, 0))}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 4: By partner */}
          {data.by_partner.length > 0 && (
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90">
              <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5" />
                  Revenus par partenaire (part société)
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 ml-auto">
                    {data.by_partner.length} partenaires
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.by_partner.map((p: any) => (
                    <div key={p.owner_name} className="px-6 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{p.owner_name}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">Revenu total : <strong>{fmt(p.total_income)}</strong></span>
                          <span className="text-emerald-700 font-bold">Part société : {fmt(p.total_company_share)}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {p.lofts.map((l: any) => (
                          <div key={l.name} className="bg-amber-50 dark:bg-amber-900/20 rounded p-2 text-xs border border-amber-200">
                            <p className="font-medium truncate">{l.name}</p>
                            <p className="text-gray-500">{fmt(l.income)} → <span className="text-emerald-700 font-semibold">{fmt(l.company_share)}</span></p>
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
