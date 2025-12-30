'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Check,
  X
} from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isAfter, isBefore, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'

interface MobileBookingCalendarProps {
  loftId: string
  onDateSelect: (checkIn: Date, checkOut: Date) => void
  selectedCheckIn?: Date
  selectedCheckOut?: Date
  unavailableDates?: Date[]
  minStay?: number
  className?: string
}

interface DateAvailability {
  date: Date
  available: boolean
  price?: number
  minStay?: number
}

export function MobileBookingCalendar({
  loftId,
  onDateSelect,
  selectedCheckIn,
  selectedCheckOut,
  unavailableDates = [],
  minStay = 1,
  className = ''
}: MobileBookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectingCheckOut, setSelectingCheckOut] = useState(false)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [availability, setAvailability] = useState<DateAvailability[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load availability data for the current month
  useEffect(() => {
    loadAvailability()
  }, [currentMonth, loftId])

  const loadAvailability = async () => {
    setIsLoading(true)
    try {
      const startDate = startOfMonth(currentMonth)
      const endDate = endOfMonth(currentMonth)
      
      const response = await fetch(
        `/api/lofts/${loftId}/availability?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setAvailability(data.availability || [])
      }
    } catch (error) {
      console.error('Failed to load availability:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price)
  }

  const isDateUnavailable = (date: Date) => {
    return unavailableDates.some(unavailableDate => 
      isSameDay(date, unavailableDate)
    ) || availability.some(avail => 
      isSameDay(avail.date, date) && !avail.available
    )
  }

  const isDateInRange = (date: Date) => {
    if (!selectedCheckIn || !selectingCheckOut) return false
    
    const endDate = hoveredDate || selectedCheckOut
    if (!endDate) return false
    
    return isAfter(date, selectedCheckIn) && isBefore(date, endDate)
  }

  const handleDateClick = (date: Date) => {
    if (isDateUnavailable(date) || isBefore(date, new Date())) {
      return
    }

    if (!selectedCheckIn || (selectedCheckIn && selectedCheckOut)) {
      // Start new selection
      onDateSelect(date, addDays(date, minStay))
      setSelectingCheckOut(true)
    } else if (selectingCheckOut) {
      // Complete selection
      if (isAfter(date, selectedCheckIn)) {
        onDateSelect(selectedCheckIn, date)
        setSelectingCheckOut(false)
      } else {
        // If clicked date is before check-in, start over
        onDateSelect(date, addDays(date, minStay))
      }
    }
  }

  const getDayClasses = (date: Date) => {
    const baseClasses = 'w-12 h-12 rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all duration-200 touch-manipulation'
    
    if (!isSameMonth(date, currentMonth)) {
      return `${baseClasses} text-gray-300 cursor-not-allowed`
    }
    
    if (isBefore(date, new Date()) || isDateUnavailable(date)) {
      return `${baseClasses} text-gray-300 cursor-not-allowed bg-gray-50`
    }
    
    if (selectedCheckIn && isSameDay(date, selectedCheckIn)) {
      return `${baseClasses} bg-blue-500 text-white shadow-lg`
    }
    
    if (selectedCheckOut && isSameDay(date, selectedCheckOut)) {
      return `${baseClasses} bg-blue-500 text-white shadow-lg`
    }
    
    if (isDateInRange(date)) {
      return `${baseClasses} bg-blue-100 text-blue-700`
    }
    
    return `${baseClasses} text-gray-700 hover:bg-blue-50 active:bg-blue-100 cursor-pointer`
  }

  const getDatePrice = (date: Date) => {
    const avail = availability.find(a => isSameDay(a.date, date))
    return avail?.price
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad the calendar to start on Monday
  const startDate = new Date(monthStart)
  const dayOfWeek = startDate.getDay()
  const paddingDays = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  
  for (let i = 0; i < paddingDays; i++) {
    days.unshift(new Date(startDate.getTime() - (paddingDays - i) * 24 * 60 * 60 * 1000))
  }

  // Pad the end to complete the week
  const endPaddingDays = 7 - (days.length % 7)
  if (endPaddingDays < 7) {
    const lastDay = days[days.length - 1]
    for (let i = 1; i <= endPaddingDays; i++) {
      days.push(new Date(lastDay.getTime() + i * 24 * 60 * 60 * 1000))
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Selection Status */}
        {selectedCheckIn && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              Arrivée: {format(selectedCheckIn, 'dd MMM', { locale: fr })}
            </Badge>
            {selectedCheckOut && (
              <Badge variant="outline" className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                Départ: {format(selectedCheckOut, 'dd MMM', { locale: fr })}
              </Badge>
            )}
            {selectingCheckOut && !selectedCheckOut && (
              <Badge variant="secondary">
                Sélectionnez la date de départ
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            const price = getDatePrice(date)
            
            return (
              <div
                key={index}
                className={getDayClasses(date)}
                onClick={() => handleDateClick(date)}
                onMouseEnter={() => setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                <span className="text-xs">
                  {format(date, 'd')}
                </span>
                {price && isSameMonth(date, currentMonth) && !isDateUnavailable(date) && (
                  <span className="text-xs text-gray-500 leading-none">
                    {formatPrice(price).replace(' DZD', '')}
                  </span>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Sélectionné</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <span>Période</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 rounded"></div>
            <span>Indisponible</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        {selectedCheckIn && selectedCheckOut && (
          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                onDateSelect(new Date(), new Date())
                setSelectingCheckOut(false)
              }}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Effacer
            </Button>
            <Button
              onClick={() => {
                // Trigger parent callback or validation
                setSelectingCheckOut(false)
              }}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirmer
            </Button>
          </div>
        )}
        
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}