'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CreditCard,
  MessageCircle,
  Star,
  Search,
  Plus,
  Eye,
  AlertCircle
} from 'lucide-react'
import { BookingWithDetails } from '@/lib/types'

interface ClientDashboardProps {
  onSearchLofts: () => void
  onViewBooking: (bookingId: string) => void
}

export function ClientDashboard({ onSearchLofts, onViewBooking }: ClientDashboardProps) {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/bookings')
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings)
      }
    } catch (error) {
      console.error('Failed to load bookings:', error)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, label: 'En attente' },
      confirmed: { variant: 'default' as const, label: 'Confirmé' },
      cancelled: { variant: 'destructive' as const, label: 'Annulé' },
      completed: { variant: 'outline' as const, label: 'Terminé' }
    }
    
    const config = variants[status as keyof typeof variants] || variants.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPaymentStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, label: 'En attente' },
      paid: { variant: 'default' as const, label: 'Payé' },
      refunded: { variant: 'outline' as const, label: 'Remboursé' },
      failed: { variant: 'destructive' as const, label: 'Échec' }
    }
    
    const config = variants[status as keyof typeof variants] || variants.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const filterBookings = (status: string) => {
    const now = new Date()
    
    switch (status) {
      case 'upcoming':
        return bookings.filter(booking => 
          new Date(booking.check_in) > now && 
          ['pending', 'confirmed'].includes(booking.status)
        )
      case 'past':
        return bookings.filter(booking => 
          new Date(booking.check_out) < now || 
          booking.status === 'completed'
        )
      case 'cancelled':
        return bookings.filter(booking => booking.status === 'cancelled')
      default:
        return bookings
    }
  }

  const upcomingBookings = filterBookings('upcoming')
  const pastBookings = filterBookings('past')
  const cancelledBookings = filterBookings('cancelled')

  const renderMobileBookingCard = (booking: BookingWithDetails) => (
    <Card key={booking.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-1 line-clamp-1">{booking.loft.name}</h3>
              <div className="flex items-center text-gray-600 text-xs mb-2">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="line-clamp-1">{booking.loft.address}</span>
              </div>
            </div>
            <div className="text-right ml-2">
              <div className="text-base font-semibold mb-1">
                {formatPrice(booking.total_price)}
              </div>
              <div className="space-y-1">
                {getStatusBadge(booking.status)}
              </div>
            </div>
          </div>

          {/* Dates and Guests */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
            </div>
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {booking.guests} voyageur{booking.guests > 1 ? 's' : ''}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-xs text-gray-500">
              Réf: {booking.booking_reference}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewBooking(booking.id)}
                className="h-8 px-3 text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                Détails
              </Button>
              {booking.status === 'confirmed' && (
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Contact
                </Button>
              )}
            </div>
          </div>

          {booking.special_requests && (
            <div className="mt-3 p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-700">
                <strong>Demandes spéciales:</strong> {booking.special_requests}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderDesktopBookingCard = (booking: BookingWithDetails) => (
    <Card key={booking.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{booking.loft.name}</h3>
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              {booking.loft.address}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {booking.guests} voyageur{booking.guests > 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold mb-2">
              {formatPrice(booking.total_price)}
            </div>
            <div className="space-y-1">
              {getStatusBadge(booking.status)}
              {getPaymentStatusBadge(booking.payment_status)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Réf: {booking.booking_reference}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewBooking(booking.id)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Détails
            </Button>
            {booking.status === 'confirmed' && (
              <Button variant="outline" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contacter
              </Button>
            )}
          </div>
        </div>

        {booking.special_requests && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Demandes spéciales:</strong> {booking.special_requests}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4 md:space-y-6 px-4 md:px-0">
      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">Mon tableau de bord</h1>
          <p className="text-gray-600 text-sm">Gérez vos réservations et découvrez de nouveaux lofts</p>
          <Button onClick={onSearchLofts} className="w-full h-12">
            <Search className="w-4 h-4 mr-2" />
            Rechercher des lofts
          </Button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mon tableau de bord</h1>
          <p className="text-gray-600 mt-1">Gérez vos réservations et découvrez de nouveaux lofts</p>
        </div>
        <Button onClick={onSearchLofts}>
          <Search className="w-4 h-4 mr-2" />
          Rechercher des lofts
        </Button>
      </div>

      {/* Mobile Quick Stats */}
      <div className="md:hidden grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Calendar className="w-6 h-6 text-blue-600" />
                <p className="text-xl font-bold">{upcomingBookings.length}</p>
              </div>
              <p className="text-xs font-medium text-gray-600">À venir</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Star className="w-6 h-6 text-yellow-600" />
                <p className="text-xl font-bold">{pastBookings.length}</p>
              </div>
              <p className="text-xs font-medium text-gray-600">Terminés</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <CreditCard className="w-6 h-6 text-green-600" />
                <p className="text-sm font-bold">
                  {formatPrice(
                    pastBookings.reduce((sum, booking) => sum + booking.total_price, 0)
                  )}
                </p>
              </div>
              <p className="text-xs font-medium text-gray-600">Dépensé</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <p className="text-xl font-bold">{cancelledBookings.length}</p>
              </div>
              <p className="text-xs font-medium text-gray-600">Annulés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Quick Stats */}
      <div className="hidden md:grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Réservations à venir</p>
                <p className="text-2xl font-bold">{upcomingBookings.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Séjours terminés</p>
                <p className="text-2xl font-bold">{pastBookings.length}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total dépensé</p>
                <p className="text-2xl font-bold">
                  {formatPrice(
                    pastBookings.reduce((sum, booking) => sum + booking.total_price, 0)
                  )}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Annulations</p>
                <p className="text-2xl font-bold">{cancelledBookings.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">
            À venir ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Terminés ({pastBookings.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Annulés ({cancelledBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 md:p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingBookings.length > 0 ? (
            <>
              {/* Mobile Bookings */}
              <div className="md:hidden space-y-3">
                {upcomingBookings.map(renderMobileBookingCard)}
              </div>
              {/* Desktop Bookings */}
              <div className="hidden md:block space-y-4">
                {upcomingBookings.map(renderDesktopBookingCard)}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 md:p-8 text-center">
                <Calendar className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                  Aucune réservation à venir
                </h3>
                <p className="text-sm md:text-base text-gray-600 mb-4">
                  Découvrez nos lofts exceptionnels et réservez votre prochain séjour.
                </p>
                <Button onClick={onSearchLofts} className="w-full md:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Réserver un loft
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastBookings.length > 0 ? (
            <>
              {/* Mobile Bookings */}
              <div className="md:hidden space-y-3">
                {pastBookings.map(renderMobileBookingCard)}
              </div>
              {/* Desktop Bookings */}
              <div className="hidden md:block space-y-4">
                {pastBookings.map(renderDesktopBookingCard)}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 md:p-8 text-center">
                <Star className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                  Aucun séjour terminé
                </h3>
                <p className="text-sm md:text-base text-gray-600">
                  Vos séjours passés apparaîtront ici.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledBookings.length > 0 ? (
            <>
              {/* Mobile Bookings */}
              <div className="md:hidden space-y-3">
                {cancelledBookings.map(renderMobileBookingCard)}
              </div>
              {/* Desktop Bookings */}
              <div className="hidden md:block space-y-4">
                {cancelledBookings.map(renderDesktopBookingCard)}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 md:p-8 text-center">
                <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                  Aucune annulation
                </h3>
                <p className="text-sm md:text-base text-gray-600">
                  Les réservations annulées apparaîtront ici.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}