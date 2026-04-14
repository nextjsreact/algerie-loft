'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, TrendingUp, Calendar, MapPin, Users } from 'lucide-react'
import Image from 'next/image'

const BLUR_DATA = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE5MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"

interface PropertySummary {
  id: string
  name: string
  address: string
  status: 'available' | 'occupied' | 'maintenance'
  price_per_night: number
  bookings_count: number
  earnings_this_month: number
  occupancy_rate: number
  average_rating: number
  cover_photo?: string | null
  images?: string[]
  next_booking?: {
    check_in: string
    check_out: string
    client_name: string
  }
}

interface PropertiesOverviewProps {
  properties: PropertySummary[]
  locale: string
  limit?: number
  showFilters?: boolean
}

const STATUS_CONFIG = {
  available:   { cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  occupied:    { cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'         },
  maintenance: { cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
}

export const PropertiesOverview = memo(function PropertiesOverview({
  properties,
  locale,
  limit = 3,
  showFilters = false,
}: PropertiesOverviewProps) {
  const router = useRouter()
  const t = useTranslations('partner.dashboard')

  const displayed = useMemo(
    () => (showFilters ? properties : properties.slice(0, limit)),
    [properties, limit, showFilters]
  )

  if (properties.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('properties.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6 w-fit mx-auto mb-4">
              <Building2 className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
              {t('properties.noProperties')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {t('properties.noPropertiesMessage')}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{t('properties.title')}</CardTitle>
          {!showFilters && (
            <Button variant="outline" size="sm"
              onClick={() => router.push(`/${locale}/partner/properties`)}>
              {t('properties.viewAll')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Same grid as homepage OptimizedLoftsList */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((property) => {
            const photoUrl = property.cover_photo || property.images?.[0] || null
            const sc = STATUS_CONFIG[property.status] || { cls: 'bg-gray-100 text-gray-800' }
            const statusLabel = property.status === 'available' ? 'Disponible'
              : property.status === 'occupied' ? 'Occupé' : 'Maintenance'

            return (
              <div
                key={property.id}
                className="group cursor-pointer rounded-xl overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-white dark:bg-gray-800"
                onClick={() => router.push(`/${locale}/partner/properties/${property.id}`)}
              >
                {/* Photo — exact same as OptimizedLoftsList */}
                <div className="relative h-48 overflow-hidden rounded-t-xl bg-gray-200 dark:bg-gray-700">
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt={property.name}
                      fill
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL={BLUR_DATA}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                      <Building2 className="h-12 w-12 mb-2" />
                      <span className="text-xs">Aucune photo</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className={sc.cls}>{statusLabel}</Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                    {property.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                    <span className="line-clamp-1">{property.address}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{property.bookings_count} rés.</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {property.price_per_night.toLocaleString('fr-DZ')} DA
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">par nuit</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2 text-xs text-center">
                    <div>
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        {property.earnings_this_month.toLocaleString('fr-DZ')} DA
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">Revenus/mois</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                        <TrendingUp className="h-3 w-3" />{Math.round(property.occupancy_rate)}%
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">Occupation</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
})
