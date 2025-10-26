'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  X, 
  Search, 
  MapPin, 
  DollarSign, 
  Users, 
  Grid3X3, 
  List, 
  Map,
  SlidersHorizontal,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FilterOptions, SortOption } from '@/types/dual-audience';

interface LoftFiltersProps {
  filters: FilterOptions;
  sortOption: SortOption;
  viewMode: 'grid' | 'list' | 'map';
  locale: string;
  onFiltersChange: (filters: FilterOptions) => void;
  onSortChange: (sort: SortOption) => void;
  onViewModeChange: (mode: 'grid' | 'list' | 'map') => void;
  onClearFilters: () => void;
  totalResults: number;
  className?: string;
}

/**
 * Comprehensive filtering and search component for lofts
 * Implements requirements 2.3, 5.3 from the spec
 */
export default function LoftFilters({
  filters,
  sortOption,
  viewMode,
  locale,
  onFiltersChange,
  onSortChange,
  onViewModeChange,
  onClearFilters,
  totalResults,
  className
}: LoftFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Multilingual content
  const content = {
    fr: {
      search: "Rechercher des lofts...",
      filters: "Filtres",
      advancedFilters: "Filtres avancés",
      clearAll: "Tout effacer",
      location: "Localisation",
      priceRange: "Gamme de prix",
      minPrice: "Prix minimum",
      maxPrice: "Prix maximum",
      rating: "Note minimum",
      guests: "Nombre d'invités",
      amenities: "Équipements",
      instantBook: "Réservation instantanée",
      sortBy: "Trier par",
      price: "Prix",
      rating: "Note",
      popularity: "Popularité",
      availability: "Disponibilité",
      ascending: "Croissant",
      descending: "Décroissant",
      results: "résultats",
      result: "résultat",
      viewMode: "Mode d'affichage",
      grid: "Grille",
      list: "Liste",
      map: "Carte",
      apply: "Appliquer",
      locations: {
        all: "Toutes les villes",
        algiers: "Alger",
        oran: "Oran",
        constantine: "Constantine",
        annaba: "Annaba",
        tlemcen: "Tlemcen"
      },
      amenitiesList: {
        wifi: "WiFi",
        parking: "Parking",
        kitchen: "Cuisine",
        ac: "Climatisation",
        tv: "Télévision",
        coffee: "Machine à café"
      }
    },
    en: {
      search: "Search lofts...",
      filters: "Filters",
      advancedFilters: "Advanced filters",
      clearAll: "Clear all",
      location: "Location",
      priceRange: "Price range",
      minPrice: "Minimum price",
      maxPrice: "Maximum price",
      rating: "Minimum rating",
      guests: "Number of guests",
      amenities: "Amenities",
      instantBook: "Instant booking",
      sortBy: "Sort by",
      price: "Price",
      rating: "Rating",
      popularity: "Popularity",
      availability: "Availability",
      ascending: "Ascending",
      descending: "Descending",
      results: "results",
      result: "result",
      viewMode: "View mode",
      grid: "Grid",
      list: "List",
      map: "Map",
      apply: "Apply",
      locations: {
        all: "All cities",
        algiers: "Algiers",
        oran: "Oran",
        constantine: "Constantine",
        annaba: "Annaba",
        tlemcen: "Tlemcen"
      },
      amenitiesList: {
        wifi: "WiFi",
        parking: "Parking",
        kitchen: "Kitchen",
        ac: "Air conditioning",
        tv: "Television",
        coffee: "Coffee machine"
      }
    },
    ar: {
      search: "البحث عن الشقق...",
      filters: "المرشحات",
      advancedFilters: "مرشحات متقدمة",
      clearAll: "مسح الكل",
      location: "الموقع",
      priceRange: "نطاق السعر",
      minPrice: "الحد الأدنى للسعر",
      maxPrice: "الحد الأقصى للسعر",
      rating: "الحد الأدنى للتقييم",
      guests: "عدد الضيوف",
      amenities: "المرافق",
      instantBook: "حجز فوري",
      sortBy: "ترتيب حسب",
      price: "السعر",
      rating: "التقييم",
      popularity: "الشعبية",
      availability: "التوفر",
      ascending: "تصاعدي",
      descending: "تنازلي",
      results: "نتائج",
      result: "نتيجة",
      viewMode: "وضع العرض",
      grid: "شبكة",
      list: "قائمة",
      map: "خريطة",
      apply: "تطبيق",
      locations: {
        all: "جميع المدن",
        algiers: "الجزائر",
        oran: "وهران",
        constantine: "قسنطينة",
        annaba: "عنابة",
        tlemcen: "تلمسان"
      },
      amenitiesList: {
        wifi: "واي فاي",
        parking: "موقف سيارات",
        kitchen: "مطبخ",
        ac: "تكييف",
        tv: "تلفزيون",
        coffee: "آلة قهوة"
      }
    }
  };

  const text = content[locale as keyof typeof content] || content.fr;

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Debounced search implementation would go here
    // For now, we'll update filters immediately
    onFiltersChange({
      ...filters,
      // Add search functionality to filters if needed
    });
  };

  const handleLocationChange = (location: string) => {
    onFiltersChange({
      ...filters,
      location: location === 'all' ? undefined : [location]
    });
  };

  const handlePriceRangeChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      priceRange: {
        min: values[0],
        max: values[1],
        currency: 'DZD'
      }
    });
  };

  const handleRatingChange = (rating: number) => {
    onFiltersChange({
      ...filters,
      rating: rating
    });
  };

  const handleAmenityToggle = (amenity: string, checked: boolean) => {
    const currentAmenities = filters.amenities || [];
    const newAmenities = checked
      ? [...currentAmenities, amenity]
      : currentAmenities.filter(a => a !== amenity);
    
    onFiltersChange({
      ...filters,
      amenities: newAmenities
    });
  };

  const handleInstantBookToggle = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      instantBook: checked
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.location?.length) count++;
    if (filters.priceRange) count++;
    if (filters.rating) count++;
    if (filters.amenities?.length) count++;
    if (filters.instantBook) count++;
    return count;
  };

  const sortOptions = [
    { key: 'popularity' as const, direction: 'desc' as const, label: text.popularity },
    { key: 'price' as const, direction: 'asc' as const, label: `${text.price} (${text.ascending})` },
    { key: 'price' as const, direction: 'desc' as const, label: `${text.price} (${text.descending})` },
    { key: 'rating' as const, direction: 'desc' as const, label: text.rating },
    { key: 'availability' as const, direction: 'desc' as const, label: text.availability }
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar and View Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={text.search}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {totalResults} {totalResults === 1 ? text.result : text.results}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
            {text.viewMode}:
          </span>
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="rounded-none border-0"
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:ml-2 sm:block">{text.grid}</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="rounded-none border-0"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:ml-2 sm:block">{text.list}</span>
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('map')}
              className="rounded-none border-0"
            >
              <Map className="h-4 w-4" />
              <span className="hidden sm:ml-2 sm:block">{text.map}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Location Filter */}
          <Select
            value={filters.location?.[0] || 'all'}
            onValueChange={handleLocationChange}
          >
            <SelectTrigger className="w-40">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{text.locations.all}</SelectItem>
              <SelectItem value="algiers">{text.locations.algiers}</SelectItem>
              <SelectItem value="oran">{text.locations.oran}</SelectItem>
              <SelectItem value="constantine">{text.locations.constantine}</SelectItem>
              <SelectItem value="annaba">{text.locations.annaba}</SelectItem>
              <SelectItem value="tlemcen">{text.locations.tlemcen}</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={`${sortOption.key}-${sortOption.direction}`}
            onValueChange={(value) => {
              const [key, direction] = value.split('-') as [SortOption['key'], SortOption['direction']];
              const option = sortOptions.find(opt => opt.key === key && opt.direction === direction);
              if (option) {
                onSortChange({
                  key,
                  direction,
                  label: option.label
                });
              }
            }}
          >
            <SelectTrigger className="w-48">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem 
                  key={`${option.key}-${option.direction}`} 
                  value={`${option.key}-${option.direction}`}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {text.advancedFilters}
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary" className="ml-1">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>

        {/* Clear Filters */}
        {getActiveFiltersCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
            {text.clearAll}
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Price Range */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {text.priceRange}
              </Label>
              <div className="px-3">
                <Slider
                  value={[filters.priceRange?.min || 0, filters.priceRange?.max || 50000]}
                  onValueChange={handlePriceRangeChange}
                  max={50000}
                  min={0}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>{filters.priceRange?.min || 0} DZD</span>
                  <span>{filters.priceRange?.max || 50000} DZD</span>
                </div>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                {text.rating}
              </Label>
              <Select
                value={filters.rating?.toString() || '0'}
                onValueChange={(value) => handleRatingChange(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Toutes les notes</SelectItem>
                  <SelectItem value="3">3+ ⭐</SelectItem>
                  <SelectItem value="4">4+ ⭐</SelectItem>
                  <SelectItem value="4.5">4.5+ ⭐</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Guest Count */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {text.guests}
              </Label>
              <Select
                value={filters.availability?.startDate ? '1' : '0'}
                onValueChange={() => {}}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nombre d'invités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 invité</SelectItem>
                  <SelectItem value="2">2 invités</SelectItem>
                  <SelectItem value="3">3 invités</SelectItem>
                  <SelectItem value="4">4+ invités</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-3">
            <Label>{text.amenities}</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(text.amenitiesList).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={filters.amenities?.includes(key) || false}
                    onCheckedChange={(checked) => handleAmenityToggle(key, checked as boolean)}
                  />
                  <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Instant Book */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="instantBook"
              checked={filters.instantBook || false}
              onCheckedChange={handleInstantBookToggle}
            />
            <Label htmlFor="instantBook" className="cursor-pointer">
              {text.instantBook}
            </Label>
          </div>

          {/* Apply Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={() => setShowAdvancedFilters(false)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {text.apply}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Active Filters Display */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.location?.map((location) => (
            <Badge key={location} variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {text.locations[location as keyof typeof text.locations] || location}
              <button
                onClick={() => handleLocationChange('all')}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {filters.priceRange && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {filters.priceRange.min} - {filters.priceRange.max} DZD
              <button
                onClick={() => onFiltersChange({ ...filters, priceRange: undefined })}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.rating && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {filters.rating}+ ⭐
              <button
                onClick={() => handleRatingChange(0)}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.instantBook && (
            <Badge variant="secondary" className="flex items-center gap-1">
              ⚡ {text.instantBook}
              <button
                onClick={() => handleInstantBookToggle(false)}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}