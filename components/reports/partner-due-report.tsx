'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTranslations, useLocale } from 'next-intl'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { fr, ar, enUS } from 'date-fns/locale'
import { RefreshCw, ChevronDown, ChevronRight, Building2, User, Printer, Eye, Search, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Transaction {
  id: string
  date: string
  description: string
  category: string
  amount: number
  type: 'income' | 'expense'
}

interface LoftResult {
  loft_id: string
  loft_name: string
  owner_id: string
  owner_name: string
  owner_percentage: number
  company_percentage: number
  total_income: number
  total_expense: number
  total_revenue: number
  owner_gross: number    // income × owner%
  owner_due: number      // owner_gross - expenses
  company_due: number    // income × company%
  transactions: Transaction[]
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
  const [selectedOwner, setSelectedOwner] = useState<string>('all')
  const [ownerSearch, setOwnerSearch] = useState('')
  const [ownerPopoverOpen, setOwnerPopoverOpen] = useState(false)

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
  const fmtDate = (d: string) => {
    try { return format(new Date(d), 'dd/MM/yyyy', { locale: dateLocale }) } catch { return d }
  }

  const calcOwnerDue = (loft: LoftResult) => {
    const pct = overrides[loft.loft_id] ?? loft.owner_percentage
    const ownerGross = Math.round(loft.total_income * pct / 100)
    return Math.max(0, ownerGross - loft.total_expense)
  }
  const calcOwnerGross = (loft: LoftResult) => {
    const pct = overrides[loft.loft_id] ?? loft.owner_percentage
    return Math.round(loft.total_income * pct / 100)
  }
  const calcCompanyDue = (loft: LoftResult) => {
    const pct = overrides[loft.loft_id] ?? loft.owner_percentage
    const compPct = 100 - pct
    return Math.round(loft.total_income * compPct / 100)
  }

  const ownerTotal = (group: OwnerGroup) => group.lofts.reduce((s, l) => s + calcOwnerDue(l), 0)
  const companyTotal = (group: OwnerGroup) => group.lofts.reduce((s, l) => s + calcCompanyDue(l), 0)
  const revenueTotal = (group: OwnerGroup) => group.lofts.reduce((s, l) => s + l.total_revenue, 0)

  const grandRevenue = byOwner.reduce((s, g) => s + revenueTotal(g), 0)
  const grandOwner = byOwner.reduce((s, g) => s + ownerTotal(g), 0)
  const grandCompany = byOwner.reduce((s, g) => s + companyTotal(g), 0)

  // Filtered list based on selected partner
  const visibleOwners = selectedOwner === 'all' ? byOwner : byOwner.filter(g => g.owner_id === selectedOwner)
  const filteredRevenue = visibleOwners.reduce((s, g) => s + revenueTotal(g), 0)
  const filteredOwner = visibleOwners.reduce((s, g) => s + ownerTotal(g), 0)
  const filteredCompany = visibleOwners.reduce((s, g) => s + companyTotal(g), 0)

  // Print in a new window — reliable cross-browser
  const handlePrint = (group: OwnerGroup) => {
    const pctMap: Record<string, number> = {}
    group.lofts.forEach(l => { pctMap[l.loft_id] = overrides[l.loft_id] ?? l.owner_percentage })

    // Only lofts where partner has a percentage > 0
    const activeLofts = group.lofts.filter(l => (pctMap[l.loft_id] ?? 0) > 0 && (l.total_income > 0 || l.total_expense > 0))

    const rows = activeLofts.map(loft => {
      const pct = pctMap[loft.loft_id]
      const ownerGross = Math.round(loft.total_income * pct / 100)
      const netOwnerDue = Math.max(0, ownerGross - loft.total_expense)

      const txRows = loft.transactions.length > 0
        ? loft.transactions.map(tx => {
            const isExpense = tx.type === 'expense'
            const sign = isExpense ? '-' : '+'
            const color = isExpense ? '#dc2626' : '#16a34a'
            const bg = isExpense ? '#fef2f2' : ''
            return `
              <tr style="background:${bg}">
                <td style="padding:5px 8px;border:1px solid #e5e7eb">${fmtDate(tx.date)}</td>
                <td style="padding:5px 8px;border:1px solid #e5e7eb">${tx.description || '-'}</td>
                <td style="padding:5px 8px;border:1px solid #e5e7eb">${tx.category || '-'}</td>
                <td style="padding:5px 8px;text-align:center;border:1px solid #e5e7eb">
                  <span style="font-size:11px;padding:2px 6px;border-radius:9999px;background:${isExpense ? '#fee2e2' : '#dcfce7'};color:${color};font-weight:bold">
                    ${isExpense ? t('expenseLabel') : t('incomeLabel')}
                  </span>
                </td>
                <td style="padding:5px 8px;text-align:right;border:1px solid #e5e7eb;color:${color};font-weight:500">${sign}${fmt(tx.amount)}</td>
              </tr>`
          }).join('')
        : `<tr><td colspan="5" style="padding:8px;color:#9ca3af;text-align:center">${t('noTransactions')}</td></tr>`

      return `
        <div style="margin-bottom:28px">
          <h3 style="font-size:14px;font-weight:bold;background:#f3f4f6;padding:8px 12px;margin:0 0 8px;border-radius:4px">
            🏠 ${loft.loft_name} &mdash; ${t('ownerPct')} : ${pct}%
          </h3>
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead>
              <tr style="background:#e5e7eb">
                <th style="padding:6px 8px;text-align:left;border:1px solid #d1d5db">${t('date')}</th>
                <th style="padding:6px 8px;text-align:left;border:1px solid #d1d5db">${t('description')}</th>
                <th style="padding:6px 8px;text-align:left;border:1px solid #d1d5db">${t('category')}</th>
                <th style="padding:6px 8px;text-align:center;border:1px solid #d1d5db">${t('type')}</th>
                <th style="padding:6px 8px;text-align:right;border:1px solid #d1d5db">${t('amount')}</th>
              </tr>
            </thead>
            <tbody>${txRows}</tbody>
            <tfoot>
              <tr style="background:#f9fafb;font-size:11px;color:#6b7280">
                <td colspan="4" style="padding:5px 8px;border:1px solid #e5e7eb">
                  ${t('income')} : +${fmt(loft.total_income)} × ${pct}% = ${fmt(ownerGross)}
                </td>
                <td style="padding:5px 8px;text-align:right;border:1px solid #e5e7eb;font-weight:bold;color:#d97706">${fmt(ownerGross)}</td>
              </tr>
              <tr style="background:#fef3c7;font-weight:bold">
                <td colspan="3" style="padding:6px 8px;border:1px solid #d1d5db">
                  ${t('ownerDue')} = ${fmt(ownerGross)} − ${t('expense')} ${fmt(loft.total_expense)}
                </td>
                <td colspan="2" style="padding:6px 8px;text-align:right;border:1px solid #d1d5db;color:#d97706;font-size:14px">${fmt(netOwnerDue)}</td>
              </tr>
            </tfoot>
          </table>
        </div>`
    }).join('')

    const totalIncome = activeLofts.reduce((s, l) => s + l.total_income, 0)
    const totalExpense = activeLofts.reduce((s, l) => s + l.total_expense, 0)
    const totalOwnerDue = activeLofts.reduce((s, l) => {
      const pct = pctMap[l.loft_id] ?? 0
      const gross = Math.round(l.total_income * pct / 100)
      return s + Math.max(0, gross - l.total_expense)
    }, 0)

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${t('printTitle')} - ${group.owner_name}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; max-width: 800px; margin: 0 auto; color: #111; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div style="border-bottom:2px solid #333;padding-bottom:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-end">
    <div>
      <h1 style="font-size:22px;font-weight:bold;margin:0">Loft Algérie</h1>
      <h2 style="font-size:15px;color:#555;margin:4px 0 0">${t('printTitle')}</h2>
    </div>
    <div style="text-align:right;font-size:12px;color:#666">
      <p style="margin:0">${t('printedOn')} : ${format(new Date(), 'dd/MM/yyyy')}</p>
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;margin-bottom:24px">
    <div>
      <p style="margin:0;font-weight:bold;font-size:15px">${t('partner')} : ${group.owner_name}</p>
      <p style="margin:4px 0 0;color:#666;font-size:13px">${t('period')} : ${fmtDate(startDate)} → ${fmtDate(endDate)}</p>
    </div>
  </div>

  ${rows}

  <div style="border-top:2px solid #333;padding-top:16px;margin-top:8px">
    <table style="width:100%;font-size:13px">
      <tr>
        <td style="padding:4px 0;color:#16a34a">${t('income')}</td>
        <td style="text-align:right;color:#16a34a">+${fmt(totalIncome)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#dc2626">${t('expense')}</td>
        <td style="text-align:right;color:#dc2626">-${fmt(totalExpense)}</td>
      </tr>
      <tr style="border-top:1px solid #e5e7eb">
        <td style="padding:4px 0;font-weight:bold">${t('income')}</td>
        <td style="text-align:right;font-weight:bold">${fmt(totalIncome)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0 4px;color:#d97706;font-weight:bold;font-size:15px">${t('totalOwnerDue')}</td>
        <td style="text-align:right;color:#d97706;font-weight:bold;font-size:18px">${fmt(totalOwnerDue)}</td>
      </tr>
    </table>
  </div>

  <div style="margin-top:48px;border-top:1px solid #e5e7eb;padding-top:16px;display:flex;justify-content:space-between;font-size:12px;color:#9ca3af">
    <span>Loft Algérie — www.loftalgerie.com</span>
    <span>${t('signature')} : ___________________</span>
  </div>

  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

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

            {/* Partner filter */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">{t('filterPartner')}</Label>
              <Popover open={ownerPopoverOpen} onOpenChange={open => { setOwnerPopoverOpen(open); if (!open) setOwnerSearch('') }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 min-w-[200px] justify-between font-normal">
                    <span className="truncate">
                      {selectedOwner === 'all' ? t('allPartners') : byOwner.find(g => g.owner_id === selectedOwner)?.owner_name || t('allPartners')}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0" align="start" side="bottom" sideOffset={4}>
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        placeholder={t('searchPartner')}
                        value={ownerSearch}
                        onChange={e => setOwnerSearch(e.target.value)}
                        className="h-8 pl-7 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-1">
                    <button
                      className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors ${selectedOwner === 'all' ? 'bg-accent font-medium' : ''}`}
                      onClick={() => { setSelectedOwner('all'); setOwnerPopoverOpen(false) }}
                    >
                      {t('allPartners')}
                    </button>
                    {byOwner
                      .filter(g => g.owner_name.toLowerCase().includes(ownerSearch.toLowerCase()))
                      .map(g => (
                        <button
                          key={g.owner_id}
                          className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors ${selectedOwner === g.owner_id ? 'bg-accent font-medium' : ''}`}
                          onClick={() => { setSelectedOwner(g.owner_id); setOwnerPopoverOpen(false) }}
                        >
                          {g.owner_name}
                        </button>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {selectedOwner !== 'all' && (
              <Button size="sm" variant="ghost" className="h-9 text-gray-500" onClick={() => setSelectedOwner('all')}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grand totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-5">
            <p className="text-blue-100 text-sm">{t('totalRevenue')}</p>
            <p className="text-2xl font-bold mt-1">{fmt(filteredRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <CardContent className="p-5">
            <p className="text-amber-100 text-sm">{t('totalOwnerDue')}</p>
            <p className="text-2xl font-bold mt-1">{fmt(filteredOwner)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-5">
            <p className="text-emerald-100 text-sm">{t('totalCompanyDue')}</p>
            <p className="text-2xl font-bold mt-1">{fmt(filteredCompany)}</p>
          </CardContent>
        </Card>
      </div>

      {visibleOwners.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">{t('noData')}</div>
      )}

      {/* Per owner */}
      {visibleOwners.map(group => (
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
                <Badge variant="outline" className="text-xs">{group.lofts.filter(l => l.total_revenue > 0).length} {t('lofts')}</Badge>
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
                  <div className="col-span-1 text-center">{t('nbTx')}</div>
                  <div className="col-span-1 text-right text-green-600">{t('income')}</div>
                  <div className="col-span-2 text-center">{t('ownerPct')}</div>
                  <div className="col-span-2 text-right text-amber-600">{t('ownerGross')}</div>
                  <div className="col-span-1 text-right text-red-500">-{t('expense')}</div>
                  <div className="col-span-2 text-right text-amber-700 font-semibold">{t('ownerDue')}</div>
                </div>

                {group.lofts.filter(l => l.total_income > 0 || l.total_expense > 0).map(loft => {
                  const pct = overrides[loft.loft_id] ?? loft.owner_percentage
                  const ownerGross = calcOwnerGross(loft)
                  const ownerNet = calcOwnerDue(loft)
                  return (
                    <div key={loft.loft_id} className="grid grid-cols-12 gap-2 px-6 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <div className="col-span-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{loft.loft_name}</span>
                      </div>
                      <div className="col-span-1 text-center">
                        <button className="text-xs text-blue-600 hover:underline flex items-center gap-1 mx-auto" onClick={() => setDetailLoft(loft)}>
                          <Eye className="h-3 w-3" />{loft.transactions.length}
                        </button>
                      </div>
                      <div className="col-span-1 text-right text-sm text-green-600">{fmt(loft.total_income)}</div>
                      <div className="col-span-2 flex items-center justify-center gap-1">
                        <Input
                          type="number" min="0" max="100" step="0.5"
                          value={pct}
                          onChange={e => setOverrides(prev => ({ ...prev, [loft.loft_id]: Number(e.target.value) }))}
                          className="h-7 w-16 text-center text-sm px-1"
                          onClick={e => e.stopPropagation()}
                        />
                        <span className="text-xs text-gray-400">%</span>
                        {pct !== loft.owner_percentage && (
                          <button className="text-xs text-blue-500 hover:underline" onClick={() => setOverrides(prev => ({ ...prev, [loft.loft_id]: loft.owner_percentage }))} title={t('reset')}>↺</button>
                        )}
                      </div>
                      <div className="col-span-2 text-right text-sm text-amber-600">{fmt(ownerGross)}</div>
                      <div className="col-span-1 text-right text-sm text-red-500">-{fmt(loft.total_expense)}</div>
                      <div className="col-span-2 text-right">
                        <span className="text-sm font-bold text-amber-700">{fmt(ownerNet)}</span>
                      </div>
                    </div>
                  )
                })}

                {/* Subtotal row */}
                <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-gray-50 dark:bg-gray-700/50 font-semibold text-sm">
                  <div className="col-span-3 text-gray-600">{t('subtotal')}</div>
                  <div className="col-span-1"></div>
                  <div className="col-span-1 text-right text-green-600">{fmt(group.lofts.reduce((s,l)=>s+l.total_income,0))}</div>
                  <div className="col-span-2"></div>
                  <div className="col-span-2 text-right text-amber-600">{fmt(group.lofts.reduce((s,l)=>s+calcOwnerGross(l),0))}</div>
                  <div className="col-span-1 text-right text-red-500">-{fmt(group.lofts.reduce((s,l)=>s+l.total_expense,0))}</div>
                  <div className="col-span-2 text-right text-amber-700">{fmt(ownerTotal(group))}</div>
                </div>

                {/* Company due row */}
                <div className="grid grid-cols-12 gap-2 px-6 py-2 bg-emerald-50/50 dark:bg-emerald-900/10 text-sm">
                  <div className="col-span-6 text-gray-500 text-xs">{t('companyDue')} = {t('income')} × {100 - (overrides[group.lofts[0]?.loft_id] ?? group.lofts[0]?.owner_percentage ?? 0)}%</div>
                  <div className="col-span-6 text-right font-semibold text-emerald-700">{fmt(companyTotal(group))}</div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* Transaction detail modal */}
      <Dialog open={!!detailLoft} onOpenChange={() => setDetailLoft(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              {detailLoft?.loft_name} — {t('transactionDetail')}
            </DialogTitle>
          </DialogHeader>
          {detailLoft && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{t('partner')} : <strong>{detailLoft.owner_name}</strong></span>
                <span>{t('ownerPct')} : <strong>{overrides[detailLoft.loft_id] ?? detailLoft.owner_percentage}%</strong></span>
              </div>
              {detailLoft.transactions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t('noTransactions')}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="text-left p-3 font-medium">{t('date')}</th>
                      <th className="text-left p-3 font-medium">{t('description')}</th>
                      <th className="text-left p-3 font-medium">{t('category')}</th>
                      <th className="text-center p-3 font-medium">{t('type')}</th>
                      <th className="text-right p-3 font-medium">{t('amount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {detailLoft.transactions.map(tx => {
                      const isExpense = tx.type === 'expense'
                      return (
                        <tr key={tx.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${isExpense ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}>
                          <td className="p-3">{fmtDate(tx.date)}</td>
                          <td className="p-3">{tx.description || '-'}</td>
                          <td className="p-3">{tx.category || '-'}</td>
                          <td className="p-3 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isExpense ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {isExpense ? t('expenseLabel') : t('incomeLabel')}
                            </span>
                          </td>
                          <td className={`p-3 text-right font-medium ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                            {isExpense ? '-' : '+'}{fmt(tx.amount)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500">
                      <td colSpan={4} className="p-2 pl-3">
                        {t('income')} : +{fmt(detailLoft.total_income)} × {overrides[detailLoft.loft_id] ?? detailLoft.owner_percentage}% = {fmt(calcOwnerGross(detailLoft))}
                      </td>
                      <td className="p-2 text-right font-semibold text-amber-600">{fmt(calcOwnerGross(detailLoft))}</td>
                    </tr>
                    <tr className="bg-amber-50 dark:bg-amber-900/20 font-bold">
                      <td colSpan={4} className="p-3">
                        {t('ownerDue')} = {fmt(calcOwnerGross(detailLoft))} − {t('expense')} {fmt(detailLoft.total_expense)}
                      </td>
                      <td className="p-3 text-right text-amber-700 text-base">{fmt(calcOwnerDue(detailLoft))}</td>
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
