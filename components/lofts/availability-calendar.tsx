"use client"

import { useState, useEffect } from "react"
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AvailabilityCalendarProps {
  loftId: string
  onDateRangeSelect?: (checkIn: string, checkOut: string) => void
  selectedCheckIn?: string
  selectedCheckOut?: string
  minimumStay?: number
}

interface CalendarState {
  currentMonth: Date
  selectedCheckIn: string | null
  selectedCheckOut: string | null
  unavailableDates: string[]
  loading: boolean
}

export function AvailabilityCalendar({
  loftId,
  onDateRangeSelect,
  selectedCheckIn,
  selectedCheckOut,
  minimumStay = 1
}: AvailabilityCalendarProps) {
  const [state, setState] = useState<CalendarState>({
    currentMonth: new Date(),
    selectedCheckIn: selectedCheckIn || null,
    selectedCheckOut: selectedCheckOut || null,
    unavailableDates: [],
    loading: false
  })

  useEffect(() => {
    fetchAvailability()
  }, [loftId, state.currentMonth])

  const fetchAvailability = async () => {
    setState(prev => ({ ...prev, loading: true }))

    try {
      const startDate = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth(), 1)
      const endDate = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 0)
      
      const params = new URLSearchParams({
        check_in: startDate.toISOString().split('T')[0],
        check_out: endDate.toISOString().split('T')[0]
      })

      const response = await fetch(`/api/lofts/${loftId}/availability?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setState(prev => ({ 
          ...prev, 
          unavailableDates: data.unavailable_dates?.map((d: any) => d.date) || [],
          loading: false 
        }))
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setState(prev => ({
      ...prev,
      currentMonth: new Date(
        prev.currentMonth.getFullYear(),
        prev.currentMonth.getMonth() + (direction === 'next' ? 1 : -1),
        1
      )
    }))
  }

  const handleDateClick = (date: string) => {
    const clickedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Don't allow selecting past dates or unavailable dates
    if (clickedDate < today || state.unavailableDates.includes(date)) {
      return
    }

    if (!state.selectedCheckIn || (state.selectedCheckIn && state.selectedCheckOut)) {
      // Start new selection
      setState(prev => ({
        ...prev,
        selectedCheckIn: date,
        selectedCheckOut: null
      }))
    } else if (state.selectedCheckIn && !state.selectedCheckOut) {
      const checkInDate = new Date(state.selectedCheckIn)
      
      if (clickedDate <= checkInDate) {
        // If clicked date is before or same as check-in, reset selection
        setState(prev => ({
          ...prev,
          selectedCheckIn: date,
          selectedCheckOut: null
        }))
      } else {
        // Calculate nights between dates
        const nights = Math.ceil((clickedDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (nights < minimumStay) {
          // If less than minimum stay, don't select
          return
        }

        // Check if any dates in range are unavailable
        const hasUnavailableDates = state.unavailableDates.some(unavailableDate => {
          const unavailable = new Date(unavailableDate)
          return unavailable > checkInDate && unavailable < clickedDate
        })

        if (hasUnavailableDates) {
          // If there are unavailable dates in range, don't select
          return
        }

        setState(prev => ({
          ...prev,
          selectedCheckOut: date
        }))

        // Notify parent component
        if (onDateRangeSelect) {
          onDateRangeSelect(state.selectedCheckIn, date)
        }
      }
    }
  }

  const clearSelection = () => {
    setState(prev => ({
      ...prev,
      selectedCheckIn: null,
      selectedCheckOut: null
    }))
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const isDateInRange = (date: Date) => {
    if (!state.selectedCheckIn || !state.selectedCheckOut) return false
    
    const checkIn = new Date(state.selectedCheckIn)
    const checkOut = new Date(state.selectedCheckOut)
    
    return date >= checkIn && date <= checkOut
  }

  const isDateSelected = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return dateStr === state.selectedCheckIn || dateStr === state.selectedCheckOut
  }

  const isDateUnavailable = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return date < today || state.unavailableDates.includes(dateStr)
  }

  const days = getDaysInMonth(state.currentMonth)
  const monthYear = state.currentMonth.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>Select Dates</span>
          </div>
          {(state.selectedCheckIn || state.selectedCheckOut) && (
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Dates Display */}
        {state.selectedCheckIn && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="text-sm">
              <div className="font-medium">Check-in</div>
              <div>{new Date(state.selectedCheckIn).toLocaleDateString()}</div>
            </div>
            {state.selectedCheckOut && (
              <>
                <div className="text-sm text-center">
                  <div className="font-medium">
                    {Math.ceil((new Date(state.selectedCheckOut).getTime() - new Date(state.selectedCheckIn).getTime()) / (1000 * 60 * 60 * 24))} nights
                  </div>
                </div>
                <div className="text-sm text-right">
                  <div className="font-medium">Check-out</div>
                  <div>{new Date(state.selectedCheckOut).toLocaleDateString()}</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigateMonth('prev')}
            disabled={state.loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-medium">{monthYear}</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigateMonth('next')}
            disabled={state.loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="p-2" />
            }

            const dateStr = date.toISOString().split('T')[0]
            const isUnavailable = isDateUnavailable(date)
            const isSelected = isDateSelected(date)
            const isInRange = isDateInRange(date)

            return (
              <button
                key={dateStr}
                onClick={() => handleDateClick(dateStr)}
                disabled={isUnavailable || state.loading}
                className={cn(
                  "p-2 text-sm rounded-md transition-colors",
                  "hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  isUnavailable && "text-gray-300 cursor-not-allowed hover:bg-transparent",
                  isSelected && "bg-blue-600 text-white hover:bg-blue-700",
                  isInRange && !isSelected && "bg-blue-100 text-blue-900",
                  !isUnavailable && !isSelected && !isInRange && "text-gray-900"
                )}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded-sm" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 rounded-sm" />
            <span>In range</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-200 rounded-sm" />
            <span>Unavailable</span>
          </div>
        </div>

        {/* Minimum Stay Notice */}
        {minimumStay > 1 && (
          <div className="text-xs text-gray-600 text-center">
            Minimum stay: {minimumStay} night{minimumStay !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  )
}