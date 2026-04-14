'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Users, TrendingUp, Calendar } from 'lucide-react'
import { ResponsivePartnerLayout } from '@/components/partner/responsive-partner-layout'

const BLUR_DATA = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE5MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"

interface Property {
  id: string
  name: string
  address: string
  price_per_night: number
  status: 'available' | 'occupied' | 'maintenance'
  max_guests?: number
  bedrooms?: number
  bathrooms?: number
  amenities?: string[]
  bookings_count?: number
  earnings_this_month?: number
  occupancy_rate?: number
  cover_photo?: string | null
  images?: string[]
  created_at: string
}

const STATUS_CONFIG = {
  available:   { label: 'Disponible',  cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  occupied:    { label: 'Occupé',      cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'         },
  maintenance: { label: 'Maintenance', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
}

export default function PartnerPropertiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'available' | 'occupied' | 'maintenance'>('all')

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true)
        const testParam = typeof window !== 'undefined' && window.location.search.includes('_test_owner_id')
          ? `?_test_owner_id=${new URLSearchParams(window.location.search).get('_test_owner_id')}`
          : ''
        const res = await fetch(`/api/partner/properties${testParam}`)
        if (!res.ok) throw new Error('Erreur de chargement')
        const data = await res.json()
        setProperties(data?.data?.properties || data?.properties || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      } finally {
        setLoading(false)
      }
    }
    fetchProperties()
  }, [])

  const filtered = properties.filter(p => filter === 'all' || p.status === filter)

  const filterBtns = [
    { key: 'all',         label: 'Tous',           count: properties.length },
    { key: 'available',   label: '✅ Disponible',  count: properties.filter(p => p.status === 'available').length },
    { key: 'occupied',    label: '🔴 Occupé',      count: properties.filter(p => p.status === 'occupied').length },
    { key: 'maintenance', label: '🔧 Maintenance', count: properties.filter(p => p.status === 'maintenance').length },
  ]

  if (loading) return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1,2,3].map(i => (
          <Card key={i} className="overflow-hidden">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-t-lg" />
            <CardHeader><div className="h-5 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-3/4" /></CardHeader>
            <CardContent><div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-full" /></CardContent>
          </Card>
        ))}
      </div>
    </ResponsivePartnerLayout>
  )

  if (error) return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="text-center py-20">
        <div className="text-5xl mb-4">❌</div>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Réessayer</button>
      </div>
    </ResponsivePartnerLayout>
  )

  return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="space-y-6">

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🏠 Mes Propriétés</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Consultez vos lofts et suivez leurs performances</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filterBtns.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                filter === f.key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-5xl mb-4">🏠</div>
            <p className="text-gray-500 dark:text-gray-400">Aucune propriété trouvée.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(property => {
              const photoUrl = property.cover_photo || (property.images?.[0]) || null
              const sc = STATUS_CONFIG[property.status] || { label: property.status, cls: 'bg-gray-100 text-gray-800' }
              return (
                <Card
                  key={property.id}
                  className="cursor-pointer hover:shadow-xl transition-shadow duration-200 border-0 shadow-lg overflow-hidden group"
                  onClick={() => router.push(`/${locale}/partner/properties/${property.id}`)}
                >
                  {/* Photo — même style que OptimizedLoftsList */}
                  <div className="relative h-48 overflow-hidden rounded-t-lg bg-gray-200 dark:bg-gray-700">
                    {photoUrl ? (
                      <Image
                        src={photoUrl}
                        alt={property.name}
                        fill
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                        <MapPin className="h-12 w-12 mb-2" />
                        <span className="text-xs">Aucune photo</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge className={sc.cls}>{sc.label}</Badge>
                    </div>
                  </div>

                  {/* Header */}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {property.name}
                    </CardTitle>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="line-clamp-1">{property.address}</span>
                    </div>
                  </CardHeader>

                  {/* Content */}
                  <CardContent className="pt-0 space-y-3">
                    {/* Price + capacity */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        {property.max_guests && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{property.max_guests}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-gray-900 dark:text-white">
                          {property.price_per_night?.toLocaleString('fr-DZ')} DA
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">par nuit</div>
                      </div>
                    </div>

                    {/* Stats */}
                    {property.bookings_count !== undefined && (
                      <div className="border-t border-gray-100 dark:border-gray-700 pt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <div className="flex items-center justify-center gap-1 text-gray-400 mb-0.5">
                            <Calendar className="h-3 w-3" />
                          </div>
                          <div className="font-semibold text-gray-900 dark:text-white">{property.bookings_count}</div>
                          <div className="text-gray-500 dark:text-gray-400">Réservations</div>
                        </div>
                        <div>
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            {(property.earnings_this_month || 0).toLocaleString('fr-DZ')}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">DA/mois</div>
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-1 text-gray-400 mb-0.5">
                            <TrendingUp className="h-3 w-3" />
                          </div>
                          <div className="font-semibold text-gray-900 dark:text-white">{Math.round(property.occupancy_rate || 0)}%</div>
                          <div className="text-gray-500 dark:text-gray-400">Occupation</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </ResponsivePartnerLayout>
  )
}
