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

  // Form state
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
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

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) { toast.error('Montant invalide'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/reservations/${reservationId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), payment_method: method, reference, payment_date: paymentDate, notes }),
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
            const m = getMethod(p.payment_method)
            const Icon = m.icon
            return (
              <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border ${m.color}`}>
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-full bg-white/80">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{fmt(p.amount)}</span>
                      <span className="text-xs opacity-70">• {m.label}</span>
                      {p.reference && <span className="text-xs opacity-60">#{p.reference}</span>}
                    </div>
                    <div className="text-xs opacity-60">
                      {new Date(p.payment_date).toLocaleDateString('fr-FR')}
                      {p.notes && ` • ${p.notes}`}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-60 hover:opacity-100 hover:text-red-600"
                  onClick={() => handleDelete(p.id)}>
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
          </div>
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
        <Button variant="outline" size="sm" className="w-full gap-2 border-dashed" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Ajouter un paiement
        </Button>
      )}
    </div>
  )
}
