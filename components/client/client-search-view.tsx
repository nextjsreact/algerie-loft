"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Heart, Users, Bed, Bath } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface ClientSearchViewProps {
  lofts: any[]
  searchParams: any
  locale: string
}

export function ClientSearchView({ lofts, searchParams, locale }: ClientSearchViewProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {lofts.length} loft{lofts.length > 1 ? 's' : ''} disponible{lofts.length > 1 ? 's' : ''}
          </h1>
          {searchParams.destination && (
            <p className="text-gray-600">à {searchParams.destination}</p>
          )}
        </div>

        {/* Résultats */}
        {lofts.length === 0 ? (
          <Card className="p-12 text-center">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-2xl font-bold mb-2">Aucun loft trouvé</h3>
            <p className="text-gray-600 mb-6">Essayez de modifier vos critères de recherche</p>
            <Link href={`/${locale}/client/dashboard`}>
              <Button>Retour au dashboard</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lofts.map((loft) => (
              <Card key={loft.id} className="overflow-hidden hover:shadow-xl transition-all">
                <div className="relative h-64 group">
                  {loft.loft_photos?.[0]?.photo_url ? (
                    <Image
                      src={loft.loft_photos[0].photo_url}
                      alt={loft.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <MapPin className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <button className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white">
                    <Heart className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{loft.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {loft.zone_areas?.name || loft.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{loft.average_rating || "Nouveau"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {loft.max_guests} pers.
                    </span>
                    <span className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      {loft.bedrooms} ch.
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      {loft.bathrooms} sdb
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <span className="font-bold text-xl text-blue-600">
                        {loft.price_per_night?.toLocaleString()} DA
                      </span>
                      <span className="text-sm text-gray-600"> / nuit</span>
                    </div>
                    <Link href={`/${locale}/lofts/${loft.id}/book`}>
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                        Réserver
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
