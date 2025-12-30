"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  MapPin, 
  Star,
  Heart,
  Filter,
  SlidersHorizontal,
  Bed,
  Bath,
  Users,
  Wifi,
  Car
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Loft {
  id: string
  name: string
  address: string
  price_per_night: number
  bedrooms?: number
  bathrooms?: number
  max_guests?: number
  description?: string
  amenities?: string[]
  average_rating?: number
  status?: string
  loft_photos?: Array<{
    id: string
    url: string
    order_index?: number
    display_order?: number
  }>
  zone_areas?: {
    id: string
    name: string
  }
}

interface ClientLoftsViewProps {
  lofts: Loft[]
  locale: string
}

export function ClientLoftsView({ lofts, locale }: ClientLoftsViewProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000])
  const [selectedZone, setSelectedZone] = useState<string>("all")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Extraire les zones uniques
  const zones = useMemo(() => {
    const uniqueZones = new Set(lofts.map(loft => loft.zone_areas?.name).filter(Boolean))
    return Array.from(uniqueZones)
  }, [lofts])

  // Filtrer les lofts
  const filteredLofts = useMemo(() => {
    return lofts.filter(loft => {
      const matchesSearch = loft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           loft.address.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPrice = loft.price_per_night >= priceRange[0] && loft.price_per_night <= priceRange[1]
      const matchesZone = selectedZone === "all" || loft.zone_areas?.name === selectedZone
      
      return matchesSearch && matchesPrice && matchesZone
    })
  }, [lofts, searchQuery, priceRange, selectedZone])

  const toggleFavorite = (loftId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(loftId)) {
        newFavorites.delete(loftId)
      } else {
        newFavorites.add(loftId)
      }
      return newFavorites
    })
  }

  const getBestPhoto = (loft: Loft) => {
    if (!loft.loft_photos || loft.loft_photos.length === 0) return null
    return loft.loft_photos.sort((a, b) => {
      const orderA = a.order_index ?? a.display_order ?? 999
      const orderB = b.order_index ?? b.display_order ?? 999
      return orderA - orderB
    })[0]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header avec recherche */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou adresse..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="flex h-12 w-full md:w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Toutes les zones</option>
                {zones.map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
              
              <Button variant="outline" size="lg" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filtres
              </Button>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{filteredLofts.length}</span> loft{filteredLofts.length > 1 ? 's' : ''} disponible{filteredLofts.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Grille de lofts */}
      <div className="container mx-auto px-4 py-8">
        {filteredLofts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun loft trouvé</h3>
            <p className="text-gray-600">Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredLofts.map((loft) => {
              const bestPhoto = getBestPhoto(loft)
              const isFavorite = favorites.has(loft.id)
              
              return (
                <Card key={loft.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
                  <div className="relative h-64">
                    {bestPhoto?.url ? (
                      <Image
                        src={bestPhoto.url}
                        alt={loft.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <MapPin className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Bouton favori */}
                    <button
                      onClick={() => toggleFavorite(loft.id)}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
                    >
                      <Heart 
                        className={`h-5 w-5 transition-colors ${
                          isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                        }`}
                      />
                    </button>
                    
                    {/* Badge zone */}
                    {loft.zone_areas?.name && (
                      <div className="absolute bottom-3 left-3">
                        <Badge className="bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white">
                          <MapPin className="h-3 w-3 mr-1" />
                          {loft.zone_areas.name}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg line-clamp-1">{loft.name}</h3>
                      {loft.average_rating && (
                        <div className="flex items-center gap-1 text-sm flex-shrink-0 ml-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{loft.average_rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {loft.address}
                    </p>
                    
                    {/* Caractéristiques */}
                    <div className="flex items-center gap-3 mb-3 text-sm text-gray-600">
                      {loft.bedrooms && (
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          <span>{loft.bedrooms}</span>
                        </div>
                      )}
                      {loft.bathrooms && (
                        <div className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          <span>{loft.bathrooms}</span>
                        </div>
                      )}
                      {loft.max_guests && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{loft.max_guests}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div>
                        <span className="font-bold text-xl text-blue-600">
                          {loft.price_per_night.toLocaleString()} DA
                        </span>
                        <span className="text-sm text-gray-600"> / nuit</span>
                      </div>
                      <Link href={`/${locale}/lofts/${loft.id}/book`}>
                        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                          Réserver
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
