'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveImage } from '@/components/ui/responsive-image';
import { Modal } from '@/components/ui/modal';
import { 
  MapPin, 
  Star, 
  Users, 
  Calendar, 
  Heart, 
  Eye,
  Wifi,
  Car,
  Coffee,
  Tv,
  Wind,
  Utensils
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LoftCard as LoftCardType } from '@/types/dual-audience';

interface LoftCardProps {
  loft: LoftCardType;
  locale: string;
  onBookingClick: (loftId: string) => void;
  onQuickView: (loft: LoftCardType) => void;
  className?: string;
}

/**
 * Interactive loft card component with booking functionality
 * Implements requirements 2.1, 2.2, 2.5 from the spec
 */
export default function LoftCard({ 
  loft, 
  locale, 
  onBookingClick, 
  onQuickView,
  className 
}: LoftCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  // Multilingual content
  const content = {
    fr: {
      perNight: "par nuit",
      guests: "invités",
      available: "Disponible",
      unavailable: "Indisponible",
      instantBook: "Réservation instantanée",
      bookNow: "Réserver maintenant",
      quickView: "Aperçu rapide",
      viewDetails: "Voir détails",
      rating: "Note",
      reviews: "avis",
      amenities: "Équipements"
    },
    en: {
      perNight: "per night",
      guests: "guests",
      available: "Available",
      unavailable: "Unavailable", 
      instantBook: "Instant booking",
      bookNow: "Book now",
      quickView: "Quick view",
      viewDetails: "View details",
      rating: "Rating",
      reviews: "reviews",
      amenities: "Amenities"
    },
    ar: {
      perNight: "في الليلة",
      guests: "ضيوف",
      available: "متاح",
      unavailable: "غير متاح",
      instantBook: "حجز فوري",
      bookNow: "احجز الآن",
      quickView: "عرض سريع",
      viewDetails: "عرض التفاصيل",
      rating: "التقييم",
      reviews: "مراجعة",
      amenities: "المرافق"
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  // Amenity icons mapping
  const amenityIcons: Record<string, React.ReactNode> = {
    wifi: <Wifi className="h-4 w-4" />,
    parking: <Car className="h-4 w-4" />,
    coffee: <Coffee className="h-4 w-4" />,
    tv: <Tv className="h-4 w-4" />,
    ac: <Wind className="h-4 w-4" />,
    kitchen: <Utensils className="h-4 w-4" />
  };

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'next') {
      setCurrentImageIndex((prev) => 
        prev === loft.images.length - 1 ? 0 : prev + 1
      );
    } else {
      setCurrentImageIndex((prev) => 
        prev === 0 ? loft.images.length - 1 : prev - 1
      );
    }
  };

  const handleQuickView = () => {
    setShowQuickView(true);
    onQuickView(loft);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency === 'DZD' ? 'DZD' : 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -5 }}
        className={cn("group", className)}
      >
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
          {/* Image Gallery - Glissement fluide */}
          <div className="relative aspect-[4/3] overflow-hidden">
            {/* Container de glissement pour les images */}
            <div className="relative w-full h-full">
              {loft.images.map((image, index) => {
                // Calcul de la position pour le glissement fluide
                const position = (index - currentImageIndex) * 100;
                
                return (
                  <div
                    key={index}
                    className="absolute top-0 w-full h-full"
                    style={{
                      left: `${position}%`,
                      transition: 'left 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    }}
                  >
                    <ResponsiveImage
                      src={image}
                      alt={loft.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Image Navigation */}
            {loft.images.length > 1 && (
              <>
                <button
                  onClick={() => handleImageNavigation('prev')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  ←
                </button>
                <button
                  onClick={() => handleImageNavigation('next')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  →
                </button>
                
                {/* Image Indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {loft.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        index === currentImageIndex ? "bg-white" : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Availability Status */}
            <Badge 
              className={cn(
                "absolute top-3 left-3",
                loft.availability.isAvailable 
                  ? "bg-green-500 hover:bg-green-600" 
                  : "bg-red-500 hover:bg-red-600"
              )}
            >
              {loft.availability.isAvailable ? text.available : text.unavailable}
            </Badge>

            {/* Instant Book Badge */}
            {loft.instantBook && (
              <Badge className="absolute top-3 right-12 bg-blue-500 hover:bg-blue-600">
                ⚡ {text.instantBook}
              </Badge>
            )}

            {/* Favorite Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
            </Button>
          </div>

          <CardContent className="p-4">
            {/* Title and Location */}
            <div className="mb-3">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">
                {loft.title}
              </h3>
              <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="line-clamp-1">{loft.location}</span>
              </div>
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-sm">{loft.rating.toFixed(1)}</span>
              </div>
              <span className="text-gray-500 text-sm">
                ({loft.reviewCount} {text.reviews})
              </span>
            </div>

            {/* Amenities */}
            <div className="flex flex-wrap gap-2 mb-4">
              {loft.amenities.slice(0, 4).map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full"
                >
                  {amenityIcons[amenity.toLowerCase()] || <span>•</span>}
                  <span className="capitalize">{amenity}</span>
                </div>
              ))}
              {loft.amenities.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{loft.amenities.length - 4}
                </Badge>
              )}
            </div>

            {/* Guest Capacity */}
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 mb-4">
              <Users className="h-4 w-4" />
              <span>{loft.maxGuests} {text.guests}</span>
            </div>

            {/* Price and Actions */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(loft.pricePerNight, loft.currency)}
                </div>
                <div className="text-sm text-gray-500">
                  {text.perNight}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickView}
                  className="flex items-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  {text.quickView}
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => onBookingClick(loft.id)}
                  disabled={!loft.availability.isAvailable}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Calendar className="h-4 w-4" />
                  {text.bookNow}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick View Modal */}
      <QuickViewModal
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        loft={loft}
        locale={locale}
        onBookingClick={onBookingClick}
      />
    </>
  );
}

/**
 * Quick view modal component for loft details
 */
interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  loft: LoftCardType;
  locale: string;
  onBookingClick: (loftId: string) => void;
}

function QuickViewModal({ isOpen, onClose, loft, locale, onBookingClick }: QuickViewModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const content = {
    fr: {
      quickView: "Aperçu rapide",
      description: "Description",
      amenities: "Équipements",
      bookNow: "Réserver maintenant",
      viewFullDetails: "Voir tous les détails",
      close: "Fermer",
      perNight: "par nuit",
      guests: "invités max",
      minimumStay: "Séjour minimum",
      nights: "nuits"
    },
    en: {
      quickView: "Quick view",
      description: "Description", 
      amenities: "Amenities",
      bookNow: "Book now",
      viewFullDetails: "View full details",
      close: "Close",
      perNight: "per night",
      guests: "max guests",
      minimumStay: "Minimum stay",
      nights: "nights"
    },
    ar: {
      quickView: "عرض سريع",
      description: "الوصف",
      amenities: "المرافق",
      bookNow: "احجز الآن",
      viewFullDetails: "عرض جميع التفاصيل",
      close: "إغلاق",
      perNight: "في الليلة",
      guests: "ضيوف كحد أقصى",
      minimumStay: "الحد الأدنى للإقامة",
      nights: "ليالي"
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">{text.quickView}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Image Gallery - Glissement fluide */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              {/* Container de glissement pour les images */}
              <div className="relative w-full h-full">
                {loft.images.map((image, index) => {
                  // Calcul de la position pour le glissement fluide
                  const position = (index - currentImageIndex) * 100;
                  
                  return (
                    <div
                      key={index}
                      className="absolute top-0 w-full h-full"
                      style={{
                        left: `${position}%`,
                        transition: 'left 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)',
                      }}
                    >
                      <ResponsiveImage
                        src={image}
                        alt={loft.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            
            {loft.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {loft.images.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "aspect-square rounded-lg overflow-hidden border-2 transition-colors",
                      index === currentImageIndex ? "border-blue-500" : "border-transparent"
                    )}
                  >
                    <ResponsiveImage
                      src={image}
                      alt={`${loft.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">{loft.title}</h3>
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <MapPin className="h-4 w-4 mr-1" />
                {loft.location}
              </div>
            </div>

            {/* Key Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{text.guests}:</span>
                <span className="ml-2 font-medium">{loft.maxGuests}</span>
              </div>
              <div>
                <span className="text-gray-500">{text.minimumStay}:</span>
                <span className="ml-2 font-medium">{loft.availability.minimumStay} {text.nights}</span>
              </div>
            </div>

            {/* Description */}
            {loft.description && (
              <div>
                <h4 className="font-medium mb-2">{text.description}</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {loft.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            <div>
              <h4 className="font-medium mb-3">{text.amenities}</h4>
              <div className="grid grid-cols-2 gap-2">
                {loft.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="capitalize">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price and Actions */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat(locale, {
                      style: 'currency',
                      currency: loft.currency === 'DZD' ? 'DZD' : 'EUR',
                      minimumFractionDigits: 0
                    }).format(loft.pricePerNight)}
                  </div>
                  <div className="text-sm text-gray-500">{text.perNight}</div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{loft.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                >
                  {text.viewFullDetails}
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    onBookingClick(loft.id);
                    onClose();
                  }}
                  disabled={!loft.availability.isAvailable}
                >
                  {text.bookNow}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}