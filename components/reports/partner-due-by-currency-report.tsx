'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { RefreshCw, Building2, User, Printer, ChevronDown, ChevronRight, Search, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'

const CURRENCY_SYMBOLS: Record<string, string> = {
  DZD: 'DA', EUR: '€', USD: '$', GBP: '£', CAD: 'CA$', CHF: 'CHF',
}

export function PartnerDueByCurrencyReport() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedOwner, setSelectedOwner] = useState('all')
  const [ownerSearch, setOwnerSearch] = useState('')
  const [ownerPopover, setOwnerPopover] = useState(false)

  const fmtDate = (d: string) => { try { return format(new Date(d), 'dd/MM/yyyy', { locale: fr }) } catch { return d } }
  const fmtAmt = (n: number, currency: string) => {
    const sym = CURRENCY_SYMBOLS[currency] || currency
    const formatted = Math.abs(n).toLocaleString('fr-FR', { minimumFractionDigits: currency === 'DZD' ? 0 : 2, maximumFractionDigits: currency === 'DZD' ? 0 : 2 })
    return currency === 'DZD' ? `${formatted} DA` : `${formatted} ${sym}`
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/partner-due-by-currency?startDate=${startDate}&endDate=${endDate}`)
      const json = await res.json()
      if (json.error) { toast.error(json.error); return }
      setData(json)
    } catch { toast.error('Erreur réseau') }
    setLoading(false)
  }, [startDate, endDate])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleExpand = (id: string) => setExpanded(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  const visibleOwners = data?.byOwner
    ? (selectedOwner === 'all' ? data.byOwner : data.byOwner.filter((g: any) => g.owner_id === selectedOwner))
    : []

  const handlePrint = (group: any) => {
    const activeLofts = group.lofts.filter((l: any) => l.currencies.length > 0 || l.total_expense_dzd > 0)

    const loftRows = activeLofts.map((loft: any) => {
      const currencyBlocks = loft.currencies.map((c: any) => {
        const rows = c.entries.map((e: any) => `
          <tr style="background:${e.type === 'expense' ? '#fef2f2' : ''}">
            <td style="padding:4px 8px;border:1px solid #e5e7eb">${fmtDate(e.date)}</td>
            <td style="padding:4px 8px;border:1px solid #e5e7eb">${e.description}</td>
            <td style="padding:4px 8px;border:1px solid #e5e7eb">${e.category}</td>
            <td style="padding:4px 8px;text-align:right;border:1px solid #e5e7eb;color:#16a34a;font-weight:500">+${fmtAmt(e.amount, c.currency)}</td>
          </tr>`).join('')

        const expRows = c.currency === 'DZD' && loft.expenses.length > 0
          ? loft.expenses.map((e: any) => `
            <tr style="background:#fef2f2">
              <td style="padding:4px 8px;border:1px solid #e5e7eb">${fmtDate(e.date)}</td>
              <td style="padding:4px 8px;border:1px solid #e5e7eb">${e.description}</td>
              <td style="padding:4px 8px;border:1px solid #e5e7eb">${e.category}</td>
              <td style="padding:4px 8px;text-align:right;border:1px solid #e5e7eb;color:#dc2626;font-weight:500">-${fmtAmt(e.amount, 'DZD')}</td>
            </tr>`).join('')
          : ''

        const dueLine = c.currency === 'DZD' && loft.total_expense_dzd > 0
          ? `<tr style="background:#fef3c7;font-size:11px">
              <td colspan="3" style="padding:4px 8px;border:1px solid #e5e7eb">
                Part partenaire : ${fmtAmt(c.total_income, 'DZD')} × ${loft.owner_percentage}% = ${fmtAmt(c.owner_gross, 'DZD')} − Dépenses ${fmtAmt(loft.total_expense_dzd, 'DZD')}
              </td>
              <td style="padding:4px 8px;text-align:right;border:1px solid #e5e7eb;font-weight:bold;color:#d97706">${fmtAmt(c.owner_due, 'DZD')}</td>
            </tr>`
          : `<tr style="background:#fef3c7;font-size:11px">
              <td colspan="3" style="padding:4px 8px;border:1px solid #e5e7eb">
                Part partenaire : ${fmtAmt(c.total_income, c.currency)} × ${loft.owner_percentage}%
              </td>
              <td style="padding:4px 8px;text-align:right;border:1px solid #e5e7eb;font-weight:bold;color:#d97706">${fmtAmt(c.owner_due, c.currency)}</td>
            </tr>`

        return `
          <div style="margin-bottom:12px">
            <div style="background:#e0f2fe;padding:4px 8px;font-size:12px;font-weight:bold;border-radius:4px;margin-bottom:4px">
              💱 ${c.currency}
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:11px">
              <thead><tr style="background:#f3f4f6">
                <th style="padding:4px 8px;text-align:left;border:1px solid #d1d5db">Date</th>
                <th style="padding:4px 8px;text-align:left;border:1px solid #d1d5db">Description</th>
                <th style="padding:4px 8px;text-align:left;border:1px solid #d1d5db">Catégorie</th>
                <th style="padding:4px 8px;text-align:right;border:1px solid #d1d5db">Montant</th>
              </tr></thead>
              <tbody>${rows}${expRows}</tbody>
              <tfoot>${dueLine}</tfoot>
            </table>
          </div>`
      }).join('')

      return `
        <div style="margin-bottom:24px">
          <h3 style="font-size:13px;font-weight:bold;background:#f3f4f6;padding:6px 10px;margin:0 0 8px;border-radius:4px">
            🏠 ${loft.loft_name} — % Partenaire : ${loft.owner_percentage}%
          </h3>
          ${currencyBlocks}
        </div>`
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Relevé par devise - ${group.owner_name}</title>
<style>body{font-family:Arial,sans-serif;padding:24px;max-width:800px;margin:0 auto;color:#111}@media print{body{padding:12px}}</style>
</head><body>
  <div style="border-bottom:2px solid #333;padding-bottom:12px;margin-bottom:20px;display:flex;justify-content:space-between">
    <div>
      <h1 style="font-size:20px;font-weight:bold;margin:0">Loft Algérie</h1>
      <h2 style="font-size:13px;color:#555;margin:4px 0 0">Relevé de compte partenaire — Par devise</h2>
    </div>
    <div style="text-align:right;font-size:11px;color:#666">
      <p style="margin:0">Imprimé le : ${format(new Date(), 'dd/MM/yyyy')}</p>
    </div>
  </div>
  <div style="margin-bottom:16px">
    <p style="margin:0;font-weight:bold;font-size:14px">Partenaire : ${group.owner_name}</p>
    <p style="margin:4px 0 0;color:#666;font-size:12px">Période : ${fmtDate(startDate)} → ${fmtDate(endDate)}</p>
  </div>
  ${loftRows}
  <div style="margin-top:32px;border-top:1px solid #e5e7eb;padding-top:12px;display:flex;justify-content:space-between;font-size:11px;color:#9ca3af">
    <span>Loft Algérie — www.loftalgerie.com</span>
    <span>Signature : ___________________</span>
  </div>
  <script>window.onload=function(){window.print()}</script>
</body></html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (win) { win.document.write(html); win.document.close() }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Du</Label>
              <Input type="date" value={startDate} onChange={e => {
                const v = e.target.value; setStartDate(v)
                if (v) { const d = new Date(v + 'T00:00:00'); setEndDate(format(endOfMonth(d), 'yyyy-MM-dd')) }
              }} className="h-9 w-[145px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Au</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 w-[145px]" />
            </div>
            {/* Partner filter */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Partenaire</Label>
              <Popover open={ownerPopover} onOpenChange={o => { setOwnerPopover(o); if (!o) setOwnerSearch('') }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 min-w-[180px] justify-between font-normal text-sm">
                    <span className="truncate">{selectedOwner === 'all' ? 'Tous les partenaires' : data?.byOwner?.find((g: any) => g.owner_id === selectedOwner)?.owner_name || 'Tous'}</span>
                    <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-50" />
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
                    <button className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent ${selectedOwner === 'all' ? 'bg-accent font-medium' : ''}`}
                      onClick={() => { setSelectedOwner('all'); setOwnerPopover(false) }}>Tous</button>
                    {(data?.byOwner || []).filter((g: any) => g.owner_name.toLowerCase().includes(ownerSearch.toLowerCase())).map((g: any) => (
                      <button key={g.owner_id} className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent ${selectedOwner === g.owner_id ? 'bg-accent font-medium' : ''}`}
                        onClick={() => { setSelectedOwner(g.owner_id); setOwnerPopover(false) }}>{g.owner_name}</button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {selectedOwner !== 'all' && (
              <Button size="sm" variant="ghost" className="h-9 mt-5 text-gray-400" onClick={() => setSelectedOwner('all')}><X className="h-4 w-4" /></Button>
            )}
            <Button size="sm" onClick={fetchData} disabled={loading} className="h-9 mt-5">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && <div className="text-center text-gray-400 py-8 animate-pulse">Chargement...</div>}

      {!loading && visibleOwners.length === 0 && <div className="text-center text-gray-400 py-8">Aucune donnée pour cette période</div>}

      {/* Per owner */}
      {visibleOwners.map((group: any) => (
        <Card key={group.owner_id} className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90">
          <div
            className="flex items-center justify-between px-6 py-4 cursor-pointer bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-700 dark:to-gray-800 rounded-t-xl"
            onClick={() => toggleExpand(group.owner_id)}
          >
            <div className="flex items-center gap-3">
              {expanded.has(group.owner_id) ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
              <User className="h-5 w-5 text-purple-600" />
              <span className="font-bold text-lg">{group.owner_name}</span>
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{group.lofts.length} loft{group.lofts.length > 1 ? 's' : ''}</span>
            </div>
            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs"
              onClick={e => { e.stopPropagation(); handlePrint(group) }}>
              <Printer className="h-3.5 w-3.5" /> Imprimer
            </Button>
          </div>

          {expanded.has(group.owner_id) && (
            <CardContent className="p-4 space-y-6">
              {group.lofts.map((loft: any) => (
                <div key={loft.loft_id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-700/50 px-4 py-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-sm">{loft.loft_name}</span>
                    <span className="text-xs text-gray-500 ml-auto">% Partenaire : {loft.owner_percentage}%</span>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Per currency */}
                    {loft.currencies.map((c: any) => (
                      <div key={c.currency} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">💱 {c.currency}</span>
                        </div>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/30 text-gray-500">
                              <th className="text-left p-2">Date</th>
                              <th className="text-left p-2">Description</th>
                              <th className="text-left p-2">Catégorie</th>
                              <th className="text-right p-2">Montant</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {c.entries.map((e: any, i: number) => (
                              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                                <td className="p-2 text-gray-500">{fmtDate(e.date)}</td>
                                <td className="p-2">{e.description}</td>
                                <td className="p-2 text-gray-500">{e.category}</td>
                                <td className="p-2 text-right text-green-600 font-medium">+{fmtAmt(e.amount, c.currency)}</td>
                              </tr>
                            ))}
                            {/* Expenses shown under DZD */}
                            {c.currency === 'DZD' && loft.expenses.map((e: any, i: number) => (
                              <tr key={`exp-${i}`} className="bg-red-50/40 dark:bg-red-900/10">
                                <td className="p-2 text-gray-500">{fmtDate(e.date)}</td>
                                <td className="p-2">{e.description}</td>
                                <td className="p-2 text-gray-500">{e.category}</td>
                                <td className="p-2 text-right text-red-600 font-medium">-{fmtAmt(e.amount, 'DZD')}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-amber-50 dark:bg-amber-900/20 font-semibold text-xs">
                              <td colSpan={3} className="p-2 text-amber-700 dark:text-amber-300">
                                {fmtAmt(c.total_income, c.currency)} × {loft.owner_percentage}% = {fmtAmt(c.owner_gross, c.currency)}
                                {c.currency === 'DZD' && loft.total_expense_dzd > 0 && ` − ${fmtAmt(loft.total_expense_dzd, 'DZD')}`}
                              </td>
                              <td className="p-2 text-right text-amber-700 dark:text-amber-300">
                                Dû : {fmtAmt(c.owner_due, c.currency)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ))}

                    {/* Expenses only loft (no income) */}
                    {loft.currencies.length === 0 && loft.expenses.length > 0 && (
                      <div className="text-xs text-gray-500 italic">Dépenses uniquement — aucun revenu ce mois</div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}
