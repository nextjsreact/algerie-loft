'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useTranslations } from 'next-intl'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { RefreshCw, ChevronDown, ChevronRight, Building2, User, TrendingUp } from 'lucide-react'

interface LoftResult {
  loft_id: string
  loft_name: string
  owner_id: string
  owner_name: string
  owner_percentage: number
  company_percentage: number
  total_revenue: number
  owner_due: number
  company_due: number
}

interface OwnerGroup {
  owner_id: string
  owner_name: string
  lofts: LoftResult[]
  total_revenue: number
  total_owner_due: number
  total_company_due: number
}

export function PartnerDueReport() {
  const t = useTranslations('reports.partnerDue')
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [byOwner, setByOwner] = useState<OwnerGroup[]>([])
  const [loading, setLoading] = useState(false)
  // Per-loft overridden percentages: loft_id -> custom percentage
  const [overrides, setOverrides] = useState<Record<string, number>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/partner-due?startDate=${startDate}&endDate=${endDate}`)
      const data = await res.json()
      if (data.byOwner) {
        setByOwner(data.byOwner)
        // Init overrides with default percentages
        const init: Record<string, number> = {}
        data.lofts?.forEach((l: LoftResult) => { init[l.loft_id] = l.owner_percentage })
        setOverrides(init)
      }
    } catch {}
    setLoading(false)
  }, [startDate, endDate])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleExpand = (ownerId: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(ownerId) ? next.delete(ownerId) : next.add(ownerId)
      return next
    })
  }

  const fmt = (n: number) => n.toLocaleString('fr-DZ') + ' DA'

  // Recalculate with overrides
  const calcOwnerDue = (loft: LoftResult) => {
    const pct = overrides[loft.loft_id] ?? loft.owner_percentage
    return Math.round(loft.total_revenue * pct / 100)
  }
  const calcCompanyDue = (loft: LoftResult) => {
    const pct = overrides[loft.loft_id] ?? loft.owner_percentage
    return Math.round(loft.total_revenue * (100 - pct) / 100)
  }

  const ownerTotal = (group: OwnerGroup) => group.lofts.reduce((s, l) => s + calcOwnerDue(l), 0)
  const companyTotal = (group: OwnerGroup) => group.lofts.reduce((s, l) => s + calcCompanyDue(l), 0)
  const revenueTotal = (group: OwnerGroup) => group.lofts.reduce((s, l) => s + l.total_revenue, 0)

  const grandRevenue = byOwner.reduce((s, g) => s + revenueTotal(g), 0)
  const grandOwner = byOwner.reduce((s, g) => s + ownerTotal(g), 0)
  const grandCompany = byOwner.reduce((s, g) => s + companyTotal(g), 0)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">{t('from')}</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 w-[150px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">{t('to')}</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 w-[150px]" />
            </div>
            <Button size="sm" onClick={fetchData} disabled={loading} className="h-9">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grand totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-5">
            <p className="text-blue-100 text-sm">{t('totalRevenue')}</p>
            <p className="text-2xl font-bold mt-1">{fmt(grandRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <CardContent className="p-5">
            <p className="text-amber-100 text-sm">{t('totalOwnerDue')}</p>
            <p className="text-2xl font-bold mt-1">{fmt(grandOwner)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-5">
            <p className="text-emerald-100 text-sm">{t('totalCompanyDue')}</p>
            <p className="text-2xl font-bold mt-1">{fmt(grandCompany)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Per owner breakdown */}
      {byOwner.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">{t('noData')}</div>
      )}

      {byOwner.map(group => (
        <Card key={group.owner_id} className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90">
          {/* Owner header — clickable to expand */}
          <CardHeader
            className="cursor-pointer select-none bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-700 dark:to-gray-800 rounded-t-lg"
            onClick={() => toggleExpand(group.owner_id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {expanded.has(group.owner_id)
                  ? <ChevronDown className="h-4 w-4 text-gray-500" />
                  : <ChevronRight className="h-4 w-4 text-gray-500" />
                }
                <User className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">{group.owner_name}</CardTitle>
                <Badge variant="outline" className="text-xs">{group.lofts.length} {t('lofts')}</Badge>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className="text-gray-500 text-xs">{t('revenue')}</p>
                  <p className="font-semibold">{fmt(revenueTotal(group))}</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-600 text-xs">{t('ownerDue')}</p>
                  <p className="font-bold text-amber-700">{fmt(ownerTotal(group))}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-600 text-xs">{t('companyDue')}</p>
                  <p className="font-bold text-emerald-700">{fmt(companyTotal(group))}</p>
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Loft details */}
          {expanded.has(group.owner_id) && (
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {/* Column headers */}
                <div className="grid grid-cols-12 gap-2 px-6 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 font-medium">
                  <div className="col-span-3">{t('loft')}</div>
                  <div className="col-span-2 text-right">{t('revenue')}</div>
                  <div className="col-span-2 text-center">{t('ownerPct')}</div>
                  <div className="col-span-2 text-right">{t('ownerDue')}</div>
                  <div className="col-span-1 text-center">{t('companyPct')}</div>
                  <div className="col-span-2 text-right">{t('companyDue')}</div>
                </div>

                {group.lofts.map(loft => {
                  const pct = overrides[loft.loft_id] ?? loft.owner_percentage
                  const compPct = 100 - pct
                  return (
                    <div key={loft.loft_id} className="grid grid-cols-12 gap-2 px-6 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <div className="col-span-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{loft.loft_name}</span>
                      </div>
                      <div className="col-span-2 text-right text-sm">{fmt(loft.total_revenue)}</div>
                      {/* Editable owner percentage */}
                      <div className="col-span-2 flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={pct}
                          onChange={e => setOverrides(prev => ({ ...prev, [loft.loft_id]: Number(e.target.value) }))}
                          className="h-7 w-16 text-center text-sm px-1"
                        />
                        <span className="text-xs text-gray-400">%</span>
                        {pct !== loft.owner_percentage && (
                          <button
                            className="text-xs text-blue-500 hover:underline ml-1"
                            onClick={() => setOverrides(prev => ({ ...prev, [loft.loft_id]: loft.owner_percentage }))}
                            title={t('reset')}
                          >↺</button>
                        )}
                      </div>
                      <div className="col-span-2 text-right text-sm font-semibold text-amber-700">{fmt(calcOwnerDue(loft))}</div>
                      <div className="col-span-1 text-center text-xs text-gray-500">{compPct.toFixed(1)}%</div>
                      <div className="col-span-2 text-right text-sm font-semibold text-emerald-700">{fmt(calcCompanyDue(loft))}</div>
                    </div>
                  )
                })}

                {/* Owner subtotal */}
                <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-gray-50 dark:bg-gray-700/50 font-semibold text-sm">
                  <div className="col-span-3 text-gray-600">{t('subtotal')}</div>
                  <div className="col-span-2 text-right">{fmt(revenueTotal(group))}</div>
                  <div className="col-span-2"></div>
                  <div className="col-span-2 text-right text-amber-700">{fmt(ownerTotal(group))}</div>
                  <div className="col-span-1"></div>
                  <div className="col-span-2 text-right text-emerald-700">{fmt(companyTotal(group))}</div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}
