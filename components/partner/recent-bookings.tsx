"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Users, MapPin, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'

interface RecentBooking {
  id: string
  booking_reference: string
  loft_name: string
  loft_address: string
  client_name: string
  client_email: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: 'pending' | 'paid' | 'refunded'
  created_at: string
}

interface RecentBookingsProps {
  userId: string
}

export function RecentBookings({ userId }: RecentBookingsProps) {
  const [bookings, setBookings] = useState<RecentBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentBookings()
  }, [userId])

  const fetchRecentBookings = async () => {
    try {
      setLoading(true)
      
      // For now, use mock data - replace with actual API call
      const mockBookings: RecentBooking[] = [
        {
          id: '1',
          booking_reference: 'BK20240115-ABC123',
          loft_name: 'Modern Loft Downtown',
          loft_address: 'Rue Didouche Mourad, Alger',
          client_name: 'Ahmed Benali',
          client_email: 'ahmed.benali@email.com',
          check_in: '2024-01-15',
          check_out: '2024-01-18',
          guests: 2,
          total_price: 15000,
          status: 'confirmed',
          payment_status: 'paid',
          created_at: '2024-01-10T10:00:00Z'
        },
        {
          id: '2',
          booking_reference: 'BK20240120-DEF456',
          loft_name: 'Cozy Studio Hydra',
          loft_address: 'Chemin des Glycines, Hydra',
          client_name: 'Fatima Zohra',
          client_email: 'fatima.zohra@email.com',
          check_in: '2024-01-20',
          check_out: '2024-01-25',
          guests: 1,
          total_price: 12500,
          status: 'pending',
          payment_status: 'pending',
          created_at: '2024-01-12T14:30:00Z'
        },
        {
          id: '3',
          booking_reference: 'BK20240128-GHI789',
          loft_name: 'Luxury Apartment',
          loft_address: 'Boulevard Mohamed V, Oran',
          client_name: 'Karim Messaoud',
          client_email: 'karim.messaoud@email.com',
          check_in: '2024-01-28',
          check_out: '2024-01-30',
          guests: 4,
          total_price: 18000,
          status: 'confirmed',
          payment_status: 'paid',
          created_at: '2024-01-13T09:15:00Z'
        }
      ]
      
      setBookings(mockBookings)
    } catch (error) {
      console.error('Error fetching recent bookings:', error)
    } finally {
      setLoading(false)
    }
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'refunded':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <Clock className="h-6 w-6 text-green-600" />
          Recent Bookings
        </CardTitle>
        <p className="text-sm text-gray-600">Latest reservation activity</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No recent bookings</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 border rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{booking.loft_name}</h4>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                      <MapPin className="h-3 w-3" />
                      {booking.loft_address}
                    </div>
                    <p className="text-sm text-gray-700">
                      <strong>{booking.client_name}</strong> • {booking.client_email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-green-600">
                      {formatCurrency(booking.total_price)}
                    </p>
                    <Badge className={getPaymentStatusColor(booking.payment_status)} variant="secondary">
                      {booking.payment_status}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(booking.check_in), 'MMM d')} - {format(new Date(booking.check_out), 'MMM d')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {booking.guests} guests
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {booking.booking_reference}
                    </span>
                    <Button size="sm" variant="outline" className="h-7">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Message
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}