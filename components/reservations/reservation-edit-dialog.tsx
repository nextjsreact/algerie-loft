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
    status?: string
    base_price?: number
    cleaning_fee?: number
    service_fee?: number
    taxes?: number
    total_amount?: number
    guest_name?: string
    currency_code?: string
    currency_ratio?: number
    price_per_night_input?: number
    original_amount?: number
    original_currency_code?: string
    lofts?: { name: string }
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  availableLofts?: Array<{ id: string; name: string; address?: string }> // Liste des lofts disponibles
}

export function ReservationEditDialog({ reservation, open, onOpenChange, onSuccess, availableLofts = [] }: ReservationEditDialogProps) {
  const t = useTranslations('reservations')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [selectedLoftId, setSelectedLoftId] = useState('')
  const [pricePerNight, setPricePerNight] = useState<string>('')
  const [basePrice, setBasePrice] = useState<string>('0')
  const [cleaningFee, setCleaningFee] = useState<string>('0')
  const [serviceFee, setServiceFee] = useState<string>('0')
  const [taxes, setTaxes] = useState<string>('0')
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAvail, setCheckingAvail] = useState(false)
  const [availOk, setAvailOk] = useState<boolean | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('')

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
    setSelectedLoftId(reservation.loft_id)
    setError('')
    setAvailOk(null)
    setSelectedStatus(reservation.status || 'pending')

    // Restore original currency if stored
    // Pour les réservations Airbnb : currency_code existe mais pas toujours currency_ratio
    // On doit calculer le ratio à partir de original_amount et total_amount
    const origCode = reservation.currency_code || 'DZD'
    let origRatio = reservation.currency_ratio || 1
    
    // Si c'est une réservation Airbnb avec devise étrangère mais sans currency_ratio
    // Calculer le ratio : total_amount_dzd / original_amount = ratio
    if (origCode !== 'DZD' && origRatio === 1 && reservation.original_amount && reservation.total_amount) {
      origRatio = reservation.total_amount / reservation.original_amount
    }
    
    setSelectedCurrencyCode(origCode)
    setCustomRatio(origRatio)

    const ratio = origRatio || 1
    const isDefault = origCode === 'DZD' || origCode === ''

    const rsvNights = reservation.check_in_date && reservation.check_out_date
      ? Math.ceil(
          (new Date(reservation.check_out_date).getTime() -
           new Date(reservation.check_in_date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0

    // If we have a stored per-night price, use it; otherwise derive from original_amount or base_price
    if (reservation.price_per_night_input) {
      setPricePerNight(String(reservation.price_per_night_input))
    } else if (!isDefault && reservation.original_amount && rsvNights > 0) {
      // Pour les réservations Airbnb sans price_per_night_input, calculer depuis original_amount
      setPricePerNight(String(Math.round((reservation.original_amount / rsvNights) * 100) / 100))
    } else {
      setPricePerNight('')
    }

    const dbTotal = reservation.total_amount || 0
    const hasBreakdown =
      (reservation.base_price || 0) > 0 ||
      (reservation.cleaning_fee || 0) > 0 ||
      (reservation.service_fee || 0) > 0 ||
      (reservation.taxes || 0) > 0

    const showTotalAsBase = isDefault && !hasBreakdown && dbTotal > 0

    if (isDefault) {
      if (showTotalAsBase) {
        setBasePrice(String(Math.round(dbTotal * 100) / 100))
      } else {
        setBasePrice(String(reservation.base_price ?? 0))
      }
      setCleaningFee(String(reservation.cleaning_fee ?? 0))
      setServiceFee(String(reservation.service_fee ?? 0))
      setTaxes(String(reservation.taxes ?? 0))

      if (showTotalAsBase && rsvNights > 0) {
        setPricePerNight(String(Math.round((dbTotal / rsvNights) * 100) / 100))
      }
    } else {
      setBasePrice(String(reservation.base_price ? Math.round((reservation.base_price / ratio) * 100) / 100 : 0))
      setCleaningFee(String(reservation.cleaning_fee ? Math.round((reservation.cleaning_fee / ratio) * 100) / 100 : 0))
      setServiceFee(String(reservation.service_fee ? Math.round((reservation.service_fee / ratio) * 100) / 100 : 0))
      setTaxes(String(reservation.taxes ? Math.round((reservation.taxes / ratio) * 100) / 100 : 0))
    }
  }, [reservation, open])

  // Auto-calculate base price from per-night × nights
  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  useEffect(() => {
    const pn = parseFloat(pricePerNight)
    if (!isNaN(pn) && pn > 0 && nights > 0) {
      setBasePrice(String(Math.round(pn * nights * 100) / 100))
    }
  }, [pricePerNight, nights])

  // Recalculate total
  useEffect(() => {
    const sum = (parseFloat(basePrice) || 0) + (parseFloat(cleaningFee) || 0) + (parseFloat(serviceFee) || 0) + (parseFloat(taxes) || 0)
    setTotal(Math.round(sum * 100) / 100)
  }, [basePrice, cleaningFee, serviceFee, taxes])

  // Check availability when dates or loft change
  useEffect(() => {
    if (!reservation || !checkIn || !checkOut || !selectedLoftId) {
      setAvailOk(null)
      return
    }
    // Si rien n'a changé, pas besoin de vérifier
    if (checkIn === reservation.check_in_date && checkOut === reservation.check_out_date && selectedLoftId === reservation.loft_id) {
      setAvailOk(null)
      return
    }
    const check = async () => {
      setCheckingAvail(true)
      setAvailOk(null)
      try {
        const res = await fetch(`/api/availability?loft_id=${selectedLoftId}&check_in_date=${checkIn}&check_out_date=${checkOut}&exclude_id=${reservation.id}`)
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
  }, [checkIn, checkOut, selectedLoftId, reservation])

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
          loft_id: selectedLoftId,
          check_in_date: checkIn,
          check_out_date: checkOut,
          base_price: toDA(parseFloat(basePrice) || 0),
          cleaning_fee: toDA(parseFloat(cleaningFee) || 0),
          service_fee: toDA(parseFloat(serviceFee) || 0),
          taxes: toDA(parseFloat(taxes) || 0),
          total_amount: totalDA,
          currency_code: selectedCurrency?.code || 'DZD',
          currency_ratio: effectiveRatio,
          price_per_night_input: pricePerNight !== '' ? parseFloat(pricePerNight) || null : null,
          status: selectedStatus,
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
            {reservation.guest_name}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Sélecteur de loft */}
          {availableLofts.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Loft</Label>
              <Select value={selectedLoftId} onValueChange={(value) => { setSelectedLoftId(value); setAvailOk(null) }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Sélectionner un loft" />
                </SelectTrigger>
                <SelectContent>
                  {availableLofts.map((loft) => (
                    <SelectItem key={loft.id} value={loft.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{loft.name}</span>
                        {loft.address && (
                          <span className="text-xs text-muted-foreground">{loft.address}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedLoftId !== reservation.loft_id && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Le loft sera changé de "{reservation.lofts?.name}" vers "{availableLofts.find(l => l.id === selectedLoftId)?.name}"
                </p>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('edit.checkIn')}</Label>
              <Input type="date" value={checkIn} onChange={(e) => { setCheckIn(e.target.value); setAvailOk(null) }} required />
            </div>
            <div className="space-y-2">
              <Label>{t('edit.checkOut')}</Label>
              <Input type="date" value={checkOut} onChange={(e) => { setCheckOut(e.target.value); setAvailOk(null) }} min={checkIn ? format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd') : undefined} required />
            </div>
          </div>

          {/* Status selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Statut de la réservation</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                    En attente
                  </span>
                </SelectItem>
                <SelectItem value="confirmed">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    Confirmée
                  </span>
                </SelectItem>
                <SelectItem value="completed">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                    Terminée
                  </span>
                </SelectItem>
                <SelectItem value="cancelled">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    Annulée
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nights + availability */}
          <div className="flex items-center gap-3 text-sm">
            {nights > 0 && <span className="text-muted-foreground">{nights > 1 ? t('edit.nights_plural', { count: nights }) : t('edit.nights', { count: nights })}</span>}
            {checkingAvail && <span className="flex items-center gap-1 text-blue-600"><Loader2 className="h-3 w-3 animate-spin" /> {t('edit.checking')}</span>}
            {availOk === true && <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3 w-3" /> {t('edit.available')}</span>}
            {availOk === false && <span className="flex items-center gap-1 text-red-600"><AlertCircle className="h-3 w-3" /> {t('edit.notAvailable')}</span>}
          </div>

          {/* Pricing */}
          <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
            {/* Header: label + currency selector */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">{t('edit.pricing')}</p>
              {(currencies.length > 1 || selectedCurrencyCode !== 'DZD') && (
                <Select value={selectedCurrencyCode} onValueChange={(code) => {
                  setSelectedCurrencyCode(code)
                  const cur = currencies.find(c => c.code === code)
                  setCustomRatio(cur?.ratio ?? 1)
                }}>
                  <SelectTrigger className="w-28 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.length > 0 ? (
                      currencies.map(c => (
                        <SelectItem key={c.code} value={c.code} className="text-xs">
                          {c.symbol} {c.code}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value={selectedCurrencyCode} className="text-xs">
                        {selectedCurrencyCode}
                      </SelectItem>
                    )}
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
                  type="text"
                  inputMode="decimal"
                  value={pricePerNight}
                  onChange={(e) => {
                    const v = e.target.value
                    // Allow digits, dot, comma (replace comma with dot)
                    const normalized = v.replace(',', '.')
                    if (/^\d*\.?\d*$/.test(normalized)) {
                      setPricePerNight(normalized)
                    }
                  }}
                  className="w-24 text-right h-7 text-xs"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t('edit.basePrice')} ({sym})</Label>
                <Input
                  type="text" inputMode="decimal"
                  value={basePrice}
                  onChange={(e) => {
                    const normalized = e.target.value.replace(',', '.')
                    if (/^\d*\.?\d*$/.test(normalized)) { setBasePrice(normalized); setPricePerNight('') }
                  }}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('edit.cleaningFee')} ({sym})</Label>
                <Input
                  type="text" inputMode="decimal"
                  value={cleaningFee}
                  onChange={(e) => {
                    const normalized = e.target.value.replace(',', '.')
                    if (/^\d*\.?\d*$/.test(normalized)) setCleaningFee(normalized)
                  }}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('edit.serviceFee')} ({sym})</Label>
                <Input
                  type="text" inputMode="decimal"
                  value={serviceFee}
                  onChange={(e) => {
                    const normalized = e.target.value.replace(',', '.')
                    if (/^\d*\.?\d*$/.test(normalized)) setServiceFee(normalized)
                  }}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('edit.taxes')} ({sym})</Label>
                <Input
                  type="text" inputMode="decimal"
                  value={taxes}
                  onChange={(e) => {
                    const normalized = e.target.value.replace(',', '.')
                    if (/^\d*\.?\d*$/.test(normalized)) setTaxes(normalized)
                  }}
                  className="h-8 text-xs"
                />
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
