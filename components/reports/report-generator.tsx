'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { RefreshCw, Printer, FileText, ChevronDown, Search, Building2, User, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

export function ReportGenerator() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  // Partner filter
  const [selectedOwner, setSelectedOwner] = useState<string>('all')
  const [ownerSearch, setOwnerSearch] = useState('')
  const [ownerPopoverOpen, setOwnerPopoverOpen] = useState(false)

  // Report type
  const [reportType, setReportType] = useState<'partner' | 'global'>('partner')

  const fmt = (n: number) => n.toLocaleString('fr-DZ') + ' DA'
  const fmtDate = (d: string) => { try { return format(new Date(d), 'dd/MM/yyyy', { locale: fr }) } catch { return d } }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/partner-due?startDate=${startDate}&endDate=${endDate}`)
      const json = await res.json()
      if (json.byOwner) setData(json)
      else toast.error(json.error || 'Erreur de chargement')
    } catch { toast.error('Erreur réseau') }
    setLoading(false)
  }, [startDate, endDate])

  useEffect(() => { fetchData() }, [fetchData])

  const byOwner: any[] = data?.byOwner || []
  const allLofts: any[] = data?.lofts || []

  const visibleOwners = selectedOwner === 'all' ? byOwner : byOwner.filter((g: any) => g.owner_id === selectedOwner)

  // Grand totals
  const grandIncome = allLofts.reduce((s: number, l: any) => s + l.total_income, 0)
  const grandExpense = allLofts.reduce((s: number, l: any) => s + l.total_expense, 0)
  const grandOwnerDue = allLofts.reduce((s: number, l: any) => s + l.owner_due, 0)
  const grandCompanyDue = allLofts.reduce((s: number, l: any) => s + l.company_due, 0)

  // ─── PDF GENERATION ───────────────────────────────────────────────────────

  const generatePDF = (groups: any[], title: string) => {
    const periodLabel = `${fmtDate(startDate)} → ${fmtDate(endDate)}`

    const ownerSections = groups.map((group: any) => {
      const activeLofts = group.lofts.filter((l: any) => l.total_income > 0 || l.total_expense > 0)

      const loftRows = activeLofts.map((loft: any) => {
        const txRows = loft.transactions.length > 0
          ? loft.transactions.map((tx: any) => {
              const isExp = tx.type === 'expense'
              return `<tr style="background:${isExp ? '#fef2f2' : ''}">
                <td style="padding:4px 8px;border:1px solid #e5e7eb">${fmtDate(tx.date)}</td>
                <td style="padding:4px 8px;border:1px solid #e5e7eb">${tx.description || '-'}</td>
                <td style="padding:4px 8px;border:1px solid #e5e7eb">${tx.category || '-'}</td>
                <td style="padding:4px 8px;text-align:center;border:1px solid #e5e7eb">
                  <span style="font-size:10px;padding:1px 6px;border-radius:9999px;background:${isExp ? '#fee2e2' : '#dcfce7'};color:${isExp ? '#dc2626' : '#16a34a'};font-weight:bold">
                    ${isExp ? 'Dépense' : 'Revenu'}
                  </span>
                </td>
                <td style="padding:4px 8px;text-align:right;border:1px solid #e5e7eb;color:${isExp ? '#dc2626' : '#16a34a'};font-weight:500">
                  ${isExp ? '-' : '+'}${fmt(tx.amount)}
                </td>
              </tr>`
            }).join('')
          : `<tr><td colspan="5" style="padding:8px;color:#9ca3af;text-align:center;border:1px solid #e5e7eb">Aucune transaction</td></tr>`

        const ownerGross = Math.round(loft.total_income * loft.owner_percentage / 100)
        const ownerNet = Math.max(0, ownerGross - loft.total_expense)

        return `
          <div style="margin-bottom:20px">
            <h4 style="font-size:13px;font-weight:bold;background:#f3f4f6;padding:6px 10px;margin:0 0 6px;border-radius:4px;border-left:3px solid #3b82f6">
              🏠 ${loft.loft_name} &nbsp;|&nbsp; Part partenaire : ${loft.owner_percentage}%
            </h4>
            <table style="width:100%;border-collapse:collapse;font-size:11px">
              <thead>
                <tr style="background:#e5e7eb">
                  <th style="padding:5px 8px;text-align:left;border:1px solid #d1d5db">Date</th>
                  <th style="padding:5px 8px;text-align:left;border:1px solid #d1d5db">Description</th>
                  <th style="padding:5px 8px;text-align:left;border:1px solid #d1d5db">Catégorie</th>
                  <th style="padding:5px 8px;text-align:center;border:1px solid #d1d5db">Type</th>
                  <th style="padding:5px 8px;text-align:right;border:1px solid #d1d5db">Montant</th>
                </tr>
              </thead>
              <tbody>${txRows}</tbody>
              <tfoot>
                <tr style="background:#f9fafb;font-size:10px;color:#6b7280">
                  <td colspan="4" style="padding:4px 8px;border:1px solid #e5e7eb">
                    Revenus : +${fmt(loft.total_income)} × ${loft.owner_percentage}% = ${fmt(ownerGross)}
                    &nbsp;|&nbsp; Dépenses : -${fmt(loft.total_expense)}
                  </td>
                  <td style="padding:4px 8px;text-align:right;border:1px solid #e5e7eb;font-weight:bold;color:#d97706">${fmt(ownerGross)}</td>
                </tr>
                <tr style="background:#fef3c7;font-weight:bold">
                  <td colspan="4" style="padding:5px 8px;border:1px solid #d1d5db;font-size:11px">
                    Dû partenaire = ${fmt(ownerGross)} − ${fmt(loft.total_expense)}
                  </td>
                  <td style="padding:5px 8px;text-align:right;border:1px solid #d1d5db;color:#d97706;font-size:13px">${fmt(ownerNet)}</td>
                </tr>
              </tfoot>
            </table>
          </div>`
      }).join('')

      const totalIncome = activeLofts.reduce((s: number, l: any) => s + l.total_income, 0)
      const totalExpense = activeLofts.reduce((s: number, l: any) => s + l.total_expense, 0)
      const totalOwnerDue = activeLofts.reduce((s: number, l: any) => s + l.owner_due, 0)
      const totalCompanyDue = activeLofts.reduce((s: number, l: any) => s + l.company_due, 0)

      return `
        <div style="page-break-inside:avoid;margin-bottom:36px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);color:white;padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <h3 style="margin:0;font-size:15px;font-weight:bold">👤 ${group.owner_name}</h3>
              <p style="margin:2px 0 0;font-size:11px;opacity:0.8">${activeLofts.length} appartement${activeLofts.length > 1 ? 's' : ''} actif${activeLofts.length > 1 ? 's' : ''}</p>
            </div>
            <div style="text-align:right;font-size:12px">
              <p style="margin:0;opacity:0.8">Dû partenaire</p>
              <p style="margin:0;font-size:18px;font-weight:bold">${fmt(totalOwnerDue)}</p>
            </div>
          </div>
          <div style="padding:16px">
            ${loftRows}
            <div style="border-top:2px solid #e5e7eb;padding-top:12px;margin-top:4px">
              <table style="width:100%;font-size:12px">
                <tr>
                  <td style="padding:3px 0;color:#16a34a">Total revenus</td>
                  <td style="text-align:right;color:#16a34a;font-weight:600">+${fmt(totalIncome)}</td>
                </tr>
                <tr>
                  <td style="padding:3px 0;color:#dc2626">Total dépenses</td>
                  <td style="text-align:right;color:#dc2626;font-weight:600">-${fmt(totalExpense)}</td>
                </tr>
                <tr style="border-top:1px solid #e5e7eb">
                  <td style="padding:6px 0;font-weight:bold;color:#d97706;font-size:13px">Dû partenaire</td>
                  <td style="text-align:right;font-weight:bold;color:#d97706;font-size:15px">${fmt(totalOwnerDue)}</td>
                </tr>
                <tr>
                  <td style="padding:3px 0;color:#059669;font-size:11px">Part société</td>
                  <td style="text-align:right;color:#059669;font-size:11px">${fmt(totalCompanyDue)}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>`
    }).join('')

    // Grand total section (only for global report)
    const grandSection = groups.length > 1 ? `
      <div style="border:2px solid #1e3a5f;border-radius:8px;padding:16px;margin-top:24px;background:#f8fafc">
        <h3 style="margin:0 0 12px;font-size:14px;font-weight:bold;color:#1e3a5f">RÉCAPITULATIF GLOBAL</h3>
        <table style="width:100%;font-size:13px">
          <tr>
            <td style="padding:4px 0;color:#16a34a">Total revenus</td>
            <td style="text-align:right;color:#16a34a;font-weight:bold">+${fmt(groups.reduce((s: number, g: any) => s + g.lofts.reduce((ss: number, l: any) => ss + l.total_income, 0), 0))}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#dc2626">Total dépenses</td>
            <td style="text-align:right;color:#dc2626;font-weight:bold">-${fmt(groups.reduce((s: number, g: any) => s + g.lofts.reduce((ss: number, l: any) => ss + l.total_expense, 0), 0))}</td>
          </tr>
          <tr style="border-top:2px solid #1e3a5f">
            <td style="padding:8px 0;font-weight:bold;color:#d97706;font-size:15px">Total dû partenaires</td>
            <td style="text-align:right;font-weight:bold;color:#d97706;font-size:18px">${fmt(groups.reduce((s: number, g: any) => s + g.total_owner_due, 0))}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#059669">Total part société</td>
            <td style="text-align:right;color:#059669;font-weight:bold">${fmt(groups.reduce((s: number, g: any) => s + g.total_company_due, 0))}</td>
          </tr>
        </table>
      </div>` : ''

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 28px; max-width: 820px; margin: 0 auto; color: #111; font-size: 12px; }
    @media print {
      body { padding: 12px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="border-bottom:2px solid #1e3a5f;padding-bottom:14px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-end">
    <div>
      <h1 style="font-size:20px;font-weight:bold;margin:0;color:#1e3a5f">Loft Algérie</h1>
      <h2 style="font-size:14px;color:#555;margin:3px 0 0;font-weight:normal">${title}</h2>
    </div>
    <div style="text-align:right;font-size:11px;color:#666">
      <p style="margin:0">Période : <strong>${periodLabel}</strong></p>
      <p style="margin:2px 0 0">Imprimé le : ${format(new Date(), 'dd/MM/yyyy')}</p>
    </div>
  </div>

  <!-- Note cutover -->
  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:8px 12px;margin-bottom:20px;font-size:11px;color:#1d4ed8">
    ℹ️ <strong>Méthode de calcul :</strong> Revenus basés sur les réservations avec prorata (à partir d'avril 2026) ou transactions (avant avril 2026). Dépenses basées sur les transactions de la période.
  </div>

  ${ownerSections}
  ${grandSection}

  <!-- Footer -->
  <div style="margin-top:40px;border-top:1px solid #e5e7eb;padding-top:12px;display:flex;justify-content:space-between;font-size:10px;color:#9ca3af">
    <span>Loft Algérie — www.loftalgerie.com</span>
    <span>Signature : ___________________</span>
  </div>

  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (win) { win.document.write(html); win.document.close() }
    else toast.error('Popup bloqué — autorisez les popups pour ce site')
  }

  const handlePrintPartner = (group: any) => generatePDF([group], `Rapport Partenaire — ${group.owner_name}`)
  const handlePrintGlobal = () => generatePDF(byOwner, 'Rapport Global — Tous les partenaires')
  const handlePrintFiltered = () => {
    if (selectedOwner === 'all') handlePrintGlobal()
    else {
      const group = byOwner.find((g: any) => g.owner_id === selectedOwner)
      if (group) handlePrintPartner(group)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-0 shadow-lg bg-white/80">
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

            {/* Partner filter */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Partenaire</Label>
              <Popover open={ownerPopoverOpen} onOpenChange={open => { setOwnerPopoverOpen(open); if (!open) setOwnerSearch('') }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 min-w-[200px] justify-between font-normal">
                    <span className="truncate">
                      {selectedOwner === 'all' ? 'Tous les partenaires' : byOwner.find((g: any) => g.owner_id === selectedOwner)?.owner_name || 'Tous'}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0" align="start">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input placeholder="Rechercher..." value={ownerSearch} onChange={e => setOwnerSearch(e.target.value)} className="h-8 pl-7 text-sm" autoFocus />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-1">
                    <button className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent ${selectedOwner === 'all' ? 'bg-accent font-medium' : ''}`}
                      onClick={() => { setSelectedOwner('all'); setOwnerPopoverOpen(false) }}>
                      Tous les partenaires
                    </button>
                    {byOwner.filter((g: any) => g.owner_name.toLowerCase().includes(ownerSearch.toLowerCase())).map((g: any) => (
                      <button key={g.owner_id} className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-accent ${selectedOwner === g.owner_id ? 'bg-accent font-medium' : ''}`}
                        onClick={() => { setSelectedOwner(g.owner_id); setOwnerPopoverOpen(false) }}>
                        {g.owner_name}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Print button */}
            <Button onClick={handlePrintFiltered} disabled={loading || byOwner.length === 0} className="h-9 bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Printer className="h-4 w-4" />
              {selectedOwner === 'all' ? 'Imprimer tout' : 'Imprimer ce partenaire'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <p className="text-green-100 text-xs flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Revenus totaux</p>
            <p className="text-xl font-bold mt-1">{fmt(grandIncome)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-600 text-white">
          <CardContent className="p-4">
            <p className="text-red-100 text-xs flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Dépenses totales</p>
            <p className="text-xl font-bold mt-1">{fmt(grandExpense)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <CardContent className="p-4">
            <p className="text-amber-100 text-xs flex items-center gap-1"><User className="h-3 w-3" /> Dû partenaires</p>
            <p className="text-xl font-bold mt-1">{fmt(grandOwnerDue)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardContent className="p-4">
            <p className="text-blue-100 text-xs flex items-center gap-1"><Building2 className="h-3 w-3" /> Part société</p>
            <p className="text-xl font-bold mt-1">{fmt(grandCompanyDue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Per partner list */}
      {loading && <div className="text-center py-12 text-gray-400">Chargement...</div>}

      {!loading && visibleOwners.length === 0 && (
        <div className="text-center py-12 text-gray-400">Aucune donnée pour cette période</div>
      )}

      {!loading && visibleOwners.map((group: any) => {
        const activeLofts = group.lofts.filter((l: any) => l.total_income > 0 || l.total_expense > 0)
        return (
          <Card key={group.owner_id} className="border-0 shadow-lg bg-white/90">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-base">{group.owner_name}</CardTitle>
                  <Badge variant="outline" className="text-xs">{activeLofts.length} appart{activeLofts.length > 1 ? 's' : ''}</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-amber-600">Dû partenaire</p>
                    <p className="font-bold text-amber-700">{fmt(group.total_owner_due)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-600">Part société</p>
                    <p className="font-bold text-emerald-700">{fmt(group.total_company_due)}</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => handlePrintPartner(group)}>
                    <Printer className="h-3.5 w-3.5" /> PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-gray-100">
                {activeLofts.map((loft: any) => (
                  <div key={loft.loft_id} className="flex items-center justify-between py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-blue-500" />
                      <span className="font-medium">{loft.loft_name}</span>
                      <span className="text-xs text-gray-400">{loft.owner_percentage}%</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-green-600">+{fmt(loft.total_income)}</span>
                      {loft.total_expense > 0 && <span className="text-red-500">-{fmt(loft.total_expense)}</span>}
                      <span className="font-bold text-amber-700">{fmt(loft.owner_due)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Info note */}
      <div className="text-xs text-gray-400 text-center pt-2">
        💡 Cliquez sur "PDF" pour imprimer le rapport d'un partenaire, ou "Imprimer tout" pour tous les partenaires. Utilisez Ctrl+P dans la fenêtre qui s'ouvre.
      </div>
    </div>
  )
}
