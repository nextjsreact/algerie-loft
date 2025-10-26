"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns'

interface BookingEvent {
  id: string
  loft_name: string
  client_name: string
  check_in: string
  check_out: string
  guests: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
}

interface PartnerBookingCalendarProps {
  userId: string
}

export function PartnerBookingCalendar({ userId }: PartnerBookingCalendarProps) {
  const [bookings, setBookings] = useState<BookingEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [userId, currentDate])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      
      // For now, use mock data - replace with actual API call
      const mockBookings: BookingEvent[] = [
        {
          id: '1',
          loft_name: 'Modern Loft Downtown',
          client_name: 'Ahmed Benali',
          check_in: '2024-01-15',
          check_out: '2024-01-18',
          guests: 2,
          status: 'confirmed'
        },
        {
          id: '2',
          loft_name: 'Cozy Studio Hydra',
          client_name: 'Fatima Zohra',
          check_in: '2024-01-20',
          check_out: '2024-01-25',
          guests: 1,
          status: 'pending'
        },
        {
          id: '3',
          loft_name: 'Luxury Apartment',
          client_name: 'Karim Messaoud',
          check_in: '2024-01-28',
          check_out: '2024-01-30',
          guests: 4,
          status: 'confirmed'
        }
      ]
      
      setBookings(mockBookings)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBookingForDate = (date: Date) => {
    return bookings.find(booking => {
      const checkIn = new Date(booking.check_in)
      const checkOut = new Date(booking.check_out)
      return date >= checkIn && date < checkOut
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  if (loading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Booking Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <Calendar className="h-6 w-6 text-purple-600" />
          Booking Calendar
        </CardTitle>
        <p className="text-sm text-gray-600">
          {format(currentDate, 'MMMM yyyy')} - Upcoming reservations
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 font-medium text-gray-500">
                {day}
              </div>
            ))}
            {monthDays.map(day => {
              const booking = getBookingForDate(day)
              const isCurrentDay = isToday(day)
              
              return (
                <div
                  key={day.toISOString()}
                  className={`
                    p-2 text-sm border rounded-md transition-colors
                    ${isCurrentDay ? 'bg-blue-100 border-blue-300' : 'border-gray-200'}
                    ${booking ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'}
                  `}
                >
                  <div className="font-medium">{format(day, 'd')}</div>
                  {booking && (
                    <div className="mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full mx-auto"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Upcoming Bookings List */}
          <div className="space-y-3 max-h-40 overflow-y-auto">
            <h4 className="font-medium text-gray-900">Upcoming Bookings</h4>
            {bookings.slice(0, 3).map(booking => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Calendar className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{booking.loft_name}</p>
                    <p className="text-xs text-gray-600">{booking.client_name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(booking.check_in), 'MMM d')} - {format(new Date(booking.check_out), 'MMM d')}
                      <Users className="h-3 w-3 ml-2" />
                      {booking.guests} guests
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}