'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NotificationsWrapper, type AirbnbNotificationItem } from '@/components/notifications/notifications-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Star, MessageSquareText, ThumbsUp, CalendarDays } from 'lucide-react'
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
  const reviews = reviewsSorted
  const bookings = payload?.bookings || []
  const journalEntriesCount = notifications.length + airbnbNotifications.length
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !payload) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5" />
              {t('title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error || t('loading')}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200">
            <MessageSquareText className="h-3.5 w-3.5 mr-1" />
            {t('journalCount', { count: journalEntriesCount })}
          </Badge>
          <Badge variant="secondary" className="bg-purple-50 text-purple-700 border border-purple-200">
            <CalendarDays className="h-3.5 w-3.5 mr-1" />
            {t('stayCount', { count: bookings.length })}
          </Badge>
          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border border-yellow-200">
            <ThumbsUp className="h-3.5 w-3.5 mr-1" />
            {t('reviewCount', { count: reviews.length })}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5" />
              {t('journalTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <NotificationsWrapper
              notifications={notifications}
              userRole={userRole}
              userId={userId}
              airbnbNotifications={airbnbNotifications}
              onNotificationRead={handleNotificationRead}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onAirbnbNotificationRead={handleAirbnbNotificationRead}
              onAirbnbMarkAllRead={handleAirbnbMarkAllRead}
            />

            {bookings.length > 0 && (
              <div className="border-t p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">{t('recentStays')}</h3>
                  <Badge variant="outline">{t('stayCount', { count: bookings.length })}</Badge>
                </div>
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((booking) => {
                    const nights = getNights(booking.check_in, booking.check_out)
                    return (
                      <div key={booking.id} className="rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{booking.loft_name || t('unknownLoft')}</p>
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
              <Star className="h-5 w-5" />
              {t('reviewsTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <Star className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">{t('noReviews')}</p>
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
                          {review.loft_name || t('unknownLoft')}
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
                      <p className="text-sm text-muted-foreground mt-3">{t('emptyReviewText')}</p>
                    )}

                    {review.response_text ? (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-muted-foreground font-medium mb-1">{t('responseLabel')}</div>
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
        {t('footnote')}
      </div>
    </div>
  )
}
