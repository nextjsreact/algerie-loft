'use client'

import { useState, useEffect, useCallback } from 'react'
import { DayPicker, DateRange } from 'react-day-picker'
import { format, addDays, isBefore, isAfter, isSameDay, parseISO, eachDayOfInterval } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import 'react-day-picker/dist/style.css'

interface DateRangePickerProps {
  loftId: string
  checkIn: string
  checkOut: string
  onCheckInChange: (date: string) => void
  onCheckOutChange: (date: string) => void
  excludeReservationId?: string
  isEmployee?: boolean
}

export function DateRangePicker({
  loftId,
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  excludeReservationId,
  isEmployee = false,
}: DateRangePickerProps) {
  const [bookedRanges, setBookedRanges] = useState<{ from: string; to: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [selecting, setSelecting] = useState<'checkin' | 'checkout'>('checkin')

  // Fetch booked dates when loft changes
  useEffect(() => {
    if (!loftId) { setBookedRanges([]); return }
    setLoading(true)
    const url = `/api/lofts/${loftId}/booked-dates${excludeReservationId ? `?exclude=${excludeReservationId}` : ''}`
    fetch(url)
      .then(r => r.json())
      .then(data => setBookedRanges(data.ranges || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [loftId, excludeReservationId])

  // Build set of booked dates (check_in inclusive, check_out exclusive)
  // The check_in day of an existing reservation is blocked for NEW check-ins
  // but is ALLOWED as a check-out (same-day turnover)
  const bookedDates: Date[] = bookedRanges.flatMap(r => {
    const from = parseISO(r.from)
    const to = addDays(parseISO(r.to), -1) // checkout day is free
    if (isBefore(to, from)) return []
    return eachDayOfInterval({ start: from, end: to })
  })

  // Check-in days of existing reservations — these are free as checkout targets
  const checkinDays: Date[] = bookedRanges.map(r => parseISO(r.from))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isDisabled = (date: Date) => {
    if (!isEmployee && isBefore(date, today)) return true
    // A day is disabled if it's booked AND it's not a check-in day of an existing reservation
    // (check-in days can be used as checkout for same-day turnover)
    const isBooked = bookedDates.some(d => isSameDay(d, date))
    if (!isBooked) return false
    // If we're selecting checkout and this day is a check-in of another reservation → allow it
    if (selecting === 'checkout' && checkinDays.some(d => isSameDay(d, date))) return false
    return true
  }

  const selectedRange: DateRange | undefined = checkIn
    ? { from: parseISO(checkIn), to: checkOut ? parseISO(checkOut) : undefined }
    : undefined

  const handleDayClick = (day: Date) => {
    if (isDisabled(day)) return

    if (selecting === 'checkin' || !checkIn) {
      onCheckInChange(format(day, 'yyyy-MM-dd'))
      onCheckOutChange('')
      setSelecting('checkout')
      return
    }

    // checkout selection
    const cin = parseISO(checkIn)
    if (isBefore(day, cin) || isSameDay(day, cin)) {
      // clicked before checkin → restart
      onCheckInChange(format(day, 'yyyy-MM-dd'))
      onCheckOutChange('')
      setSelecting('checkout')
      return
    }

    // Check no booked dates between checkin and selected checkout (exclusive of checkout)
    const range = eachDayOfInterval({ start: addDays(cin, 1), end: addDays(day, -1) })
    const hasConflict = range.some(d => bookedDates.some(b => isSameDay(b, d)))
    if (hasConflict) {
      // Can't select this range — restart from this day
      onCheckInChange(format(day, 'yyyy-MM-dd'))
      onCheckOutChange('')
      setSelecting('checkout')
      return
    }

    onCheckOutChange(format(day, 'yyyy-MM-dd'))
    setSelecting('checkin')
  }

  const nights = checkIn && checkOut
    ? Math.ceil((parseISO(checkOut).getTime() - parseISO(checkIn).getTime()) / 86400000)
    : 0

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Calendar className="h-4 w-4 text-green-600" />
          {selecting === 'checkin' ? (
            <span>Sélectionnez la date d'arrivée</span>
          ) : (
            <span className="text-emerald-600">Sélectionnez la date de départ</span>
          )}
        </div>
        {loading && <span className="text-xs text-gray-400 animate-pulse">Chargement...</span>}
      </div>

      {/* Legend */}
      {loftId && (
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-200 border border-red-400" />
            <span>Occupé</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Arrivée</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-200" />
            <span>Séjour</span>
          </div>
          {nights > 0 && (
            <span className="ml-auto font-medium text-green-700">
              {nights} nuit{nights > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Calendar */}
      <div className="border rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
        <style>{`
          .rdp { margin: 0; --rdp-cell-size: 38px; }
          .rdp-months { justify-content: center; }
          .rdp-day_selected:not(.rdp-day_range_middle) { background-color: #3b82f6 !important; color: white !important; }
          .rdp-day_range_middle { background-color: #dbeafe !important; color: #1e40af !important; border-radius: 0 !important; }
          .rdp-day_range_start { border-radius: 50% 0 0 50% !important; background-color: #3b82f6 !important; color: white !important; }
          .rdp-day_range_end { border-radius: 0 50% 50% 0 !important; background-color: #3b82f6 !important; color: white !important; }
          .rdp-day_disabled { color: #d1d5db !important; }
          .rdp-day[data-booked="true"] { background-color: #fee2e2 !important; color: #ef4444 !important; text-decoration: line-through; cursor: not-allowed; border-radius: 4px; }
          .rdp-caption { padding: 8px 12px; }
          .rdp-nav_button { color: #6b7280; }
          .rdp-head_cell { font-size: 11px; color: #9ca3af; font-weight: 600; }
          .rdp-day { font-size: 13px; }
          .rdp-day:hover:not(.rdp-day_disabled):not([data-booked="true"]) { background-color: #eff6ff !important; }
        `}</style>
        <DayPicker
          mode="range"
          selected={selectedRange}
          onDayClick={handleDayClick}
          disabled={isDisabled}
          locale={fr}
          numberOfMonths={2}
          modifiers={{ booked: bookedDates }}
          modifiersClassNames={{ booked: 'rdp-day-booked' }}
          modifiersStyles={{
            booked: {
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              textDecoration: 'line-through',
              cursor: 'not-allowed',
              borderRadius: '4px',
            }
          }}
          fromDate={isEmployee ? undefined : today}
          components={{
            IconLeft: () => <ChevronLeft className="h-4 w-4" />,
            IconRight: () => <ChevronRight className="h-4 w-4" />,
          }}
        />
      </div>

      {/* Selected dates summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-lg border text-sm ${checkIn ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700' : 'bg-gray-50 border-gray-200 dark:bg-gray-700/30 dark:border-gray-600'}`}>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Arrivée</p>
          <p className={`font-semibold ${checkIn ? 'text-blue-700 dark:text-blue-300' : 'text-gray-400'}`}>
            {checkIn ? format(parseISO(checkIn), 'dd MMM yyyy', { locale: fr }) : '—'}
          </p>
        </div>
        <div className={`p-3 rounded-lg border text-sm ${checkOut ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700' : 'bg-gray-50 border-gray-200 dark:bg-gray-700/30 dark:border-gray-600'}`}>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Départ</p>
          <p className={`font-semibold ${checkOut ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-400'}`}>
            {checkOut ? format(parseISO(checkOut), 'dd MMM yyyy', { locale: fr }) : '—'}
          </p>
        </div>
      </div>

      {!loftId && (
        <p className="text-xs text-amber-600 text-center">Sélectionnez d'abord un appartement pour voir les disponibilités</p>
      )}
    </div>
  )
}
