'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, Trash2, CreditCard, Banknote, Building2, Smartphone, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

const PAYMENT_METHODS = [
  { value: 'cash',     label: 'Espèces',          icon: Banknote,    color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'ccp',      label: 'CCP',              icon: CreditCard,  color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'virement', label: 'Virement bancaire', icon: Building2,   color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { value: 'paypal',   label: 'PayPal',            icon: Smartphone,  color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { value: 'cheque',   label: 'Chèque',            icon: CreditCard,  color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { value: 'baridi',   label: 'Baridi Mob',        icon: Smartphone,  color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { value: 'autre',    label: 'Autre',             icon: CreditCard,  color: 'text-gray-600 bg-gray-50 border-gray-200' },
]

interface Payment {
  id: string
  amount: number
  payment_method: string
  reference?: string
  payment_date: string
  notes?: string
}

interface PaymentSummary {
  total_due: number
  total_paid: number
  balance: number
  is_fully_paid: boolean
}

interface ReservationPaymentsProps {
  reservationId: string
  totalAmount: number
  currency?: string
  onUpdate?: () => void
}

export function ReservationPayments({ reservationId, totalAmount, currency = 'DA', onUpdate }: ReservationPaymentsProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({})

  // Form state
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [payCurrency, setPayCurrency] = useState('DZD')
  const [amountDZD, setAmountDZD] = useState('') // equivalent in DZD if foreign currency
  const [reference, setReference] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}/payments`)
      const data = await res.json()
      if (data.payments) {
        setPayments(data.payments)
        setSummary(data.summary)
      }
    } catch {}
    setLoading(false)
  }, [reservationId])

  useEffect(() => {
    fetchPayments()
    // Load currency rates
    fetch('/api/currencies')
      .then(r => r.json())
      .then(data => {
        const rates: Record<string, number> = {}
        ;(data.currencies || data || []).forEach((c: any) => { rates[c.code] = Number(c.ratio) || 1 })
        setCurrencyRates(rates)
      })
      .catch(() => {})
  }, [fetchPayments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) { toast.error('Montant invalide'); return }
    setSubmitting(true)
    try {
      // amount = original amount in payCurrency
      // amountDZD = DZD equivalent (required if foreign currency)
      const originalAmt = Number(amount)
      const dzdAmt = payCurrency === 'DZD'
        ? originalAmt
        : amountDZD ? Number(amountDZD)
        : currencyRates[payCurrency] ? Math.round(originalAmt * currencyRates[payCurrency])
        : originalAmt

      const res = await fetch(`/api/reservations/${reservationId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: dzdAmt,                    // stored in DZD
          original_amount: originalAmt,      // original currency amount
          original_currency: payCurrency,
          payment_method: method,
          currency: payCurrency,
          reference: reference || null,
          payment_date: paymentDate,
          notes,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Paiement enregistré')
        setAmount(''); setReference(''); setNotes(''); setShowForm(false)
        fetchPayments()
        onUpdate?.()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch { toast.error('Erreur réseau') }
    setSubmitting(false)
  }

  const handleDelete = async (paymentId: string) => {
    if (!confirm('Supprimer ce paiement ?')) return
    try {
      const res = await fetch(`/api/reservations/${reservationId}/payments?paymentId=${paymentId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { toast.success('Paiement supprimé'); fetchPayments(); onUpdate?.() }
      else toast.error(data.error || 'Erreur')
    } catch { toast.error('Erreur réseau') }
  }

  const fmt = (n: number) => n.toLocaleString('fr-DZ') + ' ' + currency
  const getMethod = (v: string) => PAYMENT_METHODS.find(m => m.value === v) || PAYMENT_METHODS[PAYMENT_METHODS.length - 1]

  // Map DB fields to display fields
  const mapPayment = (p: any) => {
    const origCurrency = p.original_currency || p.currency || 'DZD'
    const origAmount = p.original_amount != null ? Number(p.original_amount) : Number(p.amount)
    const dzdAmount = Number(p.amount) // always stored in DZD

    // Parse legacy reference format "40 USD" → extract amount
    let displayRef = p.transaction_id || p.reference || null
    if (displayRef && /^\d+(\.\d+)?\s+[A-Z]{3}$/.test(displayRef)) {
      // Legacy format like "40 USD" — don't show as reference, it's already in original_amount
      displayRef = null
    }

    return {
      id: p.id,
      amount: origAmount,
      amount_dzd: dzdAmount,
      payment_method: p.payment_method,
      currency: origCurrency,
      reference: displayRef,
      payment_date: p.processed_at || p.created_at,
      notes: p.processor_response || p.notes,
    }
  }

  if (loading) return <div className="text-sm text-gray-400 py-2">Chargement des paiements...</div>

  const balanceColor = !summary ? '' : summary.balance <= 0 ? 'text-green-600' : summary.balance < totalAmount * 0.5 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center border">
            <p className="text-xs text-gray-500 mb-1">Total dû</p>
            <p className="font-bold text-gray-900">{fmt(summary.total_due)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
            <p className="text-xs text-green-600 mb-1">Payé</p>
            <p className="font-bold text-green-700">{fmt(summary.total_paid)}</p>
          </div>
          <div className={`rounded-lg p-3 text-center border ${summary.balance <= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-xs mb-1 ${summary.balance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.balance <= 0 ? 'Soldé' : 'Reste'}
            </p>
            <p className={`font-bold ${balanceColor}`}>
              {summary.balance <= 0 ? '✓ 0 ' + currency : fmt(summary.balance)}
            </p>
          </div>
        </div>
      )}

      {/* Status badge */}
      {summary && (
        <div className="flex items-center gap-2">
          {summary.is_fully_paid ? (
            <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
              <CheckCircle2 className="h-3 w-3" /> Entièrement payé
            </Badge>
          ) : summary.total_paid > 0 ? (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1">
              <Clock className="h-3 w-3" /> Paiement partiel
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800 border-red-200 gap-1">
              <AlertCircle className="h-3 w-3" /> Non payé
            </Badge>
          )}
        </div>
      )}

      {/* Payments list */}
      {payments.length > 0 && (
        <div className="space-y-2">
          {payments.map(p => {
            const mapped = mapPayment(p)
            const m = getMethod(mapped.payment_method)
            const Icon = m.icon
            return (
              <div key={mapped.id} className={`flex items-center justify-between p-3 rounded-lg border ${m.color}`}>
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-full bg-white/80">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{mapped.amount.toLocaleString('fr-DZ')} {mapped.currency}</span>
                      {mapped.currency !== 'DZD' && mapped.amount_dzd && (
                        <span className="text-xs opacity-50">≈ {mapped.amount_dzd.toLocaleString('fr-DZ')} DA</span>
                      )}
                      <span className="text-xs opacity-70">• {m.label}</span>
                      {mapped.reference && <span className="text-xs opacity-60">#{mapped.reference}</span>}
                    </div>
                    <div className="text-xs opacity-60">
                      {mapped.payment_date ? new Date(mapped.payment_date).toLocaleDateString('fr-FR') : ''}
                      {mapped.notes && ` • ${mapped.notes}`}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-60 hover:opacity-100 hover:text-red-600"
                  onClick={() => handleDelete(mapped.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {payments.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 text-center py-2">Aucun paiement enregistré</p>
      )}

      {/* Add payment form */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Montant ({currency})</Label>
              <Input type="number" min="1" step="any" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="Ex: 5000" className="h-9" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mode de paiement</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      <div className="flex items-center gap-2">
                        <m.icon className="h-3.5 w-3.5" />
                        {m.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Devise</Label>
              <Select value={payCurrency} onValueChange={setPayCurrency}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DZD">🇩🇿 DZD</SelectItem>
                  <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
                  <SelectItem value="USD">🇺🇸 USD</SelectItem>
                  <SelectItem value="GBP">🇬🇧 GBP</SelectItem>
                  <SelectItem value="CAD">🇨🇦 CAD</SelectItem>
                  <SelectItem value="CHF">🇨🇭 CHF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Show DZD equivalent field when foreign currency */}
          {payCurrency !== 'DZD' && amount && currencyRates[payCurrency] && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm">
              <p className="text-amber-800 font-medium">
                {amount} {payCurrency} = <strong>{Math.round(Number(amount) * currencyRates[payCurrency]).toLocaleString('fr-DZ')} DA</strong>
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Taux officiel : 1 {payCurrency} = {currencyRates[payCurrency]} DA
                {amountDZD && Number(amountDZD) !== Math.round(Number(amount) * currencyRates[payCurrency]) && (
                  <span> • Taux personnalisé : {(Number(amountDZD) / Number(amount)).toFixed(2)} DA</span>
                )}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Label className="text-xs text-amber-700">Modifier le taux :</Label>
                <Input type="number" min="0" step="any" value={amountDZD}
                  onChange={e => setAmountDZD(e.target.value)}
                  placeholder={String(Math.round(Number(amount) * currencyRates[payCurrency]))}
                  className="h-7 w-28 text-xs bg-white" />
                <span className="text-xs text-amber-600">DA</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Date du paiement</Label>
              <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Référence (optionnel)</Label>
              <Input value={reference} onChange={e => setReference(e.target.value)}
                placeholder="N° CCP, virement..." className="h-9" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes (optionnel)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="text-sm resize-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button type="submit" size="sm" disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white">
              {submitting ? 'Enregistrement...' : 'Enregistrer le paiement'}
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" className="w-full gap-2 border-dashed" onClick={() => {
          setShowForm(true)
          // Pre-fill with remaining balance
          if (summary && summary.balance > 0) setAmount(String(summary.balance))
          else if (!summary) setAmount(String(totalAmount))
        }}>
          <Plus className="h-4 w-4" />
          Ajouter un paiement
        </Button>
      )}
    </div>
  )
}
