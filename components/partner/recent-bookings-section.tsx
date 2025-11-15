"use client"

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react'
import { BookingCard } from './booking-card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'

interface RecentBooking {
  id: string
  booking_reference: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed'
  client_name: string
  loft_name: string
  loft_id?: string
}

interface RecentBookingsSectionProps {
  bookings: RecentBooking[]
  locale: string
  loading?: boolean
}

export function RecentBookingsSection({ bookings, locale, loading }: RecentBookingsSectionProps) {
  const t = useTranslations('partner.dashboard.bookings')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  // Filter bookings based on status and date range
  const filteredBookings = useMemo(() => {
    let filtered = bookings

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // Filter by date range
    if (dateRange?.from) {
      filtered = filtered.filter(booking => {
        const checkIn = new Date(booking.check_in)
        const from = dateRange.from!
        const to = dateRange.to || from

        return checkIn >= from && checkIn <= to
      })
    }

    return filtered
  }, [bookings, statusFilter, dateRange])

  const hasActiveFilters = statusFilter !== 'all' || dateRange?.from

  const clearFilters = () => {
    setStatusFilter('all')
    setDateRange(undefined)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('title')}</CardTitle>
          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
                <SelectItem value="pending">{t('status.pending')}</SelectItem>
                <SelectItem value="confirmed">{t('status.confirmed')}</SelectItem>
                <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
                <SelectItem value="completed">{t('status.completed')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                      </>
                    ) : (
                      format(dateRange.from, 'MMM d, yyyy')
                    )
                  ) : (
                    <span>{t('filters.dateRange')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📅</div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
              {bookings.length === 0 ? t('noBookings') : t('filters.noResults')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {bookings.length === 0 
                ? t('noBookingsMessage')
                : t('filters.noResultsMessage')
              }
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-4"
              >
                {t('filters.clearFilters')}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                locale={locale}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
