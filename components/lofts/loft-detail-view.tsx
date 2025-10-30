"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { 
  MapPin, 
  Users, 
  Bed, 
  Bath, 
  Wifi, 
  Car, 
  Star, 
  Calendar,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import { LoftDetails } from "@/lib/services/loft"
import { formatCurrencyAuto } from "@/utils/currency-formatter"

interface LoftDetailViewProps {
  loftId: string
  onBookingClick?: (loft: LoftDetails) => void
  onBackClick?: () => void
  showBookingButton?: boolean
}

interface DetailState {
  loft: LoftDetails | null
  loading: boolean
  error: string | null
  selectedPhotoIndex: number
  isFavorite: boolean
}

export function LoftDetailView({ 
  loftId, 
  onBookingClick, 
  onBackClick, 
  showBookingButton = true 
}: LoftDetailViewProps) {
  const t = useTranslations('lofts')
  const tCommon = useTranslations('common')

  const [state, setState] = useState<DetailState>({
    loft: null,
    loading: true,
    error: null,
    selectedPhotoIndex: 0,
    isFavorite: false
  })

  useEffect(() => {
    fetchLoftDetails()
  }, [loftId])

  const fetchLoftDetails = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(`/api/lofts/${loftId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch loft details')
      }

      const data = await response.json()
      setState(prev => ({ 
        ...prev, 
        loft: data.loft, 
        loading: false 
      }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load loft details',
        loading: false 
      }))
    }
  }

  const toggleFavorite = () => {
    setState(prev => ({ ...prev, isFavorite: !prev.isFavorite }))
    // TODO: Implement favorite functionality with backend
  }

  const shareLoft = async () => {
    if (navigator.share && state.loft) {
      try {
        await navigator.share({
          title: state.loft.name,
          text: state.loft.description,
          url: window.location.href,
        })
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href)
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const getAmenityIcon = (category: string) => {
    switch (category) {
      case 'basic':
        return <Wifi className="h-4 w-4" />
      case 'outdoor':
        return <Car className="h-4 w-4" />
      case 'safety':
        return <Shield className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const formatTime = (time: string) => {
    if (!time) return ''
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (state.loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-8" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>

        {/* Photo Gallery Skeleton */}
        <Skeleton className="h-96 w-full rounded-lg" />

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Loft</h3>
        <p className="text-gray-600 mb-4">{state.error}</p>
        <Button onClick={fetchLoftDetails} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (!state.loft) {
    return (
      <div className="text-center py-12">
        <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Loft Not Found</h3>
        <p className="text-gray-600">The requested loft could not be found.</p>
      </div>
    )
  }

  const { loft } = state

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {onBackClick && (
          <Button variant="ghost" size="sm" onClick={onBackClick}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        )}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={shareLoft}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleFavorite}
            className={cn(state.isFavorite && "text-red-500")}
          >
            <Heart className={cn("h-4 w-4", state.isFavorite && "fill-current")} />
          </Button>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="relative">
        {loft.photos.length > 0 ? (
          <Carousel className="w-full">
            <CarouselContent>
              {loft.photos.map((photo, index) => (
                <CarouselItem key={photo.id}>
                  <div className="relative h-96 bg-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src={photo.url} 
                      alt={photo.alt_text || loft.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {loft.photos.length > 1 && (
              <>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </>
            )}
          </Carousel>
        ) : (
          <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
            <MapPin className="h-16 w-16 text-gray-400" />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{loft.name}</h1>
              {loft.average_rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{loft.average_rating.toFixed(1)}</span>
                  <span className="text-gray-500">({loft.review_count} reviews)</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1 text-gray-600 mb-4">
              <MapPin className="h-4 w-4" />
              <span>{loft.address}</span>
              {loft.zone_name && (
                <>
                  <span>•</span>
                  <span>{loft.zone_name}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-6 text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{loft.max_guests} guests</span>
              </div>
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{loft.bedrooms} bedroom{loft.bedrooms !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                <span>{loft.bathrooms} bathroom{loft.bathrooms !== 1 ? 's' : ''}</span>
              </div>
              {loft.area_sqm && (
                <div>{loft.area_sqm}m²</div>
              )}
            </div>
          </div>

          <Separator />

          {/* Description */}
          {loft.description && (
            <div>
              <h2 className="text-xl font-semibold mb-3">About this place</h2>
              <p className="text-gray-700 leading-relaxed">{loft.description}</p>
            </div>
          )}

          {/* Amenities */}
          {loft.amenities.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Amenities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {loft.amenities.map((amenity) => (
                  <div key={amenity.id} className="flex items-center gap-3">
                    {getAmenityIcon(amenity.category)}
                    <span>{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* House Rules */}
          {loft.house_rules && (
            <div>
              <h2 className="text-xl font-semibold mb-3">House Rules</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>Check-in: {formatTime(loft.check_in_time || '15:00')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>Check-out: {formatTime(loft.check_out_time || '11:00')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Min stay: {loft.minimum_stay} night{loft.minimum_stay !== 1 ? 's' : ''}</span>
                  </div>
                  {loft.maximum_stay && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Max stay: {loft.maximum_stay} nights</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-gray-700 whitespace-pre-line">{loft.house_rules}</p>
                </div>
              </div>
            </div>
          )}

          {/* Reviews */}
          {loft.recent_reviews.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Recent Reviews ({loft.review_count})
              </h2>
              <div className="space-y-4">
                {loft.recent_reviews.slice(0, 3).map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {review.client_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{review.client_name}</span>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={cn(
                                    "h-3 w-3",
                                    i < review.rating 
                                      ? "fill-yellow-400 text-yellow-400" 
                                      : "text-gray-300"
                                  )} 
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {review.review_text && (
                            <p className="text-gray-700 text-sm">{review.review_text}</p>
                          )}
                          {review.response_text && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <span className="font-medium">Host response:</span>
                              <p className="text-gray-700 mt-1">{review.response_text}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Booking Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold">
                    {formatCurrencyAuto(loft.price_per_night, 'DZD')}
                  </span>
                  <span className="text-gray-600 text-base font-normal"> / night</span>
                </div>
                {loft.average_rating > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{loft.average_rating.toFixed(1)}</span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pricing Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Base rate per night</span>
                  <span>{formatCurrencyAuto(loft.price_per_night, 'DZD')}</span>
                </div>
                {loft.cleaning_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Cleaning fee</span>
                    <span>{formatCurrencyAuto(loft.cleaning_fee, 'DZD')}</span>
                  </div>
                )}
                {loft.tax_rate > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Taxes ({loft.tax_rate}%)</span>
                    <span>Calculated at checkout</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Booking Button */}
              {showBookingButton && onBookingClick && (
                <Button 
                  onClick={() => onBookingClick(loft)} 
                  className="w-full"
                  size="lg"
                >
                  Reserve Now
                </Button>
              )}

              {/* Additional Info */}
              <div className="text-xs text-gray-600 space-y-1">
                <p>• Free cancellation within {loft.cancellation_policy || 'flexible'} policy</p>
                <p>• Minimum stay: {loft.minimum_stay} night{loft.minimum_stay !== 1 ? 's' : ''}</p>
                {loft.owner_name && (
                  <p>• Hosted by {loft.owner_name}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}