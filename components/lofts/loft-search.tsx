"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Search, Filter, MapPin, Users, Calendar, Star, Grid, List, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { SearchCriteria, LoftSearchResult, LoftAmenity } from "@/lib/services/loft"
import { formatCurrencyAuto } from "@/utils/currency-formatter"

interface LoftSearchProps {
  onLoftSelect: (loft: LoftSearchResult) => void
  onCriteriaChange: (criteria: SearchCriteria) => void
  initialCriteria?: SearchCriteria
}

interface SearchState {
  criteria: SearchCriteria
  results: LoftSearchResult[]
  loading: boolean
  error: string | null
  amenities: LoftAmenity[]
  viewMode: 'grid' | 'list'
  showFilters: boolean
}

export function LoftSearch({ onLoftSelect, onCriteriaChange, initialCriteria }: LoftSearchProps) {
  const t = useTranslations('lofts')
  const tCommon = useTranslations('common')

  const [state, setState] = useState<SearchState>({
    criteria: {
      guests: 1,
      sortBy: 'rating',
      sortOrder: 'desc',
      ...initialCriteria
    },
    results: [],
    loading: false,
    error: null,
    amenities: [],
    viewMode: 'grid',
    showFilters: false
  })

  // Fetch amenities on component mount
  useEffect(() => {
    fetchAmenities()
  }, [])

  // Perform search when criteria changes
  useEffect(() => {
    if (state.criteria.checkIn && state.criteria.checkOut) {
      performSearch()
    }
  }, [state.criteria])

  const fetchAmenities = async () => {
    try {
      const response = await fetch('/api/lofts/amenities')
      if (response.ok) {
        const data = await response.json()
        setState(prev => ({ ...prev, amenities: data.amenities || [] }))
      }
    } catch (error) {
      console.error('Error fetching amenities:', error)
    }
  }

  const performSearch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const params = new URLSearchParams()
      
      if (state.criteria.checkIn) params.set('check_in', state.criteria.checkIn)
      if (state.criteria.checkOut) params.set('check_out', state.criteria.checkOut)
      if (state.criteria.location) params.set('location', state.criteria.location)
      if (state.criteria.minPrice) params.set('min_price', state.criteria.minPrice.toString())
      if (state.criteria.maxPrice) params.set('max_price', state.criteria.maxPrice.toString())
      if (state.criteria.guests) params.set('guests', state.criteria.guests.toString())
      if (state.criteria.amenities?.length) params.set('amenities', state.criteria.amenities.join(','))
      if (state.criteria.sortBy) params.set('sortBy', state.criteria.sortBy)
      if (state.criteria.sortOrder) params.set('sortOrder', state.criteria.sortOrder)

      const response = await fetch(`/api/lofts/search?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to search lofts')
      }

      const data = await response.json()
      setState(prev => ({ 
        ...prev, 
        results: data.lofts || [], 
        loading: false 
      }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Search failed',
        loading: false 
      }))
    }
  }, [state.criteria])

  const updateCriteria = (updates: Partial<SearchCriteria>) => {
    const newCriteria = { ...state.criteria, ...updates }
    setState(prev => ({ ...prev, criteria: newCriteria }))
    onCriteriaChange(newCriteria)
  }

  const clearFilters = () => {
    const clearedCriteria: SearchCriteria = {
      guests: 1,
      sortBy: 'rating',
      sortOrder: 'desc'
    }
    setState(prev => ({ ...prev, criteria: clearedCriteria }))
    onCriteriaChange(clearedCriteria)
  }

  const renderLoftCard = (loft: LoftSearchResult) => (
    <Card 
      key={loft.id} 
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={() => onLoftSelect(loft)}
    >
      <CardHeader className="p-0">
        <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
          {loft.primary_photo_url ? (
            <img 
              src={loft.primary_photo_url} 
              alt={loft.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <MapPin className="h-12 w-12" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-white/90">
              {formatCurrencyAuto(loft.price_per_night, 'DZD')}/night
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg line-clamp-1">{loft.name}</h3>
            {loft.average_rating > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{loft.average_rating.toFixed(1)}</span>
                <span className="text-gray-500">({loft.review_count})</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-gray-600 text-sm">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{loft.address}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{loft.max_guests} guests</span>
            </div>
            <div>{loft.bedrooms} bed{loft.bedrooms !== 1 ? 's' : ''}</div>
            <div>{loft.bathrooms} bath{loft.bathrooms !== 1 ? 's' : ''}</div>
          </div>

          {loft.amenity_names.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {loft.amenity_names.slice(0, 3).map((amenity) => (
                <Badge key={amenity} variant="outline" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {loft.amenity_names.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{loft.amenity_names.length - 3} more
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-gray-600">
              Min stay: {loft.minimum_stay} night{loft.minimum_stay !== 1 ? 's' : ''}
            </div>
            <div className="font-semibold">
              {formatCurrencyAuto(loft.price_per_night + loft.cleaning_fee, 'DZD')}
              <span className="text-sm font-normal text-gray-600"> total</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderFilters = () => (
    <div className="space-y-6">
      {/* Date Range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Dates</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="check-in" className="text-xs text-gray-600">Check-in</Label>
            <Input
              id="check-in"
              type="date"
              value={state.criteria.checkIn || ''}
              onChange={(e) => updateCriteria({ checkIn: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="check-out" className="text-xs text-gray-600">Check-out</Label>
            <Input
              id="check-out"
              type="date"
              value={state.criteria.checkOut || ''}
              onChange={(e) => updateCriteria({ checkOut: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Guests */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Guests</Label>
        <Select 
          value={state.criteria.guests?.toString() || '1'} 
          onValueChange={(value) => updateCriteria({ guests: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} guest{num !== 1 ? 's' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Price Range (per night)</Label>
        <div className="px-2">
          <Slider
            value={[state.criteria.minPrice || 0, state.criteria.maxPrice || 5000]}
            onValueChange={([min, max]) => updateCriteria({ minPrice: min, maxPrice: max })}
            max={5000}
            min={0}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>{formatCurrencyAuto(state.criteria.minPrice || 0, 'DZD')}</span>
            <span>{formatCurrencyAuto(state.criteria.maxPrice || 5000, 'DZD')}</span>
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Amenities</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {state.amenities.map((amenity) => (
            <div key={amenity.id} className="flex items-center space-x-2">
              <Checkbox
                id={amenity.id}
                checked={state.criteria.amenities?.includes(amenity.name) || false}
                onCheckedChange={(checked) => {
                  const currentAmenities = state.criteria.amenities || []
                  const newAmenities = checked
                    ? [...currentAmenities, amenity.name]
                    : currentAmenities.filter(a => a !== amenity.name)
                  updateCriteria({ amenities: newAmenities })
                }}
              />
              <Label htmlFor={amenity.id} className="text-sm">
                {amenity.name}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Find Your Perfect Loft</h2>
          <p className="text-gray-600">
            {state.results.length} loft{state.results.length !== 1 ? 's' : ''} available
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Options */}
          <Select 
            value={`${state.criteria.sortBy}-${state.criteria.sortOrder}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-') as [string, 'asc' | 'desc']
              updateCriteria({ sortBy, sortOrder })
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating-desc">Highest Rated</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex border rounded-lg">
            <Button
              variant={state.viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setState(prev => ({ ...prev, viewMode: 'grid' }))}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={state.viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setState(prev => ({ ...prev, viewMode: 'list' }))}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters Toggle */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Search Filters</SheetTitle>
                <SheetDescription>
                  Refine your search to find the perfect loft
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                {renderFilters()}
                <div className="flex gap-2 mt-6">
                  <Button onClick={clearFilters} variant="outline" className="flex-1">
                    Clear All
                  </Button>
                  <Button onClick={performSearch} className="flex-1">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by location or loft name..."
            value={state.criteria.location || ''}
            onChange={(e) => updateCriteria({ location: e.target.value })}
            className="pl-10"
          />
        </div>
        <Button onClick={performSearch} disabled={state.loading}>
          {state.loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Active Filters */}
      {(state.criteria.checkIn || state.criteria.checkOut || state.criteria.amenities?.length) && (
        <div className="flex flex-wrap gap-2">
          {state.criteria.checkIn && state.criteria.checkOut && (
            <Badge variant="secondary">
              <Calendar className="h-3 w-3 mr-1" />
              {state.criteria.checkIn} to {state.criteria.checkOut}
            </Badge>
          )}
          {state.criteria.amenities?.map((amenity) => (
            <Badge key={amenity} variant="secondary">
              {amenity}
              <button
                onClick={() => {
                  const newAmenities = state.criteria.amenities?.filter(a => a !== amenity) || []
                  updateCriteria({ amenities: newAmenities })
                }}
                className="ml-1 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{state.error}</p>
          <Button variant="outline" size="sm" onClick={performSearch} className="mt-2">
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {state.loading && (
        <div className={cn(
          "grid gap-6",
          state.viewMode === 'grid' 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
            : "grid-cols-1"
        )}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="p-0">
                <Skeleton className="h-48 w-full rounded-t-lg" />
              </CardHeader>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results Grid */}
      {!state.loading && state.results.length > 0 && (
        <div className={cn(
          "grid gap-6",
          state.viewMode === 'grid' 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
            : "grid-cols-1"
        )}>
          {state.results.map(renderLoftCard)}
        </div>
      )}

      {/* Empty State */}
      {!state.loading && state.results.length === 0 && !state.error && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No lofts found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or clearing some filters
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}