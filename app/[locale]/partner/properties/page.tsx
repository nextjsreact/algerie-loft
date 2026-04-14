'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ResponsivePartnerLayout } from '@/components/partner/responsive-partner-layout'

interface Property {
  id: string
  name: string
  address: string
  description?: string
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

export default function PartnerPropertiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'available' | 'occupied' | 'maintenance'>('all')

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/partner/properties')
      if (!response.ok) throw new Error('Erreur lors du chargement des propriétés')
      const data = await response.json()
      const props = data?.data?.properties || data?.properties || []
      console.log('[Partner Properties] received:', props.length, 'properties')
      if (props[0]) console.log('[Partner Properties] first property cover_photo:', props[0].cover_photo, 'images:', props[0].images)
      setProperties(props)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProperties() }, [])

  const filtered = properties.filter(p => filter === 'all' || p.status === filter)

  const statusConfig = {
    available: { label: 'Disponible', cls: 'bg-emerald-500' },
    occupied:  { label: 'Occupé',     cls: 'bg-amber-500'   },
    maintenance:{ label: 'Maintenance', cls: 'bg-red-500'   },
  }

  const filterBtns = [
    { key: 'all',         label: 'Tous',           count: properties.length },
    { key: 'available',   label: '✅ Disponible',  count: properties.filter(p => p.status === 'available').length },
    { key: 'occupied',    label: '🔴 Occupé',      count: properties.filter(p => p.status === 'occupied').length },
    { key: 'maintenance', label: '🔧 Maintenance', count: properties.filter(p => p.status === 'maintenance').length },
  ]

  if (loading) return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-5xl mb-4">🔄</div>
          <p className="text-gray-500 dark:text-gray-400">Chargement de vos propriétés...</p>
        </div>
      </div>
    </ResponsivePartnerLayout>
  )

  if (error) return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Erreur de chargement</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button onClick={fetchProperties} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Réessayer
          </button>
        </div>
      </div>
    </ResponsivePartnerLayout>
  )

  return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="space-y-6">

        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🏠 Mes Propriétés</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Consultez vos lofts et suivez leurs performances</p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {filterBtns.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  filter === f.key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>

        {/* Properties Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center shadow-sm">
            <div className="text-5xl mb-4">🏠</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucune propriété</h2>
            <p className="text-gray-500 dark:text-gray-400">Aucune propriété trouvée pour ce filtre.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filtered.map((property) => {
              const photoUrl = property.cover_photo || (property.images && property.images[0]) || null
              const sc = statusConfig[property.status] || { label: property.status, cls: 'bg-gray-500' }
              return (
                <div
                  key={property.id}
                  onClick={() => router.push(`/${locale}/partner/properties/${property.id}`)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden group"
                >
                  {/* Photo */}
                  <div className="relative h-52 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={property.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          console.warn('[Partner Properties] image failed to load:', photoUrl)
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                        <span className="text-4xl mb-2">🏠</span>
                        <span className="text-xs">Aucune photo</span>
                      </div>
                    )}
                    {/* Status badge */}
                    <span className={`absolute top-3 right-3 ${sc.cls} text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow`}>
                      {sc.label}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {property.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      📍 {property.address}
                    </p>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Prix par nuit</div>
                        <div className="font-bold text-gray-900 dark:text-white">{property.price_per_night?.toLocaleString('fr-DZ')} DA</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Capacité</div>
                        <div className="font-bold text-gray-900 dark:text-white">{property.max_guests ?? '—'} invités</div>
                      </div>
                      {property.bedrooms != null && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Chambres</div>
                          <div className="font-bold text-gray-900 dark:text-white">{property.bedrooms}</div>
                        </div>
                      )}
                      {property.bathrooms != null && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Salles de bain</div>
                          <div className="font-bold text-gray-900 dark:text-white">{property.bathrooms}</div>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    {property.bookings_count !== undefined && (
                      <div className="border-t border-gray-100 dark:border-gray-700 pt-4 grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Réservations</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{property.bookings_count}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Revenus/mois</div>
                          <div className="font-semibold text-green-600 dark:text-green-400">{(property.earnings_this_month || 0).toLocaleString('fr-DZ')} DA</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Occupation</div>
                          <div className="font-semibold text-gray-900 dark:text-white">{Math.round(property.occupancy_rate || 0)}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ResponsivePartnerLayout>
  )
}
