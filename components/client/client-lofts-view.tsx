"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, MapPin, Heart, SlidersHorizontal, Users, BedDouble, Bath } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getZoneAreas } from "@/app/actions/zone-areas"

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
  loft_photos?: Array<{ id: string; url: string; order_index?: number; display_order?: number }>
  zone_areas?: { id: string; name: string }
}

interface ClientLoftsViewProps {
  lofts: Loft[]
  locale: string
}

export function ClientLoftsView({ lofts, locale }: ClientLoftsViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedZone, setSelectedZone] = useState<string>("all")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [allZones, setAllZones] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    getZoneAreas().then(data => setAllZones(data))
  }, [])

  const filteredLofts = useMemo(() => {
    return lofts.filter(loft => {
      const matchesSearch =
        loft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loft.address.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesZone = selectedZone === "all" || loft.zone_areas?.name === selectedZone
      return matchesSearch && matchesZone
    })
  }, [lofts, searchQuery, selectedZone])

  const toggleFavorite = (e: React.MouseEvent, loftId: string) => {
    e.preventDefault()
    setFavorites(prev => {
      const next = new Set(prev)
      next.has(loftId) ? next.delete(loftId) : next.add(loftId)
      return next
    })
  }

  const getBestPhoto = (loft: Loft): string | null => {
    if (!loft.loft_photos?.length) return null
    return loft.loft_photos.sort((a, b) => {
      const oa = a.order_index ?? a.display_order ?? 999
      const ob = b.order_index ?? b.display_order ?? 999
      return oa - ob
    })[0]?.url || null
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-neutral-950" style={{ fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* ─── Barre de recherche sticky ─── */}
      <div className="sticky top-0 z-20 border-b border-neutral-200/70 bg-white/90 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Rechercher un loft, une adresse…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none transition-colors focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500"
              />
            </div>

            {/* Filtre zone */}
            <select
              value={selectedZone}
              onChange={e => setSelectedZone(e.target.value)}
              className="rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white sm:w-48"
            >
              <option value="all">Toutes les zones</option>
              {allZones.map(zone => (
                <option key={zone.id} value={zone.name}>{zone.name}</option>
              ))}
            </select>
          </div>

          <p className="mt-2.5 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-medium text-neutral-900 dark:text-white">{filteredLofts.length}</span> loft{filteredLofts.length > 1 ? 's' : ''} disponible{filteredLofts.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ─── Grille — 4 colonnes ─── */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {filteredLofts.length === 0 ? (
          <div className="py-20 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-neutral-300" />
            <p className="text-neutral-500">Aucun loft correspond à votre recherche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
            {filteredLofts.map((loft, i) => {
              const photo = getBestPhoto(loft)
              const isFav = favorites.has(loft.id)

              return (
                <motion.div
                  key={loft.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: (i % 4) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link href={`/${locale}/client/lofts/${loft.id}`} className="group block">
                    {/* Photo */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-800">
                      {photo ? (
                        <Image
                          src={photo}
                          alt={loft.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <MapPin className="h-8 w-8 text-neutral-400" />
                        </div>
                      )}

                      {/* Overlay hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                      {/* Bouton favori */}
                      <button
                        onClick={e => toggleFavorite(e, loft.id)}
                        className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-all hover:bg-white dark:bg-black/50 dark:hover:bg-black/70"
                        aria-label="Favori"
                      >
                        <Heart className={`h-4 w-4 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-neutral-600 dark:text-white'}`} />
                      </button>

                      {/* Badge zone */}
                      {loft.zone_areas?.name && (
                        <div className="absolute bottom-2.5 left-2.5 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-medium text-neutral-800 backdrop-blur-sm dark:bg-black/60 dark:text-white">
                          {loft.zone_areas.name}
                        </div>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium leading-tight text-neutral-900 dark:text-white line-clamp-1"
                          style={{ fontFamily: "'Fraunces', serif" }}>
                          {loft.name}
                        </h3>
                        <div className="text-right flex-shrink-0">
                          <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {loft.price_per_night.toLocaleString('fr-FR')} DA
                          </span>
                          <span className="block text-[10px] text-neutral-500">/nuit</span>
                        </div>
                      </div>

                      {loft.address && (
                        <p className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{loft.address}</span>
                        </p>
                      )}

                      {/* Caractéristiques */}
                      {(loft.bedrooms || loft.bathrooms || loft.max_guests) && (
                        <div className="flex items-center gap-3 text-[11px] text-neutral-400 dark:text-neutral-500">
                          {loft.bedrooms && <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />{loft.bedrooms}</span>}
                          {loft.bathrooms && <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{loft.bathrooms}</span>}
                          {loft.max_guests && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{loft.max_guests}</span>}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
