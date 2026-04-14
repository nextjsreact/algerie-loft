'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'
import { ResponsivePartnerLayout } from '@/components/partner/responsive-partner-layout'

const BLUR_DATA = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE5MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"

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
}

const STATUS_CONFIG = {
  available:   { label: 'Disponible',  cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  occupied:    { label: 'Occupé',      cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'         },
  maintenance: { label: 'Maintenance', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
}

export default function PartnerPropertyDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = use(params)
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => {
    async function load() {
      try {
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
    load()
  }, [id])

  if (loading) return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="space-y-4 max-w-4xl">
        <div className="h-72 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-2xl" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded w-1/2" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl" />)}
        </div>
      </div>
    </ResponsivePartnerLayout>
  )

  if (error || !property) return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="text-center py-20">
        <div className="text-5xl mb-4">❌</div>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button onClick={() => router.push(`/${locale}/partner/properties`)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          ← Retour
        </button>
      </div>
    </ResponsivePartnerLayout>
  )

  const sc = STATUS_CONFIG[property.status] || { label: property.status, cls: 'bg-gray-100 text-gray-800' }
  const allPhotos = [
    ...(property.cover_photo ? [property.cover_photo] : []),
    ...(property.images || []).filter(u => u !== property.cover_photo),
  ]
  const mainPhoto = allPhotos[activePhoto] || null

  return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="space-y-6 max-w-4xl">

        {/* Back */}
        <button onClick={() => router.push(`/${locale}/partner/properties`)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1">
          ← Retour aux propriétés
        </button>

        {/* Main photo — same style as homepage LoftCard */}
        <div className="relative h-72 sm:h-96 overflow-hidden rounded-2xl bg-gray-200 dark:bg-gray-700 group">
          {mainPhoto ? (
            <Image
              src={mainPhoto}
              alt={property.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 896px"
              priority
              placeholder="blur"
              blurDataURL={BLUR_DATA}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <MapPin className="h-16 w-16 mb-2" />
              <span className="text-sm">Aucune photo</span>
            </div>
          )}
          <div className="absolute top-4 right-4">
            <Badge className={sc.cls}>{sc.label}</Badge>
          </div>
          {/* Photo counter */}
          {allPhotos.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              {activePhoto + 1} / {allPhotos.length}
            </div>
          )}
        </div>

        {/* Thumbnail strip — same as homepage gallery */}
        {allPhotos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allPhotos.map((url, i) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                className={`relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  i === activePhoto ? 'border-blue-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={url}
                  alt={`Photo ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA}
                />
              </button>
            ))}
          </div>
        )}

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{property.name}</h1>
          <div className="flex items-center text-gray-500 dark:text-gray-400 mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{property.address}</span>
          </div>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Prix / nuit',    value: `${property.price_per_night?.toLocaleString('fr-DZ')} DA` },
            { label: 'Capacité',       value: `${property.max_guests ?? '—'} invités` },
            { label: 'Chambres',       value: property.bedrooms ?? '—' },
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
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {(property.earnings_this_month || 0).toLocaleString('fr-DZ')} DA
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Revenus ce mois</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {Math.round(property.occupancy_rate || 0)}%
                </div>
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

      </div>
    </ResponsivePartnerLayout>
  )
}
