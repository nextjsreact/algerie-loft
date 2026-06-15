'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NotificationsWrapper, type AirbnbNotificationItem } from '@/components/notifications/notifications-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Star, MessageSquareText, ThumbsUp, CalendarDays, ArrowLeft } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { type Notification, type UserRole } from '@/lib/types'

type Review = {
  id: string
  booking_id: string | null
  rating: number | null
  review_text: string | null
  created_at: string
  is_published: boolean
  response_text: string | null
  response_date: string | null
  loft_id: string
  loft_name?: string | null
  loft_address?: string | null
  booking_check_in: string | null
  booking_check_out: string | null
}

type Booking = {
  id: string
  loft_id: string | null
  loft_name: string | null
  loft_address: string | null
  check_in: string | null
  check_out: string | null
  guests: number | null
  total_price: number | null
  status: string | null
  payment_status: string | null
  booking_reference: string | null
  created_at: string
}

type Payload = {
  user: {
    id: string
    email: string | null
    full_name: string | null
    role: UserRole
  }
  notifications: Notification[]
  airbnbNotifications: AirbnbNotificationItem[]
  reviews: Review[]
  bookings: Booking[]
}

function getDisplayLocale(locale: string) {
  if (locale === 'ar') return 'ar-DZ'
  if (locale === 'en') return 'en-US'
  return 'fr-FR'
}

