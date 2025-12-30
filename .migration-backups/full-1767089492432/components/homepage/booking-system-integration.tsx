'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Users, MapPin, Star, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useUserSession } from '@/lib/hooks/use-homepage-data'
import { homepageIntegration, type LoftAvailabilityData } from '@/lib/services/homepage-integration'

interface BookingSystemIntegrationProps {
  loft: LoftAvailabilityData
  checkIn?: string
  checkOut?: string
  guests?: number
  locale?: string
  onBookingSuccess?: (bookingId: string) => void
}

export function BookingSystemIntegration({
  loft,
  checkIn,
  checkOut,
  guests = 1,
  locale = 'fr',
  onBookingSuccess
}: BookingSystemIntegrationProps) {
  const { session, isLoading: sessionLoading } = useUserSession()
  const router = useRouter()
  
  const [availability, setAvailability] = useState<{
    available: boolean
    pricing?: any
    loading: boolean
    error?: string
  }>({
    available: loft.is_available,
    loading: false
  })
  
  const [bookingState, setBookingState] = useState<{
    processing: boolean
    success: boolean
    error?: string
  }>({
    processing: false,
    success: false
  })

  // Check real-time availability when dates change
  useEffect(() => {
    if (checkIn && checkOut) {
      checkRealTimeAvailability()
    }
  }, [checkIn, checkOut, guests, loft.id])

  const checkRealTimeAvailability = async () => {
    if (!checkIn || !checkOut) return

    setAvailability(prev => ({ ...prev, loading: true, error: undefined }))

    try {
      const result = await homepageIntegration.checkLoftAvailability(
        loft.id,
        checkIn,
        checkOut,
        guests
      )

      setAvailability({
        available: result.available,
        pricing: result.pricing,
        loading: false,
        error: result.blocked_reason && !result.available ? result.blocked_reason : undefined
      })
    } catch (error) {
      console.error('Error checking availability:', error)
      setAvailability({
        available: false,
        loading: false,
        error: 'Unable to check availability'
      })
    }
  }

  const handleBookingClick = async () => {
    if (!session) {
      // Redirect to login with return URL for seamless auth
      const returnUrl = encodeURIComponent(
        `/${locale}/lofts/${loft.id}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`
      )
      router.push(`/${locale}/login?return_to=${returnUrl}`)
      return
    }

    if (!checkIn || !checkOut || !availability.available) {
      return
    }

    setBookingState({ processing: true, success: false })

    try {
      // Create booking through API
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          loft_id: loft.id,
          check_in: checkIn,
          check_out: checkOut,
          guests,
          total_price: availability.pricing?.total_price || loft.price_per_night,
          special_requests: ''
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Booking failed')
      }

      const booking = await response.json()
      
      setBookingState({ processing: false, success: true })
      
      if (onBookingSuccess) {
        onBookingSuccess(booking.booking.id)
      } else {
        // Redirect to booking confirmation
        router.push(`/${locale}/bookings/${booking.booking.id}`)
      }
    } catch (error) {
      console.error('Booking error:', error)
      setBookingState({
        processing: false,
        success: false,
        error: error instanceof Error ? error.message : 'Booking failed'
      })
    }
  }

  const formatPrice = (price: number, currency: string = 'DZD') => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price)
  }

  const getAvailabilityStatus = () => {
    if (availability.loading) {
      return { icon: <Clock className="h-4 w-4" />, text: 'Vérification...', variant: 'secondary' as const }
    }
    
    if (availability.available) {
      return { icon: <CheckCircle className="h-4 w-4" />, text: 'Disponible', variant: 'default' as const }
    }
    
    return { icon: <AlertCircle className="h-4 w-4" />, text: 'Non disponible', variant: 'destructive' as const }
  }

  const status = getAvailabilityStatus()

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {/* Loft Image */}
        <div className="aspect-[4/3] relative overflow-hidden">
          {loft.images && loft.images.length > 0 ? (
            <img
              src={loft.images[0]}
              alt={loft.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">Pas d'image</span>
            </div>
          )}
          
          {/* Real-time Availability Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant={status.variant} className="flex items-center gap-1">
              {status.icon}
              {status.text}
            </Badge>
          </div>

          {/* Instant Book Badge */}
          {loft.instant_book && availability.available && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Réservation instantanée
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Location and Rating */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{loft.location.city}, {loft.location.region}</span>
            </div>
            {loft.rating > 0 && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium ml-1">
                  {loft.rating} ({loft.review_count})
                </span>
              </div>
            )}
          </div>

          {/* Loft Name */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {loft.name}
          </h3>

          {/* Pricing Display */}
          <div className="mb-4">
            {availability.pricing && checkIn && checkOut ? (
              <div>
                <div className="text-2xl font-bold">
                  {formatPrice(availability.pricing.total_price)}
                </div>
                <div className="text-sm text-gray-600">
                  pour {availability.pricing.nights} nuit{availability.pricing.nights > 1 ? 's' : ''}
                </div>
                <div className="text-sm text-gray-500">
                  {formatPrice(loft.price_per_night)} / nuit
                </div>
              </div>
            ) : (
              <div>
                <div className="text-2xl font-bold">
                  {formatPrice(loft.price_per_night, loft.currency)}
                </div>
                <div className="text-sm text-gray-600">/ nuit</div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {availability.error && (
            <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {availability.error}
            </div>
          )}

          {/* Booking Success */}
          {bookingState.success && (
            <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              Réservation créée avec succès !
            </div>
          )}

          {/* Booking Error */}
          {bookingState.error && (
            <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              {bookingState.error}
            </div>
          )}

          {/* Booking Actions */}
          <div className="space-y-2">
            {sessionLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : availability.available && checkIn && checkOut ? (
              <Button 
                onClick={handleBookingClick}
                className="w-full"
                disabled={bookingState.processing || availability.loading}
              >
                {bookingState.processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Réservation en cours...
                  </>
                ) : session ? (
                  'Réserver maintenant'
                ) : (
                  'Se connecter pour réserver'
                )}
              </Button>
            ) : availability.available ? (
              <Button 
                onClick={() => router.push(`/${locale}/lofts/${loft.id}`)}
                className="w-full"
                variant="default"
              >
                Voir les disponibilités
              </Button>
            ) : (
              <Button 
                disabled
                className="w-full"
                variant="outline"
              >
                Non disponible
              </Button>
            )}
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push(`/${locale}/lofts/${loft.id}`)}
            >
              Voir les détails
            </Button>
          </div>

          {/* Guest Count Display */}
          {guests > 1 && (
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              <span>{guests} voyageur{guests > 1 ? 's' : ''}</span>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}

// Grid component for multiple lofts with booking integration
interface BookingSystemGridProps {
  lofts: LoftAvailabilityData[]
  checkIn?: string
  checkOut?: string
  guests?: number
  locale?: string
  isLoading?: boolean
  onBookingSuccess?: (bookingId: string) => void
}

export function BookingSystemGrid({
  lofts,
  checkIn,
  checkOut,
  guests = 1,
  locale = 'fr',
  isLoading = false,
  onBookingSuccess
}: BookingSystemGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full" />
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-1/2 mb-3" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (lofts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          <Calendar className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Aucun loft trouvé</h3>
          <p className="text-sm">
            Essayez de modifier vos critères de recherche ou vos dates.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {lofts.map((loft) => (
        <BookingSystemIntegration
          key={loft.id}
          loft={loft}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          locale={locale}
          onBookingSuccess={onBookingSuccess}
        />
      ))}
    </div>
  )
}