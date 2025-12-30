'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BookingFlow } from './booking-flow'
import { 
  MapPin, 
  Star, 
  Users, 
  Wifi, 
  Car, 
  Coffee,
  Tv,
  Wind,
  Shield,
  ArrowLeft,
  Calendar,
  Heart,
  Share2
} from 'lucide-react'
import { ClientLoftView, LoftReview } from '@/lib/types'

interface LoftDetailProps {
  loft: ClientLoftView
  onBack: () => void
  onBookingStart: (loft: ClientLoftView) => void
  onBookingComplete?: (bookingId: string) => void
}

export function LoftDetail({ loft, onBack, onBookingStart, onBookingComplete }: LoftDetailProps) {
  const [reviews, setReviews] = useState<LoftReview[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)
  const [showBookingFlow, setShowBookingFlow] = useState(false)

  useEffect(() => {
    loadReviews()
  }, [loft.id])

  const loadReviews = async () => {
    setIsLoadingReviews(true)
    try {
      const response = await fetch(`/api/lofts/${loft.id}/reviews`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
      }
    } catch (error) {
      console.error('Failed to load reviews:', error)
    } finally {
      setIsLoadingReviews(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  // Mock amenities for now
  const amenities = [
    { icon: Wifi, label: 'WiFi gratuit' },
    { icon: Car, label: 'Parking' },
    { icon: Coffee, label: 'Cuisine équipée' },
    { icon: Tv, label: 'Télévision' },
    { icon: Wind, label: 'Climatisation' },
    { icon: Shield, label: 'Sécurisé' }
  ]

  if (showBookingFlow) {
    return (
      <BookingFlow
        loft={loft}
        onBack={() => setShowBookingFlow(false)}
        onComplete={(bookingId) => {
          setShowBookingFlow(false)
          onBookingComplete?.(bookingId)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la recherche
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Partager
          </Button>
          <Button variant="outline" size="sm">
            <Heart className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <Card>
            <CardContent className="p-0">
              <div className="h-64 md:h-96 bg-gray-200 rounded-t-lg flex items-center justify-center">
                <span className="text-gray-500">Photos du loft</span>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{loft.name}</CardTitle>
                  <CardDescription className="flex items-center mt-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {loft.address}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {renderStars(loft.average_rating)}
                  <span className="text-sm text-gray-600 ml-1">
                    {loft.average_rating.toFixed(1)} ({loft.review_count} avis)
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    Jusqu'à 4 voyageurs
                  </div>
                  <Badge variant="secondary">{loft.status}</Badge>
                </div>

                {loft.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-gray-600">{loft.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Équipements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {amenities.map((amenity, index) => {
                  const Icon = amenity.icon
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <span className="text-sm">{amenity.label}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Host Info */}
          <Card>
            <CardHeader>
              <CardTitle>Votre hôte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold">
                    {loft.partner.business_name || loft.partner.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Hôte depuis 2023
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                {loft.average_rating.toFixed(1)} · {loft.review_count} avis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingReviews ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-600">
                          {new Date(review.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {review.review_text && (
                        <p className="text-gray-700">{review.review_text}</p>
                      )}
                    </div>
                  ))}
                  {reviews.length > 3 && (
                    <Button variant="outline" className="w-full">
                      Voir tous les avis ({reviews.length})
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">Aucun avis pour le moment</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Booking */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {formatPrice(loft.price_per_night)}
                </span>
                <span className="text-gray-600">/ nuit</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setShowBookingFlow(true)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Réserver
              </Button>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Prix de base</span>
                  <span>{formatPrice(loft.price_per_night)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Frais de service</span>
                  <span>Calculés à l'étape suivante</span>
                </div>
              </div>

              <Separator />

              <div className="text-xs text-gray-500 text-center">
                Vous ne serez débité qu'après confirmation
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}