'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  Filter,
  SlidersHorizontal,
  Heart,
  Eye,
  X
} from 'lucide-react'
import { SearchFilters, ClientLoftView } from '@/lib/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface LoftSearchProps {
  onLoftSelect?: (loft: ClientLoftView) => void
}

export function LoftSearch({ onLoftSelect }: LoftSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    guests: 1
  })
  const [lofts, setLofts] = useState<ClientLoftView[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [totalResults, setTotalResults] = useState(0)

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const searchLofts = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params.append(key, value.join(','))
          } else {
            params.append(key, String(value))
          }
        }
      })

      const response = await fetch(`/api/lofts/search?${params}`)
      const data = await response.json()

      if (response.ok) {
        setLofts(data.lofts)
        setTotalResults(data.pagination.total)
      } else {
        console.error('Search failed:', data.error)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    searchLofts()
  }, [])

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

  const MobileFiltersSheet = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filtres
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtres de recherche</SheetTitle>
          <SheetDescription>
            Affinez votre recherche pour trouver le loft parfait
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          {/* Mobile Basic Search */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile-location">Localisation</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="mobile-location"
                  placeholder="Ville, quartier..."
                  value={filters.location || ''}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile-check_in">Arrivée</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="mobile-check_in"
                    type="date"
                    value={filters.check_in || ''}
                    onChange={(e) => handleFilterChange('check_in', e.target.value)}
                    className="pl-10 h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-check_out">Départ</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="mobile-check_out"
                    type="date"
                    value={filters.check_out || ''}
                    onChange={(e) => handleFilterChange('check_out', e.target.value)}
                    className="pl-10 h-12 text-base"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-guests">Voyageurs</Label>
              <Select
                value={String(filters.guests || 1)}
                onValueChange={(value) => handleFilterChange('guests', Number(value))}
              >
                <SelectTrigger className="h-12 text-base">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 8 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {i + 1} {i === 0 ? 'voyageur' : 'voyageurs'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile Advanced Filters */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold">Prix par nuit</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile-min_price">Minimum</Label>
                <Input
                  id="mobile-min_price"
                  type="number"
                  placeholder="0 DZD"
                  value={filters.min_price || ''}
                  onChange={(e) => handleFilterChange('min_price', Number(e.target.value) || undefined)}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-max_price">Maximum</Label>
                <Input
                  id="mobile-max_price"
                  type="number"
                  placeholder="10000 DZD"
                  value={filters.max_price || ''}
                  onChange={(e) => handleFilterChange('max_price', Number(e.target.value) || undefined)}
                  className="h-12 text-base"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button 
              variant="outline" 
              onClick={() => setFilters({ guests: 1 })}
              className="flex-1 h-12"
            >
              Réinitialiser
            </Button>
            <Button 
              onClick={searchLofts} 
              disabled={isLoading}
              className="flex-1 h-12"
            >
              {isLoading ? (
                <>
                  <Search className="w-4 h-4 mr-2 animate-spin" />
                  Recherche...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Rechercher
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile-First Search Interface */}
      <div className="md:hidden">
        {/* Mobile Compact Search */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Quick Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Où souhaitez-vous aller ?"
                  value={filters.location || ''}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="pl-12 h-12 text-base"
                />
              </div>

              {/* Quick Date and Guest Selection */}
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="date"
                  value={filters.check_in || ''}
                  onChange={(e) => handleFilterChange('check_in', e.target.value)}
                  className="h-10 text-sm"
                />
                <Input
                  type="date"
                  value={filters.check_out || ''}
                  onChange={(e) => handleFilterChange('check_out', e.target.value)}
                  className="h-10 text-sm"
                />
                <Select
                  value={String(filters.guests || 1)}
                  onValueChange={(value) => handleFilterChange('guests', Number(value))}
                >
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 8 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={searchLofts} 
                  disabled={isLoading}
                  className="flex-1 h-12"
                >
                  {isLoading ? (
                    <Search className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Rechercher
                    </>
                  )}
                </Button>
                <MobileFiltersSheet />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Search Interface */}
      <div className="hidden md:block">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Rechercher un loft
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filtres
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Localisation</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="location"
                    placeholder="Ville, quartier..."
                    value={filters.location || ''}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="check_in">Arrivée</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="check_in"
                    type="date"
                    value={filters.check_in || ''}
                    onChange={(e) => handleFilterChange('check_in', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="check_out">Départ</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="check_out"
                    type="date"
                    value={filters.check_out || ''}
                    onChange={(e) => handleFilterChange('check_out', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guests">Voyageurs</Label>
                <Select
                  value={String(filters.guests || 1)}
                  onValueChange={(value) => handleFilterChange('guests', Number(value))}
                >
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-gray-400" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 8 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1} {i === 0 ? 'voyageur' : 'voyageurs'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="min_price">Prix minimum (par nuit)</Label>
                  <Input
                    id="min_price"
                    type="number"
                    placeholder="0"
                    value={filters.min_price || ''}
                    onChange={(e) => handleFilterChange('min_price', Number(e.target.value) || undefined)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_price">Prix maximum (par nuit)</Label>
                  <Input
                    id="max_price"
                    type="number"
                    placeholder="10000"
                    value={filters.max_price || ''}
                    onChange={(e) => handleFilterChange('max_price', Number(e.target.value) || undefined)}
                  />
                </div>
              </div>
            )}

            <Button onClick={searchLofts} className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Search className="w-4 h-4 mr-2 animate-spin" />
                  Recherche en cours...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Rechercher
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {totalResults > 0 ? `${totalResults} loft${totalResults > 1 ? 's' : ''} trouvé${totalResults > 1 ? 's' : ''}` : 'Aucun résultat'}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Mobile Results Grid */}
            <div className="md:hidden space-y-4">
              {lofts.map((loft) => (
                <Card key={loft.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex">
                    {/* Mobile Image */}
                    <div className="relative w-32 h-32 flex-shrink-0">
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-l-lg">
                        <span className="text-gray-500 text-xs">Photo</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 bg-white/80 hover:bg-white p-1 h-auto"
                      >
                        <Heart className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Mobile Content */}
                    <CardContent className="flex-1 p-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-base line-clamp-1 flex-1 mr-2">{loft.name}</h3>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-600">
                              {loft.average_rating.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center text-gray-600 text-xs">
                          <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="line-clamp-1">{loft.address}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-base font-bold">
                              {formatPrice(loft.price_per_night)}
                            </span>
                            <span className="text-gray-600 text-xs"> / nuit</span>
                          </div>
                          
                          <Button
                            size="sm"
                            onClick={() => onLoftSelect?.(loft)}
                            className="h-8 px-3 text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Voir
                          </Button>
                        </div>

                        <div className="text-xs text-gray-500 line-clamp-1">
                          {loft.partner.business_name || loft.partner.name}
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Results Grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lofts.map((loft) => (
                <Card key={loft.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="relative">
                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">Photo du loft</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg line-clamp-1">{loft.name}</h3>
                        <div className="flex items-center gap-1">
                          {renderStars(loft.average_rating)}
                          <span className="text-sm text-gray-600 ml-1">
                            ({loft.review_count})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="line-clamp-1">{loft.address}</span>
                      </div>

                      {loft.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {loft.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <span className="text-lg font-bold">
                            {formatPrice(loft.price_per_night)}
                          </span>
                          <span className="text-gray-600 text-sm"> / nuit</span>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => onLoftSelect?.(loft)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir
                        </Button>
                      </div>

                      <div className="text-xs text-gray-500">
                        Proposé par {loft.partner.business_name || loft.partner.name}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {!isLoading && lofts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun loft trouvé
              </h3>
              <p className="text-gray-600 mb-4">
                Essayez de modifier vos critères de recherche ou explorez d'autres dates.
              </p>
              <Button variant="outline" onClick={() => setFilters({ guests: 1 })}>
                Réinitialiser les filtres
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}