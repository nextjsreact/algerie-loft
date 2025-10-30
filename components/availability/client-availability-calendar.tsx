'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from '@/components/ui/calendar'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Info, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { 
  format, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isWithinInterval,
  differenceInDays,
  addMonths,
  subMonths,
  isAfter,
  isBefore
} from 'date-fns'
import { fr, ar, enUS } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'
import { availabilityService, type PricingBreakdown, type AvailabilityResult } from '@/lib/services/availability-service'

// Types
interface LoftData {
  id: string
  name: string
  pricePerNight: number
  minimumStay: number
  maximumStay?: number
  cleaningFee: number
  taxRate: number
}

interface ClientAvailabilityCalendarProps {
  loftData: LoftData
  onDateRangeSelect: (dateRange: DateRange | undefined, pricing?: PricingBreakdown) => void
  onAvailabilityCheck?: (isAvailable: boolean, restrictions?: string[]) => void
  className?: string
  disabled?: boolean
}

interface CalendarDay {
  date: Date
  isAvailable: boolean
  price?: number
  isToday: boolean
  isInCurrentMonth: boolean
  isSelected: boolean
  isInRange: boolean
  isRangeStart: boolean
  isRangeEnd: boolean
  restrictions?: string[]
}

export function ClientAvailabilityCalendar({
  loftData,
  onDateRangeSelect,
  onAvailabilityCheck,
  className,
  disabled = false
}: ClientAvailabilityCalendarProps) {
  const t = useTranslations('availability')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  
  // State
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>()
  const [availabilityData, setAvailabilityData] = useState<Record<string, boolean>>({})
  const [pricingData, setPricingData] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPricing, setCurrentPricing] = useState<PricingBreakdown | null>(null)
  const [availabilityResult, setAvailabilityResult] = useState<AvailabilityResult | null>(null)
  const [isCalculatingPricing, setIsCalculatingPricing] = useState(false)

  // Get locale for date formatting
  const getDateLocale = () => {
    switch (locale) {
      case 'ar': return ar
      case 'fr': return fr
      default: return enUS
    }
  }

  // Fetch availability data for the current month
  const fetchAvailabilityData = useCallback(async (month: Date) => {
    if (!loftData?.id) return

    setLoading(true)
    setError(null)

    try {
      const startDate = format(startOfMonth(month), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(month), 'yyyy-MM-dd')
      
      const calendar = await availabilityService.getAvailabilityCalendar(
        loftData.id,
        startDate,
        endDate
      )
      
      setAvailabilityData(calendar)
    } catch (err) {
      console.error('Error fetching availability:', err)
      setError(t('errors.fetchFailed'))
    } finally {
      setLoading(false)
    }
  }, [loftData?.id, t])

  // Check availability and calculate pricing for selected range
  const checkRangeAvailability = useCallback(async (range: DateRange) => {
    if (!range.from || !range.to || !loftData?.id) return

    setIsCalculatingPricing(true)
    setError(null)

    try {
      const dateRange = {
        checkIn: format(range.from, 'yyyy-MM-dd'),
        checkOut: format(range.to, 'yyyy-MM-dd')
      }

      // Check availability
      const availability = await availabilityService.checkAvailability(loftData.id, dateRange)
      setAvailabilityResult(availability)

      // Calculate pricing if available
      let pricing: PricingBreakdown | null = null
      if (availability.isAvailable) {
        pricing = await availabilityService.calculatePricing(loftData.id, dateRange)
        setCurrentPricing(pricing)
      } else {
        setCurrentPricing(null)
      }

      // Notify parent components
      onAvailabilityCheck?.(
        availability.isAvailable, 
        availability.restrictions?.map(r => r.message)
      )
      onDateRangeSelect(range, pricing || undefined)

    } catch (err) {
      console.error('Error checking availability:', err)
      setError(t('errors.availabilityCheckFailed'))
      setAvailabilityResult(null)
      setCurrentPricing(null)
    } finally {
      setIsCalculatingPricing(false)
    }
  }, [loftData?.id, onAvailabilityCheck, onDateRangeSelect, t])

  // Handle date range selection
  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setSelectedRange(range)
    
    if (range?.from && range?.to) {
      checkRangeAvailability(range)
    } else {
      setCurrentPricing(null)
      setAvailabilityResult(null)
      onDateRangeSelect(range)
    }
  }

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev' 
      ? subMonths(currentMonth, 1)
      : addMonths(currentMonth, 1)
    setCurrentMonth(newMonth)
  }

  // Generate calendar days
  const generateCalendarDays = (): CalendarDay[] => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const today = new Date()

    return days.map(date => {
      const dateKey = format(date, 'yyyy-MM-dd')
      const isAvailable = availabilityData[dateKey] !== false
      const isToday = isSameDay(date, today)
      const isInCurrentMonth = isSameMonth(date, currentMonth)
      
      let isSelected = false
      let isInRange = false
      let isRangeStart = false
      let isRangeEnd = false

      if (selectedRange?.from && selectedRange?.to) {
        isSelected = isSameDay(date, selectedRange.from) || isSameDay(date, selectedRange.to)
        isInRange = isWithinInterval(date, { start: selectedRange.from, end: selectedRange.to })
        isRangeStart = isSameDay(date, selectedRange.from)
        isRangeEnd = isSameDay(date, selectedRange.to)
      } else if (selectedRange?.from) {
        isSelected = isSameDay(date, selectedRange.from)
      }

      return {
        date,
        isAvailable,
        price: pricingData[dateKey] || loftData.pricePerNight,
        isToday,
        isInCurrentMonth,
        isSelected,
        isInRange,
        isRangeStart,
        isRangeEnd
      }
    })
  }

  // Check if date is selectable
  const isDateSelectable = (date: Date): boolean => {
    if (disabled) return false
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Can't select past dates
    if (isBefore(date, today)) return false
    
    // Check availability
    const dateKey = format(date, 'yyyy-MM-dd')
    return availabilityData[dateKey] !== false
  }

  // Validate date range against minimum/maximum stay
  const validateDateRange = (range: DateRange): string[] => {
    const errors: string[] = []
    
    if (!range.from || !range.to) return errors
    
    const nights = differenceInDays(range.to, range.from)
    
    if (nights < loftData.minimumStay) {
      errors.push(t('errors.minimumStay', { nights: loftData.minimumStay }))
    }
    
    if (loftData.maximumStay && nights > loftData.maximumStay) {
      errors.push(t('errors.maximumStay', { nights: loftData.maximumStay }))
    }
    
    return errors
  }

  // Effects
  useEffect(() => {
    fetchAvailabilityData(currentMonth)
  }, [currentMonth, fetchAvailabilityData])

  // Render pricing breakdown
  const renderPricingBreakdown = () => {
    if (!currentPricing || !selectedRange?.from || !selectedRange?.to) return null

    const nights = differenceInDays(selectedRange.to, selectedRange.from)

    return (
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            {t('pricing.title')}
          </CardTitle>
          <CardDescription>
            {t('pricing.description', { nights })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>{t('pricing.nightlyRate', { nights })}</span>
            <span>{currentPricing.subtotal.toLocaleString()} {currentPricing.currency}</span>
          </div>
          
          {currentPricing.cleaningFee > 0 && (
            <div className="flex justify-between">
              <span>{t('pricing.cleaningFee')}</span>
              <span>{currentPricing.cleaningFee.toLocaleString()} {currentPricing.currency}</span>
            </div>
          )}
          
          {currentPricing.serviceFee > 0 && (
            <div className="flex justify-between">
              <span>{t('pricing.serviceFee')}</span>
              <span>{currentPricing.serviceFee.toLocaleString()} {currentPricing.currency}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>{t('pricing.taxes')}</span>
            <span>{currentPricing.taxes.toLocaleString()} {currentPricing.currency}</span>
          </div>
          
          <div className="border-t pt-3">
            <div className="flex justify-between font-semibold text-lg">
              <span>{t('pricing.total')}</span>
              <span>{currentPricing.total.toLocaleString()} {currentPricing.currency}</span>
            </div>
          </div>

          {currentPricing.priceOverrides && currentPricing.priceOverrides.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {t('pricing.seasonalPricing')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  // Render availability restrictions
  const renderRestrictions = () => {
    if (!availabilityResult?.restrictions?.length) return null

    return (
      <Alert className="mt-4" variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            {availabilityResult.restrictions.map((restriction, index) => (
              <div key={index}>{restriction.message}</div>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (loading && Object.keys(availabilityData).length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {t('calendar.selectDates')}
              </CardTitle>
              <CardDescription>
                {t('calendar.selectDatesDescription')}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('prev')}
                disabled={loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="min-w-[140px] text-center">
                <span className="font-medium">
                  {format(currentMonth, 'MMMM yyyy', { locale: getDateLocale() })}
                </span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('next')}
                disabled={loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={handleDateRangeSelect}
            disabled={(date) => !isDateSelectable(date)}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            numberOfMonths={1}
            className="w-full"
            classNames={{
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_range_middle: "bg-primary/20 text-primary-foreground",
              day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
              day_outside: "text-muted-foreground opacity-50",
            }}
          />

          {/* Booking Rules Info */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              {t('rules.title')}
            </h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>{t('rules.minimumStay', { nights: loftData.minimumStay })}</div>
              {loftData.maximumStay && (
                <div>{t('rules.maximumStay', { nights: loftData.maximumStay })}</div>
              )}
              <div>{t('rules.pricePerNight', { price: loftData.pricePerNight.toLocaleString() })}</div>
            </div>
          </div>

          {/* Loading state for pricing calculation */}
          {isCalculatingPricing && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 animate-spin" />
              {t('pricing.calculating')}
            </div>
          )}

          {/* Availability restrictions */}
          {renderRestrictions()}

          {/* Pricing breakdown */}
          {renderPricingBreakdown()}
        </CardContent>
      </Card>
    </div>
  )
}