'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTranslations, useLocale } from 'next-intl'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { fr, ar, enUS } from 'date-fns/locale'
import { RefreshCw, ChevronDown, ChevronRight, Building2, User, Printer, Eye, X } from 'lucide-react'

interface Reservation {
  id: string
  guest_name: string
  check_in_date: string
  check_out_date: string
  nights: number
  total_amount: number
  status: string
}

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
  reservations: Reservation[]
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
  const locale = useLocale()
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [byOwner, setByOwner] = useState<OwnerGroup[]>([])
  const [rawLofts, setRawLofts] = useState<LoftResult[]>([])
  const [loading, setLoading] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, number>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [detailLoft, setDetailLoft] = useState<LoftResult | null>(null)
  const [printOwner, setPrintOwner] = useState<OwnerGroup | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const dateLocale = locale === 'ar' ? ar : locale === 'fr' ? fr : enUS

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/partner-due?startDate=${startDate}&endDate=${endDate}`)
      const data = await res.json()
      if (data.byOwner) {
        setByOwner(data.byOwner)
        setRawLofts(data.lofts || [])
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
  const fmtDate = (d: string) => format(new Date(d), 'dd/MM/yyyy', { locale: dateLocale })

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

  // Print a single owner's report
  const handlePrint = (group: OwnerGroup) => {
    setPrintOwner(group)
    setTimeout(() => {
      window.print()
    }, 300)
  }

  return (
    <div className="space-y-6">
      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #partner-print-area { display: block !important; }
          #partner-print-area { position: fixed; top: 0; left: 0; width: 100%; }
        }
        #partner-print-area { display: none; }
      `}</style>

      {/* Hidden print area */}
      {printOwner && (
        <div id="partner-print-area" ref={printRef}>
          <div style={{ fontFamily: 'Arial, sans-serif', padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ borderBottom: '2px solid #333', paddingBottom: '16px', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>Loft Algérie</h1>
              <h2 style={{ fontSize: '16px', color: '#555', margin: '4px 0 0' }}>{t('printTitle')}</h2>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px' }}>{t('partner')} : {printOwner.owner_name}</p>
                <p style={{ margin: '4px 0 0', color: '#666', fontSize: '13px' }}>
                  {t('period')} : {fmtDate(startDate)} → {fmtDate(endDate)}
                </p>
              </div>
              <div style={{ textAlign: 'right', color: '#666', fontSize: '12px' }}>
                <p style={{ margin: 0 }}>{t('printedOn')} : {format(new Date(), 'dd/MM/yyyy')}</p>
              </div>
            </div>

            {/* Per loft */}
            {printOwner.lofts.map(loft => {
              const pct = overrides[loft.loft_id] ?? loft.owner_percentage
              const ownerDue = Math.round(loft.total_revenue * pct / 100)
              return (
                <div key={loft.loft_id} style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', background: '#f3f4f6', padding: '8px 12px', margin: '0 0 8px', borderRadius: '4px' }}>
                    🏠 {loft.loft_name} — {t('ownerPct')} : {pct}%
                  </h3>
                  {loft.reservations.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#e5e7eb' }}>
                          <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #d1d5db' }}>{t('guest')}</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #d1d5db' }}>{t('checkIn')}</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #d1d5db' }}>{t('checkOut')}</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #d1d5db' }}>{t('nights')}</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #d1d5db' }}>{t('amount')}</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #d1d5db' }}>{t('ownerDue')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loft.reservations.map(r => (
                          <tr key={r.id}>
                            <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb' }}>{r.guest_name}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>{fmtDate(r.check_in_date)}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>{fmtDate(r.check_out_date)}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>{r.nights}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', border: '1px solid #e5e7eb' }}>{fmt(r.total_amount)}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', border: '1px solid #e5e7eb', fontWeight: 'bold' }}>{fmt(Math.round(r.total_amount * pct / 100))}</td>
                          </tr>
                        ))}
                        <tr style={{ background: '#fef3c7', fontWeight: 'bold' }}>
                          <td colSpan={4} style={{ padding: '6px 8px', border: '1px solid #d1d5db' }}>{t('subtotal')} {loft.loft_name}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #d1d5db' }}>{fmt(loft.total_revenue)}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #d1d5db' }}>{fmt(ownerDue)}</td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: '#9ca3af', fontSize: '12px', padding: '8px' }}>{t('noReservations')}</p>
                  )}
                </div>
              )
            })}

            {/* Grand total */}
            <div style={{ borderTop: '2px solid #333', paddingTop: '16px', marginTop: '8px' }}>
              <table style={{ width: '100%', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 0', fontWeight: 'bold' }}>{t('totalRevenue')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{fmt(revenueTotal(printOwner))}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', color: '#d97706', fontWeight: 'bold' }}>{t('totalOwnerDue')} ({t('ownerPct')} moyen)</td>
                    <td style={{ textAlign: 'right', color: '#d97706', fontWeight: 'bold', fontSize: '16px' }}>{fmt(ownerTotal(printOwner))}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '48px', borderTop: '1px solid #e5e7eb', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af' }}>
              <span>Loft Algérie — www.loftalgerie.com</span>
              <span>{t('signature')} : ___________________</span>
            </div>
          </div>
        </div>
      )}

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

      {byOwner.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">{t('noData')}</div>
      )}

      {/* Per owner */}
      {byOwner.map(group => (
        <Card key={group.owner_id} className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90">
          <CardHeader
            className="cursor-pointer select-none bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-700 dark:to-gray-800 rounded-t-lg"
            onClick={() => toggleExpand(group.owner_id)}
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {expanded.has(group.owner_id)
                  ? <ChevronDown className="h-4 w-4 text-gray-500" />
                  : <ChevronRight className="h-4 w-4 text-gray-500" />
                }
                <User className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">{group.owner_name}</CardTitle>
                <Badge variant="outline" className="text-xs">{group.lofts.length} {t('lofts')}</Badge>
              </div>
              <div className="flex items-center gap-4">
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
                {/* Print button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 text-xs"
                  onClick={e => { e.stopPropagation(); handlePrint(group) }}
                >
                  <Printer className="h-3.5 w-3.5" />
                  {t('print')}
                </Button>
              </div>
            </div>
          </CardHeader>

          {expanded.has(group.owner_id) && (
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {/* Column headers */}
                <div className="grid grid-cols-12 gap-2 px-6 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 font-medium">
                  <div className="col-span-3">{t('loft')}</div>
                  <div className="col-span-1 text-center">{t('nbRes')}</div>
                  <div className="col-span-2 text-right">{t('revenue')}</div>
                  <div className="col-span-2 text-center">{t('ownerPct')}</div>
                  <div className="col-span-2 text-right">{t('ownerDue')}</div>
                  <div className="col-span-1 text-center">{t('companyPct')}</div>
                  <div className="col-span-1 text-right">{t('companyDue')}</div>
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
                      <div className="col-span-1 text-center">
                        <button
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mx-auto"
                          onClick={() => setDetailLoft(loft)}
                          title={t('viewDetail')}
                        >
                          <Eye className="h-3 w-3" />
                          {loft.reservations.length}
                        </button>
                      </div>
                      <div className="col-span-2 text-right text-sm">{fmt(loft.total_revenue)}</div>
                      <div className="col-span-2 flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={pct}
                          onChange={e => setOverrides(prev => ({ ...prev, [loft.loft_id]: Number(e.target.value) }))}
                          className="h-7 w-16 text-center text-sm px-1"
                          onClick={e => e.stopPropagation()}
                        />
                        <span className="text-xs text-gray-400">%</span>
                        {pct !== loft.owner_percentage && (
                          <button
                            className="text-xs text-blue-500 hover:underline"
                            onClick={() => setOverrides(prev => ({ ...prev, [loft.loft_id]: loft.owner_percentage }))}
                            title={t('reset')}
                          >↺</button>
                        )}
                      </div>
                      <div className="col-span-2 text-right text-sm font-semibold text-amber-700">{fmt(calcOwnerDue(loft))}</div>
                      <div className="col-span-1 text-center text-xs text-gray-500">{compPct.toFixed(1)}%</div>
                      <div className="col-span-1 text-right text-sm font-semibold text-emerald-700">{fmt(calcCompanyDue(loft))}</div>
                    </div>
                  )
                })}

                {/* Subtotal */}
                <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-gray-50 dark:bg-gray-700/50 font-semibold text-sm">
                  <div className="col-span-3 text-gray-600">{t('subtotal')}</div>
                  <div className="col-span-1"></div>
                  <div className="col-span-2 text-right">{fmt(revenueTotal(group))}</div>
                  <div className="col-span-2"></div>
                  <div className="col-span-2 text-right text-amber-700">{fmt(ownerTotal(group))}</div>
                  <div className="col-span-1"></div>
                  <div className="col-span-1 text-right text-emerald-700">{fmt(companyTotal(group))}</div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* Reservation detail modal */}
      <Dialog open={!!detailLoft} onOpenChange={() => setDetailLoft(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              {detailLoft?.loft_name} — {t('reservationDetail')}
            </DialogTitle>
          </DialogHeader>
          {detailLoft && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{t('partner')} : <strong>{detailLoft.owner_name}</strong></span>
                <span>{t('ownerPct')} : <strong>{overrides[detailLoft.loft_id] ?? detailLoft.owner_percentage}%</strong></span>
              </div>
              {detailLoft.reservations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t('noReservations')}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="text-left p-3 font-medium">{t('guest')}</th>
                      <th className="text-center p-3 font-medium">{t('checkIn')}</th>
                      <th className="text-center p-3 font-medium">{t('checkOut')}</th>
                      <th className="text-center p-3 font-medium">{t('nights')}</th>
                      <th className="text-right p-3 font-medium">{t('amount')}</th>
                      <th className="text-right p-3 font-medium">{t('ownerDue')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {detailLoft.reservations.map(r => {
                      const pct = overrides[detailLoft.loft_id] ?? detailLoft.owner_percentage
                      return (
                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="p-3">{r.guest_name}</td>
                          <td className="p-3 text-center">{fmtDate(r.check_in_date)}</td>
                          <td className="p-3 text-center">{fmtDate(r.check_out_date)}</td>
                          <td className="p-3 text-center">{r.nights}</td>
                          <td className="p-3 text-right">{fmt(r.total_amount)}</td>
                          <td className="p-3 text-right font-semibold text-amber-700">{fmt(Math.round(r.total_amount * pct / 100))}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-amber-50 dark:bg-amber-900/20 font-bold">
                      <td colSpan={4} className="p-3">{t('subtotal')}</td>
                      <td className="p-3 text-right">{fmt(detailLoft.total_revenue)}</td>
                      <td className="p-3 text-right text-amber-700">{fmt(calcOwnerDue(detailLoft))}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
