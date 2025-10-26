'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Users, MapPin, Star, Wifi, Car, Coffee, Tv } from 'lucide-react'
import { homepageIntegration, type LoftAvailabilityData } from '@/lib/services/homepage-integration'
import { QuickBookingIntegration } from './seamless-auth-integration'

interface RealTimeAvailabilityProps {
  loft: LoftAvailabilityData
  checkIn?: string
  checkOut?: string
  guests?: number
  locale?: string
  onBookingClick?: (loftId: string) => void
}

export function RealTimeAvailabilityCard({ 
  loft, 
  checkIn, 
  checkOut, 
  guests = 1,
  locale = 'fr',
  onBookingClick 
}: RealTimeAvailabilityProps) {
  const [availability, setAvailability] = useState<{
    available: boolean
    pricing?: any
    loading: boolean
  }>({
    available: loft.is_available,
    loading: false
  })

  // Check availability when dates change
  useEffect(() => {
    if (checkIn && checkOut) {
      checkAvailability()
    }
  }, [checkIn, checkOut, guests, loft.id])

  const checkAvailability = async () => {
    if (!checkIn || !checkOut) return

    setAvailability(prev => ({ ...prev, loading: true }))

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
        loading: false
      })
    } catch (error) {
      console.error('Error checking availability:', error)
      setAvailability({
        available: false,
        loading: false
      })
    }
  }

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase()
    if (amenityLower.includes('wifi') || amenityLower.includes('internet')) return <Wifi className="h-4 w-4" />
    if (amenityLower.includes('parking') || amenityLower.includes('garage')) return <Car className="h-4 w-4" />
    if (amenityLower.includes('kitchen') || amenityLower.includes('cuisine')) return <Coffee className="h-4 w-4" />
    if (amenityLower.includes('tv') || amenityLower.includes('télé')) return <Tv className="h-4 w-4" />
    return null
  }

  const formatPrice = (price: number, currency: string = 'DZD') => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price)
  }

  const handleBookingClick = () => {
    if (onBookingClick) {
      onBookingClick(loft.id)
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        {/* Image Gallery */}
        <div className="aspect-[4/3] relative overflow-hidden">
          {loft.images && loft.images.length > 0 ? (
            <img
              src={loft.images[0]}
              alt={loft.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">Pas d'image</span>
            </div>
          )}
          
          {/* Availability Badge */}
          <div className="absolute top-3 left-3">
            {availability.loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <Badge 
                variant={availability.available ? "default" : "destructive"}
                className="bg-white/90 text-gray-900 hover:bg-white"
              >
                {availability.available ? 'Disponible' : 'Non disponible'}
              </Badge>
            )}
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

          {/* Amenities */}
          {loft.amenities && loft.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {loft.amenities.slice(0, 4).map((amenity, index) => (
                <div key={index} className="flex items-center text-xs text-gray-600">
                  {getAmenityIcon(amenity)}
                  <span className="ml-1">{amenity}</span>
                </div>
              ))}
              {loft.amenities.length > 4 && (
                <span className="text-xs text-gray-500">
                  +{loft.amenities.length - 4} autres
                </span>
              )}
            </div>
          )}

          {/* Pricing */}
          <div className="flex items-center justify-between mb-4">
            <div>
              {availability.pricing ? (
                <div>
                  <span className="text-2xl font-bold">
                    {formatPrice(availability.pricing.total_price)}
                  </span>
                  <span className="text-sm text-gray-600 ml-1">
                    pour {availability.pricing.nights} nuit{availability.pricing.nights > 1 ? 's' : ''}
                  </span>
                  <div className="text-sm text-gray-500">
                    {formatPrice(loft.price_per_night)} / nuit
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-2xl font-bold">
                    {formatPrice(loft.price_per_night, loft.currency)}
                  </span>
                  <span className="text-sm text-gray-600 ml-1">/ nuit</span>
                </div>
              )}
            </div>
          </div>

          {/* Booking Actions */}
          <div className="space-y-2">
            {availability.available && checkIn && checkOut ? (
              <QuickBookingIntegration
                loftId={loft.id}
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests}
                locale={locale}
              />
            ) : availability.available ? (
              <Button 
                onClick={handleBookingClick}
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
              onClick={() => window.open(`/${locale}/lofts/${loft.id}`, '_blank')}
            >
              Voir les détails
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

// Grid component for multiple lofts
interface RealTimeAvailabilityGridProps {
  lofts: LoftAvailabilityData[]
  checkIn?: string
  checkOut?: string
  guests?: number
  locale?: string
  isLoading?: boolean
  onBookingClick?: (loftId: string) => void
}

export function RealTimeAvailabilityGrid({
  lofts,
  checkIn,
  checkOut,
  guests = 1,
  locale = 'fr',
  isLoading = false,
  onBookingClick
}: RealTimeAvailabilityGridProps) {
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
        <RealTimeAvailabilityCard
          key={loft.id}
          loft={loft}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          locale={locale}
          onBookingClick={onBookingClick}
        />
      ))}
    </div>
  )
}