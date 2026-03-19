'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { toast } from 'sonner'

interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  ratio: number
  is_default: boolean
}

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
    currency_code?: string
    currency_ratio?: number
    price_per_night_input?: number
    lofts?: { name: string }
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ReservationEditDialog({ reservation, open, onOpenChange, onSuccess }: ReservationEditDialogProps) {
  const t = useTranslations('reservations')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [pricePerNight, setPricePerNight] = useState<number | ''>('')
  const [basePrice, setBasePrice] = useState<number | ''>(0)
  const [cleaningFee, setCleaningFee] = useState<number | ''>(0)
  const [serviceFee, setServiceFee] = useState<number | ''>(0)
  const [taxes, setTaxes] = useState<number | ''>(0)
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAvail, setCheckingAvail] = useState(false)
  const [availOk, setAvailOk] = useState<boolean | null>(null)

  // Currency state
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState('DZD')
  const [customRatio, setCustomRatio] = useState<number | ''>(1)

  const selectedCurrency = currencies.find(c => c.code === selectedCurrencyCode)
  const isDefaultCurrency = !selectedCurrency || selectedCurrency.is_default
  const effectiveRatio = Number(customRatio) || selectedCurrency?.ratio || 1

  const toDA = (amount: number) => {
    if (isDefaultCurrency) return amount
    return Math.round(amount * effectiveRatio)
  }

  // Fetch currencies on mount
  useEffect(() => {
    fetch('/api/currencies')
      .then(r => r.json())
      .then(data => {
        const list: Currency[] = data.currencies || data || []
        setCurrencies(list)
      })
      .catch(() => {})
  }, [])

  // Populate form when reservation changes
  useEffect(() => {
    if (!reservation || !open) return
    setCheckIn(reservation.check_in_date)
    setCheckOut(reservation.check_out_date)
    setError('')
    setAvailOk(null)

    // Restore original currency if stored
    const origCode = reservation.currency_code || 'DZD'
    const origRatio = reservation.currency_ratio || 1
    setSelectedCurrencyCode(origCode)
    setCustomRatio(origRatio)

    // If we have a stored per-night price, use it; otherwise derive from base_price / nights
    if (reservation.price_per_night_input) {
      setPricePerNight(reservation.price_per_night_input)
    } else {
      setPricePerNight('')
    }

    // Show amounts in original currency (divide by ratio to get back to foreign currency)
    const ratio = origRatio || 1
    const isDefault = origCode === 'DZD' || origCode === ''
    if (isDefault) {
      setBasePrice(reservation.base_price ?? 0)
      setCleaningFee(reservation.cleaning_fee ?? 0)
      setServiceFee(reservation.service_fee ?? 0)
      setTaxes(reservation.taxes ?? 0)
    } else {
      // Convert stored DA amounts back to original currency for display
      setBasePrice(reservation.base_price ? Math.round((reservation.base_price / ratio) * 100) / 100 : 0)
      setCleaningFee(reservation.cleaning_fee ? Math.round((reservation.cleaning_fee / ratio) * 100) / 100 : 0)
      setServiceFee(reservation.service_fee ? Math.round((reservation.service_fee / ratio) * 100) / 100 : 0)
      setTaxes(reservation.taxes ? Math.round((reservation.taxes / ratio) * 100) / 100 : 0)
    }
  }, [reservation, open])

  // Auto-calculate base price from per-night × nights
  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  useEffect(() => {
    if (pricePerNight !== '' && nights > 0) {
      setBasePrice(Number(pricePerNight) * nights)
    }
  }, [pricePerNight, nights])

  // Recalculate total
  useEffect(() => {
    const sum = (Number(basePrice) || 0) + (Number(cleaningFee) || 0) + (Number(serviceFee) || 0) + (Number(taxes) || 0)
    setTotal(sum)
  }, [basePrice, cleaningFee, serviceFee, taxes])

  // Check availability when dates change
  useEffect(() => {
    if (!reservation || !checkIn || !checkOut || (checkIn === reservation.check_in_date && checkOut === reservation.check_out_date)) {
      setAvailOk(null)
      return
    }
    const check = async () => {
      setCheckingAvail(true)
      setAvailOk(null)
      try {
        const res = await fetch(`/api/availability?loft_id=${reservation.loft_id}&check_in_date=${checkIn}&check_out_date=${checkOut}`)
        const data = await res.json()
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

  const totalDA = isDefaultCurrency ? total : toDA(total)

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
          base_price: toDA(Number(basePrice) || 0),
          cleaning_fee: toDA(Number(cleaningFee) || 0),
          service_fee: toDA(Number(serviceFee) || 0),
          taxes: toDA(Number(taxes) || 0),
          total_amount: totalDA,
          currency_code: selectedCurrency?.code || 'DZD',
          currency_ratio: effectiveRatio,
          price_per_night_input: pricePerNight !== '' ? Number(pricePerNight) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || t('edit.notAvailable'))
      } else {
        toast.success(t('edit.success'))
        onOpenChange(false)
        onSuccess()
      }
    } catch {
      setError(t('edit.notAvailable'))
    } finally {
      setLoading(false)
    }
  }

  if (!reservation) return null

  const sym = selectedCurrency?.symbol || 'DA'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            {t('edit.title')}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {reservation.lofts?.name} — {reservation.guest_name}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('edit.checkIn')}</Label>
              <Input type="date" value={checkIn} onChange={(e) => { setCheckIn(e.target.value); setAvailOk(null) }} min={format(new Date(), 'yyyy-MM-dd')} required />
            </div>
            <div className="space-y-2">
              <Label>{t('edit.checkOut')}</Label>
              <Input type="date" value={checkOut} onChange={(e) => { setCheckOut(e.target.value); setAvailOk(null) }} min={checkIn ? format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd') : undefined} required />
            </div>
          </div>

          {/* Nights + availability */}
          <div className="flex items-center gap-3 text-sm">
            {nights > 0 && <span className="text-muted-foreground">{nights} {nights > 1 ? t('edit.nights_plural', { count: nights }) : t('edit.nights', { count: nights })}</span>}
            {checkingAvail && <span className="flex items-center gap-1 text-blue-600"><Loader2 className="h-3 w-3 animate-spin" /> {t('edit.checking')}</span>}
            {availOk === true && <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3 w-3" /> {t('edit.available')}</span>}
            {availOk === false && <span className="flex items-center gap-1 text-red-600"><AlertCircle className="h-3 w-3" /> {t('edit.notAvailable')}</span>}
          </div>

          {/* Pricing */}
          <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
            {/* Header: label + currency selector */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">{t('edit.pricing')}</p>
              {currencies.length > 1 && (
                <Select value={selectedCurrencyCode} onValueChange={(code) => {
                  setSelectedCurrencyCode(code)
                  const cur = currencies.find(c => c.code === code)
                  setCustomRatio(cur?.ratio ?? 1)
                }}>
                  <SelectTrigger className="w-28 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(c => (
                      <SelectItem key={c.code} value={c.code} className="text-xs">
                        {c.symbol} {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Editable exchange rate */}
            {!isDefaultCurrency && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                <span className="text-xs text-amber-700 flex-1">1 {selectedCurrencyCode} =</span>
                <Input
                  type="number"
                  step="any"
                  value={customRatio === '' ? '' : String(customRatio)}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    setCustomRatio(isNaN(v) ? '' : v)
                  }}
                  onBlur={() => {
                    if (customRatio === '' || Number(customRatio) <= 0) {
                      setCustomRatio(selectedCurrency?.ratio ?? 1)
                    }
                  }}
                  className="h-7 w-24 text-xs text-right border-amber-300"
                  placeholder={String(selectedCurrency?.ratio ?? 1)}
                />
                <span className="text-xs text-amber-700">DA</span>
              </div>
            )}

            {/* Per-night input */}
            <div className="flex items-center justify-between py-1 bg-blue-50 rounded px-2">
              <Label className="text-blue-700 font-medium text-xs">
                {t('edit.pricePerNight')} × {nights} {t('edit.nightsLabel')}
              </Label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">{sym}</span>
                <Input
                  type="number"
                  min="0"
                  value={String(pricePerNight)}
                  onChange={(e) => {
                    const pn = parseFloat(e.target.value) || 0
                    setPricePerNight(pn || '')
                    if (nights > 0) setBasePrice(pn * nights)
                  }}
                  className="w-24 text-right h-7 text-xs"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t('edit.basePrice')} ({sym})</Label>
                <Input type="number" min="0" value={String(basePrice)} onChange={(e) => { setBasePrice(parseFloat(e.target.value) || 0); setPricePerNight('') }} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('edit.cleaningFee')} ({sym})</Label>
                <Input type="number" min="0" value={String(cleaningFee)} onChange={(e) => setCleaningFee(parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('edit.serviceFee')} ({sym})</Label>
                <Input type="number" min="0" value={String(serviceFee)} onChange={(e) => setServiceFee(parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('edit.taxes')} ({sym})</Label>
                <Input type="number" min="0" value={String(taxes)} onChange={(e) => setTaxes(parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t font-semibold">
              <span>{t('edit.total')}</span>
              <div className="text-right">
                <span className="text-blue-700">{total.toLocaleString()} {sym}</span>
                {!isDefaultCurrency && (
                  <p className="text-xs text-muted-foreground font-normal">= {totalDA.toLocaleString()} DA</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              {t('edit.cancel')}
            </Button>
            <Button type="submit" disabled={loading || availOk === false}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('edit.saving')}</> : t('edit.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
