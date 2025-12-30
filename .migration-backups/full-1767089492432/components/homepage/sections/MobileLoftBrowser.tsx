'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResponsiveImage } from '@/components/ui/responsive-image';
import { 
  MapPin, 
  Star, 
  Users, 
  Calendar, 
  Heart, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LoftCard as LoftCardType } from '@/types/dual-audience';

interface MobileLoftBrowserProps {
  lofts: LoftCardType[];
  locale: string;
  onBookingClick: (loftId: string) => void;
  onCallClick?: (loftId: string) => void;
  className?: string;
}

/**
 * Mobile-optimized loft browsing component with touch-friendly interactions
 * Implements requirements 5.1, 5.3, 5.4 from the spec
 */
export default function MobileLoftBrowser({
  lofts,
  locale,
  onBookingClick,
  onCallClick,
  className
}: MobileLoftBrowserProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const constraintsRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  
  // Multilingual content
  const content = {
    fr: {
      perNight: "par nuit",
      guests: "invités",
      available: "Disponible",
      unavailable: "Indisponible",
      instantBook: "Réservation instantanée",
      bookNow: "Réserver",
      callNow: "Appeler",
      rating: "Note",
      reviews: "avis",
      swipeHint: "Glissez pour voir plus",
      of: "sur"
    },
    en: {
      perNight: "per night",
      guests: "guests",
      available: "Available",
      unavailable: "Unavailable",
      instantBook: "Instant booking",
      bookNow: "Book now",
      callNow: "Call now",
      rating: "Rating",
      reviews: "reviews",
      swipeHint: "Swipe to see more",
      of: "of"
    },
    ar: {
      perNight: "في الليلة",
      guests: "ضيوف",
      available: "متاح",
      unavailable: "غير متاح",
      instantBook: "حجز فوري",
      bookNow: "احجز الآن",
      callNow: "اتصل الآن",
      rating: "التقييم",
      reviews: "مراجعة",
      swipeHint: "اسحب لرؤية المزيد",
      of: "من"
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    
    if (info.offset.x > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (info.offset.x < -threshold && currentIndex < lofts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const toggleFavorite = (loftId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(loftId)) {
      newFavorites.delete(loftId);
    } else {
      newFavorites.add(loftId);
    }
    setFavorites(newFavorites);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency === 'DZD' ? 'DZD' : 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  if (lofts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucun loft trouvé</p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Progress Indicator */}
      <div className="flex justify-center mb-4">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
          <span className="text-sm font-medium text-gray-700">
            {currentIndex + 1} {text.of} {lofts.length}
          </span>
          <div className="flex gap-1">
            {lofts.slice(0, Math.min(5, lofts.length)).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentIndex ? "bg-blue-500" : "bg-gray-300"
                )}
              />
            ))}
            {lofts.length > 5 && (
              <span className="text-xs text-gray-500 ml-1">...</span>
            )}
          </div>
        </div>
      </div>

      {/* Swipeable Cards Container */}
      <div ref={constraintsRef} className="relative overflow-hidden">
        <motion.div
          className="flex"
          style={{ x }}
          drag="x"
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          animate={{ x: -currentIndex * 100 + '%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {lofts.map((loft, index) => (
            <motion.div
              key={loft.id}
              className="w-full flex-shrink-0 px-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: index === currentIndex ? 1 : 0.7,
                scale: index === currentIndex ? 1 : 0.95
              }}
              transition={{ duration: 0.3 }}
            >
              <MobileLoftCard
                loft={loft}
                locale={locale}
                text={text}
                isFavorite={favorites.has(loft.id)}
                onToggleFavorite={() => toggleFavorite(loft.id)}
                onBookingClick={onBookingClick}
                onCallClick={onCallClick}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="rounded-full shadow-lg bg-white/90 backdrop-blur-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-center">
          <p className="text-xs text-gray-500">{text.swipeHint}</p>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentIndex(Math.min(lofts.length - 1, currentIndex + 1))}
          disabled={currentIndex === lofts.length - 1}
          className="rounded-full shadow-lg bg-white/90 backdrop-blur-sm"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Individual mobile loft card component
 */
interface MobileLoftCardProps {
  loft: LoftCardType;
  locale: string;
  text: any;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onBookingClick: (loftId: string) => void;
  onCallClick?: (loftId: string) => void;
}

