'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock, 
  Users,
  Eye,
  Plus,
  Settings
} from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'

interface BookingEvent {
  id: string
  loft_name: string
  client_name: string
  check_in: string
  check_out: string
  guests: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  total_price: number
}

interface MobilePartnerCalendarProps {
  userId: string
  className?: string
}

export function MobilePartnerCalendar({ userId, className = '' }: MobilePartnerCalendarProps) {
  const [bookings, setBookings] = useState<BookingEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [userId, currentDate])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      
      // Mock data for now - replace with actual API call
      const mockBookings: BookingEvent[] = [
        {
          id: '1',
          loft_name: 'Modern Loft Downtown',
          client_name: 'Ahmed Benali',
          check_in: '2024-01-15',
          check_out: '2024-01-18',
          guests: 2,
          status: 'confirmed',
          total_price: 15000
        },
        {
          id: '2',
          loft_name: 'Cozy Studio Hydra',
          client_name: 'Fatima Zohra',
          check_in: '2024-01-20',
          check_out: '2024-01-25',
          guests: 1,
          status: 'pending',
          total_price: 12000
        },
        {
          id: '3',
          loft_name: 'Luxury Apartment',
          client_name: 'Karim Messaoud',
          check_in: '2024-01-28',
          check_out: '2024-01-30',
          guests: 4,
          status: 'confirmed',
          total_price: 25000
        }
      ]
      
      setBookings(mockBookings)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getBookingForDate = (date: Date) => {
    return bookings.find(booking => {
      const checkIn = new Date(booking.check_in)
      const checkOut = new Date(booking.check_out)
      return date >= checkIn && date < checkOut
    })
  }

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
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

  const upcomingBookings = bookings
    .filter(booking => new Date(booking.check_in) > new Date())
    .sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime())
    .slice(0, 3)

  const BookingDetailsSheet = ({ date }: { date: Date }) => {
    const dayBookings = getBookingsForDate(date)
    
    return (
      <Sheet>
        <SheetTrigger asChild>
          <button className="w-full h-full text-left">
            <div className="p-2 text-sm border rounded-md transition-colors hover:bg-gray-50">
              <div className="font-medium">{format(date, 'd')}</div>
              {dayBookings.length > 0 && (
                <div className="mt-1 space-y-1">
                  {dayBookings.slice(0, 2).map(booking => (
                    <div key={booking.id} className="w-2 h-2 bg-green-500 rounded-full"></div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayBookings.length - 2}</div>
                  )}
                </div>
              )}
            </div>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[70vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{format(date, 'EEEE, MMMM d, yyyy', { locale: fr })}</SheetTitle>
            <SheetDescription>
              {dayBookings.length} réservation{dayBookings.length !== 1 ? 's' : ''} ce jour
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            {dayBookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune réservation ce jour</p>
                <Button variant="outline" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Bloquer cette date
                </Button>
              </div>
            ) : (
              dayBookings.map(booking => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base">{booking.loft_name}</h4>
                          <p className="text-sm text-gray-600">{booking.client_name}</p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {format(new Date(booking.check_in), 'MMM d')} - {format(new Date(booking.check_out), 'MMM d')}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {booking.guests} voyageur{booking.guests > 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="font-semibold text-lg">
                          {formatPrice(booking.total_price)}
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Détails
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendrier des réservations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="h-5 w-5 text-purple-600" />
            Calendrier
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {format(currentDate, 'MMMM yyyy', { locale: fr })}
        </p>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Mobile Calendar Grid */}
        <div className="space-y-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              const booking = getBookingForDate(date)
              const isCurrentDay = isToday(date)
              const isCurrentMonth = isSameMonth(date, currentDate)
              
              return (
                <BookingDetailsSheet key={index} date={date}>
                  <div
                    className={`
                      h-12 text-xs border rounded-md transition-colors touch-manipulation
                      ${isCurrentDay ? 'bg-blue-100 border-blue-300' : 'border-gray-200'}
                      ${booking ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'}
                      ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                    `}
                  >
                    <div className="p-1">
                      <div className="font-medium">{format(date, 'd')}</div>
                      {booking && (
                        <div className="mt-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </BookingDetailsSheet>
              )
            })}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Prochaines réservations</h4>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
          
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600">Aucune réservation à venir</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingBookings.map(booking => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <CalendarIcon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{booking.loft_name}</p>
                      <p className="text-xs text-gray-600">{booking.client_name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(booking.check_in), 'MMM d')} - {format(new Date(booking.check_out), 'MMM d')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(booking.status)} variant="outline">
                      {booking.status}
                    </Badge>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatPrice(booking.total_price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}