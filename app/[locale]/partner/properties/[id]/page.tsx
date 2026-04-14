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

export default function PartnerPropertyDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = use(params)
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProperty() {
      try {
        // Reuse the partner properties list and find the one we need
        const res = await fetch('/api/partner/properties')
        if (!res.ok) throw new Error('Erreur de chargement')
        const data = await res.json()
        const props: Property[] = data?.data?.properties || data?.properties || []
        const found = props.find(p => p.id === id)
        if (!found) throw new Error('Propriété non trouvée')
        setProperty(found)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      } finally {
        setLoading(false)
      }
    }
    fetchProperty()
  }, [id])

  const statusConfig: Record<string, { label: string; cls: string }> = {
    available:   { label: 'Disponible',  cls: 'bg-emerald-500' },
    occupied:    { label: 'Occupé',      cls: 'bg-amber-500'   },
    maintenance: { label: 'Maintenance', cls: 'bg-red-500'     },
  }

  if (loading) return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-5xl mb-4">🔄</div>
          <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    </ResponsivePartnerLayout>
  )

  if (error || !property) return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Propriété non trouvée</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button onClick={() => router.push(`/${locale}/partner/properties`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            ← Retour aux propriétés
          </button>
        </div>
      </div>
    </ResponsivePartnerLayout>
  )

  const sc = statusConfig[property.status] || { label: property.status, cls: 'bg-gray-500' }
  const photoUrl = property.cover_photo || (property.images && property.images[0]) || null
  const allPhotos = property.images || (photoUrl ? [photoUrl] : [])

  return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="space-y-6 max-w-4xl">

        {/* Back */}
        <button onClick={() => router.push(`/${locale}/partner/properties`)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1">
          ← Retour aux propriétés
        </button>

        {/* Hero photo */}
        <div className="relative h-72 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          {photoUrl ? (
            <img src={photoUrl} alt={property.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <span className="text-6xl mb-2">🏠</span>
              <span className="text-sm">Aucune photo</span>
            </div>
          )}
          <span className={`absolute top-4 right-4 ${sc.cls} text-white text-sm font-semibold px-3 py-1 rounded-full shadow`}>
            {sc.label}
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{property.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">📍 {property.address}</p>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Prix / nuit', value: `${property.price_per_night?.toLocaleString('fr-DZ')} DA` },
            { label: 'Capacité',    value: `${property.max_guests ?? '—'} invités` },
            { label: 'Chambres',    value: property.bedrooms ?? '—' },
            { label: 'Salles de bain', value: property.bathrooms ?? '—' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</div>
              <div className="font-bold text-gray-900 dark:text-white">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Performance */}
        {property.bookings_count !== undefined && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">📊 Performances</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{property.bookings_count}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Réservations</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{(property.earnings_this_month || 0).toLocaleString('fr-DZ')} DA</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Revenus ce mois</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{Math.round(property.occupancy_rate || 0)}%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Occupation</div>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {property.description && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Description</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{property.description}</p>
          </div>
        )}

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">✨ Équipements</h2>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((a, i) => (
                <span key={i} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded-full">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Photo gallery */}
        {allPhotos.length > 1 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">📸 Photos ({allPhotos.length})</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {allPhotos.map((url, i) => (
                <img key={i} src={url} alt={`Photo ${i + 1}`}
                  className="w-full h-24 object-cover rounded-lg" />
              ))}
            </div>
          </div>
        )}

      </div>
    </ResponsivePartnerLayout>
  )
}