function MobileLoftCard({
  loft,
  locale,
  text,
  isFavorite,
  onToggleFavorite,
  onBookingClick,
  onCallClick
}: MobileLoftCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency === 'DZD' ? 'DZD' : 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      {/* Image Gallery with Touch Navigation - Glissement fluide */}
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
                  transition: 'left 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
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

        {/* Image Navigation for Touch */}
        {loft.images.length > 1 && (
          <>
            <div className="absolute inset-0 flex z-10">
              <button
                className="flex-1"
                onClick={() => setCurrentImageIndex(
                  currentImageIndex === 0 ? loft.images.length - 1 : currentImageIndex - 1
                )}
              />
              <button
                className="flex-1"
                onClick={() => setCurrentImageIndex(
                  currentImageIndex === loft.images.length - 1 ? 0 : currentImageIndex + 1
                )}
              />
            </div>

            {/* Image Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {loft.images.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index === currentImageIndex ? "bg-white" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <Badge 
            className={cn(
              loft.availability.isAvailable 
                ? "bg-green-500 hover:bg-green-600" 
                : "bg-red-500 hover:bg-red-600"
            )}
          >
            {loft.availability.isAvailable ? text.available : text.unavailable}
          </Badge>
          
          {loft.instantBook && (
            <Badge className="bg-blue-500 hover:bg-blue-600">
              <Zap className="h-3 w-3 mr-1" />
              {text.instantBook}
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 bg-white/80 hover:bg-white rounded-full"
          onClick={onToggleFavorite}
        >
          <Heart className={cn("h-5 w-5", isFavorite && "fill-red-500 text-red-500")} />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Title and Location */}
        <div>
          <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
            {loft.title}
          </h3>
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{loft.location}</span>
          </div>
        </div>

        {/* Rating and Guest Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-sm">{loft.rating.toFixed(1)}</span>
            </div>
            <span className="text-gray-500 text-sm">
              ({loft.reviewCount} {text.reviews})
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{loft.maxGuests} {text.guests}</span>
          </div>
        </div>

        {/* Amenities - Mobile Optimized */}
        <div className="flex flex-wrap gap-1">
          {loft.amenities.slice(0, 3).map((amenity) => (
            <Badge
              key={amenity}
              variant="secondary"
              className="text-xs px-2 py-1"
            >
              {amenity}
            </Badge>
          ))}
          {loft.amenities.length > 3 && (
            <Badge variant="outline" className="text-xs px-2 py-1">
              +{loft.amenities.length - 3}
            </Badge>
          )}
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            <div className="text-xl font-bold text-gray-900">
              {formatPrice(loft.pricePerNight, loft.currency)}
            </div>
            <div className="text-sm text-gray-500">
              {text.perNight}
            </div>
          </div>

          <div className="flex gap-2">
            {onCallClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCallClick(loft.id)}
                className="flex items-center gap-1 px-3"
              >
                <Phone className="h-4 w-4" />
                {text.callNow}
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={() => onBookingClick(loft.id)}
              disabled={!loft.availability.isAvailable}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-4"
            >
              <Calendar className="h-4 w-4" />
              {text.bookNow}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile Grid Layout Component
 * Alternative to swipe cards for users who prefer grid view
 */
interface MobileLoftGridProps {
  lofts: LoftCardType[];
  locale: string;
  onBookingClick: (loftId: string) => void;
  className?: string;
}

export function MobileLoftGrid({ 
  lofts, 
  locale, 
  onBookingClick, 
  className 
}: MobileLoftGridProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (loftId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(loftId)) {
      newFavorites.delete(loftId);
    } else {
      newFavorites.add(loftId);
    }
    setFavorites(newFavorites);
  };

  return (
    <div className={cn("grid grid-cols-1 gap-4", className)}>
      {lofts.map((loft) => (
        <motion.div
          key={loft.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <MobileLoftCard
            loft={loft}
            locale={locale}
            text={content[locale as keyof typeof content] || content.fr}
            isFavorite={favorites.has(loft.id)}
            onToggleFavorite={() => toggleFavorite(loft.id)}
            onBookingClick={onBookingClick}
          />
        </motion.div>
      ))}
    </div>
  );
}