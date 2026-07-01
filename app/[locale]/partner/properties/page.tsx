'use client'

import { useState, useEffect, use, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MapPin, Users, TrendingUp, Calendar, BedDouble, Bath,
  ChevronLeft, ChevronRight, Star, Plus, RefreshCw
} from 'lucide-react'
import { ResponsivePartnerLayout } from '@/components/partner/responsive-partner-layout'

interface Property {
  id: string
  name: string
  address: string
  price_per_night: number
  status: 'available' | 'occupied' | 'maintenance'
  max_guests?: number
  bedrooms?: number
  bathrooms?: number
  bookings_count?: number
  earnings_this_month?: number
  occupancy_rate?: number
  average_rating?: number
  cover_photo?: string | null
  images?: string[]
  next_booking?: { check_in: string; check_out: string; client_name: string }
  created_at: string
}

const STATUS = {
  available:   { label: 'Disponible',  cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  occupied:    { label: 'Occupé',      cls: 'bg-blue-100 text-blue-700 border border-blue-200' },
  maintenance: { label: 'Maintenance', cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
}

/** Carousel d'images au hover */
function PropertyImageCarousel({ images, name, status }: {
  images: string[]
  name: string
  status: Property['status']
}) {
  const [idx, setIdx] = useState(0)
  const [hovered, setHovered] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const sc = STATUS[status] || STATUS.available

  const allPhotos = images.filter(Boolean)

  const next = useCallback(() => setIdx(i => (i + 1) % Math.max(allPhotos.length, 1)), [allPhotos.length])
  const prev = useCallback(() => setIdx(i => (i - 1 + Math.max(allPhotos.length, 1)) % Math.max(allPhotos.length, 1)), [allPhotos.length])

  useEffect(() => {
    if (hovered && allPhotos.length > 1) {
      timerRef.current = setInterval(next, 1800)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      if (!hovered) setIdx(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [hovered, allPhotos.length, next])

  return (
    <div
      className="relative h-52 overflow-hidden bg-gray-100 dark:bg-gray-800"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {allPhotos.length > 0 ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <Image
              src={allPhotos[idx]}
              alt={`${name} — photo ${idx + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              priority={idx === 0}
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
          <MapPin className="h-12 w-12 mb-2 opacity-40" />
          <span className="text-xs">Aucune photo</span>
        </div>
      )}

      {/* Overlay dégradé */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {/* Badge statut */}
      <div className="absolute top-3 left-3">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${sc.cls}`}>
          {sc.label}
        </span>
      </div>

      {/* Nombre de photos */}
      {allPhotos.length > 1 && (
        <div className="absolute top-3 right-3 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
          {idx + 1}/{allPhotos.length}
        </div>
      )}

      {/* Flèches nav (visibles au hover) */}
      {hovered && allPhotos.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); prev() }}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); next() }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Dots */}
      {allPhotos.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {allPhotos.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setIdx(i) }}
              className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
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
      setError(null)
      const res = await fetch('/api/partner/properties')
      if (!res.ok) throw new Error('Erreur de chargement')
      const data = await res.json()
      setProperties(data?.data?.properties || data?.properties || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProperties() }, [])

  const filtered = properties.filter(p => filter === 'all' || p.status === filter)

  const filterBtns = [
    { key: 'all',         label: 'Tous',        count: properties.length },
    { key: 'available',   label: 'Disponible',  count: properties.filter(p => p.status === 'available').length },
    { key: 'occupied',    label: 'Occupé',      count: properties.filter(p => p.status === 'occupied').length },
    { key: 'maintenance', label: 'Maintenance', count: properties.filter(p => p.status === 'maintenance').length },
  ]

  if (loading) return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {[1,2,3].map(i => (
          <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-pulse">
            <div className="h-52 bg-gray-200 dark:bg-gray-700" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </ResponsivePartnerLayout>
  )

  if (error) return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={fetchProperties}><RefreshCw className="h-4 w-4 mr-2" />Réessayer</Button>
      </div>
    </ResponsivePartnerLayout>
  )

  return (
    <ResponsivePartnerLayout locale={locale}>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes Lofts</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {properties.length} loft{properties.length > 1 ? 's' : ''} enregistré{properties.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchProperties}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => router.push(`/${locale}/partner/properties/add`)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          {filterBtns.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                filter === f.key
                  ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                filter === f.key ? 'bg-white/20 dark:bg-black/20' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Grille */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun loft trouvé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((p, i) => {
              const allImages = [
                ...(p.cover_photo ? [p.cover_photo] : []),
                ...(p.images || []).filter(img => img !== p.cover_photo),
              ]

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="group rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => router.push(`/${locale}/partner/properties/${p.id}`)}
                >
                  {/* Carousel d'images */}
                  <PropertyImageCarousel images={allImages} name={p.name} status={p.status} />

                  {/* Infos */}
                  <div className="p-4 space-y-3">
                    {/* Nom + Prix */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-base text-gray-900 dark:text-white line-clamp-1 group-hover:text-violet-600 transition-colors">
                        {p.name}
                      </h3>
                      <div className="text-right flex-shrink-0">
                        <span className="text-base font-bold text-gray-900 dark:text-white">
                          {p.price_per_night.toLocaleString('fr-DZ')} DA
                        </span>
                        <span className="block text-[10px] text-gray-400">/nuit</span>
                      </div>
                    </div>

                    {/* Adresse */}
                    {p.address && (
                      <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="line-clamp-1">{p.address}</span>
                      </p>
                    )}

                    {/* Capacité */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {p.max_guests && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />{p.max_guests} pers.
                        </span>
                      )}
                      {p.bedrooms && (
                        <span className="flex items-center gap-1">
                          <BedDouble className="h-3.5 w-3.5" />{p.bedrooms} ch.
                        </span>
                      )}
                      {p.bathrooms && (
                        <span className="flex items-center gap-1">
                          <Bath className="h-3.5 w-3.5" />{p.bathrooms} sdb.
                        </span>
                      )}
                      {p.average_rating && p.average_rating > 0 && (
                        <span className="flex items-center gap-1 ml-auto">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {p.average_rating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    {/* Prochaine réservation */}
                    {p.next_booking && (
                      <div className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg px-3 py-2">
                        <span className="font-medium">Prochain séjour :</span>{' '}
                        {new Date(p.next_booking.check_in).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        {' → '}
                        {new Date(p.next_booking.check_out).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        {p.next_booking.client_name && ` · ${p.next_booking.client_name}`}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-3 grid grid-cols-3 gap-0 text-center">
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                          {p.bookings_count ?? '—'}
                        </p>
                        <p className="text-[10px] text-gray-400 flex items-center justify-center gap-0.5">
                          <Calendar className="h-3 w-3" /> Résa.
                        </p>
                      </div>
                      <div className="border-x border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {(p.earnings_this_month ?? 0).toLocaleString('fr-DZ')}
                        </p>
                        <p className="text-[10px] text-gray-400">DA/mois</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-0.5">
                          <TrendingUp className="h-3 w-3 text-violet-500" />
                          {Math.round(p.occupancy_rate ?? 0)}%
                        </p>
                        <p className="text-[10px] text-gray-400">Occup.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </ResponsivePartnerLayout>
  )
}
