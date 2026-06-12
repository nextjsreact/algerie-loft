'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, MapPin, X, ChevronLeft, ChevronRight,
  Users, BedDouble, Bath, Maximize2, Phone, Mail,
  Calendar, Star, Wifi, Car, Coffee, Tv, Wind, Shield,
  Grid2x2
} from 'lucide-react'

interface LoftDetailPageProps {
  params: Promise<{ id: string; locale: string }>
}

export default function LoftDetailPage({ params }: LoftDetailPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = resolvedParams.locale || 'fr'

  const [loft, setLoft] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Galerie
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [activePhoto, setActivePhoto] = useState(0)

  // Form state
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') || '')
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') || '')
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 1)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')

  useEffect(() => {
    fetch(`/api/lofts/${resolvedParams.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.loft) setLoft(data.loft)
        else setError(data.error || 'Loft non trouvé')
      })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [resolvedParams.id])

  // Lightbox — fermer avec Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') nextPhoto()
      if (e.key === 'ArrowLeft') prevPhoto()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxOpen, lightboxIndex])

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }
  const closeLightbox = () => {
    setLightboxOpen(false)
    document.body.style.overflow = ''
  }
  const nextPhoto = () => {
    const photos = loft?.photos || []
    setLightboxIndex(prev => (prev + 1) % photos.length)
  }
  const prevPhoto = () => {
    const photos = loft?.photos || []
    setLightboxIndex(prev => (prev - 1 + photos.length) % photos.length)
  }

  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    : 0
  const total = nights * (loft?.price_per_night || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkIn || !checkOut) { alert('Veuillez sélectionner les dates'); return }
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const cin = new Date(checkIn); cin.setHours(0, 0, 0, 0)
    const cout = new Date(checkOut); cout.setHours(0, 0, 0, 0)
    if (cin < today) { alert("La date d'arrivée ne peut pas être dans le passé"); return }
    if (cout <= cin) { alert("La date de départ doit être après la date d'arrivée"); return }
    if (!guestPhone.trim()) { alert('Le numéro de téléphone est obligatoire'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loft_id: loft.id,
          guest_name: guestName || null,
          guest_email: guestEmail || null,
          guest_phone: guestPhone,
          guest_nationality: 'DZ',
          guest_count: guests,
          check_in_date: checkIn,
          check_out_date: checkOut,
          base_price: total,
          cleaning_fee: 0,
          service_fee: 0,
          taxes: 0,
          total_amount: total,
          special_requests: specialRequests || null,
          source: 'client',
        }),
      })
      const data = await res.json()
      if (data.success || data.data?.id) setSuccess(true)
      else alert(data.error || 'Erreur lors de la réservation')
    } catch {
      alert('Erreur réseau')
    }
    setSubmitting(false)
  }

  /* ─── États de chargement ─── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7] dark:bg-neutral-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin dark:border-neutral-700 dark:border-t-white" />
        <p className="text-sm text-neutral-500">Chargement…</p>
      </div>
    </div>
  )

  if (error || !loft) return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7] dark:bg-neutral-950">
      <div className="text-center">
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">{error || 'Loft non trouvé'}</p>
        <button onClick={() => router.back()} className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900">
          Retour
        </button>
      </div>
    </div>
  )

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7] dark:bg-neutral-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto p-10 bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-neutral-100 dark:border-neutral-800"
      >
        <div className="text-5xl mb-5">🎉</div>
        <h2 className="text-2xl font-medium text-neutral-900 dark:text-white mb-3">Réservation envoyée !</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mb-8 text-sm leading-relaxed">
          Votre demande pour <strong className="text-neutral-900 dark:text-white">{loft.name}</strong> a bien été envoyée. Notre équipe vous contactera pour confirmer.
        </p>
        <button onClick={() => router.push(`/${locale}`)} className="rounded-full bg-neutral-900 px-8 py-3.5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900">
          Retour à l'accueil
        </button>
      </motion.div>
    </div>
  )

  const photos: string[] = loft.photos?.length ? loft.photos : loft.cover_photo ? [loft.cover_photo] : []

  /* ─── Page principale ─── */
  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-neutral-950" style={{ fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* ─── Header ─── */}
      <div className="sticky top-0 z-30 border-b border-neutral-200/70 bg-white/90 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <h1 className="text-base font-medium text-neutral-900 dark:text-white truncate max-w-xs hidden sm:block"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {loft.name}
          </h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ─── GALERIE PHOTOS ─── */}
        {photos.length > 0 && (
          <div className="mb-10">
            {/* Layout galerie : grande photo + grille */}
            <div className="grid grid-cols-1 gap-2 md:grid-cols-4 md:grid-rows-2" style={{ height: 480 }}>
              {/* Photo principale */}
              <div
                className="group relative col-span-2 row-span-2 cursor-pointer overflow-hidden rounded-2xl md:rounded-r-none bg-neutral-200 dark:bg-neutral-800"
                onClick={() => openLightbox(0)}
              >
                <Image
                  src={photos[0]}
                  alt={loft.name}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
              </div>

              {/* Photos secondaires */}
              {photos.slice(1, 5).map((photo, i) => (
                <div
                  key={i}
                  className="group relative cursor-pointer overflow-hidden bg-neutral-200 dark:bg-neutral-800"
                  style={{
                    borderRadius: i === 1 ? '0 1rem 0 0' : i === 3 ? '0 0 1rem 0' : undefined
                  }}
                  onClick={() => openLightbox(i + 1)}
                >
                  <Image
                    src={photo}
                    alt={`${loft.name} ${i + 2}`}
                    fill
                    sizes="25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />
                  {/* Bouton "voir tout" sur la dernière */}
                  {i === 3 && photos.length > 5 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <button
                        onClick={e => { e.stopPropagation(); openLightbox(4) }}
                        className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-neutral-900 backdrop-blur-sm transition-transform hover:scale-105"
                      >
                        <Grid2x2 className="h-4 w-4" />
                        +{photos.length - 5} photos
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Si moins de 5 photos, remplir */}
              {photos.length < 5 && Array.from({ length: 4 - (photos.length - 1) }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-neutral-100 dark:bg-neutral-800/50"
                  style={{
                    borderRadius: photos.length === 1 && i === 0 ? '0 1rem 0 0'
                      : photos.length === 1 && i === 2 ? '0 0 1rem 0' : undefined
                  }}
                />
              ))}
            </div>

            {/* Thumbnails scrollables (mobile) */}
            {photos.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden" style={{ scrollbarWidth: 'none' }}>
                {photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => openLightbox(i)}
                    className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${i === activePhoto ? 'border-neutral-900 dark:border-white' : 'border-transparent'}`}
                  >
                    <Image src={photo} alt="" fill sizes="64px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── CONTENU ─── */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Colonne gauche — infos */}
          <div className="lg:col-span-2 space-y-8">
            {/* Titre + localisation */}
            <div className="border-b border-neutral-200/70 pb-8 dark:border-neutral-800">
              <h1 className="text-3xl font-medium leading-tight text-neutral-900 dark:text-white sm:text-4xl" style={{ fontFamily: "'Fraunces', serif" }}>
                {loft.name}
              </h1>
              {(loft.address || loft.zone_name) && (
                <p className="mt-3 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  {loft.zone_name || loft.address}
                </p>
              )}

              {/* Caractéristiques */}
              <div className="mt-5 flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                {loft.max_guests && (
                  <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{loft.max_guests} voyageurs</span>
                )}
                {loft.bedrooms && (
                  <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4" />{loft.bedrooms} chambre{loft.bedrooms > 1 ? 's' : ''}</span>
                )}
                {loft.bathrooms && (
                  <span className="flex items-center gap-1.5"><Bath className="h-4 w-4" />{loft.bathrooms} salle{loft.bathrooms > 1 ? 's' : ''} de bain</span>
                )}
                {loft.area_sqm && (
                  <span className="flex items-center gap-1.5"><Maximize2 className="h-4 w-4" />{loft.area_sqm} m²</span>
                )}
              </div>
            </div>

            {/* Description */}
            {loft.description && (
              <div className="border-b border-neutral-200/70 pb-8 dark:border-neutral-800">
                <h2 className="mb-4 text-xl font-medium text-neutral-900 dark:text-white" style={{ fontFamily: "'Fraunces', serif" }}>
                  À propos de ce loft
                </h2>
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{loft.description}</p>
              </div>
            )}

            {/* Équipements */}
            <div className="border-b border-neutral-200/70 pb-8 dark:border-neutral-800">
              <h2 className="mb-5 text-xl font-medium text-neutral-900 dark:text-white" style={{ fontFamily: "'Fraunces', serif" }}>
                Ce que propose ce loft
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { icon: Wifi, label: 'WiFi gratuit' },
                  { icon: Car, label: 'Parking' },
                  { icon: Coffee, label: 'Cuisine équipée' },
                  { icon: Tv, label: 'Télévision' },
                  { icon: Wind, label: 'Climatisation' },
                  { icon: Shield, label: 'Sécurisé' },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800">
                    <a.icon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" strokeWidth={1.5} />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{a.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Règles check-in/out */}
            {(loft.check_in_time || loft.check_out_time || loft.house_rules) && (
              <div>
                <h2 className="mb-5 text-xl font-medium text-neutral-900 dark:text-white" style={{ fontFamily: "'Fraunces', serif" }}>
                  Règles du loft
                </h2>
                <div className="space-y-3 text-sm">
                  {loft.check_in_time && (
                    <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>Arrivée : à partir de {loft.check_in_time}</span>
                    </div>
                  )}
                  {loft.check_out_time && (
                    <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>Départ : avant {loft.check_out_time}</span>
                    </div>
                  )}
                  {loft.house_rules && (
                    <p className="mt-2 text-neutral-600 dark:text-neutral-400">{loft.house_rules}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite — formulaire réservation sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              {/* Prix */}
              <div className="mb-6 flex items-baseline gap-2">
                <span className="text-3xl font-medium text-neutral-900 dark:text-white" style={{ fontFamily: "'Fraunces', serif" }}>
                  {loft.price_per_night?.toLocaleString('fr-FR')} DA
                </span>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">/ nuit</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Dates */}
                <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700">
                  <div className="border-r border-neutral-200 px-3 py-2.5 dark:border-neutral-700">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">Arrivée</label>
                    <input type="date" value={checkIn}
                      onChange={e => { setCheckIn(e.target.value); if (checkOut && checkOut <= e.target.value) setCheckOut('') }}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full text-sm font-medium text-neutral-900 dark:text-white bg-transparent outline-none" required />
                  </div>
                  <div className="px-3 py-2.5">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">Départ</label>
                    <input type="date" value={checkOut}
                      onChange={e => setCheckOut(e.target.value)}
                      min={checkIn ? new Date(new Date(checkIn + 'T00:00:00').getTime() + 86400000).toISOString().split('T')[0] : new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                      className="w-full text-sm font-medium text-neutral-900 dark:text-white bg-transparent outline-none" required />
                  </div>
                </div>

                {/* Voyageurs */}
                <div className="rounded-2xl border border-neutral-200 px-3 py-2.5 dark:border-neutral-700">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">Voyageurs</label>
                  <input type="number" min="1" max={loft.max_guests || 10} value={guests}
                    onChange={e => setGuests(Number(e.target.value))}
                    className="w-full text-sm font-medium text-neutral-900 dark:text-white bg-transparent outline-none" />
                </div>

                {/* Téléphone */}
                <input type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
                  placeholder="Téléphone *" required
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400 dark:border-neutral-700 dark:bg-transparent dark:text-white dark:placeholder-neutral-600" />

                <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)}
                  placeholder="Nom (optionnel)"
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400 dark:border-neutral-700 dark:bg-transparent dark:text-white dark:placeholder-neutral-600" />

                <input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
                  placeholder="Email (optionnel)"
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400 dark:border-neutral-700 dark:bg-transparent dark:text-white dark:placeholder-neutral-600" />

                <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}
                  rows={2} placeholder="Demandes spéciales (optionnel)"
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400 resize-none dark:border-neutral-700 dark:bg-transparent dark:text-white dark:placeholder-neutral-600" />

                {/* Résumé prix */}
                {nights > 0 && (
                  <div className="rounded-2xl bg-neutral-50 p-4 space-y-2 text-sm dark:bg-neutral-800">
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>{loft.price_per_night?.toLocaleString('fr-FR')} DA × {nights} nuit{nights > 1 ? 's' : ''}</span>
                      <span>{total.toLocaleString('fr-FR')} DA</span>
                    </div>
                    <div className="flex justify-between border-t border-neutral-200 pt-2 font-semibold text-neutral-900 dark:border-neutral-700 dark:text-white">
                      <span>Total</span>
                      <span>{total.toLocaleString('fr-FR')} DA</span>
                    </div>
                  </div>
                )}

                <button type="submit" disabled={submitting || nights <= 0}
                  className="w-full rounded-full bg-neutral-900 py-4 text-sm font-semibold text-white transition-all hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100">
                  {submitting ? 'Envoi…' : nights > 0 ? `Demander — ${total.toLocaleString('fr-FR')} DA` : 'Choisir les dates'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ─── LIGHTBOX ─── */}
      <AnimatePresence>
        {lightboxOpen && photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/97"
            onClick={closeLightbox}
          >
            {/* Bouton fermer — grand, visible, coin haut droit */}
            <button
              onClick={e => { e.stopPropagation(); closeLightbox() }}
              className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-110 sm:right-6 sm:top-6"
              aria-label="Fermer"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Texte "Appuyez sur Échap pour fermer" — mobile */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none">
              <span className="text-xs text-white/40 hidden sm:block">Échap pour fermer</span>
              <span className="text-xs text-white/60 font-medium">
                {lightboxIndex + 1} / {photos.length}
              </span>
            </div>

            {/* Prev */}
            {photos.length > 1 && (
              <button
                onClick={e => { e.stopPropagation(); prevPhoto() }}
                className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-all hover:bg-white/30 sm:left-6 sm:h-14 sm:w-14"
                aria-label="Photo précédente"
              >
                <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
              </button>
            )}

            {/* Image principale */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative mx-16 w-full max-w-5xl overflow-hidden rounded-xl sm:mx-24"
              style={{ aspectRatio: '4/3' }}
              onClick={e => e.stopPropagation()}
            >
              <Image
                src={photos[lightboxIndex]}
                alt={`${loft.name} — photo ${lightboxIndex + 1}`}
                fill
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-contain"
                priority
              />
            </motion.div>

            {/* Next */}
            {photos.length > 1 && (
              <button
                onClick={e => { e.stopPropagation(); nextPhoto() }}
                className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-all hover:bg-white/30 sm:right-6 sm:h-14 sm:w-14"
                aria-label="Photo suivante"
              >
                <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
              </button>
            )}

            {/* Thumbnails en bas */}
            {photos.length > 1 && (
              <div
                className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 overflow-x-auto pb-1 max-w-[85vw]"
                onClick={e => e.stopPropagation()}
                style={{ scrollbarWidth: 'none' }}
              >
                {photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={e => { e.stopPropagation(); setLightboxIndex(i) }}
                    className={`relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                      i === lightboxIndex
                        ? 'ring-2 ring-white opacity-100'
                        : 'opacity-40 hover:opacity-70'
                    }`}
                  >
                    <Image src={photo} alt="" fill sizes="64px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
