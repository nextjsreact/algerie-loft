'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ContentWrapper } from '@/components/ui/ResponsiveGrid';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import LoftCard from './LoftCard';
import LoftFilters from './LoftFilters';
import MobileLoftBrowser, { MobileLoftGrid } from './MobileLoftBrowser';
import { Eye, Grid3X3, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgressiveLoading, useOfflineSupport } from '@/hooks/useOfflineSupport';
import { ProgressiveLoading, LoftGridPlaceholder, OfflineBanner } from '@/components/ui/ProgressiveLoading';
import { offlineDataManager } from '@/lib/utils/offline-data-manager';
import type { 
  LoftCard as LoftCardType, 
  FilterOptions, 
  SortOption 
} from '@/types/dual-audience';

interface FeaturedLoftsSectionProps {
  locale: string;
}

/**
 * Featured lofts section with interactive cards and booking functionality
 * Implements requirements 2.1, 2.2, 2.3, 2.5, 5.1, 5.3, 5.4 from the spec
 */
export default function FeaturedLoftsSection({ locale }: FeaturedLoftsSectionProps) {
  const [filteredLofts, setFilteredLofts] = useState<LoftCardType[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sortOption, setSortOption] = useState<SortOption>({
    key: 'popularity',
    direction: 'desc',
    label: 'Popularité'
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();

  // Use progressive loading with offline support
  const {
    data: lofts,
    loading,
    error,
    showPlaceholder,
    retry
  } = useProgressiveLoading<LoftCardType[]>(
    () => offlineDataManager.getFeaturedLofts(locale, 6),
    [], // Empty array as fallback
    {
      enablePlaceholder: true,
      placeholderDelay: 500,
      retryAttempts: 2,
      retryDelay: 2000
    }
  );

  const { isOnline, isSlowConnection, cacheForOffline } = useOfflineSupport();

  // Multilingual content
  const content = {
    fr: {
      title: "Lofts Disponibles",
      subtitle: "Découvrez notre sélection de lofts exceptionnels",
      viewAll: "Voir tous les lofts",
      noResults: "Aucun loft trouvé",
      noResultsDescription: "Essayez de modifier vos critères de recherche",
      bookingSuccess: "Redirection vers la réservation...",
      bookingError: "Erreur lors de la réservation"
    },
    en: {
      title: "Available Lofts",
      subtitle: "Discover our selection of exceptional lofts",
      viewAll: "View all lofts",
      noResults: "No lofts found",
      noResultsDescription: "Try adjusting your search criteria",
      bookingSuccess: "Redirecting to booking...",
      bookingError: "Booking error"
    },
    ar: {
      title: "الشقق المتاحة",
      subtitle: "اكتشف مجموعتنا من الشقق المفروشة الاستثنائية",
      viewAll: "عرض جميع الشقق",
      noResults: "لم يتم العثور على شقق",
      noResultsDescription: "حاول تعديل معايير البحث",
      bookingSuccess: "إعادة توجيه إلى الحجز...",
      bookingError: "خطأ في الحجز"
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  // Mock data - In real implementation, this would come from an API
  const mockLofts: LoftCardType[] = [
    {
      id: '1',
      title: 'Loft Moderne Centre-ville',
      location: 'Alger Centre, Algérie',
      pricePerNight: 12000,
      currency: 'DZD',
      rating: 4.8,
      reviewCount: 24,
      images: [
        '/api/placeholder/400/300',
        '/api/placeholder/400/301',
        '/api/placeholder/400/302'
      ],
      amenities: ['wifi', 'parking', 'kitchen', 'ac'],
      availability: {
        isAvailable: true,
        minimumStay: 2
      },
      instantBook: true,
      description: 'Magnifique loft moderne au cœur d\'Alger avec vue panoramique sur la baie.',
      maxGuests: 4
    },
    {
      id: '2',
      title: 'Loft Artistique Hydra',
      location: 'Hydra, Alger',
      pricePerNight: 15000,
      currency: 'DZD',
      rating: 4.6,
      reviewCount: 18,
      images: [
        '/api/placeholder/400/303',
        '/api/placeholder/400/304'
      ],
      amenities: ['wifi', 'tv', 'coffee', 'ac'],
      availability: {
        isAvailable: true,
        minimumStay: 1
      },
      instantBook: false,
      description: 'Loft unique avec décoration artistique dans le quartier résidentiel d\'Hydra.',
      maxGuests: 2
    },
    {
      id: '3',
      title: 'Loft Vue Mer Oran',
      location: 'Oran, Algérie',
      pricePerNight: 18000,
      currency: 'DZD',
      rating: 4.9,
      reviewCount: 31,
      images: [
        '/api/placeholder/400/305',
        '/api/placeholder/400/306',
        '/api/placeholder/400/307',
        '/api/placeholder/400/308'
      ],
      amenities: ['wifi', 'parking', 'kitchen', 'tv', 'ac'],
      availability: {
        isAvailable: true,
        minimumStay: 3
      },
      instantBook: true,
      description: 'Superbe loft avec vue imprenable sur la mer Méditerranée à Oran.',
      maxGuests: 6
    },
    {
      id: '4',
      title: 'Loft Traditionnel Constantine',
      location: 'Constantine, Algérie',
      pricePerNight: 10000,
      currency: 'DZD',
      rating: 4.4,
      reviewCount: 12,
      images: [
        '/api/placeholder/400/309',
        '/api/placeholder/400/310'
      ],
      amenities: ['wifi', 'kitchen', 'coffee'],
      availability: {
        isAvailable: false,
        minimumStay: 2,
        nextAvailableDate: new Date('2024-12-15')
      },
      instantBook: false,
      description: 'Loft authentique alliant charme traditionnel et confort moderne.',
      maxGuests: 3
    },
    {
      id: '5',
      title: 'Loft Luxe Annaba',
      location: 'Annaba, Algérie',
      pricePerNight: 22000,
      currency: 'DZD',
      rating: 4.7,
      reviewCount: 28,
      images: [
        '/api/placeholder/400/311',
        '/api/placeholder/400/312',
        '/api/placeholder/400/313'
      ],
      amenities: ['wifi', 'parking', 'kitchen', 'tv', 'ac', 'coffee'],
      availability: {
        isAvailable: true,
        minimumStay: 2
      },
      instantBook: true,
      description: 'Loft de luxe avec équipements haut de gamme près de la plage d\'Annaba.',
      maxGuests: 5
    },
    {
      id: '6',
      title: 'Loft Cosy Tlemcen',
      location: 'Tlemcen, Algérie',
      pricePerNight: 8000,
      currency: 'DZD',
      rating: 4.3,
      reviewCount: 15,
      images: [
        '/api/placeholder/400/314',
        '/api/placeholder/400/315'
      ],
      amenities: ['wifi', 'kitchen', 'tv'],
      availability: {
        isAvailable: true,
        minimumStay: 1
      },
      instantBook: false,
      description: 'Petit loft chaleureux dans la ville historique de Tlemcen.',
      maxGuests: 2
    }
  ];

  // Initialize mobile detection and cache successful data
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cache lofts data when successfully loaded
  useEffect(() => {
    if (lofts && lofts.length > 0 && isOnline) {
      cacheForOffline({ lofts });
    }
  }, [lofts, isOnline, cacheForOffline]);

  // Apply filters and sorting
  useEffect(() => {
    if (!lofts || lofts.length === 0) {
      setFilteredLofts([]);
      return;
    }

    let filtered = [...lofts];

    // Apply filters
    if (filters.location?.length) {
      filtered = filtered.filter(loft => 
        filters.location!.some(loc => 
          loft.location.toLowerCase().includes(loc.toLowerCase())
        )
      );
    }

    if (filters.priceRange) {
      filtered = filtered.filter(loft => 
        loft.pricePerNight >= filters.priceRange!.min &&
        loft.pricePerNight <= filters.priceRange!.max
      );
    }

    if (filters.rating) {
      filtered = filtered.filter(loft => loft.rating >= filters.rating!);
    }

    if (filters.amenities?.length) {
      filtered = filtered.filter(loft =>
        filters.amenities!.every(amenity =>
          loft.amenities.includes(amenity)
        )
      );
    }

    if (filters.instantBook) {
      filtered = filtered.filter(loft => loft.instantBook);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortOption.key) {
        case 'price':
          comparison = a.pricePerNight - b.pricePerNight;
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'availability':
          comparison = Number(a.availability?.isAvailable || false) - Number(b.availability?.isAvailable || false);
          break;
        case 'popularity':
          comparison = a.reviewCount - b.reviewCount;
          break;
      }

      return sortOption.direction === 'desc' ? -comparison : comparison;
    });

    setFilteredLofts(filtered);
  }, [lofts, filters, sortOption]);

  const handleBookingClick = (loftId: string) => {
    const loft = lofts?.find(l => l.id === loftId);
    if (!loft) return;

    // Check if offline
    if (!isOnline) {
      toast({
        title: "Connexion requise",
        description: "Une connexion internet est nécessaire pour effectuer une réservation.",
        variant: "destructive"
      });
      return;
    }

    if (!loft.availability?.isAvailable) {
      toast({
        title: "Loft indisponible",
        description: "Ce loft n'est pas disponible pour le moment.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: text.bookingSuccess,
      description: `Redirection vers la réservation pour ${loft.title}...`
    });

    // In real implementation, redirect to booking page
    // router.push(`/${locale}/booking/${loftId}`);
  };

  const handleQuickView = (loft: LoftCardType) => {
    // Quick view is handled by the modal in LoftCard component
    console.log('Quick view for loft:', loft.id);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <ContentWrapper maxWidth="full">
      {/* Offline Banner */}
      <OfflineBanner />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {text.title}
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {text.subtitle}
          </p>
          
          {/* Connection status indicator */}
          {isSlowConnection && (
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
              Connexion lente détectée - Chargement optimisé
            </div>
          )}
        </div>

        {/* Filters - Hidden on mobile in swipe mode */}
        {(!isMobile || viewMode !== 'grid') && (
          <div className="mb-8">
            <LoftFilters
              filters={filters}
              sortOption={sortOption}
              viewMode={viewMode}
              locale={locale}
              onFiltersChange={setFilters}
              onSortChange={setSortOption}
              onViewModeChange={setViewMode}
              onClearFilters={handleClearFilters}
              totalResults={filteredLofts.length}
            />
          </div>
        )}

        {/* Lofts Display with Progressive Loading */}
        <ProgressiveLoading
          loading={loading}
          error={error}
          showPlaceholder={showPlaceholder}
          onRetry={retry}
          placeholderComponent={<LoftGridPlaceholder count={6} />}
        >
          {filteredLofts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Eye className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {text.noResults}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {text.noResultsDescription}
              </p>
              <Button onClick={handleClearFilters} variant="outline">
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
          <>
            {/* Mobile Swipe Browser */}
            {isMobile && viewMode === 'grid' ? (
              <MobileLoftBrowser
                lofts={filteredLofts}
                locale={locale}
                onBookingClick={handleBookingClick}
                className="mb-8"
              />
            ) : isMobile && viewMode === 'list' ? (
              <MobileLoftGrid
                lofts={filteredLofts}
                locale={locale}
                onBookingClick={handleBookingClick}
                className="mb-8"
              />
            ) : (
              /* Desktop Grid/List View */
              <div className={cn(
                "mb-8",
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-6"
              )}>
                {filteredLofts.map((loft) => (
                  <LoftCard
                    key={loft.id}
                    loft={loft}
                    locale={locale}
                    onBookingClick={handleBookingClick}
                    onQuickView={handleQuickView}
                  />
                ))}
              </div>
            )}

            {/* View All Button */}
            <div className="text-center">
              <Button
                variant="outline"
                size="lg"
                className="bg-white hover:bg-gray-50 border-2 border-blue-600 text-blue-600 hover:text-blue-700"
                disabled={!isOnline}
              >
                <Eye className="mr-2 h-5 w-5" />
                {text.viewAll}
              </Button>
            </div>
          </>
          )}
        </ProgressiveLoading>
      </motion.div>
    </ContentWrapper>
  );
}