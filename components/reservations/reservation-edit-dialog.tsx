'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { toast } from 'sonner'

interface ReservationEditDialogProps {
  reservation: {
    id: string
    loft_id: string
    check_in_date: string
    check_out_date: string
    base_price?: number
    cleaning_fee?: number
    service_fee?: number
    taxes?: number
    total_amount?: number
    guest_name?: string
    lofts?: { name: string }
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ReservationEditDialog({ reservation, open, onOpenChange, onSuccess }: ReservationEditDialogProps) {
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [basePrice, setBasePrice] = useState<number | ''>(0)
  const [cleaningFee, setCleaningFee] = useState<number | ''>(0)
  const [serviceFee, setServiceFee] = useState<number | ''>(0)
  const [taxes, setTaxes] = useState<number | ''>(0)
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAvail, setCheckingAvail] = useState(false)
  const [availOk, setAvailOk] = useState<boolean | null>(null)

  // Populate form when reservation changes
  useEffect(() => {
    if (reservation) {
      setCheckIn(reservation.check_in_date)
      setCheckOut(reservation.check_out_date)
      setBasePrice(reservation.base_price ?? 0)
      setCleaningFee(reservation.cleaning_fee ?? 0)
      setServiceFee(reservation.service_fee ?? 0)
      setTaxes(reservation.taxes ?? 0)
      setError('')
      setAvailOk(null)
    }
  }, [reservation])

  // Recalculate total
  useEffect(() => {
    const t = (Number(basePrice) || 0) + (Number(cleaningFee) || 0) + (Number(serviceFee) || 0) + (Number(taxes) || 0)
    setTotal(t)
  }, [basePrice, cleaningFee, serviceFee, taxes])

  // Check availability when dates change
  useEffect(() => {
    if (!reservation || !checkIn || !checkOut || checkIn === reservation.check_in_date && checkOut === reservation.check_out_date) {
      setAvailOk(null)
      return
    }
    const check = async () => {
      setCheckingAvail(true)
      setAvailOk(null)
      try {
        const res = await fetch(`/api/availability?loft_id=${reservation.loft_id}&check_in_date=${checkIn}&check_out_date=${checkOut}`)
        const data = await res.json()
        // availability check doesn't know about current reservation — conflicts handled server-side
        setAvailOk(data.available !== false)
      } catch {
        setAvailOk(null)
      } finally {
        setCheckingAvail(false)
      }
    }
    const timer = setTimeout(check, 600)
    return () => clearTimeout(timer)
  }, [checkIn, checkOut, reservation])

  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reservation) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/patch`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          check_in_date: checkIn,
          check_out_date: checkOut,
          base_price: Number(basePrice) || 0,
          cleaning_fee: Number(cleaningFee) || 0,
          service_fee: Number(serviceFee) || 0,
          taxes: Number(taxes) || 0,
          total_amount: total,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Erreur lors de la modification')
      } else {
        toast.success('Réservation modifiée avec succès')
        onOpenChange(false)
        onSuccess()
      }
    } catch {
      setError('Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  if (!reservation) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Modifier la réservation
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {reservation.lofts?.name} — {reservation.guest_name}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Arrivée</Label>
              <Input
                type="date"
                value={checkIn}
                onChange={(e) => { setCheckIn(e.target.value); setAvailOk(null) }}
                min={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Départ</Label>
              <Input
                type="date"
                value={checkOut}
                onChange={(e) => { setCheckOut(e.target.value); setAvailOk(null) }}
                min={checkIn ? format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd') : undefined}
                required
              />
            </div>
          </div>

          {/* Nights + availability indicator */}
          <div className="flex items-center gap-3 text-sm">
            {nights > 0 && <span className="text-muted-foreground">{nights} nuit{nights > 1 ? 's' : ''}</span>}
            {checkingAvail && <span className="flex items-center gap-1 text-blue-600"><Loader2 className="h-3 w-3 animate-spin" /> Vérification...</span>}
            {availOk === true && <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3 w-3" /> Disponible</span>}
            {availOk === false && <span className="flex items-center gap-1 text-red-600"><AlertCircle className="h-3 w-3" /> Dates non disponibles</span>}
          </div>

          {/* Pricing */}
          <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
            <p className="text-sm font-medium text-gray-700">Tarification (DA)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Prix de base</Label>
                <Input type="number" min="0" value={String(basePrice)} onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Frais de nettoyage</Label>
                <Input type="number" min="0" value={String(cleaningFee)} onChange={(e) => setCleaningFee(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Frais de service</Label>
                <Input type="number" min="0" value={String(serviceFee)} onChange={(e) => setServiceFee(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Taxes</Label>
                <Input type="number" min="0" value={String(taxes)} onChange={(e) => setTaxes(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t font-semibold">
              <span>Total</span>
              <span className="text-blue-700">{total.toLocaleString()} DA</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || availOk === false}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement...</> : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