function formatDateTime(iso: string, locale: string) {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat(getDisplayLocale(locale), {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return iso
  }
}

function formatShortDate(value: string | null | undefined, locale: string) {
  if (!value) return '—'
  try {
    const d = new Date(value)
    return new Intl.DateTimeFormat(getDisplayLocale(locale), {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(d)
  } catch {
    return value
  }
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined, locale: string) {
  return `${formatShortDate(start, locale)} → ${formatShortDate(end, locale)}`
}

function getNights(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return null
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null
  return Math.max(0, Math.ceil((endMs - startMs) / 86400000))
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return null
  return `${value.toLocaleString('fr-DZ')} DA`
}

function getBookingStatusClass(status: string | null) {
  switch (status) {
    case 'confirmed':
      return 'bg-green-50 text-green-700 border border-green-200'
    case 'completed':
      return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border border-red-200'
    default:
      return 'bg-yellow-50 text-yellow-700 border border-yellow-200'
  }
}

export default function ClientJournalAvisPage() {
  const t = useTranslations('client.journalAvis')
  const locale = useLocale()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState<Payload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reviewBookingId, setReviewBookingId] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const reviewFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/client/journal-avis', { cache: 'no-store' })
        if (res.status === 401) {
          router.push(`/${locale}/login`)
          return
        }
        if (!res.ok) {
          throw new Error('Failed to load')
        }
        const data: Payload = await res.json()
        if (!cancelled) setPayload(data)
      } catch {
        if (!cancelled) setError('Impossible de charger le journal & les avis.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [locale, router])

  const reviewsSorted = useMemo(() => {
    const reviews = payload?.reviews || []
    return [...reviews].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [payload?.reviews])

  const notifications = payload?.notifications || []
  const airbnbNotifications = payload?.airbnbNotifications || []
  const bookings = payload?.bookings || []
  const reviews = reviewsSorted

  // Séjours éligibles à un avis : completed OU confirmed avec check-out dépassé
  const now = new Date()
  const completedBookings = bookings.filter((booking) => {
    if (booking.status === 'completed') return true
    if (booking.status === 'confirmed' && booking.check_out) {
      return new Date(booking.check_out) < now
    }
    return false
  })

  useEffect(() => {
    if (!reviewBookingId && completedBookings.length > 0) {
      setReviewBookingId(completedBookings[0].id)
    }
  }, [completedBookings, reviewBookingId])

  const userRole = (payload?.user.role || 'client') as UserRole
  const userId = payload?.user.id || ''

  const handleNotificationRead = async (id: string) => {
    setPayload((current) => {
      if (!current) return current
      return {
        ...current,
        notifications: current.notifications.map((notification) =>
          notification.id === id
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        ),
      }
    })

    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    } catch {
      toast.error("Erreur lors du marquage de la notification")
    }
  }

  const handleMarkAllNotificationsRead = async () => {
    setPayload((current) => {
      if (!current) return current
      return {
        ...current,
        notifications: current.notifications.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: notification.read_at || new Date().toISOString(),
        })),
      }
    })

    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' })
    } catch {
      toast.error("Erreur lors du marquage des notifications")
    }
  }

  const handleAirbnbNotificationRead = async (id: string) => {
    setPayload((current) => {
      if (!current) return current
      return {
        ...current,
        airbnbNotifications: current.airbnbNotifications.map((notification) =>
          notification.id === id ? { ...notification, is_read: true } : notification
        ),
      }
    })
  }

  const handleAirbnbMarkAllRead = async () => {
    setPayload((current) => {
      if (!current) return current
      return {
        ...current,
        airbnbNotifications: current.airbnbNotifications.map((notification) => ({
          ...notification,
          is_read: true,
        })),
      }
    })
  }

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!reviewBookingId || !payload) return

    setSubmittingReview(true)
    try {
      const res = await fetch('/api/client/journal-avis/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: reviewBookingId,
          rating: reviewRating,
          review_text: reviewText,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => null)
        throw new Error(error?.error || 'Erreur lors de l’envoi de l’avis')
      }

      const review = await res.json()
      setPayload((current) => current ? { ...current, reviews: [review, ...current.reviews] } : current)
      setReviewText('')
      toast.success(t('reviewSubmitted'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('reviewSubmitError'))
    } finally {
      setSubmittingReview(false)
    }
  }

  const openReviewForm = (bookingId: string) => {
    setReviewBookingId(bookingId)
    window.setTimeout(() => {
      reviewFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Ne jamais bloquer l’affichage du formulaire :
  // - loader tant que le fetch n’est pas terminé
  // - en cas d’erreur : on affiche l’UI avec valeurs sûres (formulaire fonctionnel)
  //   (seulement la liste des avis/séjours dépendra des données)
  const safePayload: Payload =
    payload ?? {
      user: {
        id: '',
        email: null,
        full_name: null,
        role: 'client',
      },
      notifications: [],
      airbnbNotifications: [],
      reviews: [],
      bookings: [],
    }

  const safeNotifications = safePayload.notifications || []
  const safeAirbnbNotifications = safePayload.airbnbNotifications || []
  const safeBookings = safePayload.bookings || []
  const safeUserRole = (safePayload.user.role || 'client') as UserRole
  const safeUserId = safePayload.user.id || ''

  // Rebind variables utilisées par le JSX
  const reviewsForUi = [...(safePayload.reviews || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const journalEntriesCount = safePayload.journalEntries ?? (safeNotifications.length + safeAirbnbNotifications.length)
  const reviewEntriesCount = safePayload.reviewEntries ?? reviewsForUi.length
  const bookingsForUi = safeBookings

  // Set of booking IDs that already have a review
  const reviewedBookingIds = new Set(reviews.map(r => r.booking_id).filter(Boolean))

  const completedBookingsForUi = bookingsForUi.filter((booking) => {
    if (reviewedBookingIds.has(booking.id)) return false
    if (booking.status === 'completed') return true
    if (booking.status === 'confirmed' && booking.check_out) {
      return new Date(booking.check_out) < now
    }
    return false
  })

  // Petit bandeau d’erreur (optionnel) mais on rend quand même le formulaire
  const showError = Boolean(error)

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <button onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white mb-2">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('title', { defaultValue: 'Journal & Avis' })}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('subtitle', { defaultValue: 'Votre historique et vos appréciations, au même endroit.' })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200">
            <MessageSquareText className="h-3.5 w-3.5 mr-1" />
            {t('journalCount', { count: journalEntriesCount, defaultValue: `Journal (${journalEntriesCount})` })}
          </Badge>
          <Badge variant="secondary" className="bg-purple-50 text-purple-700 border border-purple-200">
            <CalendarDays className="h-3.5 w-3.5 mr-1" />
            {t('stayCount', { count: bookingsForUi.length })}
          </Badge>
          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border border-yellow-200">
            <ThumbsUp className="h-3.5 w-3.5 mr-1" />
            {t('reviewCount', { count: reviewEntriesCount, defaultValue: `Avis (${reviewEntriesCount})` })}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5" />
              {t('journalTitle', { defaultValue: 'Journal' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {showError ? (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {t('loading', { defaultValue: error || 'Impossible de charger le journal & les avis.' })}
              </div>
            ) : null}

            <NotificationsWrapper
              notifications={safeNotifications}
              userRole={safeUserRole}
              userId={safeUserId}
              airbnbNotifications={safeAirbnbNotifications}
              onNotificationRead={handleNotificationRead}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onAirbnbNotificationRead={handleAirbnbNotificationRead}
              onAirbnbMarkAllRead={handleAirbnbMarkAllRead}
            />

            {bookingsForUi.length > 0 && (
               <div className="border-t p-4">
                 <div className="flex items-center justify-between mb-3">
                   <h3 className="text-sm font-semibold">
                     {t('recentStays', { defaultValue: 'Séjours récents' })}
                   </h3>
                   <Badge variant="outline">
                    {t('stayCount', { count: bookingsForUi.length, defaultValue: `Séjours (${bookingsForUi.length})` })}
                   </Badge>
                 </div>
                 <div className="space-y-3">
                  {bookingsForUi.slice(0, 5).map((booking) => {
                     const nights = getNights(booking.check_in, booking.check_out)
                     return (
                       <div key={booking.id} className="rounded-lg border bg-muted/20 p-3">
                         <div className="flex items-start justify-between gap-3">
                           <div className="min-w-0">
                             <p className="text-sm font-semibold truncate">
                               {booking.loft_name || t('unknownLoft', { defaultValue: 'Loft' })}
                             </p>
                             <p className="text-xs text-muted-foreground mt-1">
                               {formatDateRange(booking.check_in, booking.check_out, locale)}
                               {nights !== null ? ` · ${t('nights', { count: nights })}` : ''}
                             </p>
                           </div>
                           <Badge className={getBookingStatusClass(booking.status)}>{booking.status}</Badge>
                         </div>
 
                         {booking.total_price !== null && booking.total_price !== undefined && (
                           <p className="text-xs text-muted-foreground mt-2">{formatMoney(booking.total_price)}</p>
                         )}
 
                         {booking.status === 'completed' && (
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             className="mt-3"
                             onClick={() => openReviewForm(booking.id)}
                           >
                             {t('addReviewButton', { defaultValue: 'Donner mon avis' })}
                           </Button>
                         )}
                         {booking.status === 'confirmed' && booking.check_out && new Date(booking.check_out) < new Date() && (
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             className="mt-3"
                             onClick={() => openReviewForm(booking.id)}
                           >
                             {t('addReviewButton', { defaultValue: 'Donner mon avis' })}
                           </Button>
                         )}
                       </div>
                     )
                   })}
                 </div>
               </div>
             )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              {t('reviewsTitle', { defaultValue: 'Appréciations' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Formulaire toujours visible */}
            <form ref={reviewFormRef} onSubmit={handleReviewSubmit} className="mb-6 rounded-xl border-2 border-yellow-200 bg-yellow-50 dark:border-yellow-800/40 dark:bg-yellow-900/10 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-400" />
                <h3 className="text-sm font-semibold">
                  {t('addReviewTitle', { defaultValue: 'Donner un avis sur votre séjour' })}
                </h3>
              </div>

              {/* Sélecteur de séjour si disponible, sinon champ libre */}
              {completedBookingsForUi.length > 0 ? (
                 <label className="block text-sm mb-4">
                   <span className="mb-1 block font-medium">{t('selectStay', { defaultValue: 'Séjour concerné' })}</span>
                   <select
                     value={reviewBookingId}
                     onChange={(event) => setReviewBookingId(event.target.value)}
                     className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                     disabled={submittingReview}
                   >
                     <option value="">— Choisir un séjour —</option>
                     {completedBookingsForUi.map((booking) => (
                        <option key={booking.id} value={booking.id}>
                          {booking.loft_name || 'Loft'} · {formatDateRange(booking.check_in, booking.check_out, locale)}
                        </option>
                      ))}
                     {bookingsForUi.filter(b => !completedBookingsForUi.find(c => c.id === b.id)).map((booking) => (
                        <option key={booking.id} value={booking.id}>
                          {booking.loft_name || 'Loft'} · {formatDateRange(booking.check_in, booking.check_out, locale)} ({booking.status})
                        </option>
                      ))}
                    </select>
                  </label>
               ) : bookingsForUi.length > 0 ? (
                  <label className="block text-sm mb-4">
                    <span className="mb-1 block font-medium">{t('selectStay', { defaultValue: 'Séjour concerné' })}</span>
                    <select
                      value={reviewBookingId}
                      onChange={(event) => setReviewBookingId(event.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      disabled={submittingReview}
                    >
                      <option value="">— Choisir un séjour —</option>
                      {bookingsForUi.map((booking) => (
                        <option key={booking.id} value={booking.id}>
                          {booking.loft_name || 'Loft'} · {formatDateRange(booking.check_in, booking.check_out, locale)}
                        </option>
                      ))}
                    </select>
                  </label>
               ) : null}

              {/* Étoiles */}
              <label className="block text-sm mb-4">
                <span className="mb-1 block font-medium">{t('rating', { defaultValue: 'Note' })}</span>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      disabled={submittingReview}
                      className="focus:outline-none"
                    >
                      <Star className={`h-8 w-8 transition-colors ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-medium text-muted-foreground">{reviewRating}/5</span>
                </div>
              </label>

              {/* Commentaire */}
              <label className="block text-sm mb-4">
                <span className="mb-1 block font-medium">{t('commentLabel', { defaultValue: 'Votre commentaire' })}</span>
                <textarea
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  placeholder={t('commentPlaceholder', { defaultValue: 'Partagez votre expérience : propreté, accueil, confort...' })}
                  rows={4}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  disabled={submittingReview}
                />
              </label>

              <div className="flex items-center justify-end">
                <Button
                  type="submit"
                  disabled={submittingReview || !reviewText.trim()}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  {submittingReview ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi...</>
                  ) : (
                    <><Star className="h-4 w-4 mr-2" />Publier mon avis</>
                  )}
                </Button>
              </div>
            </form>

            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <Star className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {completedBookingsForUi.length > 0
                    ? t('noReviewsYet', { defaultValue: 'Vous avez terminé un séjour, mais aucun avis n’est enregistré dans la base pour le moment.' })
                    : t('noReviews', { defaultValue: 'Aucun avis pour le moment.' })}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 rounded-lg border bg-white dark:bg-[#111b21]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border border-yellow-200">
                            <span className="font-semibold">{review.rating ?? '—'}</span>/5
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(review.created_at, locale)}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground truncate">
                          {review.loft_name || t('unknownLoft', { defaultValue: 'Loft' })}
                        </p>
                        {(review.booking_check_in || review.booking_check_out) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateRange(review.booking_check_in, review.booking_check_out, locale)}
                          </p>
                        )}
                      </div>
                    </div>

                    {review.review_text ? (
                      <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">{review.review_text}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-3">
                        {t('emptyReviewText', { defaultValue: 'Texte indisponible.' })}
                      </p>
                    )}

                    {review.response_text ? (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-muted-foreground font-medium mb-1">
                          {t('responseLabel', { defaultValue: 'Réponse' })}
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.response_text}</p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-muted-foreground">
        {t('footnote', { defaultValue: 'Les avis sont affichés à partir de vos séjours terminés.' })}
      </div>
    </div>
  )
}
